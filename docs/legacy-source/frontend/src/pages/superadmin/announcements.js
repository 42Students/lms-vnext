import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Checkbox, DatePicker, Form, Input, Radio, Select, Space, Typography, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminGroupShell from "@/components/admin/SuperAdminGroupShell";
import AsyncModal from "@/components/tpo/ui/AsyncModal";
import AnnouncementList from "@/components/tpo/announcements/AnnouncementList";
import { dj, serverTime } from "@/components/tpo/dj";
import {
  deleteSuperAdminAnnouncement, listPlacementCells, listSuperAdminAnnouncements, postSuperAdminAnnouncement, updateSuperAdminAnnouncement,
} from "@/api/Services/AdminService";

const errorText = (e, f) => e?.response?.data?.message || e?.response?.data?.error || f;

/**
 * Placements > Announcements: 42 writes to placement cells (N12; V2, backend docs/tpo-announcements/ANNOUNCEMENTS-V2-2026-10-12.md).
 * Every placement cell or picked ones; a button and an end date; edit; "N of M placement cells read". Each cell gets a bell and an
 * unread count, and reads it under Announcements > From 42.
 */
export default function SuperAdminAnnouncements() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // {} = new
  const [cells, setCells] = useState([]);
  const [form] = Form.useForm();
  const to = Form.useWatch("to", form);

  const load = useCallback(() => {
    setItems(null);
    listSuperAdminAnnouncements()
      .then((res) => { setItems(Array.isArray(res?.data) ? res.data : []); setError(null); })
      .catch((e) => { setError(errorText(e, "Couldn't load announcements")); setItems([]); });
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { listPlacementCells().then((r) => setCells(Array.isArray(r?.data) ? r.data : [])).catch(() => setCells([])); }, []);

  const open = (a) => {
    form.setFieldsValue(a?.id ? {
      title: a.title, body: a.body, pinned: Boolean(a.pinned), linkLabel: a.linkLabel || "", linkUrl: a.linkUrl || "", showUntil: a.showUntil ? dj(a.showUntil) : null,
    } : { title: "", body: "", pinned: false, linkLabel: "", linkUrl: "", showUntil: null, to: "ALL", collegeIds: [] });
    setEditing(a || {});
  };

  const submit = async () => {
    const v = await form.validateFields();
    const body = { title: v.title, body: v.body, pinned: Boolean(v.pinned), linkLabel: v.linkLabel || null, linkUrl: v.linkUrl || null,
      showUntil: v.showUntil ? serverTime(v.showUntil) : null };
    try {
      if (editing?.id) {
        await updateSuperAdminAnnouncement(editing.id, body);
        message.success("Saved");
      } else {
        body.audience = v.to === "SOME" ? { collegeIds: v.collegeIds || [] } : null;
        const res = await postSuperAdminAnnouncement(body);
        message.success(`Sent to ${res?.data?.colleges ?? "every"} placement ${Number(res?.data?.colleges) === 1 ? "cell" : "cells"}`);
      }
      setEditing(null);
      load();
      return true;
    } catch (e) {
      message.error(errorText(e, "Couldn't send"));
      return false;
    }
  };

  return (
    <div className="ln-module admin-list-page" data-testid="superadmin.announcements">
      <SuperAdminGroupShell groupKey="placements" actions={<Button type="primary" icon={<PlusOutlined />} onClick={() => open(null)}>New announcement</Button>}>
        <Typography.Paragraph type="secondary">To placement cells. Each one gets a bell and reads it under Announcements &gt; From 42.</Typography.Paragraph>
        {error && <Alert type="error" showIcon message={error} action={<Button size="small" onClick={load}>Retry</Button>} style={{ marginBottom: 12 }} />}
        <AnnouncementList mode="superadmin" items={items} loading={items === null} emptyText="Nothing sent yet."
          onEdit={(a) => open(a)}
          onDelete={async (a) => {
            try { await deleteSuperAdminAnnouncement(a.id); message.success("Deleted"); load(); } catch (e) { message.error(errorText(e, "Couldn't delete")); }
          }} />
      </SuperAdminGroupShell>

      <AsyncModal open={Boolean(editing)} title={editing?.id ? "Edit announcement" : "New announcement to placement cells"} destroyOnClose width={600}
        okText={editing?.id ? "Save" : to === "SOME" ? "Send to the picked placement cells" : `Send to every placement cell (${cells.length})`}
        onCancel={() => setEditing(null)} onOk={submit}>
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true, whitespace: true, message: "Give it a title" }]}><Input maxLength={200} /></Form.Item>
          <Form.Item name="body" label="Announcement" rules={[{ required: true, whitespace: true, message: "Write the announcement" }]}>
            <Input.TextArea rows={6} maxLength={8000} showCount placeholder="Links starting with https:// become clickable." />
          </Form.Item>
          {!editing?.id && (
            <>
              <Form.Item name="to" label="To">
                <Radio.Group options={[{ value: "ALL", label: `Every placement cell (${cells.length})` }, { value: "SOME", label: "Some placement cells" }]} />
              </Form.Item>
              {to === "SOME" && (
                <Form.Item name="collegeIds" label="Placement cells" rules={[{ required: true, message: "Pick at least one" }]}>
                  <Select mode="multiple" optionFilterProp="label" options={cells.map((c) => ({ value: c.id, label: c.name }))} placeholder="Pick colleges" />
                </Form.Item>
              )}
            </>
          )}
          {editing?.id && <Alert type="info" showIcon style={{ marginBottom: 12 }} message={`Sent to ${editing.audienceLabel || "placement cells"}`} />}
          <Typography.Text strong>Button (optional)</Typography.Text>
          <Space.Compact block style={{ marginTop: 6, marginBottom: 12 }}>
            <Form.Item name="linkLabel" noStyle><Input style={{ width: "36%" }} maxLength={60} placeholder="Read more" aria-label="Button label" /></Form.Item>
            <Form.Item name="linkUrl" noStyle rules={[{ pattern: /^https:\/\/\S+$/i, message: "The link has to start with https://" }]}><Input placeholder="https://…" aria-label="Button link" /></Form.Item>
          </Space.Compact>
          <Form.Item name="showUntil" label="Show until (optional)">
            <DatePicker showTime={{ format: "h:mm A" }} format="ddd D MMM, h:mm A" style={{ width: "100%" }} disabledDate={(d) => d && d.endOf("day").isBefore(dj())} />
          </Form.Item>
          <Form.Item name="pinned" valuePropName="checked"><Checkbox>Pin it to the top</Checkbox></Form.Item>
        </Form>
      </AsyncModal>
    </div>
  );
}

SuperAdminAnnouncements.superAdminLayout = SuperAdminLayout;
