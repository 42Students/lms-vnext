import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Alert, Form, Input, Button, Table, Card, Row, Col, message, Select, DatePicker,
  Tag, Space, Popconfirm, Modal, Typography, Tooltip,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined, SwapOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import AdminTableToolbar from "@/components/admin/AdminTableToolbar";
import useDependencyCounts from "@/components/admin/useDependencyCounts";
import { classCapacityState } from "@/utils/classCapacity";
import {
  createBatch, getBatchesByCollege, getProgramsByCollege, updateBatch,
  deleteBatch, fetchWithErrorHandling,
  getClassesByCollege, getLearnersByClass, moveLearnerClass,
} from "@/api/Services/AdminService";
import { ListSkeleton, RefreshStatus, TableSkeleton } from "@/components/Common/Skeletons";
import { applyServerFieldErrors, getServerFormError } from "@/utils/formErrors";

const { Option } = Select;
const { Text } = Typography;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const isCanonicalAcademicYear = (value) => {
  const match = /^(\d{4})-(\d{2})$/.exec(String(value || "").trim());
  if (!match) return false;
  return Number(match[2]) === ((Number(match[1]) + 1) % 100);
};
const PAGE_SIZES = [10, 25, 50, 100];
// COMPLETED is a batch's normal end of life (graduated), not an error; it must not share INACTIVE's red.
const STATUS_TAG = {
  ACTIVE: { color: "green", label: "Active" },
  INACTIVE: { color: "orange", label: "Inactive" },
  COMPLETED: { color: "default", label: "Completed" },
};
const yearOf = (date) => (date && dayjs(date).isValid() ? dayjs(date).year() : null);
const sizeKey = "admin-batches-page-size";
const cycleKey = (collegeId) => `admin-batch-academic-year-start-month:${collegeId}`;
const idEq = (a, b) => a != null && b != null && Number(a) === Number(b);
const programIdOf = (row) => row?.programId ?? row?.program_id;
const nameOf = (row) => row?.batchName || row?.name || `Batch ${row?.id ?? ""}`;
const academicYearFor = (date, startMonth) => {
  if (!date || !dayjs(date).isValid()) return "";
  const year = dayjs(date).year();
  const firstYear = dayjs(date).month() + 1 >= startMonth ? year : year - 1;
  return `${firstYear}-${String((firstYear + 1) % 100).padStart(2, "0")}`;
};
const dateKey = (date) => date ? dayjs(date).format("YYYY-MM-DD") : null;
const fieldValues = (row) => ({
  batchName: row.batchName ?? "", programId: programIdOf(row),
  startDate: row.startDate ? dayjs(row.startDate) : null,
  endDate: row.endDate ? dayjs(row.endDate) : null,
  academicYear: row.academicYear ?? row.academic_year ?? "", status: row.status ?? "ACTIVE",
});
const snapshot = (values) => JSON.stringify({ ...values,
  startDate: dateKey(values?.startDate), endDate: dateKey(values?.endDate) });

function BatchFields({ form, programs, optionsError, onGenerateYear, startMonth, editing = false }) {
  const startDate = Form.useWatch("startDate", form);
  // The academic year used to need a separate "Academic year starts in" control (a per-browser
  // preference) plus a "Fill from start date" click. Fill it as soon as a start date is picked,
  // unless the admin already typed one.
  useEffect(() => {
    if (!startDate || editing) return;
    if (String(form.getFieldValue("academicYear") || "").trim()) return;
    onGenerateYear();
  }, [startDate]); // eslint-disable-line react-hooks/exhaustive-deps
  return <>
    <Form.Item name="programId" label="Program"
      extra={editing ? "The program can't be changed once the batch exists." : null}
      rules={[{ required: true, message: "Select a program" }]}>
      <Select placeholder={optionsError ? "Programs unavailable — Retry above" : "Select program"}
        showSearch optionFilterProp="children" disabled={Boolean(optionsError) || editing}>
        {programs.map((program) => <Option key={program.id} value={program.id}>{program.name}</Option>)}
      </Select>
    </Form.Item>
    <Form.Item name="batchName" label="Batch Name"
      rules={[{ required: true, whitespace: true, message: "Enter a batch name" }, { max: 255, message: "Maximum 255 characters" }]}>
      <Input placeholder="e.g., 2024–2028 Batch" />
    </Form.Item>
    <Row gutter={12}>
      <Col xs={24} sm={12}><Form.Item name="startDate" label="Start Date">
        <DatePicker style={{ width: "100%" }} />
      </Form.Item></Col>
      <Col xs={24} sm={12}><Form.Item name="endDate" label="End Date" dependencies={["startDate"]}
        rules={[{ validator: (_, value) => {
          const start = form.getFieldValue("startDate");
          return value && start && dayjs(value).isBefore(dayjs(start), "day")
            ? Promise.reject(new Error("End date cannot be before start date")) : Promise.resolve();
        } }]}>
        <DatePicker style={{ width: "100%" }}
          disabledDate={(value) => Boolean(value && startDate && dayjs(value).isBefore(dayjs(startDate), "day"))} />
      </Form.Item></Col>
    </Row>
    <Form.Item name="academicYear" label="Academic Year"
      extra={<span>Filled from the start date (academic year starting {MONTHS[startMonth - 1]}). Batch Promotion advances it automatically. <Button type="link" size="small" onClick={onGenerateYear} disabled={!startDate} style={{ padding: 0 }}>Recalculate</Button></span>}
      rules={[{ validator: (_, value) => {
        if (value == null || String(value).trim() === "") return Promise.resolve();
        return isCanonicalAcademicYear(value)
          ? Promise.resolve()
          : Promise.reject(new Error("Use consecutive years, e.g., 2026-27"));
      } }]}>
      <Input placeholder="e.g., 2024-25" maxLength={7} />
    </Form.Item>
    {editing && <Form.Item name="status" label="Status">
      <Select options={[{ value: "ACTIVE", label: "Active" }, { value: "INACTIVE", label: "Inactive" }, { value: "COMPLETED", label: "Completed" }]} />
    </Form.Item>}
  </>;
}

export default function Batches({ collegeId }) {
  const router = useRouter();
  const basePath = router.pathname.startsWith("/superadmin") ? "/superadmin" : "/college-admin";
  const isScoped = collegeId != null && Number.isSafeInteger(Number(collegeId)) && Number(collegeId) > 0;
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [createError, setCreateError] = useState("");
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
  const [programError, setProgramError] = useState("");
  const [programLoading, setProgramLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const deleteRef = useRef(null);
  const [search, setSearch] = useState("");
  const [filterProgram, setFilterProgram] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [startMonth, setStartMonth] = useState(7);
  const [classes, setClasses] = useState([]);
  const [classError, setClassError] = useState("");
  const [classLoading, setClassLoading] = useState(false);
  const [studentsFor, setStudentsFor] = useState(null); // the batch row whose roster is open
  const [manageClassId, setManageClassId] = useState(null); // which class-within-the-batch is selected
  const [classStudents, setClassStudents] = useState([]);
  const [rosterSearch, setRosterSearch] = useState("");
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState("");
  const [studentsLoadedClassId, setStudentsLoadedClassId] = useState(null);
  // Read through a ref inside the fetch callback: as a dependency it rebuilt the callback after every load and
  // re-ran the effects that call it (a duplicate request, plus their resets).
  const studentsLoadedClassIdRef = useRef(studentsLoadedClassId);
  studentsLoadedClassIdRef.current = studentsLoadedClassId;
  const [studentsErrorClassId, setStudentsErrorClassId] = useState(null);
  const [movingStudent, setMovingStudent] = useState(null); // the student row being reassigned
  const [moveTargetClassId, setMoveTargetClassId] = useState(null);
  const [moveSaving, setMoveSaving] = useState(false);
  const [moveError, setMoveError] = useState("");
  const tableSeq = useRef(0);
  const programSeq = useRef(0);
  const classSeq = useRef(0);
  const studentsSeq = useRef(0);
  const originalEditRef = useRef(null);
  const batchScopeKey = isScoped ? String(Number(collegeId)) : null;
  const hasCurrentBatches = batchScopeKey != null && loadedScopeKey === batchScopeKey;
  const currentLoadError = errorScopeKey === batchScopeKey ? loadError : "";
  const initialTableLoading = Boolean(batchScopeKey && tableLoading && !hasCurrentBatches && !currentLoadError);
  const tableRefreshing = Boolean(batchScopeKey && tableLoading && hasCurrentBatches);
  const hasCurrentStudents = manageClassId != null && String(studentsLoadedClassId) === String(manageClassId);
  const currentStudentsError = manageClassId != null && String(studentsErrorClassId) === String(manageClassId) ? studentsError : "";
  const initialStudentsLoading = studentsLoading && !hasCurrentStudents;
  const studentsRefreshing = studentsLoading && hasCurrentStudents;

  useEffect(() => {
    try { const saved = Number(window.localStorage.getItem(sizeKey)); if (PAGE_SIZES.includes(saved)) setPageSize(saved); }
    catch (_) { /* preference optional */ }
  }, []);
  useEffect(() => {
    try { const saved = Number(window.localStorage.getItem(cycleKey(collegeId))); setStartMonth(saved >= 1 && saved <= 12 ? saved : 7); }
    catch (_) { setStartMonth(7); }
  }, [collegeId]);

  const fetchData = useCallback(async () => {
    const request = ++tableSeq.current;
    const requestScopeKey = batchScopeKey;
    if (!isScoped || !requestScopeKey) {
      setData([]); setLoadedScopeKey(null); setErrorScopeKey(null); setLoadError(""); setTableLoading(false); return;
    }
    const scopeChanged = loadedScopeKeyRef.current !== requestScopeKey;
    if (scopeChanged) setData([]);
    setTableLoading(true); setLoadError(""); setErrorScopeKey(null);
    try {
      const result = await fetchWithErrorHandling(getBatchesByCollege(collegeId));
      if (request !== tableSeq.current) return;
      if (!result.success) throw new Error(result.message || "Failed to load batches");
      const rows = result.data?.data ?? result.data;
      if (!Array.isArray(rows)) throw new Error("Invalid batches response. Retry.");
      setData(rows);
      setLoadedScopeKey(requestScopeKey);
    } catch (error) {
      if (request !== tableSeq.current) return;
      setLoadError(error?.message || "Failed to load batches");
      setErrorScopeKey(requestScopeKey);
      if (scopeChanged) setData([]);
    } finally { if (request === tableSeq.current) setTableLoading(false); }
  }, [collegeId, isScoped, batchScopeKey]);
  const fetchPrograms = useCallback(async () => {
    const request = ++programSeq.current;
    if (!isScoped) { setPrograms([]); setProgramError(""); setProgramLoading(false); return; }
    setProgramLoading(true); setProgramError("");
    try {
      const result = await fetchWithErrorHandling(getProgramsByCollege(collegeId));
      if (request !== programSeq.current) return;
      if (!result.success) throw new Error(result.message || "Could not load programs");
      setPrograms(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      if (request !== programSeq.current) return;
      setPrograms([]); setProgramError(error?.message || "Could not load programs");
    } finally { if (request === programSeq.current) setProgramLoading(false); }
  }, [collegeId, isScoped]);

  const fetchClasses = useCallback(async () => {
    const request = ++classSeq.current;
    if (!isScoped) { setClasses([]); setClassError(""); setClassLoading(false); return; }
    setClassLoading(true); setClassError("");
    try {
      const result = await fetchWithErrorHandling(getClassesByCollege(collegeId));
      if (request !== classSeq.current) return;
      const rows = result.data?.data ?? result.data;
      if (!result.success || !Array.isArray(rows)) throw new Error(result.message || "Could not load classes");
      setClasses(rows);
    } catch (error) {
      if (request !== classSeq.current) return;
      setClasses([]); setClassError(error?.message || "Could not load classes");
    } finally { if (request === classSeq.current) setClassLoading(false); }
  }, [collegeId, isScoped]);

  useEffect(() => {
    setData([]); setPrograms([]); setClasses([]); setPage(1); setFilterProgram(null); setFilterStatus(null); setSearch("");
    form.resetFields(); fetchData(); fetchPrograms(); fetchClasses();
    return () => { ++tableSeq.current; ++programSeq.current; ++classSeq.current; };
  }, [collegeId, fetchData, fetchPrograms, fetchClasses, form]);

  const classNameOf = (row) => row?.name || row?.className || "Unnamed class";
  const classTypeOf = (row) => row?.classType ?? row?.class_type ?? "SECTION";
  const isPrimarySection = (row) => classTypeOf(row) !== "GROUP_BACKED";

  // A learner's primary class_id must point to a real SECTION. GROUP_BACKED classes represent
  // elective/group rosters and must never be used as batch-transfer destinations.
  const batchClassOptions = studentsFor
    ? classes.filter((row) =>
        idEq(row?.batchId ?? row?.batch_id, studentsFor.id)
        && idEq(row?.programId ?? row?.program_id, programIdOf(studentsFor))
        && isPrimarySection(row))
    : [];
  const destinationCounts = useDependencyCounts(batchClassOptions, {
    students: (row) => getLearnersByClass(row.id),
  });
  const selectedMoveTarget = batchClassOptions.find((row) => idEq(row.id, moveTargetClassId)) || null;
  const selectedMoveCapacity = selectedMoveTarget
    ? classCapacityState(selectedMoveTarget, destinationCounts[selectedMoveTarget.id]?.students)
    : null;

  const fetchClassStudents = useCallback(async (classId) => {
    const request = ++studentsSeq.current;
    if (!classId) {
      setClassStudents([]); setStudentsLoadedClassId(null); setStudentsErrorClassId(null);
      setStudentsError(""); setStudentsLoading(false); return;
    }
    const scopeChanged = String(studentsLoadedClassIdRef.current) !== String(classId);
    if (scopeChanged) setClassStudents([]);
    setStudentsLoading(true); setStudentsError(""); setStudentsErrorClassId(null);
    try {
      const result = await fetchWithErrorHandling(getLearnersByClass(classId));
      if (request !== studentsSeq.current) return;
      const rows = result.data?.data ?? result.data;
      if (!result.success || !Array.isArray(rows)) throw new Error(result.message || "Could not load students");
      setClassStudents(rows);
      setStudentsLoadedClassId(classId);
    } catch (error) {
      if (request !== studentsSeq.current) return;
      setStudentsError(error?.message || "Could not load students");
      setStudentsErrorClassId(classId);
      if (scopeChanged) setClassStudents([]);
    } finally { if (request === studentsSeq.current) setStudentsLoading(false); }
  }, []);

  // If the initial class lookup failed, Retry can populate the sections after the Students
  // modal is already open. Select the first valid section automatically so recovery does not
  // leave the modal sitting on an unexplained blank roster.
  useEffect(() => {
    if (!studentsFor || manageClassId || classLoading || classError) return;
    const firstClass = classes.find((c) =>
      idEq(c?.batchId ?? c?.batch_id, studentsFor.id)
      && idEq(c?.programId ?? c?.program_id, programIdOf(studentsFor))
      && isPrimarySection(c));
    if (firstClass?.id) {
      setManageClassId(firstClass.id);
      fetchClassStudents(firstClass.id);
    }
  }, [studentsFor, manageClassId, classLoading, classError, classes, fetchClassStudents]);

  const openStudentsFor = (row) => {
    setStudentsFor(row);
    const firstClass = classes.find((c) =>
      idEq(c?.batchId ?? c?.batch_id, row.id)
      && idEq(c?.programId ?? c?.program_id, programIdOf(row))
      && isPrimarySection(c));
    setManageClassId(firstClass?.id ?? null);
    if (firstClass?.id) fetchClassStudents(firstClass.id);
    else { setClassStudents([]); setStudentsError(""); }
  };
  const closeStudents = () => {
    ++studentsSeq.current;
    setStudentsFor(null); setManageClassId(null); setClassStudents([]); setStudentsError(""); setRosterSearch("");
    setMovingStudent(null); setMoveTargetClassId(null); setMoveError("");
  };
  const handleManageClassChange = (classId) => {
    setManageClassId(classId);
    fetchClassStudents(classId);
  };

  const learnerIdOf = (row) => row?.id ?? row?.learnerId ?? row?.learner_id;
  const handleMoveStudent = async () => {
    if (!movingStudent || !moveTargetClassId) return;
    setMoveSaving(true);
    setMoveError("");
    try {
      const targetClass = batchClassOptions.find((row) => idEq(row.id, moveTargetClassId));
      if (!targetClass || !isPrimarySection(targetClass)) {
        setMoveError("Choose another section in this batch.");
        return;
      }

      // Counts in the picker are a useful preview, but another admin can move a learner at any
      // moment. Re-read the destination roster immediately before the write and fail closed when
      // capacity cannot be verified. The server remains the final authority.
      const capacityResult = await fetchWithErrorHandling(getLearnersByClass(moveTargetClassId));
      const targetStudents = capacityResult.data?.data ?? capacityResult.data;
      if (!capacityResult.success || !Array.isArray(targetStudents)) {
        setMoveError("Couldn't verify the destination class capacity. Retry before moving this student.");
        return;
      }
      const freshCapacity = classCapacityState(targetClass, targetStudents.length);
      if (freshCapacity.known && freshCapacity.full) {
        setMoveError(`${classNameOf(targetClass)} is full (${freshCapacity.count}/${freshCapacity.max}). Choose another section.`);
        return;
      }

      // Use the narrow placement endpoint. Roster rows intentionally omit most profile fields;
      // sending one through the generic learner update would erase data that is not present here.
      await moveLearnerClass(learnerIdOf(movingStudent), moveTargetClassId);
      message.success("Moved student to the selected class.");
      setMovingStudent(null); setMoveTargetClassId(null); setMoveError("");
      fetchClassStudents(manageClassId); // refresh the roster we're viewing
      fetchData(); // batch student counts may have changed
    } catch (error) {
      setMoveError("Failed to move student: " + (error?.response?.data?.message || error?.message || "Unknown error"));
    } finally { setMoveSaving(false); }
  };

  const filteredData = data.filter((row) => {
    if (filterProgram && !idEq(programIdOf(row), filterProgram)) return false;
    if (filterStatus && row.status !== filterStatus) return false;
    const query = search.trim().toLowerCase();
    if (!query) return true;
    const program = programs.find((item) => idEq(item.id, programIdOf(row)));
    return [nameOf(row), row.academicYear, row.academic_year, program?.name, row.status, row.currentSemester]
      .some((value) => String(value ?? "").toLowerCase().includes(query));
  });
  const fillAcademicYear = (target) => {
    const startDate = target.getFieldValue("startDate");
    if (startDate) target.setFieldsValue({ academicYear: academicYearFor(startDate, startMonth) });
  };
  const payloadFrom = (values, editing = false) => ({
    batchName: String(values.batchName ?? "").trim(),
    programId: values.programId,
    startDate: dateKey(values.startDate), endDate: dateKey(values.endDate),
    academicYear: String(values.academicYear || academicYearFor(values.startDate, startMonth) || "").trim() || null,
    ...(editing ? { status: values.status } : { status: "ACTIVE" }),
  });
  const handleCreate = async (values) => {
    if (!isScoped) return;
    setCreateError("");
    setLoading(true);
    try {
      await createBatch(payloadFrom(values));
      message.success(`Created batch “${values.batchName.trim()}”. Next, create its classes/sections.`);
      const program = values.programId;
      form.resetFields(); form.setFieldsValue({ programId: program });
      fetchData();
    } catch (error) {
      const fieldError = applyServerFieldErrors(form, error, {
        batch_name: "batchName", program_id: "programId", academic_year: "academicYear",
        start_date: "startDate", end_date: "endDate",
      });
      const errorMessage = getServerFormError(error, "Failed to create batch.");
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
  const finishEdit = () => { setEditingRecord(null); setEditError(""); editForm.resetFields(); originalEditRef.current = null; };
  const handleEditCancel = () => {
    if (editLoading) return;
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
      await updateBatch(editingRecord.id, payloadFrom(values, true));
      message.success(`Updated batch “${values.batchName.trim()}”.`);
      finishEdit(); fetchData();
    } catch (error) {
      if (!error?.errorFields) {
        const fieldError = applyServerFieldErrors(editForm, error, {
          batch_name: "batchName", program_id: "programId", academic_year: "academicYear",
          start_date: "startDate", end_date: "endDate",
        });
        const errorMessage = getServerFormError(error, "Failed to update batch.");
        setEditError(errorMessage);
        if (!fieldError) message.error(errorMessage);
      }
    }
    finally { setEditLoading(false); }
  };
  const handleDelete = async (row, rejectOnFailure = true) => {
    if (!isScoped || deleteRef.current != null) return false;
    deleteRef.current = row.id;
    setDeletingId(row.id);
    setDeleteError(null);
    try {
      await deleteBatch(row.id);
      message.success(`Deleted batch “${nameOf(row)}”.`);
      fetchData();
      return true;
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to delete batch.";
      setDeleteError({ row, message: errorMessage });
      if (rejectOnFailure) throw error;
      return false;
    } finally {
      deleteRef.current = null;
      setDeletingId(null);
    }
  };
  const noPrograms = isScoped && !programLoading && !programError && programs.length === 0;
  const columns = [
    { title: "Batch Name", key: "name", render: (_, row) => nameOf(row) },
    { title: "Program", key: "program", render: (_, row) => row.programName
      || programs.find((item) => idEq(item.id, programIdOf(row)))?.name
      || "Program name unavailable" },
    { title: "Years", key: "years", width: 110, render: (_, row) => {
      const from = yearOf(row.startDate), to = yearOf(row.endDate);
      return from || to ? `${from ?? "?"} – ${to ?? "?"}` : <Text type="secondary">—</Text>;
    } },
    { title: "Current Semester", key: "semester", width: 140, render: (_, row) =>
      <Tag color="blue">Semester {row.currentSemester ?? row.current_semester ?? 1}</Tag> },
    { title: "Academic Year", key: "academicYear", width: 120, render: (_, row) => row.academicYear || row.academic_year || "—" },
    { title: "Classes", key: "classCount", width: 80, render: (_, row) => row.classCount ?? row.class_count ?? 0 },
    { title: "Students", dataIndex: "currentStudents", key: "currentStudents", width: 90 },
    { title: "Status", dataIndex: "status", key: "status", width: 110,
      render: (status) => { const t = STATUS_TAG[status] || { color: "default", label: status || "Unknown" };
        return <Tag color={t.color}>{t.label}</Tag>; } },
    { title: "Actions", key: "actions", width: 245, render: (_, row) => {
      const classCount = row.classCount ?? row.classesCount ?? row.class_count;
      const studentCount = row.currentStudents ?? row.current_students;
      const knownChildren = (Number.isFinite(Number(classCount)) && Number(classCount) > 0)
        || (Number.isFinite(Number(studentCount)) && Number(studentCount) > 0);
      const reason = knownChildren
        ? `Move or remove its ${[
          [Number(classCount) || 0, "class", "classes"], [Number(studentCount) || 0, "student", "students"],
        ].filter(([n]) => n > 0).map(([n, one, many]) => `${n} ${n === 1 ? one : many}`).join(" and ")} before deleting.` : "";
      return <Space size="small" wrap>
        <Button size="small" icon={<EditOutlined />} aria-label={`Edit batch ${nameOf(row)}`} onClick={() => handleEdit(row)}
          disabled={deletingId != null}>Edit</Button>
        <Button size="small" icon={<TeamOutlined />} aria-label={`Manage students in ${nameOf(row)}`}
          onClick={() => openStudentsFor(row)} disabled={deletingId != null}>Students</Button>
        <Tooltip title={reason}>
          <span><Popconfirm title={`Delete “${nameOf(row)}”?`}
            description="Deletion is blocked if classes or students are linked. The server performs the final check."
            onConfirm={() => handleDelete(row)} okText="Delete" cancelText="Cancel"
            okButtonProps={{ danger: true, loading: deletingId === row.id }}
            disabled={knownChildren || (deletingId != null && deletingId !== row.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} aria-label={`Delete batch ${nameOf(row)}`}
              loading={deletingId === row.id} disabled={knownChildren || (deletingId != null && deletingId !== row.id)}>Delete</Button>
          </Popconfirm></span>
        </Tooltip>
      </Space>;
    } },
  ];

  return <>
    {!isScoped && <Alert type="warning" showIcon message="Select a college to manage Batches"
      description="Batches belong to a specific college. Choose one in the header." style={{ marginBottom: 16 }} />}
    <div className="admin-list-page__header">
      <div>
        <h1 className="admin-list-page__title">Batches</h1>
        <div className="admin-list-page__subtitle">Manage cohorts, their academic year and current semester before creating sections or promoting students.</div>
      </div>
    </div>
    <Row gutter={24}>
      <Col xs={24} lg={10}>
        <Card title="Create New Batch" size="small">
          {createError ? <Alert type="error" showIcon message="Batch was not created" description={createError}
            closable onClose={() => setCreateError("")} style={{ marginBottom: 12 }} /> : null}
          {programError && <Alert type="error" showIcon message="Programs could not be loaded"
            description={programError} action={<Button size="small" onClick={fetchPrograms}>Retry</Button>}
            style={{ marginBottom: 12 }} />}
          {noPrograms && <Alert type="info" showIcon message="No programs in this college yet"
            description={<span>Create a program before adding batches. <Link href={`${basePath}/programs`}>Go to Programs</Link>.</span>}
            style={{ marginBottom: 12 }} />}
          <Form form={form} layout="vertical" onFinish={handleCreate} disabled={loading}>
            <BatchFields form={form} programs={programs} optionsError={programError}
              startMonth={startMonth} onGenerateYear={() => fillAcademicYear(form)} />
            <Form.Item><Button type="primary" htmlType="submit" loading={loading} icon={<PlusOutlined />}
              disabled={!isScoped || programLoading || Boolean(programError) || noPrograms}>Create Batch</Button></Form.Item>
          </Form>
        </Card>
      </Col>
      <Col xs={24} lg={14}>
        <Card title="Existing Batches" size="small" extra={<AdminTableToolbar
          searchValue={search} onSearch={(value) => { setSearch(value); setPage(1); }}
          searchPlaceholder="Search batch, year, program or status" onRefresh={fetchData} loading={tableLoading}
          resultCount={filteredData.length} totalCount={data.length} exportFileName="batches.csv"
          exportRows={() => filteredData.map((row) => ({
            id: row.id, batchName: nameOf(row), programId: programIdOf(row) ?? "",
            currentSemester: row.currentSemester ?? row.current_semester ?? "",
            academicYear: row.academicYear ?? row.academic_year ?? "",
            students: row.currentStudents ?? "", status: row.status ?? "",
            startDate: row.startDate ?? "", endDate: row.endDate ?? "",
          }))} />}>
          {deleteError ? <Alert type="error" showIcon message="Batch was not deleted" description={deleteError.message}
            action={<Button size="small" onClick={() => handleDelete(deleteError.row, false)} disabled={deletingId != null}>Retry delete</Button>}
            closable onClose={() => setDeleteError(null)} style={{ marginBottom: 12 }} /> : null}
          {tableRefreshing ? <RefreshStatus label="Refreshing batches…" /> : null}
          {currentLoadError && <Alert type={hasCurrentBatches ? "warning" : "error"} showIcon
            message={hasCurrentBatches ? "Couldn't refresh batches" : "Could not load batches"}
            description={hasCurrentBatches ? "Showing the last batches loaded for this college." : currentLoadError}
            action={<Button size="small" onClick={fetchData}>Retry</Button>} style={{ marginBottom: 12 }} />}
          <Space wrap style={{ marginBottom: 12 }}>
            <Select aria-label="Filter batches by program" placeholder="All programs" allowClear
              value={filterProgram} style={{ width: 155, maxWidth: "100%" }}
              onChange={(value) => { setFilterProgram(value ?? null); setPage(1); }}
              options={programs.map((row) => ({ value: row.id, label: row.name }))} />
            <Select aria-label="Filter batches by status" placeholder="All statuses" allowClear
              value={filterStatus} style={{ width: 155, maxWidth: "100%" }}
              onChange={(value) => { setFilterStatus(value ?? null); setPage(1); }}
              options={[{ value: "ACTIVE", label: "Active" }, { value: "INACTIVE", label: "Inactive" }, { value: "COMPLETED", label: "Completed" }]} />
            {(filterProgram || filterStatus) && <Button size="small"
              onClick={() => { setFilterProgram(null); setFilterStatus(null); setPage(1); }}>Clear filters</Button>}
          </Space>
          {initialTableLoading ? (
            <TableSkeleton rows={8} columns={8} label="Loading batches" />
          ) : currentLoadError && !hasCurrentBatches ? null : (
          <Table dataSource={filteredData} columns={columns} rowKey="id"
            size="small" scroll={{ x: "max-content" }}
            pagination={{ current: page, pageSize, pageSizeOptions: PAGE_SIZES, showSizeChanger: true,
              onChange: (nextPage, nextSize) => {
                setPage(nextSize !== pageSize ? 1 : nextPage); setPageSize(nextSize);
                try { window.localStorage.setItem(sizeKey, String(nextSize)); } catch (_) { /* Optional */ }
              }, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}` }}
            locale={{ emptyText: loadError ? "Could not load batches; use Retry above."
              : search.trim() || filterProgram || filterStatus ? "No batches match the search or filters."
              : "No batches yet. Create a program first." }} />
          )}
        </Card>
      </Col>
    </Row>
    <Modal title={editingRecord ? `Edit batch “${nameOf(editingRecord)}”` : "Edit Batch"}
      open={Boolean(editingRecord)} onOk={() => editForm.submit()} onCancel={handleEditCancel}
      confirmLoading={editLoading} okButtonProps={{ disabled: editLoading }} cancelButtonProps={{ disabled: editLoading }}
      okText="Save Changes" cancelText="Cancel"
      width={520} maskClosable={false} closable={!editLoading} keyboard={!editLoading}>
      {programError && <Alert type="error" showIcon message="Programs could not be loaded"
        description={programError} action={<Button size="small" onClick={fetchPrograms}>Retry</Button>}
        style={{ marginBottom: 12 }} />}
      {editError ? <Alert type="error" showIcon message="Batch was not updated" description={editError}
        closable onClose={() => setEditError("")} style={{ marginBottom: 12 }} /> : null}
      <Form form={editForm} layout="vertical" onFinish={handleEditSubmit} disabled={editLoading}>
        <BatchFields form={editForm} programs={programs} optionsError={programError}
          startMonth={startMonth} editing onGenerateYear={() => fillAcademicYear(editForm)} />
      </Form>
    </Modal>
    <Modal title={studentsFor ? `Students — ${nameOf(studentsFor)}` : "Students"}
      open={Boolean(studentsFor)} onCancel={closeStudents} footer={null} width={720} destroyOnClose>
      {classError ? (
        <Alert type="error" showIcon message="Could not load classes"
          description={classError} action={<Button size="small" onClick={fetchClasses}>Retry</Button>} />
      ) : classLoading ? (
        <ListSkeleton rows={3} avatar={false} label="Loading batch sections" />
      ) : batchClassOptions.length === 0 ? (
        <Alert type="info" showIcon message="No classes in this batch yet"
          description={<span>Students belong to a class, and a class belongs to a batch. Create a class for
            this batch first (Classes page), then students can be added or moved into it.
            {" "}<Link href={`${basePath}/classes`}>Go to Classes</Link>.</span>} />
      ) : (
        <>
          <Space style={{ marginBottom: 12 }} wrap>
            <Text>Class:</Text>
            <Select style={{ width: 220, maxWidth: "100%" }} value={manageClassId} onChange={handleManageClassChange}
              options={batchClassOptions.map((c) => ({ value: c.id, label: classNameOf(c) }))} />
            <Input.Search allowClear placeholder="Search name, roll no. or email" style={{ width: 240 }}
              value={rosterSearch} onChange={(e) => setRosterSearch(e.target.value)} />
            <Text type="secondary">{classStudents.length} student{classStudents.length === 1 ? "" : "s"}</Text>
          </Space>
          {studentsRefreshing ? <RefreshStatus label="Refreshing class roster…" /> : null}
          {currentStudentsError && <Alert type={hasCurrentStudents ? "warning" : "error"} showIcon
            message={hasCurrentStudents ? "Couldn't refresh students" : "Could not load students"}
            description={hasCurrentStudents ? "Showing the last roster loaded for this class." : currentStudentsError}
            action={<Button size="small" onClick={() => fetchClassStudents(manageClassId)}>Retry</Button>}
            style={{ marginBottom: 12 }} />}
          {initialStudentsLoading ? (
            <TableSkeleton rows={6} columns={4} label="Loading class roster" />
          ) : currentStudentsError && !hasCurrentStudents ? null : (
          <Table
            size="small" rowKey={(r) => learnerIdOf(r)}
            dataSource={rosterSearch.trim() ? classStudents.filter((r) => {
              const q = rosterSearch.trim().toLowerCase();
              return [r.first_name ?? r.firstName, r.last_name ?? r.lastName, r.roll_number ?? r.rollNumber, r.contact_mail ?? r.contactMail]
                .some((v) => String(v ?? "").toLowerCase().includes(q));
            }) : classStudents}
            pagination={{ pageSize: 20, showSizeChanger: false, hideOnSinglePage: true }}
            locale={{ emptyText: studentsError ? "Could not load students; use Retry above." : "No students in this class yet." }}
            columns={[
              { title: "Name", key: "name", render: (_, r) => [r.first_name ?? r.firstName, r.last_name ?? r.lastName].filter(Boolean).join(" ") || "—" },
              { title: "Roll No.", key: "roll", render: (_, r) => r.roll_number ?? r.rollNumber ?? "—" },
              { title: "Email", key: "email", render: (_, r) => r.contact_mail ?? r.contactMail ?? "—" },
              { title: "Actions", key: "actions", width: 120, render: (_, r) => (
                <Button size="small" icon={<SwapOutlined />}
                  aria-label={`Move ${[r.first_name ?? r.firstName, r.last_name ?? r.lastName].filter(Boolean).join(" ")} to another class`}
                  disabled={!batchClassOptions.some((c) => !idEq(c.id, manageClassId))}
                  title={!batchClassOptions.some((c) => !idEq(c.id, manageClassId)) ? "No other section is available in this batch" : undefined}
                  onClick={() => { setMovingStudent(r); setMoveTargetClassId(null); setMoveError(""); }}>Move</Button>
              ) },
            ]}
          />
          )}
        </>
      )}
    </Modal>
    <Modal title={movingStudent ? `Move ${[movingStudent.first_name ?? movingStudent.firstName, movingStudent.last_name ?? movingStudent.lastName].filter(Boolean).join(" ")} to another class` : "Move student"}
      open={Boolean(movingStudent)} onCancel={() => { if (!moveSaving) { setMovingStudent(null); setMoveTargetClassId(null); setMoveError(""); } }}
      onOk={handleMoveStudent} okText="Move" confirmLoading={moveSaving}
      okButtonProps={{ disabled: moveSaving || !moveTargetClassId || Boolean(selectedMoveCapacity?.full) }}
      cancelButtonProps={{ disabled: moveSaving }} closable={!moveSaving} keyboard={!moveSaving} maskClosable={false} destroyOnClose>
      <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
        Choose another section in this batch. Cross-batch or cross-program transfers require a
        dedicated transfer workflow and are intentionally not performed from this page.
      </Text>
      {classError && <Alert type="error" showIcon message="Could not load classes"
        description={classError} action={<Button size="small" onClick={fetchClasses}>Retry</Button>}
        style={{ marginBottom: 12 }} />}
      {moveError && <Alert type="error" showIcon message="Student was not moved" description={moveError}
        style={{ marginBottom: 12 }} />}
      {selectedMoveCapacity?.full && <Alert type="warning" showIcon message="Destination class is full"
        description={`${selectedMoveCapacity.count}/${selectedMoveCapacity.max} students are already assigned. Choose another section.`}
        style={{ marginBottom: 12 }} />}
      {selectedMoveTarget && selectedMoveCapacity && !selectedMoveCapacity.known && selectedMoveCapacity.max != null && (
        <Alert type="info" showIcon message="Capacity will be rechecked before moving"
          description={`This class allows up to ${selectedMoveCapacity.max} students. The latest roster count will be verified before the move is sent.`}
          style={{ marginBottom: 12 }} />
      )}
      <Select style={{ width: "100%" }} placeholder="Select destination class" value={moveTargetClassId}
        onChange={(value) => { setMoveTargetClassId(value); setMoveError(""); }} loading={classLoading} showSearch
        filterOption={(input, option) => String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
        options={batchClassOptions
          .filter((c) => !idEq(c.id, manageClassId))
          .map((c) => {
            const capacity = classCapacityState(c, destinationCounts[c.id]?.students);
            const capacityLabel = capacity.max == null
              ? ""
              : capacity.count == null
                ? ` · capacity ?/${capacity.max}`
                : ` · ${capacity.count}/${capacity.max}${capacity.full ? " · Full" : ""}`;
            return { value: c.id, label: `${classNameOf(c)}${capacityLabel}`, disabled: capacity.full };
          })} />
    </Modal>
  </>;
}
