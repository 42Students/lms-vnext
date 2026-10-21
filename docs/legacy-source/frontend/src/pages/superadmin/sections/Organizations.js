import { useState, useEffect, useRef } from "react";
import { Alert, Form, Input, Button, Table, Card, Row, Col, message, Space, Tag, Popconfirm, Modal, Typography } from "antd";
import { PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { createOrganization, getOrganizations, updateOrganization, deleteOrganization, fetchWithErrorHandling } from "@/api/Services/AdminService";
import { useUnsavedFormGuard } from "@/components/admin/projects/useUnsavedFormGuard";
import { RefreshStatus, TableSkeleton } from "@/components/Common/Skeletons";

const PAGE_SIZE_KEY = "admin-organizations-page-size";
const PAGE_SIZES = [10, 25, 50, 100];
const normalizeName = (value) => typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";

const Organizations = ({ readOnly = false, onCreated } = {}) => {
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [data, setData] = useState([]);
  const [loadError, setLoadError] = useState(null);
  // After the first successful load, a failed refresh keeps the last rows on screen instead of emptying the table.
  const [hasLoaded, setHasLoaded] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const actionRef = useRef(false);
  const [actionBusy, setActionBusy] = useState(null);

  useUnsavedFormGuard(form, { enabled: !loading });
  useUnsavedFormGuard(editForm, { enabled: editModalVisible && !editLoading });

  // Read browser preferences after mount, avoiding server/client hydration mismatches.
  useEffect(() => {
    try {
      const saved = Number(window.localStorage.getItem(PAGE_SIZE_KEY));
      if (PAGE_SIZES.includes(saved)) setPageSize(saved);
    } catch (_) { /* Preferences are optional in restricted browsers. */ }
  }, []);

  // BE-0099: only the newest list request may set the table (a slow older read can't undo a create, rename or delete).
  const fetchSeq = useRef(0);
  const fetchData = async () => {
    const seq = ++fetchSeq.current;
    setTableLoading(true);
    setLoadError(null);
    try {
      const result = await fetchWithErrorHandling(getOrganizations());
      if (seq !== fetchSeq.current) return;
      if (!result.success || !Array.isArray(result.data)) throw new Error(result.message || "Could not load organizations.");
      setData(result.data);
      setHasLoaded(true);
    } catch (error) {
      if (seq !== fetchSeq.current) return;
      setLoadError(error?.message || "Could not load organizations.");
      if (!hasLoaded) setData([]);
    } finally {
      if (seq === fetchSeq.current) setTableLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = data.filter((record) => String(record.name || "").toLowerCase().includes(search.trim().toLowerCase()));

  const handleSubmit = async (values) => {
    if (readOnly) { message.warning("Clear scope to manage organizations."); return; }
    const name = normalizeName(values.name);
    if (!name) { form.setFields([{ name: "name", errors: ["Organization name is required"] }]); return; }
    if (actionRef.current) return;
    actionRef.current = true;
    setActionBusy("create");
    setLoading(true);
    try {
      const res = await createOrganization({ name });
      const created = res?.data?.data ?? res?.data ?? null;
      message.success(`Created organization “${name}”.`);
      form.resetFields();
      await fetchData();
      if (created?.id != null) onCreated?.(created);
    } catch (error) {
      message.error("Failed to create organization: " + (error?.response?.data?.message || error.message));
    } finally { actionRef.current = false; setActionBusy(null); setLoading(false); }
  };

  const handleEdit = (record) => {
    if (readOnly) { message.warning("Clear scope to manage organizations."); return; }
    setEditingRecord(record);
    editForm.setFieldsValue({ name: record.name });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    if (readOnly || actionRef.current) { if (readOnly) message.warning("Clear scope to manage organizations."); return; }
    try {
      const values = await editForm.validateFields();
      const name = normalizeName(values.name);
      if (!name) { editForm.setFields([{ name: "name", errors: ["Organization name is required"] }]); return; }
      actionRef.current = true;
      setActionBusy(`edit:${editingRecord.id}`);
      setEditLoading(true);
      await updateOrganization(editingRecord.id, { name });
      message.success(`Updated organization “${name}”.`);
      setEditModalVisible(false);
      setEditingRecord(null);
      editForm.resetFields();
      await fetchData();
    } catch (error) {
      if (!error?.errorFields) message.error("Failed to update organization: " + (error?.response?.data?.message || error?.message));
    } finally { actionRef.current = false; setActionBusy(null); setEditLoading(false); }
  };

  const handleDelete = async (record) => {
    if (readOnly || actionRef.current) { if (readOnly) message.warning("Clear scope to manage organizations."); return; }
    actionRef.current = true;
    setActionBusy(`delete:${record.id}`);
    try {
      await deleteOrganization(record.id);
      message.success(`Deleted organization “${record.name}”.`);
      await fetchData();
    } catch (error) {
      message.error("Failed to delete organization: " + (error?.response?.data?.message || error.message));
    } finally {
      actionRef.current = false;
      setActionBusy(null);
    }
  };

  const finishCloseEdit = () => {
    setEditModalVisible(false);
    setEditingRecord(null);
    editForm.resetFields();
  };
  const handleEditCancel = () => {
    if (!editingRecord || normalizeName(editForm.getFieldValue("name")) === normalizeName(editingRecord.name)) {
      finishCloseEdit();
      return;
    }
    Modal.confirm({
      title: "Discard changes to this organization?",
      content: `Your unsaved edits to “${editingRecord.name}” will be lost.`,
      okText: "Discard changes",
      okButtonProps: { danger: true },
      onOk: finishCloseEdit,
    });
  };

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Status", key: "status", width: 100, render: () => <Tag color="green">Active</Tag> },
    {
      title: "Actions", key: "actions", width: 210,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button size="small" icon={<EditOutlined />} aria-label={`Edit organization ${record.name}`} onClick={() => handleEdit(record)} disabled={readOnly || actionBusy != null}>Edit</Button>
          <Popconfirm title={`Delete “${record.name}”?`}
            description="Deletion is blocked while colleges belong to this organization."
            onConfirm={() => handleDelete(record)} okText="Delete" cancelText="Cancel"
            okButtonProps={{ danger: true }} disabled={readOnly}>
            <Button size="small" danger icon={<DeleteOutlined />} aria-label={`Delete organization ${record.name}`} loading={actionBusy === `delete:${record.id}`} disabled={readOnly || actionBusy != null}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Row gutter={24}>
      <Col xs={24} lg={10}>
        <Card title="Create New Organization" size="small">
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item name="name" label="Organization Name" rules={[{ required: true, whitespace: true, message: "Please enter organization name" }]}>
              <Input placeholder="e.g., ABC University" maxLength={255} />
            </Form.Item>
            <Form.Item><Button type="primary" htmlType="submit" loading={loading} icon={<PlusOutlined />} disabled={readOnly || actionBusy != null}>Create Organization</Button></Form.Item>
          </Form>
        </Card>
      </Col>
      <Col xs={24} lg={14}>
        <Card title="Existing Organizations" size="small" extra={
          <Space wrap>
            <Input.Search aria-label="Search organizations" placeholder="Search organizations" allowClear size="small" style={{ width: 200 }}
              value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
            {search.trim() && <Button size="small" onClick={() => { setSearch(""); setPage(1); }}>Clear search</Button>}
            <Button icon={<ReloadOutlined />} onClick={fetchData} loading={tableLoading} size="small">Refresh</Button>
          </Space>
        }>
          {loadError && <Alert type={hasLoaded ? "warning" : "error"} showIcon
            message={hasLoaded ? "Couldn't refresh organizations" : "Organizations could not be loaded"}
            description={hasLoaded ? `${loadError} Showing the last loaded list.` : loadError}
            action={<Button size="small" onClick={fetchData} disabled={tableLoading}>Retry</Button>} style={{ marginBottom: 12 }} />}
          {tableLoading && hasLoaded ? <RefreshStatus label="Refreshing organizations…" /> : null}
          <Typography.Text type="secondary" role="status">{search.trim() ? `${filtered.length} of ${data.length} organizations` : `${data.length} organizations`}</Typography.Text>
          {tableLoading && !hasLoaded ? <TableSkeleton rows={6} columns={3} label="Loading organizations" /> : (
          <Table dataSource={filtered} columns={columns} rowKey="id"
            size="small" scroll={{ x: "max-content" }}
            pagination={{ current: page, pageSize, showSizeChanger: true, pageSizeOptions: PAGE_SIZES,
              onChange: (nextPage, nextSize) => {
                setPage(nextSize !== pageSize ? 1 : nextPage);
                setPageSize(nextSize);
                try { window.localStorage.setItem(PAGE_SIZE_KEY, String(nextSize)); } catch (_) { /* Optional preference */ }
              },
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}` }}
            locale={{ emptyText: loadError ? "Unable to load organizations; use Retry above." : search.trim() ? "No matching organizations. Clear search to see all." : "No organizations found." }} />
          )}
        </Card>
      </Col>
      <Modal title={editingRecord ? `Edit “${editingRecord.name}”` : "Edit Organization"} open={editModalVisible}
        onOk={handleEditSubmit} onCancel={handleEditCancel} confirmLoading={editLoading}
        okText="Save Changes" cancelText="Cancel" maskClosable={false}>
        <Form form={editForm} layout="vertical">
          <Form.Item name="name" label="Organization Name" rules={[{ required: true, whitespace: true, message: "Please enter organization name" }]}>
            <Input placeholder="e.g., ABC University" maxLength={255} />
          </Form.Item>
        </Form>
      </Modal>
    </Row>
  );
};

export default Organizations;
