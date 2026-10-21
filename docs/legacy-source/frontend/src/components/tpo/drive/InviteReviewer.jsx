import { useState } from "react";
import { Alert, Button, Checkbox, Form, Input, Modal, Space, Tooltip, Typography, message } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import Link from "next/link";
import AsyncModal from "@/components/tpo/ui/AsyncModal";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { inviteRecruiterToReview } from "@/api/Services/TpoService";
import { getPublicLink } from "@/api/Services/TpoHubService";
import { RECRUITER_EMAIL_NOTE } from "@/components/tpo/drive/CompanyPicker";

const copy = (text, what) => navigator.clipboard?.writeText(text).then(() => message.success(`${what} copied`), () => message.error("Couldn't copy. Select the text and copy it."));

/** The invitation written out, for the placement cell to send from its own mailbox. */
function WrittenOut({ email }) {
  const all = `To: ${email.to}\nSubject: ${email.subject}\n\n${email.body}`;
  const mailto = `mailto:${encodeURIComponent(email.to)}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
  return (
    <Space direction="vertical" size={8} style={{ width: "100%" }} data-testid="invite-reviewer.letter">
      <Typography.Text type="secondary">To: {email.to}</Typography.Text>
      <Typography.Text type="secondary">Subject: {email.subject}</Typography.Text>
      <Input.TextArea readOnly value={email.body} autoSize={{ minRows: 6, maxRows: 14 }} aria-label="Email to send" />
      <Space wrap>
        <Button type="primary" href={mailto}>Open in my email</Button>
        <Button onClick={() => copy(all, "Email")}>Copy email</Button>
      </Space>
    </Space>
  );
}

/**
 * "Invite the recruiter to review" (recruiter phase 1, N5 c): the placement cell posted the drive and asks the company's
 * recruiter to look at it. Someone already working with the college sees it at once; anyone else gets an invitation, and the
 * drive is theirs when they join. They answer with change requests. The college's public link can go with it, for colleagues;
 * when the invitation can't be emailed, the last step hands the TPO the email to send (audit 13 Oct 2026).
 */
export default function InviteReviewer({ jobId, companyName, defaultEmail, onDone, buttonProps }) {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState(null); // the college's public link: { usable, reason }
  const [result, setResult] = useState(null);
  const [form] = Form.useForm();

  const start = async () => {
    form.resetFields();
    // The email typed in "Add a company" on the drive form, so it isn't asked for twice.
    if (defaultEmail) form.setFieldsValue({ email: defaultEmail });
    setResult(null);
    setLink(null);
    setOpen(true);
    let d = null;
    try {
      const r = await fetchWithErrorHandling(getPublicLink());
      d = r.success ? r.data : null;
    } catch { /* the invitation still works without the link */ }
    const usable = Boolean(d?.enabled && d?.token);
    setLink({ usable, reason: !d ? "Couldn't check your public link." : !d.hasLink ? "You haven't made a public link yet." : !d.enabled ? "Your public link is off." : !d.token ? "Make a new public link in Settings to add it." : null });
    form.setFieldsValue({ includePublicLink: usable });
  };

  const close = () => {
    setOpen(false);
    if (result) onDone?.();
  };

  const headline = !result ? null
    : result.status === "ATTACHED" ? `${result.recruiterName || "The recruiter"} can now review this drive`
      : result.emailed ? "Invitation emailed. The drive is theirs to review once they join."
        : "Your invitation is ready. Send it from your email.";

  return (
    <>
      <Button {...buttonProps} onClick={start}>Invite the recruiter to review</Button>
      {result ? (
        <Modal open={open} title="Invite the recruiter to review" onCancel={close} destroyOnClose
          footer={<Button type="primary" onClick={close}>Done</Button>}>
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <Alert type={result.status === "INVITED" && !result.emailed ? "info" : "success"} showIcon message={headline} />
            {result.publicLinkIncluded === false && <Typography.Text type="secondary">Your public link was left out: it is off or can&apos;t be shown.</Typography.Text>}
            {result.status === "INVITED" && result.emailed && result.publicLink && <Typography.Text type="secondary">Your public link was in it, for their colleagues.</Typography.Text>}
            {result.email && (
              <>
                {result.status === "ATTACHED" && <Typography.Text>No email goes out for someone already working with you. Let them know:</Typography.Text>}
                <WrittenOut email={result.email} />
              </>
            )}
            {result.inviteLink && !result.emailed && (
              <Typography.Text type="secondary">
                Their invitation link is personal and works for one person. It is also kept in <Link href={`/tpo/recruiters/${result.recruiterLeadId}`}>Engage</Link>.
              </Typography.Text>
            )}
          </Space>
        </Modal>
      ) : (
        <AsyncModal open={open} title="Invite the recruiter to review" okText="Send invitation" destroyOnClose onCancel={close}
          onOk={async () => {
            const v = await form.validateFields();
            const r = await fetchWithErrorHandling(inviteRecruiterToReview(jobId, { name: v.name || null, email: v.email, note: v.note || null, includePublicLink: Boolean(v.includePublicLink) }));
            if (!r.success) {
              const msg = r?.data?.message || "Couldn't send the invitation";
              form.setFields([{ name: "email", errors: [msg] }]);
              return;
            }
            setResult(r.data || {});
          }}>
          <Typography.Paragraph type="secondary">
            They see this drive in their workspace and answer with change requests. Nothing is published until you publish it.
          </Typography.Paragraph>
          <Form form={form} layout="vertical">
            <Form.Item name="email" label={<Space size={4}>Recruiter&apos;s work email <Tooltip title={RECRUITER_EMAIL_NOTE}><InfoCircleOutlined aria-label={RECRUITER_EMAIL_NOTE} /></Tooltip></Space>} extra={companyName ? `An email address at ${companyName}.` : undefined}
              rules={[{ required: true, message: "Enter their work email" }, { type: "email", message: "Enter a valid email" }]}>
              <Input autoComplete="off" />
            </Form.Item>
            <Form.Item name="name" label="Their name (optional)">
              <Input />
            </Form.Item>
            <Form.Item name="note" label="A note for them (optional)">
              <Input.TextArea rows={2} maxLength={500} />
            </Form.Item>
            <Form.Item name="includePublicLink" valuePropName="checked" style={{ marginBottom: 0 }}
              extra={link?.reason ? <>{link.reason} <Link href="/tpo/settings?tab=recruiters">Settings</Link></> : "So colleagues who should join too can, after confirming their work email."}>
              <Checkbox disabled={!link?.usable}>Add our public link{companyName ? ` for others at ${companyName}` : ""}</Checkbox>
            </Form.Item>
          </Form>
        </AsyncModal>
      )}
    </>
  );
}
