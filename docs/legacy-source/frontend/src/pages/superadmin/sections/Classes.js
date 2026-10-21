import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Alert, Form, Input, Button, Table, Card, Row, Col, message, Select, DatePicker,
  InputNumber, Space, Popconfirm, Modal, Checkbox, TimePicker, Tag, Typography,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, CalendarOutlined } from "@ant-design/icons";
import AdminTableToolbar from "@/components/admin/AdminTableToolbar";
import useDependencyCounts from "@/components/admin/useDependencyCounts";
import {
  createClass, getClassesByCollege, getProgramsByCollege, getBatchesByCollege,
  updateClass, deleteClass, fetchWithErrorHandling, createRecurringClassSchedule,
  getFacultyByCollegeId, getCoursesByCollege, getLectureHallsByCollege, getLearnersByClass,
} from "@/api/Services/AdminService";
import dayjs from "dayjs";
import { RefreshStatus, TableSkeleton } from "@/components/Common/Skeletons";
import { applyServerFieldErrors, getServerFormError } from "@/utils/formErrors";

const { Option } = Select;
const PAGE_SIZE_KEY = "admin-classes-page-size";
const PAGE_SIZES = [10, 25, 50, 100];
const idEq = (a, b) => a != null && b != null && Number(a) === Number(b);
const programIdOf = (row) => row?.programId ?? row?.program_id;
const batchIdOf = (row) => row?.batchId ?? row?.batch_id;
const nameOf = (row) => row?.name || row?.className || `Class ${row?.id ?? ""}`;
const unpack = (result) => {
  const value = result?.data?.data ?? result?.data;
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && Array.isArray(value.content)) return value.content;
  return [];
};
const classPayload = (values) => ({
  name: String(values.name || "").trim(),
  description: String(values.description || "").trim(),
  program_id: values.programId,
  batch_id: values.batchId || null,
  upper_limit: Number(values.upperLimit ?? 60),
  lower_limit: Number(values.lowerLimit ?? 0),
});
const fieldValues = (record) => ({
  name: record?.name ?? record?.className ?? "",
  description: record?.description ?? "",
  programId: programIdOf(record),
  batchId: batchIdOf(record),
  upperLimit: record?.upperLimit ?? 60,
  lowerLimit: record?.lowerLimit ?? 0,
});
const snapshot = (values) => JSON.stringify(values || {});
const focusInvalid = (form, details) => {
  const first = details.errorFields?.[0]?.name;
  if (first) {
    form.scrollToField(first, { behavior: "smooth", block: "center" });
    form.getFieldInstance(first)?.focus?.();
  }
};

function ClassFields({ form, programs, batches, onProgramChange, optionsError = {} }) {
  const selectedProgram = Form.useWatch("programId", form);
  const upperLimit = Form.useWatch("upperLimit", form);
  const availableBatches = batches.filter((batch) => idEq(batch.programId ?? batch.program_id, selectedProgram));
  return <>
    <Form.Item name="programId" label="Program"
      extra={optionsError.programs ? "Programs could not be loaded. Retry above." : undefined}
      rules={[{ required: true, message: "Select a program" }]}>
      <Select placeholder={optionsError.programs ? "Programs unavailable" : "Select program"}
        showSearch optionFilterProp="children" onChange={onProgramChange} disabled={Boolean(optionsError.programs)}>
        {programs.map((program) => <Option key={program.id} value={program.id}>{program.name}</Option>)}
      </Select>
    </Form.Item>
    <Form.Item name="batchId" label="Batch"
      extra={optionsError.batches ? "Batches could not be loaded. Retry above." : undefined}
      rules={[{ required: true, message: "Select a batch" }]}>
      <Select placeholder={optionsError.batches ? "Batches unavailable" : selectedProgram ? "Select batch" : "Select program first"}
        showSearch optionFilterProp="children" disabled={!selectedProgram || Boolean(optionsError.batches)}>
        {availableBatches.map((batch) => <Option key={batch.id} value={batch.id}>{batch.batchName || batch.name}</Option>)}
      </Select>
    </Form.Item>
    <Form.Item name="name" label="Class/Section Name" rules={[
      { required: true, whitespace: true, message: "Enter the class or section name" },
      { max: 255, message: "Maximum 255 characters" },
    ]}>
      <Input placeholder="e.g., CSE-A or Section 1" />
    </Form.Item>
    <Form.Item name="description" label="Description"><Input.TextArea rows={2} placeholder="Optional description" /></Form.Item>
    <Typography.Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
      Class dates follow the batch/semester academic structure. Schedule actual teaching dates from the Schedule action.
    </Typography.Text>
    <Row gutter={12}>
      <Col xs={24} sm={12}>
        <Form.Item name="upperLimit" label="Maximum students" dependencies={["lowerLimit"]}
          extra="Moving a student into a full section is refused."
          rules={[{ required: true, message: "Enter maximum capacity" }, { validator: (_, value) => {
            const lower = form.getFieldValue("lowerLimit") ?? 0;
            if (value == null || !Number.isInteger(value) || value < 1 || value > 200) {
              return Promise.reject(new Error("Maximum must be a whole number from 1 to 200"));
            }
            return value < lower ? Promise.reject(new Error("Maximum cannot be less than minimum")) : Promise.resolve();
          } }]}>
          <InputNumber min={1} max={200} precision={0} style={{ width: "100%" }} />
        </Form.Item>
      </Col>
      {/* "Minimum students" was checked on save and used by nothing else; kept hidden so edits keep the stored value. */}
      <Form.Item name="lowerLimit" hidden><InputNumber /></Form.Item>
    </Row>
  </>;
}

export default function Classes({ collegeId }) {
  const router = useRouter();
  const basePath = router.pathname.startsWith("/superadmin") ? "/superadmin" : "/college-admin";
  const isScoped = collegeId != null && Number.isSafeInteger(Number(collegeId)) && Number(collegeId) > 0;
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [recurringForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const deleteRef = useRef(null);
  const [tableLoading, setTableLoading] = useState(false);
  const [data, setData] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [loadedScopeKey, setLoadedScopeKey] = useState(null);
  // Read through a ref inside the fetch callback: as a dependency it rebuilt the callback after every load and
  // re-ran the effects that call it (a duplicate request, plus their resets).
  const loadedScopeKeyRef = useRef(loadedScopeKey);
  loadedScopeKeyRef.current = loadedScopeKey;
  const [errorScopeKey, setErrorScopeKey] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [batches, setBatches] = useState([]);
  const [optionsError, setOptionsError] = useState({});
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [recurringFor, setRecurringFor] = useState(null);
  const [recurringLoading, setRecurringLoading] = useState(false);
  const [recurringDirty, setRecurringDirty] = useState(false);
  const [recurringReport, setRecurringReport] = useState(null);
  const [recurringMutationError, setRecurringMutationError] = useState("");
  const [recurringOptions, setRecurringOptions] = useState({ faculty: [], courses: [], halls: [] });
  const [recurringErrors, setRecurringErrors] = useState({});
  const [recurringOptionsLoading, setRecurringOptionsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterProgram, setFilterProgram] = useState(null);
  const [filterBatch, setFilterBatch] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const tableSeq = useRef(0);
  const lookupSeq = useRef(0);
  const recurringSeq = useRef(0);
  const originalEditRef = useRef(null);
  const classScopeKey = isScoped ? String(Number(collegeId)) : null;
  const hasCurrentClasses = classScopeKey != null && loadedScopeKey === classScopeKey;
  const currentLoadError = errorScopeKey === classScopeKey ? loadError : "";
  const initialTableLoading = Boolean(classScopeKey && tableLoading && !hasCurrentClasses && !currentLoadError);
  const tableRefreshing = Boolean(classScopeKey && tableLoading && hasCurrentClasses);

  useEffect(() => {
    try { const size = Number(window.localStorage.getItem(PAGE_SIZE_KEY)); if (PAGE_SIZES.includes(size)) setPageSize(size); }
    catch (_) { /* Optional preference */ }
  }, []);

  const fetchData = useCallback(async () => {
    const requestId = ++tableSeq.current;
    const requestScopeKey = classScopeKey;
    if (!isScoped || !requestScopeKey) {
      setData([]); setLoadedScopeKey(null); setErrorScopeKey(null); setLoadError(""); setTableLoading(false); return;
    }
    const scopeChanged = loadedScopeKeyRef.current !== requestScopeKey;
    if (scopeChanged) setData([]);
    setTableLoading(true); setLoadError(""); setErrorScopeKey(null);
    try {
      const result = await fetchWithErrorHandling(getClassesByCollege(collegeId));
      if (requestId !== tableSeq.current) return;
      if (!result.success) throw new Error(result.message || "Failed to load classes");
      const raw = result.data?.data ?? result.data;
      const rows = Array.isArray(raw) ? raw : raw && typeof raw === "object" ? Object.values(raw) : [];
      // Elective offerings are GROUP_BACKED classes managed from the Electives page; the pickers
      // elsewhere still list them, but this CRUD list is for real sections only.
      setData(Array.isArray(rows) ? rows.filter((c) => c?.classType !== "GROUP_BACKED" && c?.class_type !== "GROUP_BACKED") : []);
      setLoadedScopeKey(requestScopeKey);
    } catch (error) {
      if (requestId !== tableSeq.current) return;
      setLoadError(error?.message || "Failed to load classes");
      setErrorScopeKey(requestScopeKey);
      if (scopeChanged) setData([]);
    } finally { if (requestId === tableSeq.current) setTableLoading(false); }
  }, [collegeId, isScoped, classScopeKey]);

  const fetchOptions = useCallback(async () => {
    const requestId = ++lookupSeq.current;
    if (!isScoped) { setPrograms([]); setBatches([]); setOptionsError({}); setOptionsLoading(false); return; }
    setOptionsLoading(true); setOptionsError({});
    const loaders = [() => getProgramsByCollege(collegeId), () => getBatchesByCollege(collegeId)];
    const results = await Promise.all(loaders.map(async (fn) => {
      try {
        const result = await fetchWithErrorHandling(fn());
        if (!result.success) return { error: result.message || "Could not load options" };
        return { data: unpack(result) };
      } catch (error) { return { error: error?.message || "Could not load options" }; }
    }));
    if (requestId !== lookupSeq.current) return;
    setPrograms(results[0].data || []); setBatches(results[1].data || []);
    const errors = {};
    if (results[0].error) errors.programs = results[0].error;
    if (results[1].error) errors.batches = results[1].error;
    setOptionsError(errors); setOptionsLoading(false);
  }, [collegeId, isScoped]);

  useEffect(() => {
    setPage(1); setSearch(""); setFilterProgram(null); setFilterBatch(null);
    setData([]); setPrograms([]); setBatches([]); form.resetFields();
    fetchData(); fetchOptions();
    return () => { ++tableSeq.current; ++lookupSeq.current; };
  }, [collegeId, fetchData, fetchOptions, form]);

  const filteredData = data.filter((row) => {
    if (filterProgram && !idEq(programIdOf(row), filterProgram)) return false;
    if (filterBatch && !idEq(batchIdOf(row), filterBatch)) return false;
    const query = search.trim().toLowerCase();
    if (!query) return true;
    const program = programs.find((item) => idEq(item.id, programIdOf(row)));
    const batch = batches.find((item) => idEq(item.id, batchIdOf(row)));
    return [nameOf(row), row.description, program?.name, batch?.batchName, row.upperLimit, row.lowerLimit]
      .some((value) => String(value ?? "").toLowerCase().includes(query));
  });

  const handleCreate = async (values) => {
    if (!isScoped) { message.warning("Select a college first."); return; }
    setCreateError("");
    setLoading(true);
    try {
      await createClass(classPayload(values));
      message.success(`Created class “${values.name.trim()}”. Next, register or move students into this section.`);
      // Creating sections A/B/C should not require reselecting program and batch each time.
      form.resetFields();
      form.setFieldsValue({ programId: values.programId, batchId: values.batchId, upperLimit: values.upperLimit, lowerLimit: values.lowerLimit });
      fetchData();
    } catch (error) {
      const fieldError = applyServerFieldErrors(form, error, {
        program_id: "programId", batch_id: "batchId", upper_limit: "upperLimit", lower_limit: "lowerLimit",
      });
      const errorMessage = getServerFormError(error, "Failed to create class.");
      setCreateError(errorMessage);
      if (!fieldError) message.error(errorMessage);
    }
    finally { setLoading(false); }
  };

  const handleEdit = (row) => {
    if (!isScoped) return;
    setEditingRecord(row);
    setEditError("");
    const values = fieldValues(row);
    editForm.resetFields(); editForm.setFieldsValue(values);
    originalEditRef.current = snapshot(values);
  };
  const finishEdit = () => {
    setEditingRecord(null); setEditError(""); editForm.resetFields(); originalEditRef.current = null;
  };
  const handleEditCancel = () => {
    if (!editingRecord || snapshot(editForm.getFieldsValue(true)) === originalEditRef.current) { finishEdit(); return; }
    Modal.confirm({ title: `Discard edits to “${nameOf(editingRecord)}”?`,
      content: "Your unsaved changes will be lost.", okText: "Discard edits", okButtonProps: { danger: true }, onOk: finishEdit });
  };
  const handleEditSubmit = async () => {
    if (!editingRecord) return;
    try {
      const values = await editForm.validateFields();
      setEditError("");
      setEditLoading(true);
      await updateClass(editingRecord.id, classPayload(values));
      message.success(`Updated class “${values.name.trim()}”.`);
      finishEdit(); fetchData();
    } catch (error) {
      if (error?.errorFields) { focusInvalid(editForm, error); return; }
      const fieldError = applyServerFieldErrors(editForm, error, {
        program_id: "programId", batch_id: "batchId", upper_limit: "upperLimit", lower_limit: "lowerLimit",
      });
      const errorMessage = getServerFormError(error, "Failed to update class.");
      setEditError(errorMessage);
      if (!fieldError) message.error(errorMessage);
    } finally { setEditLoading(false); }
  };
  const handleDelete = async (row, rejectOnFailure = true) => {
    if (!isScoped || deleteRef.current != null) return false;
    deleteRef.current = row.id;
    setDeletingId(row.id);
    setDeleteError(null);
    try {
      await deleteClass(row.id);
      message.success(`Deleted class “${nameOf(row)}”.`);
      fetchData();
      return true;
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to delete class.";
      setDeleteError({ row, message: errorMessage });
      if (rejectOnFailure) throw error;
      return false;
    } finally {
      deleteRef.current = null;
      setDeletingId(null);
    }
  };

  const fetchRecurringOptions = useCallback(async () => {
    const requestId = ++recurringSeq.current;
    if (!recurringFor || !isScoped) return;
    setRecurringOptionsLoading(true); setRecurringErrors({});
    const endpoints = {
      faculty: () => getFacultyByCollegeId(collegeId),
      courses: () => getCoursesByCollege(collegeId),
      halls: () => getLectureHallsByCollege(collegeId),
    };
    const results = await Promise.all(Object.entries(endpoints).map(async ([key, fn]) => {
      try {
        const response = await fn();
        if (response?.data?.status === "error") throw new Error(response.data.message || "Request failed");
        const rows = response?.data?.data ?? response?.data;
        if (!Array.isArray(rows) && !Array.isArray(rows?.content)) throw new Error("Unexpected option response");
        return { key, data: Array.isArray(rows) ? rows : rows.content };
      } catch (error) { return { key, error: error?.response?.data?.message || error?.message || "Request failed" }; }
    }));
    if (requestId !== recurringSeq.current) return;
    const data = { faculty: [], courses: [], halls: [] };
    const errors = {};
    results.forEach((item) => { if (item.error) errors[item.key] = item.error; else data[item.key] = item.data; });
    setRecurringOptions(data); setRecurringErrors(errors); setRecurringOptionsLoading(false);
  }, [recurringFor, collegeId, isScoped]);

  useEffect(() => {
    if (recurringFor) fetchRecurringOptions();
    return () => { ++recurringSeq.current; };
  }, [fetchRecurringOptions, recurringFor]);

  const handleCreateRecurring = async () => {
    if (!recurringFor || recurringLoading) return;
    try {
      const values = await recurringForm.validateFields();
      setRecurringLoading(true); setRecurringReport(null); setRecurringMutationError("");
      const response = await createRecurringClassSchedule(collegeId, {
        classId: recurringFor.id,
        courseId: values.courseId || undefined, facultyId: values.facultyId || undefined,
        lectureHallId: values.lectureHallId || undefined, title: values.title || undefined,
        startDate: values.dateRange?.[0]?.format("YYYY-MM-DD"),
        endDate: values.dateRange?.[1]?.format("YYYY-MM-DD"),
        startTime: values.startTime?.format("HH:mm"), endTime: values.endTime?.format("HH:mm"),
        daysOfWeek: values.daysOfWeek || [],
      });
      const report = response?.data?.data ?? response?.data ?? null;
      setRecurringReport(report);
      setRecurringDirty(false);
      if (report?.createdCount > 0) message.success(`Created ${report.createdCount} of ${report.requested} session(s).`);
      else message.warning("No sessions were created. Review the per-date report.");
    } catch (error) {
      if (!error?.errorFields) {
        const errorMessage = error?.response?.data?.message || error?.message || "Failed to create recurring sessions";
        setRecurringMutationError(errorMessage);
        message.error(errorMessage);
      }
    } finally { setRecurringLoading(false); }
  };
  const finishRecurringClose = () => {
    setRecurringFor(null); setRecurringReport(null); setRecurringMutationError(""); setRecurringErrors({});
    recurringForm.resetFields();
  };
  const closeRecurring = () => {
    if (recurringLoading) return;
    if (!recurringReport && recurringForm.isFieldsTouched()) {
      Modal.confirm({
        title: "Discard this recurring schedule?",
        content: "The dates, times and optional assignments you entered will be lost.",
        okText: "Discard schedule",
        okButtonProps: { danger: true },
        cancelText: "Keep editing",
        onOk: finishRecurringClose,
      });
      return;
    }
    finishRecurringClose();
  };

  const dependencyCounts = useDependencyCounts(data, {
    students: (row) => getLearnersByClass(row.id),
  });

  const columns = [
    { title: "Class/Section Name", key: "name", render: (_, row) => nameOf(row) },
    { title: "Program", key: "program", render: (_, row) =>
      programs.find((item) => idEq(item.id, programIdOf(row)))?.name || `Name unavailable (ID ${programIdOf(row) ?? "unknown"})` },
    { title: "Batch", key: "batch", render: (_, row) =>
      batches.find((item) => idEq(item.id, batchIdOf(row)))?.batchName || `Name unavailable (ID ${batchIdOf(row) ?? "unknown"})` },
    // 0 is stored for "no limit" on older sections (the capacity check skips it).
    { title: "Max Students", dataIndex: "upperLimit", key: "upperLimit", width: 115,
      render: (v) => (Number(v) > 0 ? v : "No limit") },
    { title: "Description", dataIndex: "description", key: "description", ellipsis: true },
    { title: "Students", key: "studentCount", width: 105, render: (_, row) => {
      const count = dependencyCounts[row.id]?.students;
      return count == null ? <Tag>Unavailable</Tag> : <Tag color={count > 0 ? "blue" : "default"}>{count}</Tag>;
    } },
    { title: "Actions", key: "actions", width: 250, render: (_, row) => {
      const studentCount = dependencyCounts[row.id]?.students;
      const blockedByStudents = typeof studentCount === "number" && studentCount > 0;
      const reason = blockedByStudents
        ? `Move or remove ${studentCount} enrolled student${studentCount === 1 ? "" : "s"} before deleting this class.`
        : "Scheduled sessions are checked by the server before deletion.";
      return <Space size="small" wrap>
        <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(row)} aria-label={`Edit class ${nameOf(row)}`}
          disabled={deletingId != null}>Edit</Button>
        <Button size="small" icon={<CalendarOutlined />} aria-label={`Schedule sessions for ${nameOf(row)}`}
          onClick={() => { setRecurringFor(row); setRecurringReport(null); setRecurringMutationError(""); recurringForm.resetFields(); }}
          disabled={deletingId != null}>Schedule</Button>
        <span title={reason}>
          <Popconfirm title={`Delete class “${nameOf(row)}”?`}
            description="Deletion is blocked while enrolled students or scheduled sessions exist. The server performs the final schedule check."
            onConfirm={() => handleDelete(row)} okText="Delete" cancelText="Cancel"
            okButtonProps={{ danger: true, loading: deletingId === row.id }}
            disabled={blockedByStudents || (deletingId != null && deletingId !== row.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} aria-label={`Delete class ${nameOf(row)}`}
              loading={deletingId === row.id} disabled={blockedByStudents || (deletingId != null && deletingId !== row.id)}>Delete</Button>
          </Popconfirm>
        </span>
      </Space>;
    } },
  ];

  const optionNotice = Object.keys(optionsError).length > 0 ? <Alert type="error" showIcon
    message="Some setup options failed to load" description={<Space direction="vertical" size={0}>
      {Object.entries(optionsError).map(([key, error]) => <span key={key}>{key}: {error}</span>)}
    </Space>} action={<Button size="small" onClick={fetchOptions} loading={optionsLoading}>Retry options</Button>}
    style={{ marginBottom: 12 }} /> : null;
  const noPrograms = isScoped && !optionsLoading && !optionsError.programs && programs.length === 0;
  const selectedFilterBatches = batches.filter((batch) => !filterProgram || idEq(batch.programId ?? batch.program_id, filterProgram));

  return <>
    {!isScoped && <Alert type="warning" showIcon message="Select a college to manage Classes/Sections"
      description="Classes belong to a specific college; choose one in the header." style={{ marginBottom: 16 }} />}
    <div className="admin-list-page__header">
      <div>
        <h1 className="admin-list-page__title">Classes &amp; Sections</h1>
        <div className="admin-list-page__subtitle">Create teaching sections within a batch, manage capacity and schedule recurring sessions from the same roster.</div>
      </div>
    </div>
    <Row gutter={24}>
      <Col xs={24} lg={10}>
        <Card title="Create New Class/Section" size="small">
          {createError ? <Alert type="error" showIcon message="Class was not created" description={createError}
            closable onClose={() => setCreateError("")} style={{ marginBottom: 12 }} /> : null}
          {optionNotice}
          {noPrograms && <Alert type="info" showIcon message="No programs in this college yet"
            description={<span>Create a program and batch before adding a class. <Link href={`${basePath}/programs`}>Go to Programs</Link>.</span>}
            style={{ marginBottom: 12 }} />}
          <Form form={form} layout="vertical" onFinish={handleCreate}
            onFinishFailed={(error) => focusInvalid(form, error)} initialValues={{ upperLimit: 60, lowerLimit: 0 }}>
            <ClassFields form={form} programs={programs} batches={batches} optionsError={optionsError}
              onProgramChange={() => form.setFieldsValue({ batchId: undefined })} />
            <Form.Item><Button type="primary" htmlType="submit" loading={loading} icon={<PlusOutlined />}
              disabled={!isScoped || optionsLoading || Object.keys(optionsError).length > 0 || noPrograms}>
              Create Class &amp; Add Another
            </Button></Form.Item>
          </Form>
        </Card>
      </Col>
      <Col xs={24} lg={14}>
        <Card title="Existing Classes/Sections" size="small" extra={<AdminTableToolbar
          searchValue={search} onSearch={(value) => { setSearch(value); setPage(1); }}
          searchPlaceholder="Search class, program, batch or capacity"
          resultCount={filteredData.length} totalCount={data.length}
          onRefresh={fetchData} loading={tableLoading} exportFileName="classes.csv"
          exportRows={() => filteredData.map((row) => ({
            id: row.id, name: nameOf(row), programId: programIdOf(row) ?? "",
            batchId: batchIdOf(row) ?? "", startDate: row.startDate ?? "",
            endDate: row.endDate ?? "", minStudents: row.lowerLimit ?? "", maxStudents: row.upperLimit ?? "",
          }))} />}>
          {deleteError ? <Alert type="error" showIcon message="Class was not deleted" description={deleteError.message}
            action={<Button size="small" onClick={() => handleDelete(deleteError.row, false)} disabled={deletingId != null}>Retry delete</Button>}
            closable onClose={() => setDeleteError(null)} style={{ marginBottom: 12 }} /> : null}
          {tableRefreshing ? <RefreshStatus label="Refreshing classes…" /> : null}
          {currentLoadError && <Alert type={hasCurrentClasses ? "warning" : "error"} showIcon
            message={hasCurrentClasses ? "Couldn't refresh classes" : "Could not load classes"}
            description={hasCurrentClasses ? "Showing the last classes loaded for this college." : currentLoadError}
            action={<Button size="small" onClick={fetchData}>Retry</Button>} style={{ marginBottom: 12 }} />}
          <Space wrap style={{ marginBottom: 12 }}>
            <Select aria-label="Filter classes by program" placeholder="All programs" allowClear
              value={filterProgram} style={{ width: 165, maxWidth: "100%" }}
              onChange={(value) => { setFilterProgram(value ?? null); setFilterBatch(null); setPage(1); }}
              options={programs.map((row) => ({ value: row.id, label: row.name }))} />
            <Select aria-label="Filter classes by batch" placeholder="All batches" allowClear
              value={filterBatch} style={{ width: 165, maxWidth: "100%" }}
              onChange={(value) => { setFilterBatch(value ?? null); setPage(1); }}
              options={selectedFilterBatches.map((row) => ({ value: row.id, label: row.batchName || row.name }))} />
            {(filterProgram || filterBatch) && <Button size="small" onClick={() => { setFilterProgram(null); setFilterBatch(null); setPage(1); }}>Clear filters</Button>}
          </Space>
          {initialTableLoading ? (
            <TableSkeleton rows={8} columns={8} label="Loading classes" />
          ) : currentLoadError && !hasCurrentClasses ? null : (
          <Table dataSource={filteredData} columns={columns} rowKey="id"
            size="small" scroll={{ x: "max-content" }}
            pagination={{ current: page, pageSize, pageSizeOptions: PAGE_SIZES, showSizeChanger: true,
              onChange: (nextPage, nextSize) => {
                setPage(nextSize !== pageSize ? 1 : nextPage); setPageSize(nextSize);
                try { window.localStorage.setItem(PAGE_SIZE_KEY, String(nextSize)); } catch (_) { /* Optional preference */ }
              }, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}` }}
            locale={{ emptyText: loadError ? "Could not load classes; use Retry above."
              : search.trim() || filterProgram || filterBatch ? "No classes match these filters; clear search or filters."
              : "No classes found. Create a program and batch first." }} />
          )}
        </Card>
      </Col>
    </Row>
    <Modal title={editingRecord ? `Edit class “${nameOf(editingRecord)}”` : "Edit Class/Section"}
      open={Boolean(editingRecord)} onCancel={handleEditCancel} onOk={handleEditSubmit}
      confirmLoading={editLoading} okText="Save Changes" cancelText="Cancel"
      maskClosable={false} closable={!editLoading} keyboard={!editLoading} width={550} className="admin-list-page-modal">
      {optionNotice}
      {editError ? <Alert type="error" showIcon message="Class was not updated" description={editError}
        closable onClose={() => setEditError("")} style={{ marginBottom: 12 }} /> : null}
      <Form form={editForm} layout="vertical" onFinish={handleEditSubmit}
        onFinishFailed={(error) => focusInvalid(editForm, error)} disabled={editLoading}>
        <ClassFields form={editForm} programs={programs} batches={batches} optionsError={optionsError}
          onProgramChange={() => editForm.setFieldsValue({ batchId: undefined })} />
      </Form>
    </Modal>
    <Modal title={`Schedule recurring sessions${recurringFor ? ` — ${nameOf(recurringFor)}` : ""}`}
      open={Boolean(recurringFor)} onCancel={closeRecurring} onOk={handleCreateRecurring}
      confirmLoading={recurringLoading} okText="Create series" width={720} destroyOnClose
      maskClosable={false} closable={!recurringLoading} keyboard={!recurringLoading}>
      {recurringOptionsLoading && <Typography.Text type="secondary">Loading optional course, faculty and hall choices…</Typography.Text>}
      {recurringMutationError && <Alert type="error" showIcon style={{ marginBottom: 12 }}
        message="Recurring sessions were not created" description={recurringMutationError}
        closable onClose={() => setRecurringMutationError("")} />}
      {Object.keys(recurringErrors).length > 0 && <Alert type="warning" showIcon style={{ marginBottom: 12 }}
        message="Some optional choices could not be loaded"
        description={<Space direction="vertical" size={0}>
          {Object.entries(recurringErrors).map(([key, error]) => <span key={key}>{key}: {error}. Leave this field blank or retry.</span>)}
        </Space>}
        action={<Button size="small" onClick={fetchRecurringOptions} loading={recurringOptionsLoading}>Retry choices</Button>} />}
      <Form form={recurringForm} layout="vertical" onFinish={handleCreateRecurring} disabled={recurringLoading}>
        <Form.Item name="title" label="Session title"><Input placeholder="e.g., Data Structures — Lecture" maxLength={120} /></Form.Item>
        <Row gutter={12}>
          <Col xs={24} sm={12}><Form.Item name="dateRange" label="Date range"
            rules={[{ required: true, message: "Choose first and last date" }]}>
            <DatePicker.RangePicker style={{ width: "100%" }} />
          </Form.Item></Col>
          <Col xs={12} sm={6}><Form.Item name="startTime" label="Start time"
            rules={[{ required: true, message: "Choose start time" }]}>
            <TimePicker format="HH:mm" minuteStep={5} style={{ width: "100%" }} />
          </Form.Item></Col>
          <Col xs={12} sm={6}><Form.Item name="endTime" label="End time" dependencies={["startTime"]}
            rules={[{ required: true, message: "Choose end time" }, { validator: (_, value) => {
              const start = recurringForm.getFieldValue("startTime");
              if (start && value && (dayjs(value).hour() * 60 + dayjs(value).minute()) <= (dayjs(start).hour() * 60 + dayjs(start).minute())) {
                return Promise.reject(new Error("End time must be after start time"));
              }
              return Promise.resolve();
            } }]}>
            <TimePicker format="HH:mm" minuteStep={5} style={{ width: "100%" }} />
          </Form.Item></Col>
        </Row>
        <Form.Item name="daysOfWeek" label="Repeat on" extra="Leave every day unchecked for daily sessions in the date range.">
          <Checkbox.Group options={[
            { label: "Mon", value: "MONDAY" }, { label: "Tue", value: "TUESDAY" },
            { label: "Wed", value: "WEDNESDAY" }, { label: "Thu", value: "THURSDAY" },
            { label: "Fri", value: "FRIDAY" }, { label: "Sat", value: "SATURDAY" },
            { label: "Sun", value: "SUNDAY" },
          ]} />
        </Form.Item>
        <Row gutter={12}>
          <Col xs={24} sm={8}><Form.Item name="courseId" label="Course (optional)"
            extra={recurringErrors.courses ? "Unavailable — Retry above, or leave blank." : undefined}>
            <Select allowClear showSearch optionFilterProp="label" placeholder="Select course"
              disabled={Boolean(recurringErrors.courses)} loading={recurringOptionsLoading}
              options={recurringOptions.courses.map((course) => ({ value: course.id,
                label: course.title || course.name || course.courseName || course.course_name || `Course ${course.id}` }))} />
          </Form.Item></Col>
          <Col xs={24} sm={8}><Form.Item name="facultyId" label="Faculty (optional)"
            extra={recurringErrors.faculty ? "Unavailable — Retry above, or leave blank." : undefined}>
            <Select allowClear showSearch optionFilterProp="label" placeholder="Select faculty"
              disabled={Boolean(recurringErrors.faculty)} loading={recurringOptionsLoading}
              options={recurringOptions.faculty.map((faculty) => ({ value: faculty.id,
                label: faculty.name || faculty.fullName || [faculty.firstName, faculty.lastName].filter(Boolean).join(" ") || `Faculty ${faculty.id}` }))} />
          </Form.Item></Col>
          <Col xs={24} sm={8}><Form.Item name="lectureHallId" label="Lecture hall (optional)"
            extra={recurringErrors.halls ? "Unavailable — Retry above, or leave blank." : undefined}>
            <Select allowClear showSearch optionFilterProp="label" placeholder="Select hall"
              disabled={Boolean(recurringErrors.halls)} loading={recurringOptionsLoading}
              options={recurringOptions.halls.map((hall) => ({ value: hall.id,
                label: hall.name || hall.hallName || `Hall ${hall.id}` }))} />
          </Form.Item></Col>
        </Row>
        {recurringReport && <Alert type={recurringReport.failed?.length ? "warning" : "success"}
          showIcon style={{ marginTop: 8 }} message={`Created ${recurringReport.createdCount} of ${recurringReport.requested} session(s)`}
          description={recurringReport.failed?.length ? <div style={{ maxHeight: 200, overflowY: "auto" }}>
            <div>These dates were skipped:</div>
            {recurringReport.failed.map((item) => <div key={item.date}><Tag>{item.date}</Tag> {item.reason}</div>)}
          </div> : null} />}
      </Form>
    </Modal>
  </>;
}
