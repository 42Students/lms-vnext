import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Alert, Form, Input, Button, Table, Card, Row, Col, message, Select, InputNumber, Space, Popconfirm, Modal, Tag, Tooltip, Typography } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import AdminTableToolbar from "@/components/admin/AdminTableToolbar";
import useDependencyCounts from "@/components/admin/useDependencyCounts";
import { getSemestersByProgram } from "@/api/Services/SemesterService";
import { createProgram, getProgramsByCollege, getDepartmentsByCollege, updateProgram, deleteProgram, fetchWithErrorHandling, getBatchesByProgram, getClassCountByProgram } from "@/api/Services/AdminService";
import { RefreshStatus, TableSkeleton } from "@/components/Common/Skeletons";
import { applyServerFieldErrors, getServerFormError } from "@/utils/formErrors";

const { Option } = Select;
const { Text } = Typography;
const PAGE_SIZE_KEY = "admin-programs-page-size";
const PAGE_SIZES = [10, 25, 50, 100];
const departmentIdOf = (record) => record?.dept_id ?? record?.deptId;
const yearsOf = (record) => record?.duration_years ?? record?.durationYears ?? 4;
const SINGULAR = { semesters: "semester", batches: "batch", classes: "class" };

const Programs = ({ collegeId }) => {
  const router = useRouter();
  const basePath = router.pathname.startsWith("/superadmin") ? "/superadmin" : "/college-admin";
  const isScoped = collegeId != null && Number.isFinite(Number(collegeId)) && Number(collegeId) > 0;
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [tableLoading, setTableLoading] = useState(false);
  const [data, setData] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [departments, setDepartments] = useState([]);
  const [departmentLoading, setDepartmentLoading] = useState(false);
  const [departmentError, setDepartmentError] = useState("");
  const departmentSeq = useRef(0);
  const tableSeq = useRef(0);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const deleteRef = useRef(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [loadedCollegeId, setLoadedCollegeId] = useState(null);
  const hasCurrentPrograms = isScoped && Number(loadedCollegeId) === Number(collegeId);

  useEffect(() => {
    try {
      const saved = Number(window.localStorage.getItem(PAGE_SIZE_KEY));
      if (PAGE_SIZES.includes(saved)) setPageSize(saved);
    } catch (_) { /* Page size preference is optional. */ }
  }, []);

  const fetchData = async () => {
    const request = ++tableSeq.current;
    if (!isScoped) {
      setData([]);
      setLoadedCollegeId(null);
      setLoadError("");
      setTableLoading(false);
      return;
    }
    const sameScope = Number(loadedCollegeId) === Number(collegeId);
    setTableLoading(true);
    setLoadError("");
    if (!sameScope) setData([]);
    try {
      const result = await fetchWithErrorHandling(getProgramsByCollege(collegeId));
      if (request !== tableSeq.current) return;
      if (!result.success) throw new Error(result.message || "Failed to load programs");
      setData(Array.isArray(result.data) ? result.data : []);
      setLoadedCollegeId(collegeId);
    } catch (error) {
      if (request !== tableSeq.current) return;
      if (!sameScope) setData([]);
      setLoadError(error?.message || "Failed to load programs");
    } finally { if (request === tableSeq.current) setTableLoading(false); }
  };

  const fetchDepartments = async () => {
    const request = ++departmentSeq.current;
    if (!isScoped) { setDepartments([]); setDepartmentError(""); setDepartmentLoading(false); return; }
    setDepartmentLoading(true);
    setDepartmentError("");
    try {
      const result = await fetchWithErrorHandling(getDepartmentsByCollege(collegeId));
      if (request !== departmentSeq.current) return;
      if (!result.success) throw new Error(result.message || "Could not load departments");
      const rows = Array.isArray(result.data) ? result.data : [];
      setDepartments(rows);
    } catch (error) {
      if (request !== departmentSeq.current) return;
      setDepartments([]);
      setDepartmentError(error?.message || "Could not load departments");
    } finally { if (request === departmentSeq.current) setDepartmentLoading(false); }
  };

  useEffect(() => {
    setPage(1);
    setData([]);
    setLoadedCollegeId(null);
    setDepartments([]);
    fetchData();
    fetchDepartments();
    return () => { ++tableSeq.current; ++departmentSeq.current; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId]);

  const handleSubmit = async (values) => {
    if (!isScoped) { message.warning("Select a college first."); return; }
    setCreateError("");
    setLoading(true);
    try {
      const name = String(values.name ?? "").trim();
      if (!name) { form.setFields([{ name: "name", errors: ["Program name cannot be empty"] }]); return; }
      await createProgram({ name, dept_id: values.deptId, duration_years: values.durationYears });
      message.success(`Created program “${name}”. Next, create its semesters and batches.`);
      // Retain department for admins creating several programs under the same department.
      form.resetFields();
      form.setFieldsValue({ deptId: values.deptId, durationYears: values.durationYears });
      fetchData();
    } catch (error) {
      const fieldError = applyServerFieldErrors(form, error, { dept_id: "deptId", duration_years: "durationYears" });
      const errorMessage = getServerFormError(error, "Failed to create program.");
      setCreateError(errorMessage);
      if (!fieldError) message.error(errorMessage);
    } finally { setLoading(false); }
  };

  const handleEdit = (record) => {
    if (!isScoped) { message.warning("Select a college first."); return; }
    setEditingRecord(record);
    setEditError("");
    editForm.setFieldsValue({ name: record.name, deptId: departmentIdOf(record), durationYears: yearsOf(record) });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    if (!isScoped) { message.warning("Select a college first."); return; }
    try {
      const values = await editForm.validateFields();
      setEditError("");
      setEditLoading(true);
      const name = String(values.name ?? "").trim();
      if (!name) { editForm.setFields([{ name: "name", errors: ["Program name cannot be empty"] }]); return; }
      await updateProgram(editingRecord.id, { name, dept_id: values.deptId, duration_years: values.durationYears });
      message.success(`Updated program “${name}”.`);
      finishEditClose();
      fetchData();
    } catch (error) {
      if (!error?.errorFields) {
        const fieldError = applyServerFieldErrors(editForm, error, { dept_id: "deptId", duration_years: "durationYears" });
        const errorMessage = getServerFormError(error, "Failed to update program.");
        setEditError(errorMessage);
        if (!fieldError) message.error(errorMessage);
      }
    } finally { setEditLoading(false); }
  };

  // BE-0089: every row (the CSV export carries the counts), but a few lookups at a time and each count asked once.
  const counts = useDependencyCounts(data, {
    semesters: (row) => getSemestersByProgram(row.id),
    batches: (row) => getBatchesByProgram(row.id),
    classes: (row) => getClassCountByProgram(row.id),
  }, { resetKey: collegeId });

  const filteredData = (Array.isArray(data) ? data : []).filter((record) => {
    const q = search.trim().toLowerCase();
    return !q || [record.name, record.deptName, record.dept_name].some((v) => String(v ?? "").toLowerCase().includes(q));
  });

  const handleDelete = async (record, rejectOnFailure = true) => {
    if (!isScoped) { message.warning("Select a college first."); return false; }
    if (deleteRef.current != null) return false;
    deleteRef.current = record.id;
    setDeletingId(record.id);
    setDeleteError(null);
    try {
      await deleteProgram(record.id);
      message.success(`Deleted program “${record.name}”.`);
      fetchData();
      return true;
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to delete program.";
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
    editForm.resetFields();
  };
  const handleEditCancel = () => {
    if (!editingRecord) { finishEditClose(); return; }
    const changed = String(editForm.getFieldValue("name") ?? "").trim() !== String(editingRecord.name ?? "").trim()
      || Number(editForm.getFieldValue("deptId")) !== Number(departmentIdOf(editingRecord))
      || Number(editForm.getFieldValue("durationYears")) !== Number(yearsOf(editingRecord));
    if (!changed) { finishEditClose(); return; }
    Modal.confirm({ title: "Discard changes to this program?", content: `Your edits to “${editingRecord.name}” will be lost.`,
      okText: "Discard changes", okButtonProps: { danger: true }, onOk: finishEditClose });
  };

  const columns = [
    { title: "Program Name", dataIndex: "name", key: "name" },
    { title: "Duration", dataIndex: "duration_years", key: "duration_years", width: 110,
      render: (years, record) => { const n = years ?? record.durationYears; return n ? `${n} year${n === 1 ? "" : "s"}` : "—"; } },
    { title: "Department", dataIndex: "dept_name", key: "dept_name",
      render: (name, record) => name || record.deptName || departments.find((d) => Number(d.id) === Number(departmentIdOf(record)))?.name || "Name unavailable" },
    { title: "Contents", key: "counts", width: 250, render: (_, record) => {
      const c = counts[record.id];
      if (!c) return <Text type="secondary">Checking dependencies…</Text>;
      const chip = (n, label) => n == null ? <Tag key={label}> {label}: unavailable </Tag> : <Tag key={label} color={n > 0 ? "blue" : "default"}>{n} {n === 1 ? SINGULAR[label] : label}</Tag>;
      return <Tooltip title="A program with linked semesters, batches or classes cannot be deleted.">
        <Space size={4} wrap>{chip(c.semesters, "semesters")}{chip(c.batches, "batches")}{chip(c.classes, "classes")}</Space>
      </Tooltip>;
    } },
    { title: "Actions", key: "actions", width: 165, render: (_, record) => {
      const c = counts[record.id];
      const blocked = c && [c.semesters, c.batches, c.classes].some((n) => typeof n === "number" && n > 0);
      const blockers = blocked ? ["semesters", "batches", "classes"].filter((key) => c[key] > 0) : [];
      const blockerText = blocked ? `Remove linked ${blockers.join(", ")} before deleting.` : "";
      return <Space size="small" wrap>
        <Button size="small" icon={<EditOutlined />} aria-label={`Edit program ${record.name}`} onClick={() => handleEdit(record)}
          disabled={deletingId != null}>Edit</Button>
        <Tooltip title={blockerText}>
          <span><Popconfirm title={`Delete “${record.name}”?`}
            description="It has no semesters, batches or classes. Delete it?"
            onConfirm={() => handleDelete(record)} okText="Delete" cancelText="Cancel"
            okButtonProps={{ danger: true, loading: deletingId === record.id }}
            disabled={Boolean(blocked) || (deletingId != null && deletingId !== record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} aria-label={`Delete program ${record.name}`}
              loading={deletingId === record.id} disabled={Boolean(blocked) || (deletingId != null && deletingId !== record.id)}>Delete</Button>
          </Popconfirm></span>
        </Tooltip>
      </Space>;
    } },
  ];

  const departmentNotice = departmentError ? (
    <Alert type="error" showIcon message="Departments could not be loaded" description={departmentError}
      action={<Button size="small" onClick={fetchDepartments} loading={departmentLoading}>Retry departments</Button>} style={{ marginBottom: 12 }} />
  ) : !departmentLoading && isScoped && departments.length === 0 ? (
    <Alert type="info" showIcon message="No departments in this college yet"
      description={<span>Create a department before adding a program. <Link href={`${basePath}/departments`}>Go to Departments</Link>.</span>}
      style={{ marginBottom: 12 }} />
  ) : null;
  const departmentField = (editing = false) => (
    <Form.Item name="deptId" label="Department" rules={[{ required: true, message: "Please select a department" }]}>
      <Select placeholder={departmentError ? "Departments unavailable — retry above" : departmentLoading ? "Loading departments…" : "Select department"}
        showSearch optionFilterProp="children" loading={departmentLoading}
        disabled={!isScoped || departmentLoading || Boolean(departmentError) || departments.length === 0}>
        {departments.map((dept) => <Option key={dept.id} value={dept.id}>{dept.name}</Option>)}
      </Select>
    </Form.Item>
  );

  return <>
    {!isScoped && <Alert type="warning" showIcon message="Select a college to manage Programs" style={{ marginBottom: 16 }} />}
    <h1 className="admin-list-page__title">Programs</h1>
    <Row gutter={24}>
      <Col xs={24} lg={10}>
        <Card title="Create New Program" size="small">
          {departmentNotice}
          {createError ? <Alert type="error" showIcon message="Program was not created" description={createError}
            closable onClose={() => setCreateError("")} style={{ marginBottom: 12 }} /> : null}
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            {departmentField()}
            <Form.Item name="name" label="Program Name"
              rules={[{ required: true, whitespace: true, message: "Please enter program name" }, { max: 255, message: "Maximum 255 characters" }]}>
              <Input placeholder="e.g., B.Tech Computer Science" />
            </Form.Item>
            <Form.Item name="durationYears" label="Duration (Years)" initialValue={4}
              rules={[{ required: true, message: "Please enter program duration" }]}>
              <InputNumber min={1} max={10} placeholder="e.g., 4" style={{ width: "100%" }} addonAfter="Years" />
            </Form.Item>
            <Form.Item><Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={loading}
              disabled={!isScoped || departmentLoading || Boolean(departmentError) || departments.length === 0}>Create Program</Button></Form.Item>
          </Form>
        </Card>
      </Col>
      <Col xs={24} lg={14}>
        <Card title="Existing Programs" size="small" extra={<AdminTableToolbar searchValue={search} onSearch={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder="Search programs or departments" onRefresh={fetchData} loading={tableLoading}
          resultCount={filteredData.length} totalCount={data.length} exportFileName="programs.csv"
          exportRows={() => filteredData.map((record) => ({
            id: record.id, name: record.name, durationYears: yearsOf(record), departmentId: departmentIdOf(record) ?? "",
            semesters: counts[record.id]?.semesters ?? "", batches: counts[record.id]?.batches ?? "", classes: counts[record.id]?.classes ?? "",
          }))} />}>
          {deleteError ? <Alert type="error" showIcon message="Program was not deleted" description={deleteError.message}
            action={<Button size="small" onClick={() => handleDelete(deleteError.record, false)} disabled={deletingId != null}>Retry delete</Button>}
            closable onClose={() => setDeleteError(null)} style={{ marginBottom: 12 }} /> : null}
          {tableLoading && hasCurrentPrograms ? <RefreshStatus label="Refreshing programs…" /> : null}
          {loadError && <Alert type={hasCurrentPrograms ? "warning" : "error"} showIcon
            message={hasCurrentPrograms ? "Couldn't refresh programs" : "Could not load programs"}
            description={hasCurrentPrograms ? "Showing the last programs loaded for this college." : loadError}
            action={<Button size="small" onClick={fetchData}>Retry</Button>} style={{ marginBottom: 12 }} />}
          {tableLoading && !hasCurrentPrograms ? (
            <TableSkeleton rows={8} columns={5} label="Loading programs" />
          ) : loadError && !hasCurrentPrograms ? null : (
            <Table dataSource={filteredData} columns={columns} rowKey="id"
              size="small" scroll={{ x: "max-content" }}
              pagination={{ current: page, pageSize, showSizeChanger: true, pageSizeOptions: PAGE_SIZES,
                onChange: (nextPage, nextSize) => {
                  setPage(nextSize !== pageSize ? 1 : nextPage);
                  setPageSize(nextSize);
                  try { window.localStorage.setItem(PAGE_SIZE_KEY, String(nextSize)); } catch (_) { /* Optional */ }
                },
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}` }}
              locale={{ emptyText: search.trim() ? "No matching programs. Clear search to see all." : "No programs found. Create a department first." }} />
          )}
        </Card>
      </Col>
    </Row>
    <Modal title={editingRecord ? `Edit “${editingRecord.name}”` : "Edit Program"} open={editModalVisible}
      onOk={() => editForm.submit()} onCancel={handleEditCancel} confirmLoading={editLoading}
      okButtonProps={{ disabled: editLoading }} cancelButtonProps={{ disabled: editLoading }}
      okText="Save Changes" cancelText="Cancel" maskClosable={false} closable={!editLoading} keyboard={!editLoading} className="admin-list-page-modal">
      {departmentNotice}
      {editError ? <Alert type="error" showIcon message="Program was not updated" description={editError}
        closable onClose={() => setEditError("")} style={{ marginBottom: 12 }} /> : null}
      <Form form={editForm} layout="vertical" onFinish={handleEditSubmit} disabled={editLoading}>
        {departmentField(true)}
        <Form.Item name="name" label="Program Name"
          rules={[{ required: true, whitespace: true, message: "Please enter program name" }, { max: 255, message: "Maximum 255 characters" }]}>
          <Input placeholder="e.g., B.Tech Computer Science" />
        </Form.Item>
        <Form.Item name="durationYears" label="Duration (Years)" rules={[{ required: true, message: "Please enter program duration" }]}>
          <InputNumber min={1} max={10} placeholder="e.g., 4" style={{ width: "100%" }} addonAfter="Years" />
        </Form.Item>
      </Form>
    </Modal>
  </>;
};

export default Programs;
