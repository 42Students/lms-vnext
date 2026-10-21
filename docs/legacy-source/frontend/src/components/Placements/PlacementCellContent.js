import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, Checkbox, Form, Input, Modal, Select, Skeleton, Upload, message } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import moment from "moment";
import { getPlacementOverview, raiseStudentRequest, registerForPlacements } from "@/api/Services/TpoHubService";
import { uploadFileViaPresign } from "@/utils/uploadToR2";
import PlacementRules from "@/components/Placements/student/PlacementRules";
import { at, dayTime } from "@/components/Placements/student/words";

const CHOICES = [
  { value: "PLACEMENTS", label: "Placements", hint: "I want a job through campus drives" },
  { value: "HIGHER_STUDIES", label: "Higher studies", hint: "I'm going for a master's or similar" },
  { value: "NOT_INTERESTED", label: "Not interested", hint: "I'm not taking part this year" },
];
// The placement cell can also record these two for a student (TPO notes item 7); students see them, they do not pick them.
const CHOICE_LABEL = { ...Object.fromEntries(CHOICES.map((c) => [c.value, c.label])), ENTREPRENEURSHIP: "Entrepreneurship / self-employed", COMPETITIVE_EXAMS: "Competitive exams" };
const REQUEST_TYPES = {
  REGISTRATION_CHANGE: "Change my registration", CORRECTION: "Correct my details (with proof)", EXTERNAL_OFFER: "Report an off-campus offer",
  OFFER_EXTENSION: "Ask for more time on an offer", WITHDRAWAL: "Withdraw from a drive", ABSENCE_DISPUTE: "Absence dispute", PAP: "Apply again after placement",
};
const REQUEST_STATE = { PENDING: ["Waiting for the placement cell", "wait"], APPROVED: ["Approved", "good"], AUTO_APPROVED: ["Approved", "good"], REJECTED: ["Not approved", "bad"] };
const errorText = (e, fallback) => e?.response?.data?.message || e?.response?.data?.error || fallback;
const validOverview = (v) => Boolean(v && typeof v === "object" && !Array.isArray(v)
  && v.registration && typeof v.registration === "object"
  && ["offers", "schedule", "requests", "debarments", "notices"].every((key) => Array.isArray(v[key])));

/**
 * What a student settles with the placement cell (redesign, 14 Oct 2026): their registration, anything that needs their attention
 * (a debarment, being marked absent), their requests, and the college's rules. Offers, rounds and notices have their own tabs now.
 */
export default function PlacementCellContent() {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [choice, setChoice] = useState(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);
  const [offerLetter, setOfferLetter] = useState(null);
  const [uploadingLetter, setUploadingLetter] = useState(false);
  const [requestDirty, setRequestDirty] = useState(false);
  const actionRef = useRef(false);
  const [form] = Form.useForm();

  const load = useCallback(() => {
    getPlacementOverview()
      .then((r) => {
        if (!validOverview(r?.data)) {
          setFailed(true);
          return;
        }
        setData(r.data);
        // Their saved choice is the one ticked (it showed "You are registered for Placements" with nothing ticked).
        setChoice(r.data.registration?.choice && CHOICE_LABEL[r.data.registration.choice] && CHOICES.some((c) => c.value === r.data.registration.choice) ? r.data.registration.choice : null);
        setConsent(r.data.registration?.choice === "PLACEMENTS");
        setFailed(false);
      })
      .catch(() => setFailed(true));
  }, []);
  useEffect(() => { load(); }, [load]);

  // A link to #rules or #requests (from an offer, a drive or a notice) lands on that section once it is drawn.
  useEffect(() => {
    if (!data || typeof window === "undefined" || !window.location.hash) return;
    const el = document.getElementById(window.location.hash.slice(1));
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [data]);

  if (failed) return <Alert type="warning" showIcon message="We could not load this page" action={<Button size="small" onClick={load}>Retry</Button>} />;
  if (!data) return <Skeleton active paragraph={{ rows: 6 }} />;

  const reg = data.registration || {};
  const act = async (fn, ok, fail) => {
    if (actionRef.current) return false;
    actionRef.current = true;
    setBusy(true);
    try {
      await fn();
      message.success(ok);
      load();
      return true;
    } catch (e) {
      message.error(errorText(e, fail));
      return false;
    } finally {
      actionRef.current = false;
      setBusy(false);
    }
  };
  const offerJobs = [...new Map((data.offers || []).filter((o) => o.status === "RELEASED").map((o) => [o.jobId, o])).values()];
  const attention = (data.notices || []).filter((n) => n.event === "MARKED_ABSENT");

  // Student V1 §5 "Off-campus offer": the letter goes with the request; the placement cell verifies it.
  const uploadOfferLetter = async (file) => {
    setUploadingLetter(true);
    try {
      const res = await uploadFileViaPresign(file, { folder: "off-campus-offer-letters", type: "generic" });
      setOfferLetter({ url: res.publicUrl, name: file.name });
      setRequestDirty(true);
      message.success("Letter attached");
    } catch {
      message.error("Could not upload the letter. You can still submit and share it separately.");
    } finally {
      setUploadingLetter(false);
    }
    return false;
  };

  const openRequest = (preset) => {
    form.resetFields();
    if (preset) form.setFieldsValue(preset);
    setOfferLetter(null);
    setRequestDirty(Boolean(preset));
    setAsking(true);
  };
  // Student V1 §7 "Marked absent": a one-tap dispute, pre-filled.
  const disputeNotice = (notice) => openRequest({ type: "ABSENCE_DISPUTE", reason: `Disputing: "${notice.body}"` });
  const discardRequest = () => {
    setAsking(false);
    setOfferLetter(null);
    setRequestDirty(false);
    form.resetFields();
  };
  const closeRequest = () => {
    if (busy || uploadingLetter) return;
    if (!requestDirty && !offerLetter) {
      discardRequest();
      return;
    }
    Modal.confirm({
      title: "Discard this request?",
      content: "Your unsent request details will be lost.",
      okText: "Discard",
      okButtonProps: { danger: true },
      onOk: discardRequest,
    });
  };

  const submitRequest = async () => {
    const v = await form.validateFields();
    const payload = v.choice ? { choice: v.choice }
      : v.type === "EXTERNAL_OFFER" ? {
          companyName: v.companyName || null,
          ctcLpa: v.ctcLpa !== undefined && v.ctcLpa !== null && v.ctcLpa !== "" ? Number(v.ctcLpa) : null,
          letterUrl: offerLetter?.url || null,
        }
      : null;
    await act(async () => {
      await raiseStudentRequest({ type: v.type, jobId: v.jobId || null, reason: v.reason, payload });
      setAsking(false);
      setOfferLetter(null);
      setRequestDirty(false);
      form.resetFields();
    }, "Sent to the placement cell", "Could not send the request");
  };

  const regLine = reg.choice
    ? `You are registered for ${CHOICE_LABEL[reg.choice] || reg.choice}.`
    : reg.registrationOpen ? "Choose one to register. You need to register before you can apply to drives." : "You have not registered yet.";

  return (
    <div data-testid="placements.cell">
      {(data.debarments || []).map((d) => (
        <Alert key={d.id} className="sp-gap" type="error" showIcon message="You are barred from drives for now"
          description={<>
            {d.reason ? `${d.reason} ` : ""}{d.untilDate ? `Until ${at(d.untilDate)?.format("D MMM YYYY")}.` : d.untilDrives ? `For the next ${d.untilDrives} drives.` : ""}
            {" "}<Button size="small" type="link" style={{ padding: 0 }} onClick={() => openRequest({ type: "CORRECTION", reason: "I think this debarment is wrong because " })}>Think it&apos;s wrong? Tell the placement cell</Button>
          </>} />
      ))}

      {attention.map((n) => (
        <Alert key={n.id} className="sp-gap" type="warning" showIcon message={n.title} description={n.body}
          action={<Button size="small" onClick={() => disputeNotice(n)}>Wrong? Tell the placement cell</Button>} />
      ))}

      <section className="sp-panel" id="registration" aria-labelledby="sp-reg">
        <header className="sp-panel__head"><h2 id="sp-reg">Registration{reg.batchName ? ` · ${reg.batchName}` : ""}</h2></header>
        <p style={{ marginTop: 0 }}>{regLine}</p>
        {reg.registrationOpen ? (
          <>
            <div className="sp-choices" role="radiogroup" aria-label="Your choice">
              {CHOICES.map((c) => (
                <label key={c.value}>
                  <input type="radio" name="sp-choice" value={c.value} checked={choice === c.value} onChange={() => setChoice(c.value)} />
                  <div><b>{c.label}</b><span>{c.hint}</span></div>
                </label>
              ))}
            </div>
            {choice === "PLACEMENTS" && (
              <div style={{ marginTop: 12 }}>
                <Checkbox checked={consent} onChange={(e) => setConsent(e.target.checked)}>I agree to share my academic details, resume and contact details with the companies I apply to.</Checkbox>
              </div>
            )}
            <Button type="primary" style={{ marginTop: 12 }} loading={busy}
              disabled={!choice || (choice === "PLACEMENTS" && !consent) || choice === reg.choice}
              onClick={() => act(() => registerForPlacements(choice, consent), "Registration saved", "Could not save")}>{reg.choice ? "Save my new choice" : "Register"}</Button>
            {reg.deadline && <p className="sp-small sp-muted" style={{ marginTop: 8, marginBottom: 0 }}>You can change your choice until {dayTime(reg.deadline)}.</p>}
          </>
        ) : (
          <p className="sp-muted" style={{ marginBottom: 0 }}>
            {reg.invited === false && !reg.choice
              ? "Registration opens when the placement cell invites your batch. You'll get a notice."
              : "Registration is closed. To change your choice, send a request below."}
          </p>
        )}
      </section>

      <section className="sp-panel" id="requests" aria-labelledby="sp-req">
        <header className="sp-panel__head">
          <h2 id="sp-req">Your requests</h2>
          <Button size="small" disabled={busy} onClick={() => openRequest()}>New request</Button>
        </header>
        {(data.requests || []).length === 0 ? (
          <p className="sp-empty">Need more time on an offer, a correction to your details, or to report an off-campus offer? Send a request and the placement cell will reply here.</p>
        ) : (
          <ul className="sp-notices">
            {data.requests.map((r) => {
              const [label, tone] = REQUEST_STATE[r.status] || [r.status, "later"];
              return (
                <li key={r.id} className="sp-notices__item">
                  <div>
                    <span className="sp-notices__title">{REQUEST_TYPES[r.type] || r.type}</span>
                    <span className="sp-notices__body">{r.reason || ""}</span>
                    {r.decisionReason && <span className="sp-notices__body"><b>Reply:</b> {r.decisionReason}</span>}
                    {r.createdAt && <span className="sp-small sp-muted">Sent {moment(at(r.createdAt)).fromNow()}</span>}
                  </div>
                  <span className={`sp-chip sp-chip--${tone}`}>{label}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="sp-panel" id="rules" aria-labelledby="sp-rules-h">
        <header className="sp-panel__head"><h2 id="sp-rules-h">Placement rules</h2></header>
        <PlacementRules />
      </section>

      <Modal open={asking} title="New request" okText="Send" onOk={submitRequest} onCancel={closeRequest}
        confirmLoading={busy} okButtonProps={{ disabled: uploadingLetter }} closable={!busy && !uploadingLetter}
        maskClosable={!busy && !uploadingLetter} keyboard={!busy && !uploadingLetter} destroyOnClose>
        <Form form={form} layout="vertical" onValuesChange={() => setRequestDirty(true)}>
          <Form.Item name="type" label="What do you need?" rules={[{ required: true }]}>
            <Select options={["REGISTRATION_CHANGE", "CORRECTION", "EXTERNAL_OFFER", "ABSENCE_DISPUTE", ...(offerJobs.length ? ["OFFER_EXTENSION"] : [])].map((t) => ({ value: t, label: REQUEST_TYPES[t] }))} />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(a, b) => a.type !== b.type}>
            {({ getFieldValue }) => (getFieldValue("type") === "OFFER_EXTENSION" ? (
              <Form.Item name="jobId" label="Which offer?" rules={[{ required: true }]}><Select options={offerJobs.map((o) => ({ value: o.jobId, label: `${o.company} · ${o.role}` }))} /></Form.Item>
            ) : getFieldValue("type") === "REGISTRATION_CHANGE" ? (
              <Form.Item name="choice" label="Change to" rules={[{ required: true }]}><Select options={CHOICES.map(({ value, label }) => ({ value, label }))} /></Form.Item>
            ) : getFieldValue("type") === "EXTERNAL_OFFER" ? (
              <>
                <Form.Item name="companyName" label="Company" rules={[{ required: true, message: "Which company?" }]}>
                  <Input maxLength={200} placeholder="e.g. Acme Corp" />
                </Form.Item>
                <Form.Item name="ctcLpa" label="CTC (LPA)">
                  <Input type="number" min={0} step={0.1} placeholder="e.g. 8.5" />
                </Form.Item>
                <Form.Item label="Offer letter">
                  <Upload.Dragger beforeUpload={uploadOfferLetter} showUploadList={false} disabled={uploadingLetter}>
                    <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                    <p>{uploadingLetter ? "Uploading…" : offerLetter ? `Attached: ${offerLetter.name}` : "Click or drag your offer letter here"}</p>
                  </Upload.Dragger>
                </Form.Item>
              </>
            ) : null)}
          </Form.Item>
          <Form.Item name="reason" label="Tell the placement cell why" rules={[{ required: true, min: 3, message: "Please explain" }]}><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
