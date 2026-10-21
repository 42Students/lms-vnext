import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Empty, Form, Input, List, Space, Tag, Typography, message } from "antd";
import AsyncModal from "@/components/tpo/ui/AsyncModal";
import { dj } from "@/components/tpo/dj";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { listCampaigns, sendCampaign } from "@/api/Services/TpoHubService";

const errorText = (r, f) => r?.data?.message || r?.message || f;
export const EMAIL_NOT_SET_UP = "Campaign email is not set up yet, so nothing can be sent. Ask 42 to switch it on.";

/** Write one email to the chosen recruiter leads (phase 3). Each gets their own copy, with their name and an unsubscribe link. */
export function CampaignComposer({ recruiterLeads, open, onClose, onSent }) {
  const [form] = Form.useForm();
  const [available, setAvailable] = useState(true);
  useEffect(() => {
    if (!open) return;
    form.resetFields();
    fetchWithErrorHandling(listCampaigns()).then((r) => setAvailable(r.success ? r.data?.emailAvailable !== false : true));
  }, [open, form]);
  const reachable = (recruiterLeads || []).filter((l) => l.email && !l.unsubscribedAt);
  return (
    <AsyncModal open={open} title={`Email ${reachable.length} ${reachable.length === 1 ? "recruiter" : "recruiters"}`} okText="Send" destroyOnClose
      okButtonProps={{ disabled: !available || reachable.length === 0 }} onCancel={onClose}
      onOk={async () => {
        const v = await form.validateFields();
        const r = await fetchWithErrorHandling(sendCampaign({ subject: v.subject, body: v.body, recruiterLeadIds: reachable.map((l) => l.id) }));
        if (!r.success) { message.error(errorText(r, "Couldn't send")); return; }
        if (r.data?.emailAvailable === false) message.warning(EMAIL_NOT_SET_UP);
        else message.success(`${r.data?.sent || 0} sent${r.data?.skipped ? `, ${r.data.skipped} skipped` : ""}${r.data?.failed ? `, ${r.data.failed} failed` : ""}.`);
        onSent?.();
        onClose();
      }}>
      {!available && <Alert type="warning" showIcon message={EMAIL_NOT_SET_UP} style={{ marginBottom: 12 }} />}
      {(recruiterLeads || []).length > reachable.length && (
        <Typography.Paragraph type="secondary">{(recruiterLeads || []).length - reachable.length} left out: no email on file, or they asked not to be contacted.</Typography.Paragraph>
      )}
      <Form form={form} layout="vertical">
        <Form.Item name="subject" label="Subject" rules={[{ required: true, whitespace: true, message: "Give it a subject" }]}><Input maxLength={200} /></Form.Item>
        <Form.Item name="body" label="Email" extra="Write {name} or {company} and each person sees their own. Your signature and an unsubscribe link are added."
          rules={[{ required: true, whitespace: true, message: "Write the email" }]}>
          <Input.TextArea rows={8} maxLength={10000} showCount />
        </Form.Item>
      </Form>
    </AsyncModal>
  );
}

/** Emails sent from Engage, newest first, with what happened to each. */
export default function Campaigns({ reloadKey }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const load = useCallback(async () => {
    const r = await fetchWithErrorHandling(listCampaigns());
    if (!r.success) { setError(errorText(r, "Couldn't load emails")); setData({ campaigns: [] }); return; }
    setError(null);
    setData(r.data || { campaigns: [] });
  }, []);
  useEffect(() => { load(); }, [load, reloadKey]);
  return (
    <Card data-testid="engage.campaigns">
      {data?.emailAvailable === false && <Alert type="warning" showIcon message={EMAIL_NOT_SET_UP} style={{ marginBottom: 12 }} />}
      {error && <Alert type="error" showIcon message={error} action={<Button size="small" onClick={load}>Retry</Button>} style={{ marginBottom: 12 }} />}
      <Typography.Paragraph type="secondary">To send one, select recruiters in the table and choose Act, then Send an email.</Typography.Paragraph>
      <List loading={!data} dataSource={data?.campaigns || []} locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No emails sent from Engage yet." /> }}
        renderItem={(c) => (
          <List.Item key={c.id}>
            <List.Item.Meta title={c.subject}
              description={<Typography.Text type="secondary">{[c.sentBy, dj(c.createdAt).format("HH:mm D MMM YYYY")].filter(Boolean).join(" · ")}</Typography.Text>} />
            <Space wrap size={4}>
              <Tag color="green">{c.sent} sent</Tag>
              {c.skipped > 0 && <Tag>{c.skipped} skipped</Tag>}
              {c.failed > 0 && <Tag color="red">{c.failed} failed</Tag>}
            </Space>
          </List.Item>
        )} />
    </Card>
  );
}
