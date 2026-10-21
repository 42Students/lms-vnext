import { useState, useEffect, useRef } from "react";
import { Alert, Form, Input, Button, Table, Card, Row, Col, message, Select, Space, Popconfirm, Modal } from "antd";
import { PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, DownloadOutlined } from "@ant-design/icons";
import { exportRowsToCsv, columnsFromRows } from "@/utils/csvExport";
import { Tag, Tooltip, Typography } from "antd";

const { Text } = Typography;
import { 
  createDepartment, 
  getDepartments, 
  getDepartmentsByCollege,
  getColleges, 
  updateDepartment, 
  deleteDepartment, 
  fetchWithErrorHandling,
  getProgramsByDepartment,
  getCoursesByDepartment,
  getFacultyByDepartment,
} from "@/api/Services/AdminService";
import { RefreshStatus, TableSkeleton } from "@/components/Common/Skeletons";
import { applyServerFieldErrors, getServerFormError } from "@/utils/formErrors";
import useDependencyCounts from "@/components/admin/useDependencyCounts";

const { Option } = Select;

// Note: the `!collegeId` branches below (college dropdown, `getDepartments()` unscoped fetch)
// exist for the superadmin SPA's unscoped use case. `college-admin/departments.js` always passes
// a non-null collegeId (it renders an Alert instead of this component when unset), so those
// branches are unreachable from the college-admin route.
const Departments = ({ collegeId }) => {
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [tableLoading, setTableLoading] = useState(false);
  const [data, setData] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [loadedScopeKey, setLoadedScopeKey] = useState(null);
  const [errorScopeKey, setErrorScopeKey] = useState(null);
  const fetchSeq = useRef(0);
  const [colleges, setColleges] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const originalEditRef = useRef(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const deleteRef = useRef(null);
  // A department cannot be deleted while it has programs, faculty or courses, and the server only
  // says so after the attempt. Loading the counts up front turns a rejected click into a visible
  // reason, and answers "how big is this department" at a glance.
  const [search, setSearch] = useState("");
  const departmentScopeKey = collegeId ? `college:${Number(collegeId)}` : "all";
  const hasCurrentDepartments = loadedScopeKey === departmentScopeKey;
  const currentLoadError = errorScopeKey === departmentScopeKey ? loadError : "";
  const initialTableLoading = tableLoading && !hasCurrentDepartments && !currentLoadError;
  const tableRefreshing = tableLoading && hasCurrentDepartments;

  const fetchData = async () => {
    const request = ++fetchSeq.current;
    const requestScopeKey = departmentScopeKey;
    const scopeChanged = loadedScopeKey !== requestScopeKey;
    if (scopeChanged) setData([]);
    setTableLoading(true);
    setLoadError("");
    setErrorScopeKey(null);
    const apiCall = collegeId ? getDepartmentsByCollege(collegeId) : getDepartments();
    const result = await fetchWithErrorHandling(apiCall);
    if (request !== fetchSeq.current) return;
    if (result.success) {
      setData(Array.isArray(result.data) ? result.data : []);
      setLoadedScopeKey(requestScopeKey);
    } else {
      setLoadError(result.message || "Failed to load departments");
      setErrorScopeKey(requestScopeKey);
      if (scopeChanged) setData([]);
    }
    setTableLoading(false);
  };

  const fetchColleges = async () => {
    const result = await fetchWithErrorHandling(getColleges());
    if (result.success) {
      setColleges(Array.isArray(result.data) ? result.data : []);
    }
  };

  useEffect(() => {
    fetchData();
    if (!collegeId) fetchColleges();
    if (collegeId) form.setFieldsValue({ collegeId });
  }, [collegeId]);

  const handleSubmit = async (values) => {
    setCreateError("");
    setLoading(true);
    try {
      const trimmedName = (values.name ?? "").trim();
      if (!trimmedName) {
        message.error("Department name cannot be empty");
        setLoading(false);
        return;
      }
      const payload = {
        name: trimmedName,
        college_id: collegeId ?? values.collegeId,
      };
      await createDepartment(payload);
      message.success(`Created department “${trimmedName}”. Next, add programs or courses under it.`);
      form.resetFields();
      fetchData();
    } catch (error) {
      const fieldError = applyServerFieldErrors(form, error, { college_id: "collegeId" });
      const errorMessage = getServerFormError(error, "Failed to create department.");
      setCreateError(errorMessage);
      if (!fieldError) message.error(errorMessage);
    }
    setLoading(false);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    const values = { name: record.name, collegeId: record.collegeId };
    editForm.setFieldsValue(values);
    originalEditRef.current = JSON.stringify({
      name: String(values.name ?? "").trim(),
      collegeId: values.collegeId ?? collegeId ?? null,
    });
    setEditError("");
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      setEditError("");
      setEditLoading(true);
      const trimmedName = (values.name ?? "").trim();
      if (!trimmedName) {
        message.error("Department name cannot be empty");
        setEditLoading(false);
        return;
      }
      const payload = {
        name: trimmedName,
        college_id: collegeId ?? values.collegeId,
        // Chair / vice chair are no longer edited or shown: nothing in the product reads them, and
        // resending a stale value (0 or a removed faculty) made a plain rename fail validation.
      };
      await updateDepartment(editingRecord.id, payload);
      message.success("Department updated successfully!");
      finishEditClose();
      fetchData();
    } catch (error) {
      if (error.errorFields) {
        return;
      }
      const fieldError = applyServerFieldErrors(editForm, error, { college_id: "collegeId" });
      const errorMessage = getServerFormError(error, "Failed to update department.");
      setEditError(errorMessage);
      if (!fieldError) message.error(errorMessage);
    }
    setEditLoading(false);
  };

  const handleDelete = async (record, rejectOnFailure = true) => {
    if (deleteRef.current != null) return false;
    deleteRef.current = record.id;
    setDeletingId(record.id);
    setDeleteError(null);
    try {
      await deleteDepartment(record.id);
      message.success("Department deleted successfully!");
      fetchData();
      return true;
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to delete department.";
      setDeleteError({ record, message: errorMessage });
      if (rejectOnFailure) throw error;
      return false;
    } finally {
      deleteRef.current = null;
      setDeletingId(null);
    }
  };

  const finishEditClose = () => {
    setEditModalVisible(false);
    setEditingRecord(null);
    setEditError("");
    originalEditRef.current = null;
    editForm.resetFields();
    originalEditRef.current = null;
  };

  const handleEditCancel = () => {
    if (editLoading) return;
    const current = JSON.stringify({
      name: String(editForm.getFieldValue("name") ?? "").trim(),
      collegeId: editForm.getFieldValue("collegeId") ?? collegeId ?? null,
    });
    if (!editingRecord || current === originalEditRef.current) {
      finishEditClose();
      return;
    }
    Modal.confirm({
      title: "Discard department changes?",
      content: "Your edits to “" + editingRecord.name + "” will be lost.",
      okText: "Discard changes",
      okButtonProps: { danger: true },
      onOk: finishEditClose,
    });
  };

  // Counts are best-effort and per department: a failure on one must not blank the table, so each
  // settles independently and simply shows as unknown. BE-0089: through the shared hook, so at most a few
  // lookups run at once and a known count is not asked again on every reload.
  const counts = useDependencyCounts(data, {
    programs: (d) => getProgramsByDepartment(d.id),
    courses: (d) => getCoursesByDepartment(d.id),
    faculty: (d) => getFacultyByDepartment(d.id),
  }, { resetKey: collegeId });

  const filteredData = (Array.isArray(data) ? data : []).filter((d) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return String(d.name || "").toLowerCase().includes(q);
  });

  const handleExport = () => {
    // exportRowsToCsv(filename, columns, rows) needs a {label,key}[] columns list — this used to
    // call it with only (filename, rows), which silently passed the row array in as `columns` and
    // left `rows` undefined, exporting a single line of empty commas instead of any data.
    const rows = filteredData.map((d) => ({
      id: d.id,
      name: d.name,
      programs: counts[d.id]?.programs ?? "",
      courses: counts[d.id]?.courses ?? "",
      faculty: counts[d.id]?.faculty ?? "",
    }));
    exportRowsToCsv("departments.csv", columnsFromRows(rows), rows);
  };

  const columns = [
    {
      title: "Department Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => String(a.name || "").localeCompare(String(b.name || "")),
      defaultSortOrder: "ascend",
    },
    {
      title: "Contents",
      key: "counts",
      width: 260,
      render: (_, r) => {
        const c = counts[r.id];
        if (!c) return <Text type="secondary">…</Text>;
        const chip = (n, label) =>
          n == null ? null : (
            <Tag color={n > 0 ? "blue" : "default"}>
              {n} {n === 1 ? ({ programs: "program", courses: "course" }[label] || label) : label}
            </Tag>
          );
        return (
          <Tooltip title="A department can only be deleted once all three are empty.">
            <Space size={4} wrap>
              {chip(c.programs, "programs")}
              {chip(c.courses, "courses")}
              {chip(c.faculty, "faculty")}
            </Space>
          </Tooltip>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => {
        // Same rule as Programs: say up front what blocks the delete instead of letting it fail.
        const c = counts[record.id];
        const linked = c ? [["programs", c.programs], ["courses", c.courses], ["faculty", c.faculty]]
          .filter(([, n]) => typeof n === "number" && n > 0).map(([k]) => k) : [];
        return (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
            title="Edit"
            aria-label="Edit department"
          />
          {linked.length > 0 ? (
            <Tooltip title={`Move or remove its ${linked.join(", ")} before deleting.`}>
              <Button type="text" danger icon={<DeleteOutlined />} size="small" disabled aria-label="Delete department" />
            </Tooltip>
          ) : (
          <Popconfirm
            title="Delete Department"
            description="This department has nothing linked to it. Delete it?"
            onConfirm={() => handleDelete(record)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true, loading: deletingId === record.id }}
            disabled={deletingId != null && deletingId !== record.id}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
              title="Delete"
              aria-label="Delete department"
              loading={deletingId === record.id}
              disabled={deletingId != null && deletingId !== record.id}
            />
          </Popconfirm>
          )}
        </Space>
        );
      },
    },
  ];

  return (
    <>
      <h1 className="admin-list-page__title">Departments</h1>
      <Row gutter={24}>
        <Col xs={24} lg={10}>
          <Card title="Create New Department" size="small">
            {createError ? <Alert type="error" showIcon message="Department was not created" description={createError}
              closable onClose={() => setCreateError("")} style={{ marginBottom: 12 }} /> : null}
            <Form form={form} layout="vertical" onFinish={handleSubmit} disabled={loading} initialValues={collegeId ? { collegeId } : undefined}>
              {!collegeId && (
                <Form.Item
                  name="collegeId"
                  label="College"
                  rules={[{ required: true, message: "Please select college" }]}
                >
                  <Select placeholder="Select college">
                    {colleges.map((college) => (
                      <Option key={college.id} value={college.id}>
                        {college.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              )}

              <Form.Item
                name="name"
                label="Department Name"
                rules={[
                  { required: true, whitespace: true, message: "Please enter department name" },
                  { max: 255, message: "Department name must be 255 characters or less" },
                ]}
              >
                <Input placeholder="e.g., Computer Science & Engineering" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} icon={<PlusOutlined />}>
                  Create Department
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title="Existing Departments"
            size="small"
            extra={
              <Space wrap>
              <Input.Search
                placeholder="Search departments"
                allowClear
                size="small"
                style={{ width: 220 }}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button icon={<DownloadOutlined />} onClick={handleExport} size="small" disabled={!filteredData.length}>
                Export CSV
              </Button>
              <Button icon={<ReloadOutlined />} onClick={fetchData} size="small">
                Refresh
              </Button>
              </Space>
            }
          >
            {deleteError ? <Alert type="error" showIcon message="Department was not deleted" description={deleteError.message}
              action={<Button size="small" onClick={() => handleDelete(deleteError.record, false)} disabled={deletingId != null}>Retry delete</Button>}
              closable onClose={() => setDeleteError(null)} style={{ marginBottom: 12 }} /> : null}
            {tableRefreshing ? <RefreshStatus label="Refreshing departments…" /> : null}
            {currentLoadError && (
              <Alert type={hasCurrentDepartments ? "warning" : "error"} showIcon
                message={hasCurrentDepartments ? "Couldn't refresh departments" : "Could not load departments"}
                description={hasCurrentDepartments ? "Showing the last departments loaded for this scope." : currentLoadError}
                action={<Button size="small" onClick={fetchData}>Retry</Button>} style={{ marginBottom: 12 }} />
            )}
            {initialTableLoading ? (
              <TableSkeleton rows={8} columns={6} label="Loading departments" />
            ) : currentLoadError && !hasCurrentDepartments ? null : (
            <Table
              dataSource={filteredData}
              columns={columns}
              rowKey="id"
              size="small"
              scroll={{ x: 'max-content' }}
              pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}` }}
              locale={{ emptyText: loadError ? "Could not load departments. Use Retry above." : "No departments found. Create a college first, then add departments." }}
            />
            )}
          </Card>
        </Col>
      </Row>

      {/* Edit Modal */}
      <Modal
        title="Edit Department"
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={handleEditCancel}
        confirmLoading={editLoading}
        okText="Save Changes"
        cancelText="Cancel"
        maskClosable={false}
        className="admin-list-page-modal"
        closable={!editLoading}
        keyboard={!editLoading}
      >
        {editError ? <Alert type="error" showIcon message="Department was not updated" description={editError}
          closable onClose={() => setEditError("")} style={{ marginBottom: 12 }} /> : null}
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit} disabled={editLoading}>
          {!collegeId && (
            <Form.Item
              name="collegeId"
              label="College"
              rules={[{ required: true, message: "Please select college" }]}
            >
              <Select placeholder="Select college">
                {colleges.map((college) => (
                  <Option key={college.id} value={college.id}>
                    {college.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="name"
            label="Department Name"
            rules={[
              { required: true, whitespace: true, message: "Please enter department name" },
              { max: 255, message: "Department name must be 255 characters or less" },
            ]}
          >
            <Input placeholder="e.g., Computer Science & Engineering" />
          </Form.Item>

        </Form>
      </Modal>
    </>
  );
};

export default Departments;
