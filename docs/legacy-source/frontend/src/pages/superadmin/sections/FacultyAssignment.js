import { useState, useEffect, useCallback, useRef } from "react";
import { Alert, Form, Button, Table, Card, Row, Col, message, Select, Tag, Space, Popconfirm, Modal, Switch, AutoComplete, Typography } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import {
  getProgramsByCollege, getBatchesByCollege, getClassesByCollege,
  getFacultyByCollegeId, getCoursesByCollege, fetchWithErrorHandling,
} from "@/api/Services/AdminService";
import { getSemestersByProgram } from "@/api/Services/SemesterService";
import {
  createTeachingAssignment, createBulkTeachingAssignments, getTeachingAssignmentsForCollege,
  deleteTeachingAssignment, getAssignmentsByClass, updateTeachingAssignment,
} from "@/api/Services/FacultyAssignmentService";
import AdminTableToolbar from "@/components/admin/AdminTableToolbar";
import { RefreshStatus, TableSkeleton } from "@/components/Common/Skeletons";
import { applyServerFieldErrors, getServerFormError } from "@/utils/formErrors";
import PeoplePageOverview from "@/components/admin/people/PeoplePageOverview";

const { Option } = Select;
const PAGE_SIZES = [10, 25, 50, 100];
const PAGE_SIZE_KEY = "admin-faculty-assignments-page-size";
const LOOKUPS = ["programs", "batches", "classes", "faculty", "courses"];
const unwrap = (result) => {
  const value = result?.data?.data ?? result?.data ?? [];
  return Array.isArray(value) ? value : [];
};
const labelOrId = (name, type, id) => name || `${type} name unavailable (ID ${id ?? "unknown"})`;
const academicYearOptions = () => {
  const year = new Date().getFullYear();
  return Array.from({ length: 27 }, (_, index) => year - 16 + index)
    .map((start) => ({ value: `${start}-${String((start + 1) % 100).padStart(2, "0")}` }));
};
const yearRules = [{
  validator: (_, value) => {
    if (value == null || String(value).trim() === "") return Promise.resolve();
    const raw = String(value).trim();
    if (!/^\d{4}(?:-\d{2}|-\d{4})?$/.test(raw)) return Promise.reject(new Error("Use YYYY-YY, YYYY-YYYY or YYYY."));
    return Promise.resolve();
  },
}];

const ROLE_LABELS = { PRIMARY: "Primary Instructor", CO_TEACHER: "Co-Teacher", TA: "Teaching Assistant" };

const FacultyAssignment = ({ collegeId }) => {
  const isCollegeScoped = collegeId != null && Number.isSafeInteger(Number(collegeId)) && Number(collegeId) > 0;
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [tableLoading, setTableLoading] = useState(false);
  const [data, setData] = useState([]);
  const [tableError, setTableError] = useState(null);
  const [loadedScopeKey, setLoadedScopeKey] = useState(null);
  // Read through a ref inside the fetch callback: as a dependency it rebuilt the callback after every load and
  // re-ran the effects that call it (a duplicate request, plus their resets).
  const loadedScopeKeyRef = useRef(loadedScopeKey);
  loadedScopeKeyRef.current = loadedScopeKey;
  const [errorScopeKey, setErrorScopeKey] = useState(null);
  const [lookupErrors, setLookupErrors] = useState({});
  const [lookupsLoading, setLookupsLoading] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [batches, setBatches] = useState([]);
  const [classes, setClasses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [semesterError, setSemesterError] = useState("");
  const [editSemesters, setEditSemesters] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [filterClassId, setFilterClassId] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const deleteRef = useRef(null);
  const originalEditRef = useRef(null);
  const editProgramId = Form.useWatch("programId", editForm);
  const editBatchId = Form.useWatch("batchId", editForm);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const lookupSeq = useRef(0);
  const assignmentsSeq = useRef(0);
  const semestersSeq = useRef(0);
  // BE-0069/BE-0115: the edit dialog's semester lookup has its own counter, so it never cancels the create form's (or back).
  const editSemestersSeq = useRef(0);
  const assignmentScopeKey = isCollegeScoped
    ? JSON.stringify([Number(collegeId), filterClassId ?? null])
    : null;
  const hasCurrentAssignments = assignmentScopeKey != null && loadedScopeKey === assignmentScopeKey;
  const currentTableError = errorScopeKey === assignmentScopeKey ? tableError : null;
  const initialTableLoading = Boolean(assignmentScopeKey && tableLoading && !hasCurrentAssignments && !currentTableError);
  const tableRefreshing = Boolean(assignmentScopeKey && tableLoading && hasCurrentAssignments);

  useEffect(() => {
    try {
      const saved = Number(window.localStorage.getItem(PAGE_SIZE_KEY));
      if (PAGE_SIZES.includes(saved)) setPageSize(saved);
    } catch (_) { /* Preference optional */ }
  }, []);

  const fetchInitialData = useCallback(async () => {
    const requestId = ++lookupSeq.current;
    if (!isCollegeScoped) {
      setPrograms([]); setBatches([]); setClasses([]); setFaculty([]); setCourses([]);
      setLookupErrors({}); setLookupsLoading(false); return;
    }
    setLookupsLoading(true);
    setLookupErrors({});
    const requests = [
      () => getProgramsByCollege(collegeId), () => getBatchesByCollege(collegeId),
      () => getClassesByCollege(collegeId), () => getFacultyByCollegeId(collegeId),
      () => getCoursesByCollege(collegeId),
    ];
    const outcomes = await Promise.all(requests.map(async (fn) => {
      try {
        const result = await fetchWithErrorHandling(fn());
        if (!result.success) return { error: result.message || "Could not load options" };
        return { rows: unwrap(result) };
      } catch (error) { return { error: error?.message || "Could not load options" }; }
    }));
    if (requestId !== lookupSeq.current) return;
    const errors = {};
    outcomes.forEach((outcome, index) => { if (outcome.error) errors[LOOKUPS[index]] = outcome.error; });
    setPrograms(outcomes[0].rows || []);
    setBatches(outcomes[1].rows || []);
    setClasses(outcomes[2].rows || []);
    setFaculty(outcomes[3].rows || []);
    setCourses(outcomes[4].rows || []);
    setLookupErrors(errors);
    setLookupsLoading(false);
  }, [collegeId, isCollegeScoped]);

  const fetchAssignments = useCallback(async () => {
    const requestId = ++assignmentsSeq.current;
    const requestScopeKey = assignmentScopeKey;
    if (!isCollegeScoped || !requestScopeKey) {
      setData([]); setLoadedScopeKey(null); setErrorScopeKey(null); setTableError(null); setTableLoading(false); return;
    }
    const scopeChanged = loadedScopeKeyRef.current !== requestScopeKey;
    if (scopeChanged) setData([]);
    setTableLoading(true);
    setTableError(null);
    setErrorScopeKey(null);
    try {
      const result = await fetchWithErrorHandling(filterClassId ? getAssignmentsByClass(filterClassId) : getTeachingAssignmentsForCollege(collegeId));
      if (requestId !== assignmentsSeq.current) return;
      if (!result.success) throw new Error(result.message || "Could not load assignments");
      setData(unwrap(result));
      setLoadedScopeKey(requestScopeKey);
    } catch (error) {
      if (requestId !== assignmentsSeq.current) return;
      setTableError(error?.message || "Could not load assignments");
      setErrorScopeKey(requestScopeKey);
      if (scopeChanged) setData([]);
    } finally { if (requestId === assignmentsSeq.current) setTableLoading(false); }
  }, [collegeId, isCollegeScoped, filterClassId, assignmentScopeKey]);

  const fetchSemesters = async (programId, edit = false) => {
    const seqRef = edit ? editSemestersSeq : semestersSeq;
    const request = ++seqRef.current;
    if (!programId) { if (edit) setEditSemesters([]); else setSemesters([]); return; }
    if (!edit) setSemesterError("");
    try {
      const result = await fetchWithErrorHandling(getSemestersByProgram(programId));
      if (request !== seqRef.current) return;
      if (!result.success) throw new Error(result.message || "Could not load semesters");
      if (edit) setEditSemesters(unwrap(result)); else setSemesters(unwrap(result));
    } catch (error) {
      if (request !== seqRef.current) return;
      if (edit) setEditSemesters([]);
      else { setSemesters([]); setSemesterError(error?.message || "Could not load semesters"); }
    }
  };

  // Exactly one initial assignments request; a separate effect handles lookup data.
  useEffect(() => {
    fetchInitialData();
    return () => { ++lookupSeq.current; };
  }, [fetchInitialData]);
  useEffect(() => {
    fetchAssignments();
    return () => { ++assignmentsSeq.current; };
  }, [fetchAssignments]);
  useEffect(() => {
    fetchSemesters(selectedProgram);
    return () => { ++semestersSeq.current; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProgram, collegeId]);
  useEffect(() => {
    setSelectedProgram(null); setSelectedBatch(null); setFilterClassId(null); setPage(1);
    form.resetFields();
  }, [collegeId, form]);

  const handleProgramChange = (programId) => {
    setSelectedProgram(programId);
    setSelectedBatch(null);
    form.setFieldsValue({ batchId: undefined, classId: undefined, semesterNumber: undefined });
  };
  const handleBatchChange = (batchId) => {
    setSelectedBatch(batchId);
    form.setFieldsValue({ classId: undefined });
  };

  const handleSubmit = async (values) => {
    if (!isCollegeScoped) return;
    setCreateError("");
    setLoading(true);
    try {
      const courseIds = Array.isArray(values.courseId) ? values.courseId : [values.courseId];
      const base = {
        faculty_id: values.facultyId, class_id: values.classId, batch_id: values.batchId,
        semester_number: values.semesterNumber, academic_year: values.academicYear,
        role: values.role || "PRIMARY", is_active: true,
      };
      if (courseIds.length > 1) {
        await createBulkTeachingAssignments({ ...base, course_ids: courseIds });
        message.success(`Created ${courseIds.length} teaching assignments for this class.`);
      } else {
        await createTeachingAssignment({ ...base, course_id: courseIds[0] });
        message.success("Created teaching assignment for this class.");
      }
      // Most assignments in a sitting share this cohort/faculty. Only reset the course selection.
      form.resetFields();
      form.setFieldsValue({
        programId: values.programId, batchId: values.batchId, classId: values.classId,
        semesterNumber: values.semesterNumber, academicYear: values.academicYear,
        facultyId: values.facultyId, role: values.role || "PRIMARY", courseId: [],
      });
      fetchAssignments();
    } catch (error) {
      const fieldError = applyServerFieldErrors(form, error, {
        faculty_id: "facultyId",
        course_id: "courseId",
        course_ids: "courseId",
        class_id: "classId",
        batch_id: "batchId",
        semester_number: "semesterNumber",
        academic_year: "academicYear",
        is_active: "isActive",
      });
      const errorMessage = getServerFormError(error, "Failed to create teaching assignment.");
      setCreateError(errorMessage);
      if (!fieldError) message.error(errorMessage);
    } finally { setLoading(false); }
  };

  const handleEdit = async (record) => {
    if (lookupsLoading || Object.keys(lookupErrors).length > 0) {
      message.warning("Reload the selection options before editing this assignment.");
      return;
    }
    setEditingRecord(record);
    setEditError("");
    editForm.resetFields();
    const batch = batches.find((item) => Number(item.id) === Number(record.batch_id));
    const programId = batch?.programId ?? batch?.program_id ?? null;
    const original = {
      facultyId: record.faculty_id, courseId: record.course_id, classId: record.class_id,
      batchId: record.batch_id, programId, semesterNumber: record.semester_number,
      academicYear: record.academic_year, role: record.role || "PRIMARY", isActive: record.is_active !== false,
    };
    originalEditRef.current = original;
    editForm.setFieldsValue(original);
    setEditModalVisible(true);
    if (programId) await fetchSemesters(programId, true);
  };

  const handleEditSubmit = async () => {
    if (lookupsLoading || Object.keys(lookupErrors).length > 0 || semesterError) {
      message.error("Selection options are unavailable. Retry them before saving.");
      return;
    }
    try {
      const values = await editForm.validateFields();
      setEditError("");
      setEditLoading(true);
      await updateTeachingAssignment(editingRecord.id, {
        faculty_id: values.facultyId, course_id: values.courseId, class_id: values.classId,
        batch_id: values.batchId, semester_number: values.semesterNumber,
        academic_year: values.academicYear, role: values.role || "PRIMARY", is_active: values.isActive !== false,
      });
      message.success(`Updated assignment #${editingRecord.id}.`);
      finishCloseEdit();
      fetchAssignments();
    } catch (error) {
      if (!error?.errorFields) {
        const fieldError = applyServerFieldErrors(editForm, error, {
          faculty_id: "facultyId",
          course_id: "courseId",
          class_id: "classId",
          batch_id: "batchId",
          semester_number: "semesterNumber",
          academic_year: "academicYear",
          is_active: "isActive",
        });
        const errorMessage = getServerFormError(error, "Failed to update teaching assignment.");
        setEditError(errorMessage);
        if (!fieldError) message.error(errorMessage);
      }
    } finally { setEditLoading(false); }
  };

  const finishCloseEdit = () => {
    setEditModalVisible(false); setEditingRecord(null); setEditError(""); editForm.resetFields();
    originalEditRef.current = null; setEditSemesters([]);
  };
  const handleEditCancel = () => {
    if (editLoading) return;
    const original = originalEditRef.current;
    const values = editForm.getFieldsValue();
    const changed = original && Object.keys(original).some((key) => String(values[key] ?? "") !== String(original[key] ?? ""));
    if (!changed) { finishCloseEdit(); return; }
    Modal.confirm({ title: "Discard assignment changes?", content: "Your unsaved changes to this assignment will be lost.",
      okText: "Discard changes", okButtonProps: { danger: true }, onOk: finishCloseEdit });
  };

  const handleDelete = async (record, rejectOnFailure = true) => {
    if (deleteRef.current != null || editLoading) return false;
    deleteRef.current = record.id;
    setDeletingId(record.id);
    setDeleteError(null);
    try {
      await deleteTeachingAssignment(record.id);
      message.success(`Deleted assignment #${record.id}.`);
      fetchAssignments();
      return true;
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to delete teaching assignment.";
      setDeleteError({ record, message: errorMessage });
      if (rejectOnFailure) throw error;
      return false;
    } finally {
      deleteRef.current = null;
      setDeletingId(null);
    }
  };

  const filteredBatches = selectedProgram
    ? batches.filter((batch) => Number(batch.programId ?? batch.program_id) === Number(selectedProgram)) : batches;
  const filteredClasses = selectedBatch
    ? classes.filter((cls) => Number(cls.batchId ?? cls.batch_id) === Number(selectedBatch)) : classes;
  const editFilteredBatches = editProgramId
    ? batches.filter((batch) => Number(batch.programId ?? batch.program_id) === Number(editProgramId))
    : batches;
  const editFilteredClasses = editBatchId
    ? classes.filter((cls) => Number(cls.batchId ?? cls.batch_id) === Number(editBatchId))
    : classes;
  const yearOptions = academicYearOptions();
  const optionError = (key) => lookupErrors[key] ? <Button type="link" size="small" onClick={fetchInitialData}>Could not load {key} — Retry</Button> : null;

  const columns = [
    { title: "Faculty", dataIndex: "faculty_name", key: "faculty_name", render: (name, record) => {
      const item = faculty.find((f) => Number(f.id) === Number(record.faculty_id));
      return labelOrId(name || (item ? [item.firstName, item.lastName].filter(Boolean).join(" ") : ""), "Faculty", record.faculty_id);
    } },
    { title: "Course", dataIndex: "course_name", key: "course_name", render: (name, record) => {
      const item = courses.find((c) => Number(c.id) === Number(record.course_id));
      return labelOrId(name || item?.courseName || item?.course_name, "Course", record.course_id);
    } },
    { title: "Class", dataIndex: "class_name", key: "class_name", render: (name, record) => {
      const item = classes.find((c) => Number(c.id) === Number(record.class_id));
      return labelOrId(name || item?.name || item?.className, "Class", record.class_id);
    } },
    { title: "Semester", dataIndex: "semester_number", key: "semester_number", width: 95, render: (value) => value ? <Tag color="blue">Sem {value}</Tag> : "—" },
    { title: "Year", dataIndex: "academic_year", key: "academic_year", width: 90, render: (value) => value || "—" },
    { title: "Role", dataIndex: "role", key: "role", width: 100, render: (role) => <Tag color={role === "PRIMARY" ? "green" : role === "CO_TEACHER" ? "blue" : "orange"}>{ROLE_LABELS[role] || ROLE_LABELS.PRIMARY}</Tag> },
    { title: "Active", dataIndex: "is_active", key: "is_active", width: 75, render: (active) => <Tag color={active !== false ? "green" : "red"}>{active !== false ? "Yes" : "No"}</Tag> },
    { title: "Actions", key: "actions", width: 180, render: (_, record) => <Space size="small" wrap>
      <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}
        disabled={lookupsLoading || Object.keys(lookupErrors).length > 0 || deletingId != null} aria-label={`Edit faculty assignment ${record.id}`}>Edit</Button>
      <Popconfirm title="Delete teaching assignment?" description="This removes the faculty from teaching the listed course."
        onConfirm={() => handleDelete(record)} okText="Delete" cancelText="Cancel"
        okButtonProps={{ danger: true, loading: deletingId === record.id }}
        disabled={(deletingId != null && deletingId !== record.id) || editLoading}>
        <Button size="small" danger icon={<DeleteOutlined />} aria-label={`Delete faculty assignment ${record.id}`}
          loading={deletingId === record.id} disabled={(deletingId != null && deletingId !== record.id) || editLoading}>Delete</Button>
      </Popconfirm>
    </Space> },
  ];

  return <>
    <PeoplePageOverview
      title="Faculty Assignments"
      description="Connect faculty to the right class, course, semester and teaching role. Account status and profile changes stay on the Faculty roster."
      metrics={isCollegeScoped ? [
        { label: "Assignments", value: data.length },
        { label: "Active", value: data.filter((item) => item.is_active !== false).length },
        { label: "Primary instructors", value: data.filter((item) => item.role === "PRIMARY" || !item.role).length },
        { label: "Classes covered", value: new Set(data.map((item) => item.class_id ?? item.classId).filter(Boolean)).size },
      ] : []}
    />
    {!isCollegeScoped ? <Alert type="warning" showIcon message="Select a college to manage faculty assignments" /> : <>
      {Object.keys(lookupErrors).length > 0 && <Alert type="error" showIcon message="Some selection options are unavailable"
        description={<Space direction="vertical" size={0}>
          {Object.entries(lookupErrors).map(([key, error]) => <span key={key}><strong>{key}:</strong> {error}</span>)}
        </Space>} action={<Button size="small" loading={lookupsLoading} onClick={fetchInitialData}>Retry options</Button>}
        style={{ marginBottom: 12 }} />}
      <Row gutter={24}>
        <Col xs={24} lg={10}>
          <Card title="Create teaching assignment" size="small">
            {createError ? <Alert type="error" showIcon message="Teaching assignment was not created" description={createError}
              closable onClose={() => setCreateError("")} style={{ marginBottom: 12 }} /> : null}
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item name="programId" label="Program" extra={optionError("programs")}
                rules={[{ required: true, message: "Select a program" }]}>
                <Select placeholder="Select program" onChange={handleProgramChange} loading={lookupsLoading}
                  disabled={Boolean(lookupErrors.programs)} showSearch optionFilterProp="children">
                  {programs.map((p) => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                </Select>
              </Form.Item>
              <Row gutter={12}>
                <Col xs={24} sm={12}>
                  <Form.Item name="batchId" label="Batch" extra={optionError("batches")}
                    rules={[{ required: true, message: "Select a batch" }]}>
                    <Select placeholder="Select batch" onChange={handleBatchChange}
                      disabled={!selectedProgram || Boolean(lookupErrors.batches)}>
                      {filteredBatches.map((b) => <Option key={b.id} value={b.id}>{b.batchName}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="classId" label="Class/Section" extra={optionError("classes")}
                    rules={[{ required: true, message: "Select a class" }]}>
                    <Select placeholder="Select class" disabled={!selectedBatch || Boolean(lookupErrors.classes)}>
                      {filteredClasses.map((c) => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col xs={24} sm={12}>
                  <Form.Item name="semesterNumber" label="Semester"
                    extra={semesterError ? <Button type="link" size="small" onClick={() => fetchSemesters(selectedProgram)}>Could not load semesters — Retry</Button> : undefined}
                    rules={[{ required: true, message: "Select a semester" }]}>
                    <Select placeholder="Select semester" disabled={!selectedProgram || Boolean(semesterError)}>
                      {semesters.map((s) => <Option key={s.id} value={s.semester_number}>{s.name || `Semester ${s.semester_number}`}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="academicYear" label="Academic Year" rules={yearRules}
                    extra="Choose a suggested year or type a historical/future year (e.g., 2012-13).">
                    <AutoComplete options={yearOptions} placeholder="YYYY-YY" filterOption={(input, option) => option.value.includes(input)} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="facultyId" label="Faculty" extra={optionError("faculty")}
                rules={[{ required: true, message: "Select faculty" }]}>
                <Select placeholder="Select faculty" showSearch optionFilterProp="children"
                  disabled={Boolean(lookupErrors.faculty)}>
                  {faculty.map((f) => <Option key={f.id} value={f.id}>{f.firstName} {f.lastName}</Option>)}
                </Select>
              </Form.Item>
              <Form.Item name="courseId" label="Course(s)"
                extra={lookupErrors.courses ? optionError("courses") : "Select several courses to assign this lecturer to all of them at once."}
                rules={[{ required: true, message: "Select one or more courses" }]}>
                <Select mode="multiple" placeholder="Select one or more courses" showSearch optionFilterProp="children"
                  maxTagCount="responsive" disabled={Boolean(lookupErrors.courses)}>
                  {courses.map((c) => <Option key={c.id} value={c.id}>{c.courseName || c.course_name}</Option>)}
                </Select>
              </Form.Item>
              <Form.Item name="role" label="Role" initialValue="PRIMARY">
                <Select placeholder="Select role">
                  <Option value="PRIMARY">Primary Instructor</Option>
                  <Option value="CO_TEACHER">Co-Teacher</Option>
                  <Option value="TA">Teaching Assistant</Option>
                </Select>
              </Form.Item>
              <Form.Item><Button type="primary" htmlType="submit" loading={loading} icon={<PlusOutlined />}
                disabled={lookupsLoading || Object.keys(lookupErrors).length > 0 || Boolean(semesterError)}>Create Assignment</Button></Form.Item>
            </Form>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title="Current teaching assignments" size="small" extra={<Space wrap>
            <Select placeholder={lookupErrors.classes ? "Classes unavailable" : "Filter by class"} aria-label="Filter assignments by class" allowClear
              disabled={Boolean(lookupErrors.classes)} loading={lookupsLoading}
              style={{ width: 170, maxWidth: "100%" }} value={filterClassId}
              onChange={(value) => { setFilterClassId(value ?? null); setPage(1); }}>
              {classes.map((c) => <Option key={c.id} value={c.id}>{c.name}</Option>)}
            </Select>
            <AdminTableToolbar onRefresh={fetchAssignments} loading={tableLoading} exportFileName="faculty-assignments.csv"
              exportRows={() => data.map((record) => ({
                id: record.id, facultyId: record.faculty_id ?? "", courseId: record.course_id ?? "",
                classId: record.class_id ?? "", batchId: record.batch_id ?? "",
                semester: record.semester_number ?? "", academicYear: record.academic_year ?? "",
                role: record.role ?? "", active: record.is_active === false ? "no" : "yes",
              }))} />
          </Space>}>
            {deleteError ? <Alert type="error" showIcon message="Teaching assignment was not deleted" description={deleteError.message}
              action={<Button size="small" onClick={() => handleDelete(deleteError.record, false)} disabled={deletingId != null}>Retry delete</Button>}
              closable onClose={() => setDeleteError(null)} style={{ marginBottom: 12 }} /> : null}
            {tableRefreshing ? <RefreshStatus label="Refreshing faculty assignments…" /> : null}
            {currentTableError && <Alert type={hasCurrentAssignments ? "warning" : "error"} showIcon
              message={hasCurrentAssignments ? "Couldn't refresh faculty assignments" : "Could not load faculty assignments"}
              description={hasCurrentAssignments ? "Showing the last assignments loaded for this filter." : currentTableError}
              action={<Button size="small" onClick={fetchAssignments}>Retry</Button>} style={{ marginBottom: 12 }} />}
            {filterClassId && <Typography.Text type="secondary">Showing assignments for the selected class. Clear the filter to see all.</Typography.Text>}
            {initialTableLoading ? (
              <TableSkeleton rows={8} columns={8} label="Loading faculty assignments" />
            ) : currentTableError && !hasCurrentAssignments ? null : (
            <Table dataSource={data} columns={columns} rowKey="id" size="small"
              pagination={{ current: page, pageSize, pageSizeOptions: PAGE_SIZES, showSizeChanger: true,
                onChange: (nextPage, nextSize) => {
                  setPage(nextSize !== pageSize ? 1 : nextPage); setPageSize(nextSize);
                  try { window.localStorage.setItem(PAGE_SIZE_KEY, String(nextSize)); } catch (_) { /* Optional */ }
                }, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}` }}
              scroll={{ x: "max-content" }} locale={{ emptyText: "No assignments found." }} />
            )}
          </Card>
        </Col>
      </Row>
    </>}
    <Modal title={editingRecord ? `Edit assignment: ${editingRecord.faculty_name || editingRecord.facultyName || "faculty"} · ${editingRecord.course_name || editingRecord.courseName || "course"}` : "Edit Faculty Assignment"}
      open={editModalVisible} onOk={handleEditSubmit} onCancel={handleEditCancel}
      confirmLoading={editLoading} okText="Save Changes" cancelText="Cancel"
      okButtonProps={{ disabled: lookupsLoading || Object.keys(lookupErrors).length > 0 || Boolean(semesterError) }}
      width={500} maskClosable={false} closable={!editLoading} keyboard={!editLoading}
      className="admin-list-page-modal">
      {editError ? <Alert type="error" showIcon message="Teaching assignment was not updated" description={editError}
        closable onClose={() => setEditError("")} style={{ marginBottom: 12 }} /> : null}
      <Form form={editForm} layout="vertical">
        <Form.Item name="facultyId" label="Faculty" rules={[{ required: true, message: "Select faculty" }]}>
          <Select placeholder={lookupErrors.faculty ? "Faculty unavailable" : "Select faculty"} disabled={Boolean(lookupErrors.faculty)} showSearch optionFilterProp="children">
            {faculty.map((f) => <Option key={f.id} value={f.id}>{f.firstName} {f.lastName}</Option>)}
          </Select>
        </Form.Item>
        <Form.Item name="courseId" label="Course" rules={[{ required: true, message: "Select course" }]}>
          <Select placeholder={lookupErrors.courses ? "Courses unavailable" : "Select course"} disabled={Boolean(lookupErrors.courses)} showSearch optionFilterProp="children">
            {courses.map((c) => <Option key={c.id} value={c.id}>{c.courseName || c.course_name}</Option>)}
          </Select>
        </Form.Item>
        <Form.Item name="programId" label="Program">
          <Select placeholder={lookupErrors.programs ? "Programs unavailable" : "Select program"} disabled={Boolean(lookupErrors.programs)} allowClear onChange={(programId) => {
            fetchSemesters(programId, true);
            editForm.setFieldsValue({ batchId: undefined, classId: undefined, semesterNumber: undefined });
          }}>
            {programs.map((p) => <Option key={p.id} value={p.id}>{p.name}</Option>)}
          </Select>
        </Form.Item>
        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item name="batchId" label="Batch" rules={[{ required: true, message: "Select batch" }]}>
              <Select placeholder="Select batch" disabled={!editProgramId} onChange={() => editForm.setFieldsValue({ classId: undefined })}>
                {editFilteredBatches.map((b) => <Option key={b.id} value={b.id}>{b.batchName}</Option>)}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="semesterNumber" label="Semester" rules={[{ required: true, message: "Select semester" }]}>
              <Select placeholder="Select semester">
                {(editSemesters.length > 0 ? editSemesters : semesters).map((s) =>
                  <Option key={s.id} value={s.semester_number}>{s.name || `Semester ${s.semester_number}`}</Option>)}
                {/* Fallback options if no semesters loaded for this program yet. 1-12 matches
                    the same bound SemesterManagement.js's own "Semester Number" field uses
                    (InputNumber min={1} max={12}) — a hardcoded 1-8 silently couldn't offer
                    semester 9+ for any program with more than 8 semesters. */}
                {editSemesters.length === 0 && semesters.length === 0 && Array.from({ length: 12 }, (_, i) => i + 1).map((n) =>
                  <Option key={n} value={n}>Semester {n}</Option>)}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="classId" label="Class/Section" rules={[{ required: true, message: "Select class" }]}>
          <Select placeholder="Select class" disabled={!editBatchId}>
            {editFilteredClasses.map((c) => <Option key={c.id} value={c.id}>{c.name}</Option>)}
          </Select>
        </Form.Item>
        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item name="academicYear" label="Academic Year" rules={yearRules}>
              <AutoComplete options={yearOptions} placeholder="YYYY-YY or custom year"
                filterOption={(input, option) => option.value.includes(input)} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="role" label="Role">
              <Select placeholder="Select role">
                <Option value="PRIMARY">Primary Instructor</Option>
                <Option value="CO_TEACHER">Co-Teacher</Option>
                <Option value="TA">Teaching Assistant</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="isActive" label="Active" valuePropName="checked"
          extra="Inactive stops them teaching this course for the section; past attendance and grades keep their name.">
          <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
        </Form.Item>
      </Form>
    </Modal>
  </>;
};

export default FacultyAssignment;
