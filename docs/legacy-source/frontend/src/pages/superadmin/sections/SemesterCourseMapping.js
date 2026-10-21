import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Alert, Form, Button, Table, Card, Row, Col, message, Select, Tag, Space,
  Popconfirm, Empty, Modal, InputNumber, Switch, Tooltip, Typography,
} from "antd";
import { PlusOutlined, ReloadOutlined, DeleteOutlined, EditOutlined, WarningOutlined } from "@ant-design/icons";
import { getProgramsByCollege, getCoursesByCollege, fetchWithErrorHandling } from "@/api/Services/AdminService";
import {
  getSemestersByProgram, addCoursesToSemester, removeCourseFromSemester,
  getSemesterById, updateSemesterCourse, getSemesterStaffing, reorderSemesterCourses,
} from "@/api/Services/SemesterService";
import { useSortableTable, sortColumn } from "@/components/admin/SortableTableRow";
import { RefreshStatus, TableSkeleton } from "@/components/Common/Skeletons";
import { applyServerFieldErrors, getServerFormError } from "@/utils/formErrors";

const { Option } = Select;
const idEq = (a, b) => a != null && b != null && Number(a) === Number(b);
const unwrap = (result) => {
  const rows = result?.data?.data ?? result?.data;
  return Array.isArray(rows) ? rows : [];
};
const getMappingId = (row) => row?.mapping_id ?? row?.mappingId;
const getCourseId = (row) => row?.course_id ?? row?.courseId;

export default function SemesterCourseMapping({ collegeId }) {
  const router = useRouter();
  const basePath = router.pathname.startsWith("/superadmin") ? "/superadmin" : "/college-admin";
  const isScoped = collegeId != null && Number.isSafeInteger(Number(collegeId)) && Number(collegeId) > 0;
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [programs, setPrograms] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lookupErrors, setLookupErrors] = useState({});
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [semesterCourses, setSemesterCourses] = useState([]);
  const [mappingError, setMappingError] = useState(null);
  const [staffingError, setStaffingError] = useState(null);
  const [staffingByCourseId, setStaffingByCourseId] = useState({});
  const [tableLoading, setTableLoading] = useState(false);
  const [loadedSemesterId, setLoadedSemesterId] = useState(null);
  // Read through a ref inside the fetch callback: as a dependency it rebuilt the callback after every load and
  // re-ran the effects that call it (a duplicate request, plus their resets).
  const loadedSemesterIdRef = useRef(loadedSemesterId);
  loadedSemesterIdRef.current = loadedSemesterId;
  const [errorSemesterId, setErrorSemesterId] = useState(null);
  const [reordering, setReordering] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const draftsRef = useRef(new Map());
  const mappingSeq = useRef(0);
  const semestersSeq = useRef(0);
  const lookupsSeq = useRef(0);
  const currentScopeRef = useRef(collegeId);
  currentScopeRef.current = collegeId;

  const fetchLookups = useCallback(async () => {
    const request = ++lookupsSeq.current;
    if (!isScoped) { setPrograms([]); setCourses([]); setLookupErrors({}); return; }
    const tasks = [
      ["programs", () => getProgramsByCollege(collegeId)],
      ["courses", () => getCoursesByCollege(collegeId)],
    ];
    const outcome = await Promise.all(tasks.map(async ([key, fn]) => {
      try {
        const result = await fetchWithErrorHandling(fn());
        if (!result.success) throw new Error(result.message || "Request failed");
        return { key, rows: unwrap(result) };
      } catch (error) { return { key, error: error?.message || "Request failed" }; }
    }));
    if (request !== lookupsSeq.current) return;
    const errors = {};
    outcome.forEach((item) => { if (item.error) errors[item.key] = item.error; });
    setPrograms(outcome[0].rows || []); setCourses(outcome[1].rows || []); setLookupErrors(errors);
  }, [collegeId, isScoped]);

  const fetchSemesters = useCallback(async (programId) => {
    const request = ++semestersSeq.current;
    if (!programId || !isScoped) { setSemesters([]); setLookupErrors((prev) => ({ ...prev, semesters: null })); return; }
    setSemesters([]);
    setLookupErrors((prev) => ({ ...prev, semesters: null }));
    try {
      const result = await fetchWithErrorHandling(getSemestersByProgram(programId));
      if (request !== semestersSeq.current) return;
      if (!result.success) throw new Error(result.message || "Could not load semesters");
      setSemesters(unwrap(result));
    } catch (error) {
      if (request !== semestersSeq.current) return;
      setLookupErrors((prev) => ({ ...prev, semesters: error?.message || "Could not load semesters" }));
    }
  }, [isScoped]);

  const fetchSemesterCourses = useCallback(async () => {
    const request = ++mappingSeq.current;
    if (!selectedSemester || !isScoped) {
      setSemesterCourses([]); setStaffingByCourseId({}); setMappingError(null);
      setStaffingError(null); setTableLoading(false); return;
    }
    const requestedScope = collegeId;
    const sameSemester = String(loadedSemesterIdRef.current) === String(selectedSemester);
    setTableLoading(true); setMappingError(null); setErrorSemesterId(null); setStaffingError(null);
    // A different semester is a new scope; same-semester refresh keeps the current rows.
    if (!sameSemester) {
      setSemesterCourses([]);
      setStaffingByCourseId({});
    }
    try {
      const result = await fetchWithErrorHandling(getSemesterById(selectedSemester));
      if (request !== mappingSeq.current || requestedScope !== currentScopeRef.current) return;
      if (!result.success) throw new Error(result.message || "Could not load semester mappings");
      const payload = result.data?.data ?? result.data;
      if (!payload || !Array.isArray(payload.courses)) throw new Error("Invalid mapping response; refresh and retry");
      setSemesterCourses(payload.courses);
      setLoadedSemesterId(selectedSemester);
    } catch (error) {
      if (request !== mappingSeq.current || requestedScope !== currentScopeRef.current) return;
      setMappingError(error?.message || "Could not load semester mappings");
      setErrorSemesterId(selectedSemester);
      setTableLoading(false);
      return;
    }
    try {
      const response = await fetchWithErrorHandling(getSemesterStaffing(selectedSemester));
      if (request !== mappingSeq.current || requestedScope !== currentScopeRef.current) return;
      if (!response.success || !Array.isArray(unwrap(response))) throw new Error(response.message || "Staffing data unavailable");
      const byCourse = {};
      unwrap(response).forEach((row) => { if (row?.courseId != null) byCourse[row.courseId] = row; });
      setStaffingByCourseId(byCourse);
    } catch (error) {
      if (request !== mappingSeq.current || requestedScope !== currentScopeRef.current) return;
      setStaffingError(error?.message || "Staffing warnings unavailable");
    } finally { if (request === mappingSeq.current) setTableLoading(false); }
  }, [collegeId, isScoped, selectedSemester]);

  useEffect(() => {
    draftsRef.current.clear();
    setSelectedProgram(null); setSelectedSemester(null); setSemesters([]);
    setSemesterCourses([]); setLoadedSemesterId(null); setErrorSemesterId(null); setMappingError(null); setStaffingError(null);
    form.resetFields(); fetchLookups();
    return () => { ++lookupsSeq.current; ++semestersSeq.current; ++mappingSeq.current; };
  }, [collegeId, fetchLookups, form]);
  useEffect(() => {
    fetchSemesters(selectedProgram);
    return () => { ++semestersSeq.current; };
  }, [selectedProgram, fetchSemesters]);
  useEffect(() => {
    fetchSemesterCourses();
    return () => { ++mappingSeq.current; };
  }, [fetchSemesterCourses]);

  const saveCurrentDraft = () => {
    if (selectedSemester) draftsRef.current.set(String(selectedSemester), form.getFieldValue("courseIds") || []);
  };
  const restoreDraft = (semesterId) => draftsRef.current.get(String(semesterId)) || [];
  const chooseProgram = (programId) => {
    saveCurrentDraft();
    setSelectedProgram(programId || null);
    setSelectedSemester(null);
    setSemesterCourses([]);
    form.setFieldsValue({ programId, semesterId: undefined, courseIds: [] });
  };
  const handleProgramChange = (programId) => {
    const chosen = form.getFieldValue("courseIds") || [];
    if (!chosen.length) { chooseProgram(programId); return; }
    // AntD has already changed the controlled Form.Item by the time onChange runs.
    form.setFieldsValue({ programId: selectedProgram });
    Modal.confirm({ title: "Switch programs with unsaved course choices?",
      content: `${chosen.length} selected course(s) will be saved as a draft for this semester and restored if you return.`,
      okText: "Switch program", onOk: () => chooseProgram(programId) });
  };
  const chooseSemester = (semesterId) => {
    saveCurrentDraft(); setSelectedSemester(semesterId || null);
    form.setFieldsValue({ semesterId, courseIds: semesterId ? restoreDraft(semesterId) : [] });
  };
  const handleSemesterChange = (semesterId) => {
    const chosen = form.getFieldValue("courseIds") || [];
    if (!chosen.length) { chooseSemester(semesterId); return; }
    form.setFieldsValue({ semesterId: selectedSemester });
    Modal.confirm({ title: "Switch semesters with unsaved course choices?",
      content: `${chosen.length} selected course(s) will be saved as a draft and restored when you return.`,
      okText: "Switch semester", onOk: () => chooseSemester(semesterId) });
  };

  const handleSubmit = async (values) => {
    if (!isScoped || mappingError || tableLoading) { message.warning("Load the selected semester before adding courses."); return; }
    if (!values.courseIds?.length) { message.warning("Select at least one course."); return; }
    setAddError("");
    setLoading(true);
    try {
      await addCoursesToSemester(values.semesterId, values.courseIds);
      message.success(`Added ${values.courseIds.length} course(s) to this semester.`);
      draftsRef.current.delete(String(values.semesterId));
      form.setFieldsValue({ courseIds: [] });
      fetchSemesterCourses();
    } catch (error) {
      const fieldError = applyServerFieldErrors(form, error, {
        semester_id: "semesterId", course_ids: "courseIds", program_id: "programId",
      });
      const errorMessage = getServerFormError(error, "Failed to add courses to this semester.");
      setAddError(errorMessage);
      if (!fieldError) message.error(errorMessage);
    }
    finally { setLoading(false); }
  };

  const finishEdit = () => { setEditingRecord(null); setEditError(""); editForm.resetFields(); };
  const handleEdit = (row) => {
    if (!isScoped) return;
    setEditingRecord(row);
    setEditError("");
    editForm.resetFields();
    editForm.setFieldsValue({ credits: row.credits ?? 3,
      isMandatory: row.is_mandatory !== false, courseOrder: row.course_order ?? 1 });
  };
  const handleEditSubmit = async (submittedValues = null) => {
    try {
      const values = submittedValues || await editForm.validateFields();
      const mappingId = getMappingId(editingRecord);
      if (!mappingId) { message.error("Cannot edit: missing mapping ID. Refresh and retry."); return; }
      setEditError("");
      setEditLoading(true);
      await updateSemesterCourse(mappingId, { credits: values.credits,
        is_mandatory: values.isMandatory, course_order: values.courseOrder });
      message.success(`Updated mapping for “${getCourseName(getCourseId(editingRecord))}”.`);
      finishEdit(); fetchSemesterCourses();
    } catch (error) {
      if (!error?.errorFields) {
        const fieldError = applyServerFieldErrors(editForm, error, {
          credits: "credits", is_mandatory: "isMandatory", course_order: "courseOrder",
        });
        const errorMessage = getServerFormError(error, "Failed to update the semester course mapping.");
        setEditError(errorMessage);
        if (!fieldError) message.error(errorMessage);
      }
    } finally { setEditLoading(false); }
  };
  const handleEditCancel = () => {
    if (!editingRecord) { finishEdit(); return; }
    const values = editForm.getFieldsValue();
    const dirty = Number(values.credits) !== Number(editingRecord.credits ?? 3)
      || Boolean(values.isMandatory) !== (editingRecord.is_mandatory !== false)
      || Number(values.courseOrder) !== Number(editingRecord.course_order ?? 1);
    if (!dirty) { finishEdit(); return; }
    Modal.confirm({ title: "Discard mapping changes?", content: "Unsaved edits to the mapping will be lost.",
      okText: "Discard changes", okButtonProps: { danger: true }, onOk: finishEdit });
  };
  const handleRemoveCourse = async (row) => {
    try {
      await removeCourseFromSemester(selectedSemester, getCourseId(row));
      message.success(`Removed “${getCourseName(getCourseId(row))}” from this semester.`);
      fetchSemesterCourses();
    } catch (error) { message.error("Failed to remove course: " + (error?.response?.data?.message || error?.message)); }
  };
  // BE-0080: a refused reorder puts back the old order only if that semester is still the one on screen.
  const selectedSemesterRef = useRef(selectedSemester);
  selectedSemesterRef.current = selectedSemester;
  const handleReorder = async (orderedIds) => {
    if (reordering || mappingError || tableLoading) return;
    const previous = semesterCourses;
    const semesterAtStart = selectedSemester;
    const byId = Object.fromEntries(previous.map((row) => [row.id, row]));
    setSemesterCourses(orderedIds.map((id) => byId[id]).filter(Boolean));
    setReordering(true);
    try {
      await reorderSemesterCourses(selectedSemester, orderedIds);
      message.success("Semester course order saved.");
    } catch (error) {
      if (idEq(selectedSemesterRef.current, semesterAtStart)) setSemesterCourses(previous);
      message.error(error?.response?.data?.message || "Could not save order; previous order restored.");
    } finally { setReordering(false); }
  };

  const getCourseName = (courseId) => {
    const course = courses.find((item) => idEq(item.id, courseId));
    return course?.courseName || course?.course_name || `Course name unavailable (ID ${courseId ?? "unknown"})`;
  };
  const availableCourses = courses.filter((course) =>
    !semesterCourses.some((row) => idEq(getCourseId(row), course.id)));
  const sortable = useSortableTable({ items: semesterCourses, rowKeyName: "id", onReorder: handleReorder });
  const columns = [
    sortColumn,
    { title: "Course Name", dataIndex: "course_name", key: "course_name", render: (name, row) => {
      const label = name || getCourseName(getCourseId(row));
      const staffing = staffingByCourseId[getCourseId(row)];
      if (!staffing || !staffing.unstaffedClassCount) return label;
      const classList = (staffing.unstaffedClasses || []).join(", ");
      return <Space direction="vertical" size={2}>
        <span>{label}</span>
        <Tooltip title={staffing.fullyUnstaffed
          ? `No faculty assigned to teach this course. Use Faculty Assignment.${classList ? ` Classes: ${classList}` : ""}`
          : `No faculty assigned for: ${classList}`}>
          <Tag color={staffing.fullyUnstaffed ? "red" : "orange"} icon={<WarningOutlined />}>
            {staffing.fullyUnstaffed ? "No faculty assigned"
              : `No faculty for ${staffing.unstaffedClassCount} of ${staffing.totalClasses} classes`}
          </Tag>
        </Tooltip>
      </Space>;
    } },
    { title: "Course Code", dataIndex: "course_code", key: "course_code", width: 120,
      render: (code, row) => code || courses.find((item) => idEq(item.id, getCourseId(row)))?.course_code || "—" },
    { title: "Credits", dataIndex: "credits", key: "credits", width: 80, render: (credits) => credits ?? 3 },
    // No Core/Elective column: is_mandatory is read by nothing (no rule, no student screen), and
    // real electives are set up in the Electives module, so an "Elective" tag here misled.
    { title: "Order", dataIndex: "course_order", key: "course_order", width: 70,
      render: (order) => order ?? "—" },
    { title: "Actions", key: "actions", width: 175, render: (_, row) => <Space size="small" wrap>
      <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(row)}
        disabled={!getMappingId(row)} aria-label={`Edit mapping for ${getCourseName(getCourseId(row))}`}>Edit</Button>
      <Popconfirm title={`Remove “${getCourseName(getCourseId(row))}” from this semester?`}
        onConfirm={() => handleRemoveCourse(row)} okText="Remove" cancelText="Cancel"
        okButtonProps={{ danger: true }}>
        <Button size="small" danger icon={<DeleteOutlined />}
          aria-label={`Remove ${getCourseName(getCourseId(row))} from semester`}>Remove</Button>
      </Popconfirm>
    </Space> },
  ];

  return <>
    {!isScoped && <Alert type="warning" showIcon message="Select a college to manage Semester–Course Mapping"
      description="Choose a college in the header." style={{ marginBottom: 16 }} />}
    <div className="admin-list-page__header">
      <div>
        <h1 className="admin-list-page__title">Semester–Course Mapping</h1>
        <div className="admin-list-page__subtitle">Define the curriculum for each semester and spot courses that still need faculty coverage.</div>
      </div>
    </div>
    <Row gutter={24}>
      <Col xs={24} lg={10}>
        <Card title="Assign Courses to Semester" size="small">
          {Object.values(lookupErrors).some(Boolean) && <Alert type="error" showIcon
            message="Some required dropdowns could not be loaded"
            description={Object.entries(lookupErrors).filter(([, error]) => error).map(([key, error]) =>
              <div key={key}>{key}: {error}</div>)}
            action={<Button size="small" onClick={() => { fetchLookups(); if (selectedProgram) fetchSemesters(selectedProgram); }}>Retry</Button>}
            style={{ marginBottom: 12 }} />}
          {!lookupErrors.programs && isScoped && programs.length === 0 && <Alert type="info" showIcon
            message="No programs found" description={<span>Create a program first. <Link href={`${basePath}/programs`}>Go to Programs</Link>.</span>}
            style={{ marginBottom: 12 }} />}
          {addError ? <Alert type="error" showIcon message="Courses were not added to the semester" description={addError}
            closable onClose={() => setAddError("")} style={{ marginBottom: 12 }} /> : null}
          <Form form={form} layout="vertical" onFinish={handleSubmit} disabled={loading}
            onValuesChange={() => setAddError("")}>
            <Form.Item name="programId" label="Program" rules={[{ required: true, message: "Select a program" }]}>
              <Select placeholder="Select program" onChange={handleProgramChange} showSearch optionFilterProp="children"
                disabled={Boolean(lookupErrors.programs)}>
                {programs.map((program) => <Option key={program.id} value={program.id}>{program.name}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="semesterId" label="Semester" rules={[{ required: true, message: "Select a semester" }]}>
              <Select placeholder="Select semester" onChange={handleSemesterChange}
                disabled={!selectedProgram || Boolean(lookupErrors.semesters)}>
                {semesters.map((semester) => <Option key={semester.id} value={semester.id}>
                  {semester.name || `Semester ${semester.semester_number ?? semester.semesterNumber}`}
                </Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="courseIds" label="Courses to Add"
              extra="Selecting a different program or semester keeps your unsaved choices as a draft for this semester.">
              <Select mode="multiple" placeholder="Select courses to add" showSearch optionFilterProp="children"
                maxTagCount="responsive" disabled={!selectedSemester || Boolean(mappingError) || tableLoading || Boolean(lookupErrors.courses)}>
                {availableCourses.map((course) => <Option key={course.id} value={course.id}>
                  {course.courseName || course.course_name} {course.course_code ? `(${course.course_code})` : ""}
                </Option>)}
              </Select>
            </Form.Item>
            <Form.Item><Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={loading}
              disabled={!selectedSemester || Boolean(mappingError) || tableLoading || reordering || Boolean(lookupErrors.courses)}>
              Add Courses to Semester
            </Button></Form.Item>
          </Form>
        </Card>
      </Col>
      <Col xs={24} lg={14}>
        <Card title={selectedSemester
          ? `Courses in ${semesters.find((item) => idEq(item.id, selectedSemester))?.name || "Selected semester"}`
          : "Select a Semester to View Courses"}
          size="small" extra={<Button icon={<ReloadOutlined />} onClick={fetchSemesterCourses}
            loading={tableLoading} size="small" disabled={!selectedSemester}>Refresh</Button>}>
          {tableLoading && String(loadedSemesterId) === String(selectedSemester) ? <RefreshStatus label="Refreshing semester courses…" /> : null}
          {reordering ? <RefreshStatus label="Saving course order…" /> : null}
          {mappingError && <Alert type={String(loadedSemesterId) === String(selectedSemester) ? "warning" : "error"} showIcon style={{ marginBottom: 12 }}
            message={String(loadedSemesterId) === String(selectedSemester) ? "Couldn't refresh semester course mapping" : "Semester course mapping could not be loaded"}
            description={String(loadedSemesterId) === String(selectedSemester) ? "Showing the last mapping loaded for this semester." : mappingError}
            action={<Button size="small" onClick={fetchSemesterCourses}>Retry mapping</Button>} />}
          {staffingError && !mappingError && <Alert type="warning" showIcon style={{ marginBottom: 12 }}
            message="Faculty staffing warnings unavailable" description={staffingError}
            action={<Button size="small" onClick={fetchSemesterCourses}>Retry</Button>} />}
          {selectedSemester
            ? tableLoading && String(loadedSemesterId) !== String(selectedSemester)
              ? <TableSkeleton rows={6} columns={6} label="Loading semester courses" />
              : mappingError && String(loadedSemesterId) !== String(selectedSemester)
                ? <Empty description="Mapping unavailable. Retry above before adding or removing courses." />
                : sortable.wrap(<Table dataSource={semesterCourses} columns={columns} rowKey="id"
                    components={sortable.components}
                    size="small" scroll={{ x: "max-content" }} pagination={false}
                    locale={{ emptyText: "No courses mapped to this semester. Select courses to add." }} />)
            : <Empty description="Select a program and semester to view/manage courses" />}
          {selectedSemester && semesterCourses.length > 0 && <Typography.Text type="secondary">
            Drag the handle or use keyboard controls to change course order.
          </Typography.Text>}
        </Card>
      </Col>
    </Row>
    <Modal title={`Edit Course Mapping: ${editingRecord ? getCourseName(getCourseId(editingRecord)) : ""}`}
      open={Boolean(editingRecord)} onOk={() => editForm.submit()} onCancel={handleEditCancel}
      maskClosable={false} closable={!editLoading} keyboard={!editLoading}
      confirmLoading={editLoading} okButtonProps={{ disabled: editLoading }}
      cancelButtonProps={{ disabled: editLoading }} okText="Save Changes" cancelText="Cancel">
      {editError ? <Alert type="error" showIcon message="Course mapping was not updated" description={editError}
        closable onClose={() => setEditError("")} style={{ marginBottom: 12 }} /> : null}
      <Form form={editForm} layout="vertical" onFinish={handleEditSubmit} disabled={editLoading}>
        <Form.Item name="credits" label="Credits" rules={[{ required: true, message: "Enter credits" }]}>
          <InputNumber min={1} max={10} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="isMandatory" valuePropName="checked" hidden><Switch /></Form.Item>
        <Form.Item name="courseOrder" label="Display Order">
          <InputNumber min={1} style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Modal>
  </>;
}
