import { useCallback, useEffect, useRef, useState } from "react";
import { Fact, Facts } from "@/components/Common/Facts";
import { useDispatch } from "react-redux";
import Router, { useRouter } from "next/router";
import { plural } from "@/components/tpo/ui/labels";
import { Alert, Button, Card, Col, DatePicker, Descriptions, Dropdown, Form, Input, List, Modal, Row, Select, Space, Tag, Timeline, Typography, message } from "antd";
import { MailOutlined, PhoneOutlined, TeamOutlined, EditOutlined } from "@ant-design/icons";
import { dj, serverTime } from "@/components/tpo/dj";
import { recruiterActivity } from "@/components/tpo/ui/recruiterActivity";
import PageShell from "@/components/Common/PageShell";
import { PanelError, PanelNotFound } from "@/components/Common/PanelStates";
import { DetailSkeleton } from "@/components/Common/Skeletons";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import InviteModal from "@/components/tpo/InviteModal";
import { StageTag } from "@/components/tpo/recruiterLeadStages";
import { label } from "@/components/tpo/ui/labels";
import { appAction } from "@/redux/store";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { addFollowUp, logRecruiterLeadActivity, markFollowUpDone, markRecruiterLeadNotNow, updateRecruiterLead } from "@/api/Services/TpoService";
import { getRecruiterLeadPage } from "@/api/Services/TpoHubService";
import useChoices from "@/hooks/useChoices";
import { recruiterLeadSourceLabel } from "@/config/choices";
import AsyncModal from "@/components/tpo/ui/AsyncModal";

const NOT_FOUND = "__not_found__";
const errorText = (res, fallback) => res?.data?.message || res?.data?.error || res?.message || fallback;
const LOG = [["CALL", "Call", <PhoneOutlined key="c" />], ["EMAIL", "Email", <MailOutlined key="e" />], ["MEETING", "Meeting", <TeamOutlined key="m" />], ["NOTE", "Note", <EditOutlined key="n" />]];
/** One tap for the usual next steps; the picker stays for anything else. */
const FOLLOW_UP_QUICK = [
  ["Tomorrow 10 AM", () => dj().add(1, "day").hour(10).minute(0).second(0)],
  ["In 3 days", () => dj().add(3, "day").hour(10).minute(0).second(0)],
  ["Next Monday", () => { const d = dj().add(1, "week").startOf("week").add(1, "day"); return d.hour(10).minute(0).second(0); }],
];
const OUTCOMES = [["CONNECTED", "Connected"], ["NO_ANSWER", "No answer (follow up tomorrow)"], ["CALL_BACK", "Call back"], ["NOT_INTERESTED", "Not interested"]];

/** RecruiterLead page (TPO V1 - Locked.docx §3): header, person and company on the left, log bar and timeline on the right, follow-ups pinned on top. */
export default function TpoRecruiterLeadPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { recruiterLeadId } = router.query;
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [invite, setInvite] = useState(false);
  const [logType, setLogType] = useState(null);
  const [note, setNote] = useState("");
  // Follow-up gets its own state - it used to reuse `note`/`setNote` with the interaction-log
  // textarea, so an unfinished note typed while logging a call could leak into Add Follow-up (or
  // vice versa) since both inputs were really the same piece of state.
  const [followUpNote, setFollowUpNote] = useState("");
  const [followUpAt, setFollowUpAt] = useState(null);
  const [followModal, setFollowModal] = useState(false);
  const [notNow, setNotNow] = useState(false);
  const [reason, setReason] = useState("");
  const [revisit, setRevisit] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [editDirty, setEditDirty] = useState(false);
  const loadSeqRef = useRef(0);
  const actionRef = useRef(false);
  const savingRef = useRef(false);
  const [editForm] = Form.useForm();
  const shared = useChoices();

  const hasDraft =
    Boolean(note.trim()) ||
    Boolean(followModal && (followUpNote.trim() || followUpAt)) ||
    Boolean(notNow && (reason.trim() || revisit)) ||
    Boolean(editing && editDirty);

  useEffect(() => {
    if (!hasDraft || actionRef.current || savingRef.current || typeof window === "undefined") return undefined;
    const beforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const beforeRouteChange = () => {
      if (window.confirm("Discard your unsaved recruiter changes?")) return;
      const addressBar = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (addressBar !== Router.asPath) window.history.pushState(null, "", Router.asPath);
      // eslint-disable-next-line no-throw-literal
      throw "Route change aborted to preserve recruiter draft.";
    };
    window.addEventListener("beforeunload", beforeUnload);
    Router.events.on("routeChangeStart", beforeRouteChange);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      Router.events.off("routeChangeStart", beforeRouteChange);
    };
  }, [hasDraft]);

    useEffect(() => { dispatch(appAction.setActiveMenuItem("recruiters")); }, [dispatch]);
  // Clear the previous recruiter lead's data the instant the id changes (going straight from /recruiter leads/1 to
  // /recruiter leads/2, e.g. via Previous/Next or a typed URL, used to briefly keep showing recruiter lead 1's data
  // while recruiter lead 2 loaded) and give a genuine load failure an inline error + Retry instead of only
  // a toast that leaves the page on a permanent skeleton.
  useEffect(() => { setData(null); setError(null); }, [recruiterLeadId]);
  const load = useCallback(async () => {
    if (!recruiterLeadId) return;
    const requestId = ++loadSeqRef.current;
    const res = await fetchWithErrorHandling(getRecruiterLeadPage(recruiterLeadId));
    if (requestId !== loadSeqRef.current) return;
    if (!res.success) { setError(res.status === 404 ? NOT_FOUND : errorText(res, "Recruiter not found")); return; }
    setError(null);
    setData(res.data);
  }, [recruiterLeadId]);
  useEffect(() => { load(); }, [load]);

  const openEdit = () => {
    const l = data?.recruiterLead || {};
    // Only a picked source shows in the box; Added by hand / Imported are what an empty box means.
    const picked = (shared.recruiterLeadSources || []).some((s) => s.value === l.source && s.pickable !== false) ? l.source : undefined;
    editForm.setFieldsValue({ name: l.name, designation: l.designation, email: l.email, phone: l.phone, companyName: l.companyName, source: picked });
    setEditDirty(false);
    setEditing(true);
  };

  const runAction = async (call, failure, after) => {
    if (actionRef.current) return false;
    actionRef.current = true;
    setActionBusy(true);
    try {
      const res = await fetchWithErrorHandling(call);
      if (!res.success) {
        message.error(errorText(res, failure));
        return false;
      }
      await after?.(res.data);
      return true;
    } finally {
      actionRef.current = false;
      setActionBusy(false);
    }
  };

  const confirmDiscard = (dirty, title, onDiscard) => {
    if (actionRef.current || savingRef.current) return;
    if (!dirty) {
      onDiscard();
      return;
    }
    Modal.confirm({
      title,
      content: "Your unsaved changes will be lost.",
      okText: "Discard",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: onDiscard,
    });
  };

  const log = async (type, outcome) => {
    if (actionRef.current) return;
    actionRef.current = true;
    setActionBusy(true);
    try {
      const res = await fetchWithErrorHandling(logRecruiterLeadActivity(recruiterLeadId, { type, outcome: outcome || null, note: note.trim() || null }));
      if (!res.success) { message.error(errorText(res, "Could not log")); return; }
      if (outcome === "NO_ANSWER") {
        const f = await fetchWithErrorHandling(addFollowUp(recruiterLeadId, { dueAt: serverTime(dj().add(1, "day").hour(10).minute(0)), note: "No answer, try again" }));
        if (!f.success) message.warning("The call is logged, but the follow-up for tomorrow could not be added. Add it from Follow-ups.");
      }
      if (outcome === "NOT_INTERESTED") {
        setLogType(null);
        setNote("");
        setNotNow(true);
        setReason("Not interested");
        void load();
        return;
      }
      setLogType(null);
      setNote("");
      void load();
    } finally {
      actionRef.current = false;
      setActionBusy(false);
    }
  };

  if (error === NOT_FOUND && !data) return <div className="scroll-container tpo-recruiter-lead-detail"><PageShell><div className="tpo-recruiter-lead-detail__load-state"><PanelNotFound title="This recruiter isn't in Engage" description="They may have been removed, or the link is wrong." actionLabel="Go to Engage" onAction={() => router.push("/tpo/recruiters")} /></div></PageShell></div>;
  if (error && !data) return <div className="scroll-container tpo-recruiter-lead-detail"><PageShell><div className="tpo-recruiter-lead-detail__load-state"><PanelError title={error} onRetry={load} /></div></PageShell></div>;
  if (!data) return <div className="scroll-container tpo-recruiter-lead-detail"><PageShell><Card className="tpo-recruiter-lead-detail__loading"><DetailSkeleton label="Loading recruiter lead" withMedia={false} /></Card></PageShell></div>;
  const l = data.recruiterLead;
  const inviteText = recruiterActivity(l).text;

  return (
    <div className="scroll-container tpo-recruiter-lead-detail" data-testid="tpo.recruiter-lead">
      <PageShell>
        <ListingPageHeader
          className="tpo-recruiter-lead-detail__header"
          title={l.name}
          subtitle={
            <div className="tpo-recruiter-lead-detail__meta">
              <Typography.Text type="secondary">{l.companyName}{l.designation ? ` · ${l.designation}` : ""}</Typography.Text>
              <Facts size="small">
                <Fact label="Stage"><StageTag stage={l.stage} /></Fact>
                <Fact label="Invite"><Tag className="tpo-recruiter-lead-detail__invite-status">{inviteText}</Tag></Fact>
                {(l.ownerName || "").trim() && <Fact label="Owner"><Typography.Text>{l.ownerName.trim()}</Typography.Text></Fact>}
              </Facts>
            </div>
          }
          rightContent={
            <Space wrap className="tpo-recruiter-lead-detail__header-actions">
              {!l.recruiterId && <Button type="primary" disabled={Boolean(l.unsubscribedAt)} onClick={() => setInvite(true)}>{l.inviteSentAt ? "Resend invite" : "Invite"}</Button>}
              <Button onClick={() => router.push(`/tpo/drives/new?company=${encodeURIComponent(l.companyName || "")}`)}>Create drive</Button>
              {/* Team module V1: the team's conversation about this company. */}
              {l.companyName && <Button onClick={() => router.push(`/tpo/messages?tab=team&about=${encodeURIComponent(`COMPANY:${l.companyName.trim().toLowerCase()}`)}`)}>Team talk</Button>}
              <Dropdown menu={{ items: [{ key: "e", label: "Edit details", onClick: openEdit }, { key: "n", label: "Not now…", onClick: () => { setReason(""); setRevisit(null); setNotNow(true); } }, { key: "f", label: "Add follow-up", onClick: () => { setFollowUpNote(""); setFollowUpAt(null); setFollowModal(true); } }] }} trigger={["click"]}><Button>More</Button></Dropdown>
            </Space>
          }
        />
        {l.stage === "NOT_NOW" && <Alert className="tpo-recruiter-lead-detail__alert" type="warning" showIcon message={`Not now: ${l.notNowReason || ""}${l.notNowUntil ? ` · revisit ${dj(l.notNowUntil).format("D MMM YYYY")}` : ""}`} />}
        {l.unsubscribedAt && <Alert className="tpo-recruiter-lead-detail__alert" type="info" showIcon message="This person said they are not hiring from your college this season or unsubscribed." />}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <Card className="tpo-recruiter-lead-detail__panel tpo-recruiter-lead-detail__person" title="Contact">
              <Descriptions column={1} size="small">
                {/* A missing phone or email is one click to add, not a dash (TPO page audit 2026-10-04). */}
                <Descriptions.Item label="Phone">{l.phone ? <a href={`tel:${l.phone}`}>{l.phone}</a> : <Button size="small" type="link" className="tpo-recruiter-lead-detail__add" onClick={openEdit}>Add phone</Button>}</Descriptions.Item>
                <Descriptions.Item label="Email">{l.email ? <a href={`mailto:${l.email}`}>{l.email}</a> : <Button size="small" type="link" className="tpo-recruiter-lead-detail__add" onClick={openEdit}>Add email</Button>}</Descriptions.Item>
                <Descriptions.Item label="Came from">{recruiterLeadSourceLabel(shared.recruiterLeadSources, l.source)}</Descriptions.Item>
                <Descriptions.Item label="Added">{dj(l.createdAt).format("D MMM YYYY")}</Descriptions.Item>
              </Descriptions>
            </Card>
            <Card className="tpo-recruiter-lead-detail__panel tpo-recruiter-lead-detail__company" title="Company" style={{ marginTop: 16 }}>
              <Typography.Title level={5} style={{ marginTop: 0 }}><a onClick={() => router.push(`/tpo/companies?name=${encodeURIComponent(l.companyName || "")}`)}>{l.companyName}</a></Typography.Title>
              <Typography.Paragraph type="secondary">{plural(Number(l.drives) || 0, "drive")} · {plural(Number(l.studentsHired) || 0, "student")} hired</Typography.Paragraph>
              <List size="small" dataSource={data.drives} locale={{ emptyText: "No drives yet" }} renderItem={(d) => <List.Item onClick={() => router.push(`/tpo/drives/${d.id}`)} style={{ cursor: "pointer" }}>{d.jobTitle} <Tag>{label("drive", d.status)}</Tag></List.Item>} />
            </Card>
          </Col>
          <Col xs={24} lg={16}>
            <Card className="tpo-recruiter-lead-detail__panel tpo-recruiter-lead-detail__log">
              <div className="tpo-recruiter-lead-detail__section-head">
                <div>
                  <Typography.Title level={5}>Log an interaction</Typography.Title>
                </div>
                <Typography.Text type="secondary">Keep the next person who opens this recruiter fully up to date.</Typography.Text>
              </div>
              <Space wrap className="tpo-recruiter-lead-detail__log-actions">{LOG.map(([type, label, icon]) => <Button key={type} icon={icon} type={logType === type ? "primary" : "default"} onClick={() => { setLogType(type); setNote(""); }}>{label}</Button>)}</Space>
              {logType && (
                <div style={{ marginTop: 12 }}>
                  <Input.TextArea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder={logType === "NOTE" ? "Write a note" : "What was said? (optional)"} />
                  {logType === "CALL" ? (
                    <Space wrap style={{ marginTop: 8 }}>{OUTCOMES.map(([v, label]) => <Button key={v} onClick={() => log(logType, v)}>{label}</Button>)}</Space>
                  ) : <Button type="primary" style={{ marginTop: 8 }} disabled={logType === "NOTE" && !note.trim()} onClick={() => log(logType)}>Save</Button>}
                </div>
              )}
            </Card>
            <Card className="tpo-recruiter-lead-detail__panel tpo-recruiter-lead-detail__followups" title="Follow-ups" style={{ marginTop: 16 }} extra={<Button size="small" onClick={() => { setFollowUpNote(""); setFollowUpAt(null); setFollowModal(true); }}>Add</Button>}>
              <List size="small" dataSource={data.followUps} locale={{ emptyText: <div className="tpo-recruiter-lead-detail__empty"><Typography.Text type="secondary">No next step yet, so this recruiter can go quiet.</Typography.Text> <Button size="small" onClick={() => { setFollowUpNote(""); setFollowUpAt(null); setFollowModal(true); }}>Add follow-up</Button></div> }}
                renderItem={(f) => (
                  <List.Item actions={f.doneAt ? [<Tag key="d" color="green">Done</Tag>] : [<Button key="d" size="small" loading={actionBusy} disabled={actionBusy} onClick={() => runAction(markFollowUpDone(f.id), "Could not mark it done", load)}>Done</Button>]}>
                    <Space>{!f.doneAt && dj(f.dueAt).isBefore(dj()) ? <Tag color="red">Overdue</Tag> : null}{dj(f.dueAt).format("ddd D MMM, h:mm A")}<Typography.Text type="secondary">{f.note}</Typography.Text></Space>
                  </List.Item>
                )} />
            </Card>
            <Card className="tpo-recruiter-lead-detail__panel tpo-recruiter-lead-detail__timeline" title="Timeline" style={{ marginTop: 16 }}>
              {data.timeline.length === 0 ? <Typography.Text type="secondary" className="tpo-recruiter-lead-detail__empty">Nothing logged yet. A call, email, meeting or note logged above shows up here.</Typography.Text> : (
                <Timeline items={data.timeline.map((t) => ({ color: t.isSystem ? "gray" : "blue", children: <div><b>{t.isSystem ? String(t.type).toLowerCase() : `${String(t.type).toLowerCase()}${t.outcome ? ` · ${String(t.outcome).replace(/_/g, " ").toLowerCase()}` : ""}`}</b>{t.note ? `: ${t.note}` : ""}<div><Typography.Text type="secondary">{dj(t.createdAt).format("D MMM, h:mm A")}</Typography.Text></div></div> }))} />
              )}
            </Card>
          </Col>
        </Row>
      </PageShell>

      <InviteModal recruiterLead={invite ? { ...l } : null} onClose={() => setInvite(false)} onCreated={load} />
      <AsyncModal open={followModal} title="Add a follow-up" okText="Add follow-up" confirmLoading={actionBusy} onCancel={() => confirmDiscard(Boolean(followUpNote.trim() || followUpAt), "Discard this follow-up draft?", () => { setFollowModal(false); setFollowUpAt(null); setFollowUpNote(""); })} okButtonProps={{ disabled: !followUpAt || actionBusy }}
        onOk={async () => {
          const ok = await runAction(
            addFollowUp(recruiterLeadId, { dueAt: serverTime(followUpAt), note: followUpNote.trim() || null }),
            "Could not add the follow-up"
          );
          if (!ok) return;
          setFollowModal(false);
          setFollowUpAt(null);
          setFollowUpNote("");
          void load();
        }}>
        <Space wrap style={{ marginBottom: 8 }}>
          {FOLLOW_UP_QUICK.map(([text, at]) => <Button key={text} size="small" type={followUpAt && followUpAt.isSame(at(), "minute") ? "primary" : "default"} onClick={() => setFollowUpAt(at())}>{text}</Button>)}
        </Space>
        <DatePicker showTime={{ format: "h:mm A", defaultValue: dj().hour(10).minute(0).second(0) }} format="ddd D MMM, h:mm A" style={{ width: "100%", marginBottom: 8 }} value={followUpAt} onChange={setFollowUpAt}
          disabledDate={(d) => d && d.isBefore(dj().startOf("day"))} />
        <Input placeholder="What to do (optional)" value={followUpNote} onChange={(e) => setFollowUpNote(e.target.value)} />
      </AsyncModal>
      <Modal open={editing} title="Edit contact details" okText="Save" confirmLoading={saving} onCancel={() => confirmDiscard(editDirty, "Discard contact changes?", () => { setEditDirty(false); setEditing(false); editForm.resetFields(); })} destroyOnClose
        onOk={async () => {
          if (savingRef.current) return;
          const v = await editForm.validateFields();
          savingRef.current = true;
          setSaving(true);
          try {
            const r = await fetchWithErrorHandling(updateRecruiterLead(recruiterLeadId, { ...v, source: v.source || "" }));
            if (!r.success) { message.error(errorText(r, "Could not save")); return; }
            message.success("Saved");
            setEditDirty(false);
            setEditing(false);
            void load();
          } finally {
            savingRef.current = false;
            setSaving(false);
          }
        }}>
        <Form form={editForm} layout="vertical" className="tpo-form-grid" preserve={false} onValuesChange={() => setEditDirty(true)}>
          <div className="tpo-form-row">
            <Form.Item name="name" label="Name" rules={[{ required: true, whitespace: true, message: "Name is required" }]}><Input /></Form.Item>
            <Form.Item name="designation" label="Designation"><Input /></Form.Item>
          </div>
          <div className="tpo-form-row">
            <Form.Item name="email" label="Email" rules={[{ type: "email", message: "Enter a valid email" }, ({ getFieldValue }) => ({ validator: (_, val) => (val || getFieldValue("phone") ? Promise.resolve() : Promise.reject(new Error("Keep an email or a phone"))) })]}><Input /></Form.Item>
            <Form.Item name="phone" label="Phone" dependencies={["email"]}><Input /></Form.Item>
          </div>
          <Form.Item name="companyName" label="Company" rules={[{ required: true, whitespace: true, message: "Company is required" }]}><Input /></Form.Item>
          <Form.Item name="source" label="Where did you find them?" extra="Left empty, it shows as Added by hand (or Imported).">
            <Select allowClear placeholder="Not recorded" options={(shared.recruiterLeadSources || []).filter((s) => s.pickable !== false).map((s) => ({ value: s.value, label: s.label }))} />
          </Form.Item>
        </Form>
      </Modal>
      <AsyncModal open={notNow} title="Not now" confirmLoading={actionBusy} onCancel={() => confirmDiscard(Boolean(reason.trim() || revisit), "Discard this Not now draft?", () => { setNotNow(false); setReason(""); setRevisit(null); })} okButtonProps={{ disabled: reason.trim().length < 2 || actionBusy }}
        onOk={async () => { const ok = await runAction(markRecruiterLeadNotNow(recruiterLeadId, { reason: reason.trim(), revisitDate: revisit ? revisit.format("YYYY-MM-DD") : null }), "Failed"); if (!ok) return; setNotNow(false); setReason(""); setRevisit(null); void load(); }}>
        <Input placeholder="Why?" value={reason} onChange={(e) => setReason(e.target.value)} style={{ marginBottom: 8 }} />
        <DatePicker placeholder="Revisit on" value={revisit} onChange={setRevisit} />
      </AsyncModal>
    </div>
  );
}
