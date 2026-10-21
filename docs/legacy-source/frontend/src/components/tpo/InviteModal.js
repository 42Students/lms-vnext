import { useEffect, useRef, useState } from "react";
import { Alert, Button, Checkbox, Input, Modal, Space, Typography, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { inviteRecruiterLead } from "@/api/Services/TpoService";
import { getMailStatus } from "@/api/Services/TpoHubService";

/**
 * Invite (TPO V1 - Locked.docx §3): a preview with the TPO's own note, then a link to copy and send yourself. The email is optional and only offered
 * when its template is live: the link is the invitation, and the recruiter joins with their phone number. Creating the link again rotates it.
 * The wording comes from Settings, Templates, and can be edited before sending. Every invite carries "not hiring this season".
 */
export default function InviteModal({ recruiterLead, onClose, onCreated }) {
  const [link, setLink] = useState(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [createError, setCreateError] = useState("");
  const busyRef = useRef(false);
  const [emailLive, setEmailLive] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);

  useEffect(() => {
    if (!recruiterLead) return;
    setLink(null); setNote(""); setSendEmail(false); setCreateError("");
    busyRef.current = false; setBusy(false);
    fetchWithErrorHandling(getMailStatus()).then((r) => setEmailLive(Boolean(r.data?.templates?.["recruiter-invite"])));
  }, [recruiterLead]);

  const create = async () => {
    if (busyRef.current || busy) return;
    busyRef.current = true;
    setBusy(true);
    setCreateError("");
    try {
      const res = await fetchWithErrorHandling(inviteRecruiterLead(recruiterLead.id, {
        sendEmail: sendEmail && Boolean(recruiterLead.email),
        note: note || null,
      }));
      if (!res.success) {
        const errorMessage = res?.data?.message || res?.data?.error || "Could not create the invite link";
        setCreateError(errorMessage);
        message.error(errorMessage);
        return;
      }
      setLink({
        url: `${window.location.origin}/recruiter-invite/${res.data.token}`,
        expiresAt: res.data.expiresAt,
        emailed: Boolean(res.data.emailed),
      });
      onCreated?.();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const requestClose = () => {
    if (busyRef.current || busy) {
      message.info("Wait for the invite link to finish generating.");
      return;
    }
    if (link) {
      Modal.confirm({
        title: "Close this invite?",
        content: "This invite link is shown only once. Make sure you copied or sent it before closing.",
        okText: "Close invite",
        cancelText: "Keep open",
        onOk: () => onClose?.(),
      });
      return;
    }
    if (!note.trim() && !sendEmail) {
      onClose?.();
      return;
    }
    Modal.confirm({
      title: "Discard invite changes?",
      content: "Your personal note and delivery choice will be cleared.",
      okText: "Discard",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: () => onClose?.(),
    });
  };

  const text = link
    ? `${"Hello {name}, we would love to host {company} for campus recruitment. Please join here: {link}".replace("{name}", recruiterLead.name).replace("{company}", recruiterLead.companyName || "your company").replace("{link}", link.url)}${note ? `\n\n${note}` : ""}`
    : "";
  const copy = async (value, what) => { try { await navigator.clipboard.writeText(value); message.success(`${what} copied`); } catch (_) { message.info("Select the text and copy it"); } };

  return (
    <Modal
      open={Boolean(recruiterLead)}
      title={recruiterLead ? `Invite ${recruiterLead.name}` : "Invite"}
      onCancel={requestClose}
      footer={null}
      closable={!busy}
      maskClosable={false}
      keyboard={!busy}
      destroyOnClose
    >
      {!link ? (
        <>
          <Typography.Paragraph type="secondary">We create a private link that works for 7 days. Send it yourself, or let us email it. They join with their phone number and see only your college.</Typography.Paragraph>
          {createError ? <Alert type="error" showIcon message="Invite link was not created" description={createError}
            closable onClose={() => setCreateError("")} style={{ marginBottom: 12 }} /> : null}
          <Input.TextArea rows={3} value={note} onChange={(e) => { setNote(e.target.value); setCreateError(""); }} placeholder="Add a personal note (optional)" />
          {emailLive && (
            <div style={{ marginTop: 12 }}>
              <Checkbox checked={sendEmail} disabled={busy || !recruiterLead?.email} onChange={(e) => { setSendEmail(e.target.checked); setCreateError(""); }}>
                Also email it to {recruiterLead?.email || "them"}{recruiterLead?.email ? "" : " (no email on this recruiter)"}
              </Checkbox>
            </div>
          )}
          <Button type="primary" style={{ marginTop: 12 }} loading={busy} disabled={busy} onClick={create}>{recruiterLead?.inviteSentAt ? "Create a new link (the old one stops working)" : "Create invite link"}</Button>
        </>
      ) : (
        <>
          <Alert type="success" showIcon message={link.emailed ? `Emailed to ${recruiterLead.email}. You can still copy the link below: it is shown only this once.` : "Link ready. Copy it now: it is shown only this once."} />
          {sendEmail && !link.emailed && <Alert type="warning" showIcon style={{ marginTop: 8 }} message="The email could not be sent. Send the link yourself." />}
          <Typography.Paragraph copyable={{ text: link.url }} style={{ marginTop: 12, wordBreak: "break-all" }}>{link.url}</Typography.Paragraph>
          <Typography.Paragraph type="secondary">Preview of your message</Typography.Paragraph>
          <Input.TextArea rows={4} value={text} readOnly />
          <Space style={{ marginTop: 12 }} wrap>
            <Button icon={<CopyOutlined />} onClick={() => copy(link.url, "Link")}>Copy link</Button>
            <Button icon={<CopyOutlined />} onClick={() => copy(text, "Message")}>Copy message</Button>
          </Space>
          <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>The page they open lets them say &quot;not hiring from us this season&quot; or unsubscribe, and you are told.</Typography.Paragraph>
        </>
      )}
    </Modal>
  );
}
