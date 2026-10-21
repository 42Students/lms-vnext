import { useEffect, useRef, useState } from "react";
import { Alert, Checkbox, DatePicker, Form, Input, Radio, Segmented, Select, Space, Typography } from "antd";
import { dj, serverTime } from "@/components/tpo/dj";
import AsyncModal from "@/components/tpo/ui/AsyncModal";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { getAnnouncementAudiences, previewAnnouncementReach } from "@/api/Services/TpoHubService";

export const AUDIENCES = [
  { value: "PLACEMENTS", label: "Students in placements" },
  { value: "BATCHES", label: "Batches" },
  { value: "BRANCHES", label: "Branches" },
  { value: "DRIVE", label: "A drive's applicants" },
  { value: "ALL", label: "All students" },
];
const errorText = (r, f) => r?.data?.message || r?.data?.error || f;
const notPast = (d) => d && d.endOf("day").isBefore(dj());

/** The audience the form describes, as the server reads it. */
export function audienceOf(v) {
  const kind = v.kind || "PLACEMENTS";
  if (kind === "BATCHES") return { kind, batchIds: v.batchIds || [] };
  if (kind === "BRANCHES") return { kind, branches: v.branches || [] };
  if (kind === "DRIVE") return { kind, jobId: v.jobId || null, stage: v.stage || "APPLIED" };
  return { kind };
}

/** Whether the picked audience is complete enough to ask for its reach. */
export const audienceReady = (a) => (a.kind === "BATCHES" ? a.batchIds.length > 0 : a.kind === "BRANCHES" ? a.branches.length > 0 : a.kind === "DRIVE" ? Boolean(a.jobId) : true);

/**
 * New or edit (Announcements V2, design §3): who it is for, with the reach shown live before sending; an optional button; pin;
 * now or later; until when. In the app only: students get email only for signing in and for interviews (13 Oct 2026). A sent
 * announcement keeps its audience; editing it can tell the same students it changed.
 */
export default function AnnouncementComposer({ open, editing, onClose, onSave }) {
  const [form] = Form.useForm();
  const [pickers, setPickers] = useState({ batches: [], branches: [], drives: [], emailReady: false });
  const [reach, setReach] = useState(null); // { count, label, withEmail } | { error }
  const seq = useRef(0);
  const sent = Boolean(editing?.id) && editing.state !== "SCHEDULED";
  const values = Form.useWatch([], form) || {};
  const kind = values.kind || "PLACEMENTS";

  useEffect(() => {
    if (!open) return;
    fetchWithErrorHandling(getAnnouncementAudiences()).then((r) => { if (r.success && r.data) setPickers({ batches: [], branches: [], drives: [], ...r.data }); });
    const a = editing?.audience || {};
    form.setFieldsValue(editing?.id ? {
      title: editing.title, body: editing.body, pinned: Boolean(editing.pinned), linkLabel: editing.linkLabel || "", linkUrl: editing.linkUrl || "",
      kind: a.kind || editing.audienceKind || "PLACEMENTS", batchIds: a.batchIds || [], branches: a.branches || [], jobId: a.jobId || null, stage: a.stage || "APPLIED",
      when: editing.state === "SCHEDULED" ? "LATER" : "NOW", sendAt: editing.sendAt ? dj(editing.sendAt) : null, showUntil: editing.showUntil ? dj(editing.showUntil) : null,
      email: Boolean(editing.email), tellAgain: false,
    } : { title: "", body: "", pinned: false, kind: "PLACEMENTS", batchIds: [], branches: [], jobId: null, stage: "APPLIED", when: "NOW", sendAt: null, showUntil: null, email: false, linkLabel: "", linkUrl: "" });
    setReach(null);
  }, [open, editing, form]);

  // The reach, asked again whenever the audience changes (not for a sent one: its audience is fixed).
  const audienceKey = JSON.stringify(audienceOf(values));
  useEffect(() => {
    if (!open || sent) return undefined;
    const a = audienceOf(values);
    if (!audienceReady(a)) { setReach(null); return undefined; }
    const n = ++seq.current;
    const t = setTimeout(async () => {
      const r = await fetchWithErrorHandling(previewAnnouncementReach(a));
      if (n !== seq.current) return;
      setReach(r.success ? r.data : { error: errorText(r, "Couldn't work out who it reaches") });
    }, 250);
    return () => clearTimeout(t);
  }, [open, sent, audienceKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    const v = await form.validateFields();
    const body = {
      title: v.title, body: v.body, pinned: Boolean(v.pinned), linkLabel: v.linkLabel || null, linkUrl: v.linkUrl || null,
      showUntil: v.showUntil ? serverTime(v.showUntil) : null, email: Boolean(v.email),
    };
    if (!sent) {
      body.audience = audienceOf(v);
      body.sendAt = v.when === "LATER" && v.sendAt ? serverTime(v.sendAt) : null;
    } else {
      body.tellAgain = Boolean(v.tellAgain);
    }
    return onSave(body);
  };

  const count = reach?.count;
  const okText = editing?.id ? "Save" : values.when === "LATER" ? "Schedule" : count != null ? `Send to ${count} ${count === 1 ? "student" : "students"}` : "Send";
  return (
    <AsyncModal open={open} title={editing?.id ? "Edit announcement" : "New announcement"} okText={okText} destroyOnClose width={640} onCancel={onClose}
      okButtonProps={{ disabled: !sent && (reach?.error || (count === 0)) }} onOk={submit}>
      <Form form={form} layout="vertical" className="announcement-composer" data-testid="announcement.composer">
        <Form.Item name="title" label="Title" rules={[{ required: true, whitespace: true, message: "Give it a title" }]}>
          <Input maxLength={200} placeholder="Omega pre-placement talk on Monday" />
        </Form.Item>
        <Form.Item name="body" label="Announcement" rules={[{ required: true, whitespace: true, message: "Write the announcement" }]}>
          <Input.TextArea rows={5} maxLength={8000} showCount placeholder="What, when, where, and what they should do. Links starting with https:// become clickable." />
        </Form.Item>

        {sent ? (
          <Alert type="info" showIcon className="announcement-composer__sent" message={`Sent to ${editing.audienceLabel || "students"}`} description="Who it went to stays the same once it is sent." />
        ) : (
          <>
            <Form.Item name="kind" label="Who is it for">
              <Segmented block options={AUDIENCES} />
            </Form.Item>
            {kind === "BATCHES" && (
              <Form.Item name="batchIds" label="Batches" rules={[{ required: true, message: "Pick at least one batch" }]}>
                <Select mode="multiple" optionFilterProp="label" placeholder="Pick batches" notFoundContent="No batch is in placements"
                  options={(pickers.batches || []).map((b) => ({ value: b.id, label: b.name }))} />
              </Form.Item>
            )}
            {kind === "BRANCHES" && (
              <Form.Item name="branches" label="Branches" extra="Students in placements from these branches." rules={[{ required: true, message: "Pick at least one branch" }]}>
                <Select mode="multiple" placeholder="Pick branches" notFoundContent="No student in placements has a branch yet"
                  options={(pickers.branches || []).map((b) => ({ value: b, label: b }))} />
              </Form.Item>
            )}
            {kind === "DRIVE" && (
              <Space direction="vertical" style={{ width: "100%" }} size={0}>
                <Form.Item name="jobId" label="Drive" rules={[{ required: true, message: "Pick a drive" }]}>
                  <Select showSearch optionFilterProp="label" placeholder="Pick a drive" notFoundContent="No published drive yet"
                    options={(pickers.drives || []).map((d) => ({ value: d.id, label: d.label }))} />
                </Form.Item>
                <Form.Item name="stage">
                  <Radio.Group options={[{ value: "APPLIED", label: "Everyone who applied" }, { value: "ACTIVE", label: "Still in the drive" }]} />
                </Form.Item>
              </Space>
            )}
            <div className={`announcement-composer__reach${reach?.error ? " is-error" : ""}`} aria-live="polite" data-testid="announcement.reach">
              {reach?.error ? reach.error
                : reach ? <>Goes to <strong>{reach.count} {reach.count === 1 ? "student" : "students"}</strong> · {reach.label}{kind === "ALL" ? " (including students not in placements)" : ""}</>
                  : "Pick who it is for to see how many it reaches."}
            </div>
          </>
        )}

        <Typography.Text strong className="announcement-composer__section">Button (optional)</Typography.Text>
        <Space.Compact block className="announcement-composer__link">
          <Form.Item name="linkLabel" noStyle><Input style={{ width: "36%" }} maxLength={60} placeholder="Register" aria-label="Button label" /></Form.Item>
          <Form.Item name="linkUrl" noStyle rules={[{ pattern: /^https:\/\/\S+$/i, message: "The link has to start with https://" }]}>
            <Input placeholder="https://forms.gle/…" aria-label="Button link" />
          </Form.Item>
        </Space.Compact>
        <Form.Item noStyle shouldUpdate>{() => (form.getFieldError("linkUrl")[0] ? <Typography.Text type="danger">{form.getFieldError("linkUrl")[0]}</Typography.Text> : null)}</Form.Item>
        {kind === "DRIVE" && !sent && <Typography.Paragraph type="secondary" className="announcement-composer__hint">Students also get an Open the drive button.</Typography.Paragraph>}

        {!sent && (
          <Form.Item name="when" label="When" className="announcement-composer__when">
            <Radio.Group options={[{ value: "NOW", label: "Now" }, { value: "LATER", label: "Later" }]} />
          </Form.Item>
        )}
        {!sent && values.when === "LATER" && (
          <Form.Item name="sendAt" label="Send at" rules={[{ required: true, message: "Pick when to send it" }]}>
            <DatePicker showTime={{ format: "h:mm A" }} format="ddd D MMM, h:mm A" disabledDate={notPast} style={{ width: "100%" }} />
          </Form.Item>
        )}
        <Form.Item name="showUntil" label="Show until (optional)" extra="After this, students no longer see it. You still do.">
          <DatePicker showTime={{ format: "h:mm A" }} format="ddd D MMM, h:mm A" disabledDate={notPast} style={{ width: "100%" }} />
        </Form.Item>
        <Space direction="vertical" size={4}>
          <Form.Item name="pinned" valuePropName="checked" noStyle><Checkbox>Pin it to the top</Checkbox></Form.Item>
          {sent && <Form.Item name="tellAgain" valuePropName="checked" noStyle><Checkbox>Tell them it changed (a short notice to the same students)</Checkbox></Form.Item>}
        </Space>
        {!sent && <Typography.Paragraph type="secondary" className="announcement-composer__hint">Students get a notice in the app. You can undo for 30 seconds after sending.</Typography.Paragraph>}
      </Form>
    </AsyncModal>
  );
}
