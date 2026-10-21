import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Checkbox, DatePicker, Form, Input, List, Modal, Popconfirm, Select, Space, Tag, Typography, message } from "antd";
import { readShareMemory, writeShareMemory } from "@/components/tpo/ui/shareMemory";
import { dj, serverTime } from "@/components/tpo/dj";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { createShare, getMailStatus, getShareEvents, getShares, revokeShare } from "@/api/Services/TpoHubService";

const COLUMN_LABELS = { name: "Name", roll: "Roll number", branch: "Branch", cgpa: "UG % (verified; a band unless Settings shows it exactly)", tenth: "10th %", twelfth: "12th % / Diploma", email: "Email", phone: "Phone (only after shortlist)", resume: "Resume link", projects: "Project links", stage: "Stage" };
const STAGES = [{ value: "", label: "All stages" }, { value: "APPLIED", label: "Up to Applied" }, { value: "SHORTLISTED", label: "Up to Shortlisted" }, { value: "ASSESSMENT", label: "Up to Test" }, { value: "INTERVIEW", label: "Up to Interview" }];

/**
 * "Share with company" (TPO V1 - Locked.docx §5): a secure link with a one-time code and a 7 day expiry. The link and code
 * are shown once for you to send yourself, or the link can be emailed for you; the company never receives an attachment. Every open and
 * download is logged and shown here.
 */
/** What happened to a shared list, in words. */
const SHARE_EVENT = { CREATED: "Shared", LINK_EMAILED: "Link emailed", CODE_EMAILED: "Code emailed", OPENED: "Opened", DOWNLOADED_LIST: "Downloaded the list",
  DOWNLOADED_ZIP: "Downloaded the resumes", REVOKED: "Stopped sharing", CODE_FAILED: "Wrong code entered" };

export default function ShareModal({ open, job, applicantCount, onClose }) {
  const [form] = Form.useForm();
  const [created, setCreated] = useState(null);
  const [shares, setShares] = useState([]);
  // BE-0047: a failed load keeps the last good list and says so; it is never shown as "no links".
  const [sharesError, setSharesError] = useState("");
  const [events, setEvents] = useState(null);
  const [busy, setBusy] = useState(false);
  const [createError, setCreateError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [emailLive, setEmailLive] = useState(false);
  // What this company was last sent (contact, columns, stage cut-off): filled in again, not retyped.
  const remembered = useMemo(() => (open ? readShareMemory(job?.companyName) : null), [open, job?.companyName]);

  const load = useCallback(async () => {
    if (!job) return;
    const res = await fetchWithErrorHandling(getShares(job.id));
    if (!res.success) { setSharesError("The links for this drive could not be loaded."); return; }
    setSharesError("");
    setShares(Array.isArray(res.data) ? res.data : []);
  }, [job]);
  const openActivity = async (s) => {
    const r = await fetchWithErrorHandling(getShareEvents(s.id));
    if (!r.success) { message.error("This link's activity could not be loaded. Try again."); return; }
    setEvents({ share: s, rows: Array.isArray(r.data) ? r.data : [] });
  };
  // The confirmation stays open (and says why) unless the server confirms the revoke.
  const revoke = async (s) => {
    const r = await fetchWithErrorHandling(revokeShare(s.id));
    if (!r.success) {
      message.error(r?.data?.message || r?.data?.error || "Could not revoke the link. It is still live.");
      throw new Error("revoke failed");
    }
    message.success("Link revoked");
    load();
  };
  useEffect(() => {
    if (open) {
      setCreated(null);
      setCreateError("");
      setDirty(false);
      load();
      fetchWithErrorHandling(getMailStatus()).then((r) => setEmailLive(Boolean(r.data?.templates?.["share-link"])));
    }
  }, [open, load]);

  const create = async (submittedValues = null) => {
    try {
      const v = submittedValues || await form.validateFields();
      setCreateError("");
      setBusy(true);
      const res = await fetchWithErrorHandling(createShare(job.id, {
        recipientEmail: v.recipientEmail, emailLink: Boolean(v.emailLink), columns: v.columns, maxStage: v.maxStage || null,
        shortlistBy: v.shortlistBy ? serverTime(v.shortlistBy) : null,
      }));
      setBusy(false);
      if (!res.success) {
        const detail = res?.data?.message || res?.data?.error || "Could not create the link";
        setCreateError(detail);
        message.error(detail);
        return;
      }
      writeShareMemory(job.companyName, { recipientEmail: v.recipientEmail, columns: v.columns, maxStage: v.maxStage });
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      setCreated({ link: `${origin}/company-share/${res.data.token}`, code: res.data.code, expiresAt: res.data.expiresAt, emailed: Boolean(res.data.emailed), email: v.recipientEmail, asked: Boolean(v.emailLink) });
      setDirty(false);
      load();
    } catch (error) {
      setBusy(false);
      if (!error?.errorFields) {
        const detail = error?.response?.data?.message || error?.message || "Could not create the link";
        setCreateError(detail);
      }
    }
  };

  const finishClose = () => {
    setDirty(false);
    setCreateError("");
    onClose?.();
  };

  const requestClose = () => {
    if (busy) {
      message.info("Wait for the share link to finish creating.");
      return;
    }
    if (!created && dirty) {
      Modal.confirm({
        title: "Discard share-link setup?",
        content: "The company contact, columns and shortlist settings you entered will be lost.",
        okText: "Discard changes",
        okButtonProps: { danger: true },
        cancelText: "Keep editing",
        onOk: finishClose,
      });
      return;
    }
    finishClose();
  };

  const copy = (text, what) => { navigator.clipboard?.writeText(text); message.success(`${what} copied`); };
  const messageText = created ? `Hello, here are the ${applicantCount} applicants for ${job.jobTitle}: ${created.link}\nYour one-time code is ${created.code}. The link works for 7 days.` : "";

  return (
    <Modal open={open} title={`Share applicants with ${job?.companyName || "the company"}`} onCancel={requestClose} footer={null} width={640} destroyOnClose
      maskClosable={false} closable={!busy} keyboard={!busy}>
      {!created ? (
        <Form form={form} layout="vertical" initialValues={{ columns: remembered?.columns?.length ? remembered.columns : ["name", "roll", "branch", "cgpa", "resume", "email"], maxStage: remembered?.maxStage ?? "", recipientEmail: remembered?.recipientEmail }}
          onFinish={create} onValuesChange={() => { setDirty(true); setCreateError(""); }} disabled={busy}>
          {createError ? <Alert type="error" showIcon message="Share link was not created" description={createError}
            closable onClose={() => setCreateError("")} style={{ marginBottom: 12 }} /> : null}
          {remembered && <Typography.Text type="secondary" style={{ display: "block", marginBottom: 8 }}>Filled in from the last time you shared with {job?.companyName}. Change anything you need.</Typography.Text>}
          <Alert type="info" showIcon style={{ marginBottom: 12 }} message={`${applicantCount} applicants will be shared. Phone numbers are only included for shortlisted students, and CGPA shows as a band unless your settings show it exactly.`} />
          <Form.Item name="recipientEmail" label="Company contact's email" rules={[{ required: true, type: "email", message: "Enter a valid email" }]}><Input placeholder="hr@company.com" /></Form.Item>
          {emailLive && <Form.Item name="emailLink" valuePropName="checked" extra="The link is emailed to them. The code is never in that email: you send it yourself, or they can ask for it by email on the page."><Checkbox>Email the link to this address</Checkbox></Form.Item>}
          <Form.Item name="columns" label="What the company sees"><Checkbox.Group options={Object.entries(COLUMN_LABELS).map(([value, label]) => ({ value, label }))} /></Form.Item>
          <Space wrap>
            <Form.Item name="maxStage" label="Include students up to"><Select style={{ width: 200 }} options={STAGES} /></Form.Item>
            <Form.Item name="shortlistBy" label="Ask them to shortlist by (optional)"><DatePicker showTime /></Form.Item>
          </Space>
          <div><Button type="primary" loading={busy} htmlType="submit">Create secure link</Button></div>
        </Form>
      ) : (
        <div>
          <Alert type="success" showIcon message={created.emailed ? `Link emailed to ${created.email}. Send them the code yourself: it is shown only this once.` : "Link created. Copy it now: the code is shown only this once."} />
          {created.asked && !created.emailed && <Alert type="warning" showIcon style={{ marginTop: 8 }} message="The email could not be sent. Send the link yourself." />}
          <Typography.Paragraph style={{ marginTop: 12 }} copyable={{ text: created.link }}>Link: {created.link}</Typography.Paragraph>
          <Typography.Paragraph copyable={{ text: created.code }}>One-time code: <b>{created.code}</b></Typography.Paragraph>
          <Space>
            <Button onClick={() => copy(messageText, "Message")}>Copy message</Button>
            <Button onClick={() => setCreated(null)}>Create another</Button>
          </Space>
        </div>
      )}

      {sharesError && (
        <Alert style={{ marginTop: 16 }} type="warning" showIcon message={sharesError} action={<Button size="small" onClick={load}>Retry</Button>} data-testid="tpo.share.list-error" />
      )}
      {shares.length > 0 && (
        <List style={{ marginTop: 16 }} header={<b>Links for this drive</b>} dataSource={shares} renderItem={(s) => (
          <List.Item actions={[<Button key="a" type="link" size="small" style={{ padding: 0, height: "auto" }} onClick={() => openActivity(s)}>Activity</Button>,
            !s.revokedAt && dj(s.expiresAt).isAfter(dj()) ? <Popconfirm key="r" title="Revoke this link?" description="The company can no longer open it. This cannot be undone." okText="Revoke" okButtonProps={{ danger: true }} onConfirm={() => revoke(s)}><a style={{ color: "#cf1322" }}>Revoke</a></Popconfirm> : null].filter(Boolean)}>
            <List.Item.Meta title={s.recipientEmail} description={`Created ${dj(s.createdAt).format("D MMM")} · ${s.opens} opens · ${s.downloads} downloads`} />
            {s.revokedAt ? <Tag>Revoked</Tag> : dj(s.expiresAt).isBefore(dj()) ? <Tag>Expired</Tag> : <Tag color="green">Live until {dj(s.expiresAt).format("D MMM")}</Tag>}
          </List.Item>
        )} />
      )}
      <Modal open={Boolean(events)} title={`Activity: ${events?.share?.recipientEmail || ""}`} footer={null} onCancel={() => setEvents(null)}>
        <List size="small" dataSource={events?.rows || []} locale={{ emptyText: "Nothing yet" }} renderItem={(e) => <List.Item>{SHARE_EVENT[e.action] || String(e.action).replace(/_/g, " ").toLowerCase()}{e.detail ? ` · ${e.detail}` : ""} <Typography.Text type="secondary">{dj(e.createdAt).format("D MMM, h:mm A")}</Typography.Text></List.Item>} />
      </Modal>
    </Modal>
  );
}
