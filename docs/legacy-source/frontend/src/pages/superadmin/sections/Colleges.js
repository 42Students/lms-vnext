import { useState, useEffect, useMemo, useRef } from "react";
import { Alert, Form, Input, Button, Table, Card, Row, Col, message, Select, Space, Popconfirm, Modal, Tag, Collapse } from "antd";
import { PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import ManageCollegeDrawer from "./ManageCollegeDrawer";
import HelpHint from "@/components/admin/HelpHint";
import { useUnsavedFormGuard } from "@/components/admin/projects/useUnsavedFormGuard";
import { parseCsvRecords } from "@/utils/bulkCsvParse";
import {
  createCollege,
  getColleges,
  getOrganizations,
  updateCollege,
  deleteCollege,
  fetchWithErrorHandling
} from "@/api/Services/AdminService";
// Domain health moved to Domains section; keep Tenants focused on onboarding.

const { Option } = Select;

const BULK_TEMPLATE = "orgId,name,uniqueId,city,state\n1,\"Engineering College, Main Campus\",eng-college,Vijayawada,Andhra Pradesh";
const MAX_BULK_COLLEGES = 200;

const Colleges = ({ readOnly = false, defaultOrgId = null, onCreated } = {}) => {
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [data, setData] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [organizationsError, setOrganizationsError] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [managingCollege, setManagingCollege] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState(null);
  const [bulkParseError, setBulkParseError] = useState(null);
  const [search, setSearch] = useState("");
  const actionRef = useRef(false);
  const [actionBusy, setActionBusy] = useState(null);

  useUnsavedFormGuard(form, { enabled: !loading });
  useUnsavedFormGuard(editForm, { enabled: editModalVisible && !editLoading });

  useEffect(() => {
    if (defaultOrgId != null) form.setFieldsValue({ orgId: defaultOrgId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultOrgId]);

  const fetchData = async () => {
    setTableLoading(true);
    setLoadError(null);
    const result = await fetchWithErrorHandling(getColleges());
    if (result.success && Array.isArray(result.data)) {
      setData(result.data);
    } else {
      setLoadError(result?.data?.message || result?.data?.error || result?.message || "Could not load colleges");
    }
    setTableLoading(false);
  };

  const fetchOrganizations = async () => {
    setOrganizationsError(null);
    const result = await fetchWithErrorHandling(getOrganizations());
    if (result.success && Array.isArray(result.data)) {
      setOrganizations(result.data);
    } else {
      setOrganizations([]);
      setOrganizationsError(result?.data?.message || result?.data?.error || result?.message || "Could not load organizations");
    }
  };

  useEffect(() => {
    fetchData();
    fetchOrganizations();
  }, []);

  const normalizeUniqueId = (v) => {
    const s = typeof v === "string" ? v.trim() : "";
    return s.toLowerCase();
  };

  const handleSubmit = async (values) => {
    if (readOnly) {
      message.warning("Clear scope to manage colleges.");
      return;
    }
    if (actionRef.current) return;
    const uniqueId = normalizeUniqueId(values.uniqueId);
    if (!/^[a-z0-9-]{3,63}$/.test(uniqueId)) {
      message.error("Unique ID must be 3-63 chars, lowercase letters/numbers/hyphen only.");
      return;
    }
    actionRef.current = true;
    setActionBusy("create");
    setLoading(true);
    try {
      const payload = {
        name: values.name,
        unique_id: uniqueId,
        org_id: values.orgId,
        address_line1: values.addressLine1 || "",
        address_line2: values.addressLine2 || "",
        city: values.city || "",
        state: values.state || "",
        country: values.country || "India",
        pin_code: values.pinCode || "",
      };
      const res = await createCollege(payload);
      const created = res?.data?.data ?? res?.data ?? null;
      message.success("College created");
      form.resetFields();
      if (defaultOrgId != null) form.setFieldsValue({ orgId: defaultOrgId });
      fetchData();
      if (created?.id != null) onCreated?.(created);
    } catch (error) {
      message.error("Failed to create college: " + (error?.response?.data?.error || error?.response?.data?.message || error.message));
    } finally {
      actionRef.current = false;
      setActionBusy(null);
      setLoading(false);
    }
  };

  // Shared by the single-college form (handleSubmit) and bulk import — same validation, same
  // payload shape, so a bulk row and a manually-typed row behave identically.
  const buildCollegePayload = (row) => {
    const uniqueId = normalizeUniqueId(row.uniqueId);
    if (!/^[a-z0-9-]{3,63}$/.test(uniqueId)) {
      throw new Error("uniqueId must be 3-63 chars, lowercase letters/numbers/hyphen only");
    }
    if (!row.name || !String(row.name).trim()) throw new Error("name is required");
    const orgId = Number(row.orgId);
    if (!orgId || Number.isNaN(orgId)) throw new Error("orgId must be a number");
    if (organizations.length > 0 && !organizations.some((org) => Number(org.id) === orgId)) {
      throw new Error(`organization ${orgId} is not available in the current tenant list`);
    }
    return {
      name: String(row.name).trim(),
      unique_id: uniqueId,
      org_id: orgId,
      address_line1: row.addressLine1 || "",
      address_line2: row.addressLine2 || "",
      city: row.city || "",
      state: row.state || "",
      country: row.country || "India",
      pin_code: row.pinCode || "",
    };
  };

  const parseBulkCsv = (text) => {
    let records;
    try {
      records = parseCsvRecords(text);
    } catch (error) {
      return { rows: [], error: error?.message || "Malformed CSV" };
    }
    if (records.length === 0) return { rows: [], error: "Paste at least one college row first." };

    const first = records[0].map((value) => String(value ?? "").trim());
    const normalizedHeader = first.map((value) => value.toLowerCase().replace(/[\s_-]/g, ""));
    const hasHeader = normalizedHeader.includes("orgid") || normalizedHeader.includes("organizationid");
    const dataRecords = hasHeader ? records.slice(1) : records;
    if (dataRecords.length === 0) return { rows: [], error: "The CSV has a header but no college rows." };
    if (dataRecords.length > MAX_BULK_COLLEGES) {
      return { rows: [], error: `Maximum ${MAX_BULK_COLLEGES} colleges per import. This CSV has ${dataRecords.length}.` };
    }

    const headerIndex = (aliases) => normalizedHeader.findIndex((value) => aliases.includes(value));
    const indexes = hasHeader ? {
      orgId: headerIndex(["orgid", "organizationid"]),
      name: headerIndex(["name", "collegename"]),
      uniqueId: headerIndex(["uniqueid", "collegecode", "code"]),
      city: headerIndex(["city"]),
      state: headerIndex(["state"]),
    } : null;
    if (hasHeader && (indexes.orgId < 0 || indexes.name < 0 || indexes.uniqueId < 0)) {
      return { rows: [], error: "Header must include orgId, name and uniqueId. City and state are optional." };
    }

    const rows = [];
    for (let index = 0; index < dataRecords.length; index += 1) {
      const record = dataRecords[index];
      if (!hasHeader && (record.length < 3 || record.length > 5)) {
        return { rows: [], error: `CSV record ${index + 1} has ${record.length} columns; expected 3 to 5.` };
      }
      const valueAt = (position) => position >= 0 ? String(record[position] ?? "").trim() : "";
      rows.push(hasHeader ? {
        orgId: valueAt(indexes.orgId),
        name: valueAt(indexes.name),
        uniqueId: valueAt(indexes.uniqueId),
        city: valueAt(indexes.city),
        state: valueAt(indexes.state),
      } : {
        orgId: valueAt(0),
        name: valueAt(1),
        uniqueId: valueAt(2),
        city: valueAt(3),
        state: valueAt(4),
      });
    }

    const seenCodes = new Map();
    for (let index = 0; index < rows.length; index += 1) {
      const code = normalizeUniqueId(rows[index].uniqueId);
      if (!code) continue;
      if (seenCodes.has(code)) {
        return { rows: [], error: `Duplicate uniqueId "${code}" in rows ${seenCodes.get(code) + 1} and ${index + 1}.` };
      }
      seenCodes.set(code, index);
    }

    return { rows, error: null };
  };

  const handleBulkImport = async () => {
    if (actionRef.current) return;
    const parsed = parseBulkCsv(bulkText);
    if (parsed.error) {
      setBulkParseError(parsed.error);
      setBulkResults(null);
      return;
    }
    const rows = parsed.rows;
    setBulkParseError(null);
    actionRef.current = true;
    setActionBusy("bulk");
    setBulkLoading(true);
    const results = [];
    // Sequential, not Promise.all — a duplicate uniqueId within the pasted batch itself should be
    // caught by createCollege's own uniqueness check as soon as the first occurrence lands, so
    // later rows in the same batch see it too (parallel requests would all pass the check at once).
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const payload = buildCollegePayload(row);
        await createCollege(payload);
        results.push({ index: i, name: row.name, uniqueId: row.uniqueId, status: "success" });
      } catch (error) {
        const msg = error?.response?.data?.error || error?.response?.data?.message || error.message;
        results.push({ index: i, name: row.name, uniqueId: row.uniqueId, status: "error", message: msg });
      }
    }
    setBulkResults(results);
    actionRef.current = false;
    setActionBusy(null);
    setBulkLoading(false);
    fetchData();
    const failCount = results.filter((r) => r.status === "error").length;
    if (failCount === 0) message.success(`Imported ${results.length} colleges.`);
    else message.warning(`Imported ${results.length - failCount}/${results.length} colleges — see results below.`);
  };

  const handleEdit = (record) => {
    if (readOnly) {
      message.warning("Clear scope to manage colleges.");
      return;
    }
    setEditingRecord(record);
    editForm.setFieldsValue({
      name: record.name,
      uniqueId: record.uniqueId,
      orgId: record.orgId,
      city: record.city,
      state: record.state,
      addressLine1: record.addressLine1,
      addressLine2: record.addressLine2,
      pinCode: record.pinCode,
      country: record.country || "India",
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    if (actionRef.current) return;
    if (readOnly) {
      message.warning("Clear scope to manage colleges.");
      return;
    }
    try {
      const values = await editForm.validateFields();
      setEditLoading(true);
      const uniqueId = normalizeUniqueId(values.uniqueId);
      if (!/^[a-z0-9-]{3,63}$/.test(uniqueId)) {
        message.error("Unique ID must be 3-63 chars, lowercase letters/numbers/hyphen only.");
        setEditLoading(false);
        return;
      }
      const payload = {
        name: values.name,
        unique_id: uniqueId,
        org_id: values.orgId,
        address_line1: values.addressLine1 || "",
        address_line2: values.addressLine2 || "",
        city: values.city || "",
        state: values.state || "",
        country: values.country || "India",
        pin_code: values.pinCode || "",
      };
      actionRef.current = true;
      setActionBusy(`edit:${editingRecord.id}`);
      await updateCollege(editingRecord.id, payload);
      message.success("College updated");
      setEditModalVisible(false);
      setEditingRecord(null);
      editForm.resetFields();
      fetchData();
    } catch (error) {
      if (error.errorFields) {
        return;
      }
      message.error("Failed to update college: " + (error?.response?.data?.message || error.message));
    }
    actionRef.current = false;
    setActionBusy(null);
    setEditLoading(false);
  };

  const handleDelete = async (id) => {
    if (actionRef.current) return;
    if (readOnly) {
      message.warning("Clear scope to manage colleges.");
      return;
    }
    actionRef.current = true;
    setActionBusy(`delete:${id}`);
    try {
      await deleteCollege(id);
      message.success("College deleted");
      fetchData();
    } catch (error) {
      message.error("Failed to delete college: " + (error?.response?.data?.message || error?.response?.data?.error || error.message));
    } finally {
      actionRef.current = false;
      setActionBusy(null);
    }
  };

  const requestBulkClose = () => {
    if (actionRef.current) return;
    if (!bulkText.trim()) {
      setBulkOpen(false);
      return;
    }
    Modal.confirm({
      title: "Discard this bulk-import draft?",
      content: "The pasted college rows will be lost.",
      okText: "Discard",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: () => { setBulkText(""); setBulkResults(null); setBulkOpen(false); },
    });
  };

  const finishEditCancel = () => {
    setEditModalVisible(false);
    setEditingRecord(null);
    editForm.resetFields();
  };

  const handleEditCancel = () => {
    if (actionRef.current) return;
    if (!editForm.isFieldsTouched()) {
      finishEditCancel();
      return;
    }
    Modal.confirm({
      title: "Discard college changes?",
      content: "Your unsaved college details will be lost.",
      okText: "Discard",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: finishEditCancel,
    });
  };

  const organizationNameById = useMemo(
    () => new Map(organizations.map((org) => [Number(org.id), org.name || `Organization ${org.id}`])),
    [organizations]
  );
  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((record) => {
      const orgName = organizationNameById.get(Number(record.orgId)) || "";
      return [record.name, record.uniqueId, record.city, record.state, orgName]
        .some((value) => String(value ?? "").toLowerCase().includes(q));
    });
  }, [data, organizationNameById, search]);

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Organization", key: "organization", render: (_, record) => organizationNameById.get(Number(record.orgId)) || `Org #${record.orgId ?? "—"}` },
    { title: "Unique ID", dataIndex: "uniqueId", key: "uniqueId" },
    { title: "City", dataIndex: "city", key: "city" },
    { title: "State", dataIndex: "state", key: "state" },
    {
      title: "Actions",
      key: "actions",
      width: 210,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            onClick={() => {
              setManagingCollege({
                ...record,
                organizationName: organizationNameById.get(Number(record.orgId)) || null,
              });
              setManageOpen(true);
            }}
            disabled={readOnly}
          >
            Manage
          </Button>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
            aria-label={`Edit college ${record.name ?? ""}`.trim()}
            disabled={readOnly}
          />
          <Popconfirm
            title="Delete College"
            description="Only an empty college can be deleted. The server blocks deletion while departments, programs, students, faculty or active tenant domains still belong to it."
            onConfirm={() => handleDelete(record.id)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true, size: "large" }}
            cancelButtonProps={{ size: "large" }}
            disabled={readOnly}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
              aria-label={`Delete college ${record.name ?? ""}`.trim()}
              loading={actionBusy === `delete:${record.id}`}
              disabled={readOnly || actionBusy != null}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row gutter={24}>
        <Col xs={24} lg={10}>
            <Card title="Create New College" size="small">
              <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item
                name="orgId"
                label="Organization"
                rules={[{ required: true, message: "Please select organization" }]}
              >
                <Select placeholder={organizationsError ? "Organizations unavailable — Retry above" : "Select organization"} disabled={Boolean(organizationsError) || readOnly}>
                  {organizations.map((org) => (
                    <Option key={org.id} value={org.id}>
                      {org.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="name"
                label="College Name"
                rules={[{ required: true, message: "Please enter college name" }]}
              >
                <Input placeholder="e.g., Engineering College" />
              </Form.Item>

              <Form.Item
                name="uniqueId"
                label={
                  <span>
                    Unique ID / Code{" "}
                    <HelpHint title="Unique ID / Code">
                      A short, permanent code for this college — shown in switchers and menus (e.g.
                      “ROLE • NSRIT”). It’s separate from the web address you’ll add next, though
                      people often reuse the same word for both.{"\n\n"}Once set, avoid changing it
                      — other parts of the system reference it by this code, not by the college’s
                      display name.
                    </HelpHint>
                  </span>
                }
                rules={[{ required: true, message: "Please enter unique ID" }]}
              >
                <Input placeholder="e.g., nsrit or eng-college" />
              </Form.Item>

              {/* Address fields are optional and every one of them can be filled in later from
                  Manage — collapsed by default so the form's first impression is three fields,
                  not eight. */}
              {/* items API (Panel children logged a deprecation error on every visit); forceRender keeps
                  the address fields registered while collapsed, so Country's "India" default is sent. */}
              <Collapse ghost style={{ marginBottom: 16 }} items={[{
                key: "address",
                label: "Address details (optional)",
                forceRender: true,
                children: (<>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item name="city" label="City">
                        <Input placeholder="City" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="state" label="State">
                        <Input placeholder="State" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item name="addressLine1" label="Address">
                    <Input.TextArea rows={2} placeholder="Full address" />
                  </Form.Item>

                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item name="pinCode" label="Pin Code">
                        <Input placeholder="Pin Code" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="country" label="Country" initialValue="India">
                        <Input placeholder="Country" />
                      </Form.Item>
                    </Col>
                  </Row>
                </>),
              }]} />

                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading} icon={<PlusOutlined />} disabled={readOnly || Boolean(organizationsError) || actionBusy != null}>
                    Create College
                  </Button>
                </Form.Item>
              </Form>
            </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title="Existing Colleges"
            size="small"
            extra={
              <Space wrap>
                <Input.Search
                  aria-label="Search colleges"
                  placeholder="Search college, code, city or organization"
                  allowClear
                  size="small"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  style={{ width: 260, maxWidth: "100%" }}
                />
                <Button
                  icon={<UploadOutlined />}
                  onClick={() => {
                    setBulkResults(null);
                    setBulkText("");
                    setBulkOpen(true);
                  }}
                  size="small"
                  disabled={readOnly}
                >
                  Bulk Import
                </Button>
                <Button icon={<ReloadOutlined />} onClick={fetchData} size="small" loading={tableLoading}>
                  Refresh
                </Button>
              </Space>
            }
          >
            {loadError && <Alert type={data.length ? "warning" : "error"} showIcon
              message={data.length ? "College refresh failed" : "Colleges could not be loaded"}
              description={data.length ? `Showing the last successful list. ${loadError}` : loadError}
              action={<Button size="small" onClick={fetchData}>Retry</Button>} style={{ marginBottom: 12 }} />}
            {organizationsError && <Alert type="error" showIcon message="Organizations could not be loaded"
              description="Creating or moving a college is blocked until the organization list can be verified."
              action={<Button size="small" onClick={fetchOrganizations}>Retry organizations</Button>} style={{ marginBottom: 12 }} />}
            <div style={{ marginBottom: 10 }}>
              <Tag>{search.trim() ? `${filteredData.length} of ${data.length} colleges` : `${data.length} colleges`}</Tag>
              {search.trim() ? <Button type="link" size="small" onClick={() => setSearch("")}>Clear search</Button> : null}
            </div>
            <Table
              dataSource={filteredData}
              columns={columns}
              rowKey="id"
              loading={tableLoading}
              size="small"
              scroll={{ x: 'max-content' }}
              pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}` }}
              locale={{ emptyText: loadError ? "Could not load colleges; use Retry above."
                : search.trim() ? "No colleges match this search."
                : "No colleges found. Create an organization first, then add colleges." }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="Bulk Import Colleges (CSV)"
        open={bulkOpen}
        onCancel={requestBulkClose}
        width={640}
        footer={[
          <Button key="close" onClick={requestBulkClose} disabled={bulkLoading}>
            Close
          </Button>,
          <Button key="import" type="primary" loading={bulkLoading} disabled={!bulkText.trim() || (actionBusy != null && actionBusy !== "bulk")} onClick={handleBulkImport}>
            Import
          </Button>,
        ]}
      >
        <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
          Columns: <code>orgId,name,uniqueId,city,state</code> (city/state optional). A header is optional.
          Standard quoted CSV is supported, including commas inside a college name. Up to {MAX_BULK_COLLEGES} colleges
          can be imported at once; duplicate codes in the pasted batch are rejected before any row is created.
        </div>
        <Input.TextArea
          rows={8}
          value={bulkText}
          onChange={(e) => {
            setBulkText(e.target.value);
            setBulkParseError(null);
            setBulkResults(null);
          }}
          placeholder={BULK_TEMPLATE}
        />
        {bulkParseError ? (
          <Alert type="error" showIcon message="CSV needs attention" description={bulkParseError} style={{ marginTop: 12 }} />
        ) : null}
        {bulkResults && (
          <div style={{ marginTop: 16 }}>
            <Table
              size="small"
              rowKey="index"
              dataSource={bulkResults}
              pagination={false}
              columns={[
                { title: "#", dataIndex: "index", width: 40, render: (v) => v + 1 },
                { title: "Name", dataIndex: "name" },
                { title: "Unique ID", dataIndex: "uniqueId" },
                {
                  title: "Result",
                  key: "result",
                  render: (_, r) =>
                    r.status === "success" ? (
                      <Tag color="green">Created</Tag>
                    ) : (
                      <Tag color="red" title={r.message}>
                        Failed
                      </Tag>
                    ),
                },
                { title: "Message", dataIndex: "message", render: (v) => v || "—" },
              ]}
            />
          </div>
        )}
      </Modal>

      <ManageCollegeDrawer
        open={manageOpen}
        onClose={() => {
          setManageOpen(false);
          setManagingCollege(null);
        }}
        college={managingCollege}
      />

      {/* Edit Modal */}
      <Modal
        title="Edit College"
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={handleEditCancel}
        confirmLoading={editLoading}
        okButtonProps={{ disabled: Boolean(organizationsError) || readOnly }}
        okText="Save Changes"
        cancelText="Cancel"
        width={600}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="orgId"
            label="Organization"
            rules={[{ required: true, message: "Please select organization" }]}
          >
            <Select placeholder={organizationsError ? "Organizations unavailable — Retry above" : "Select organization"} disabled={Boolean(organizationsError) || readOnly}>
              {organizations.map((org) => (
                <Option key={org.id} value={org.id}>
                  {org.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="name"
            label="College Name"
            rules={[{ required: true, message: "Please enter college name" }]}
          >
            <Input placeholder="e.g., Engineering College" />
          </Form.Item>

          <Form.Item
            name="uniqueId"
            label="Unique ID / Code"
            rules={[{ required: true, message: "Please enter unique ID" }]}
          >
            <Input placeholder="e.g., ENG001" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="city" label="City">
                <Input placeholder="City" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="state" label="State">
                <Input placeholder="State" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="addressLine1" label="Address">
            <Input.TextArea rows={2} placeholder="Full address" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="pinCode" label="Pin Code">
                <Input placeholder="Pin Code" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="country" label="Country">
                <Input placeholder="Country" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
};

export default Colleges;
