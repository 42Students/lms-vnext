import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Alert, Form, Input, Button, Table, Card, Row, Col, message, Select, Switch,
  Tag, Space, Modal, Typography,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  createLesson, getLessonsByCourse, getCoursesByCollege, updateLesson, deleteLesson,
  fetchWithErrorHandling, bulkUpdateLessonStatus, reorderLessons,
} from "@/api/Services/AdminService";
import AdminTableToolbar from "@/components/admin/AdminTableToolbar";
import { useSortableTable, sortColumn } from "@/components/admin/SortableTableRow";
import { RefreshStatus, TableSkeleton } from "@/components/Common/Skeletons";
import { applyServerFieldErrors, getServerFormError } from "@/utils/formErrors";

const { Option } = Select;
const PAGE_SIZE_KEY = "admin-lessons-page-size";
const PAGE_SIZES = [10, 25, 50, 100];
const idEq = (a, b) => a != null && b != null && Number(a) === Number(b);
const lessonCourseId = (lesson) => lesson?.courseId ?? lesson?.course_id;
const lessonNameOf = (lesson) => lesson?.lessonName || lesson?.lesson_name || "Untitled lesson";
const lessonSequence = (lesson) => Number(lesson?.sequence ?? 0);
const sortLessons = (items = []) => [...items].sort((a, b) =>
  Number(lessonCourseId(a) ?? 0) - Number(lessonCourseId(b) ?? 0)
  || lessonSequence(a) - lessonSequence(b)
  || Number(a?.id ?? 0) - Number(b?.id ?? 0)
);
const asLessons = (res) => {
  const value = res?.data?.data ?? res?.data;
  if (!Array.isArray(value)) throw new Error("Unexpected lessons response");
  return value;
};
const snapshot = (values) => JSON.stringify(values);

function LessonFields({ courses, editing = false }) {
  return <>
    <Form.Item name="courseId" label="Course" rules={[{ required: true, message: "Select a course" }]}>
      <Select placeholder="Select course" showSearch optionFilterProp="children">
        {courses.map((course) => <Option key={course.id} value={course.id}>
          {course.courseName || course.course_name || course.short_title || `Course ${course.id}`}
        </Option>)}
      </Select>
    </Form.Item>
    <Form.Item name="lessonName" label="Lesson Name" rules={[
      { required: true, whitespace: true, message: "Enter a lesson name" },
      { max: 255, message: "Maximum 255 characters" },
    ]}>
      <Input placeholder="e.g., Introduction to Arrays" />
    </Form.Item>
    <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: 0 }}>
      {editing ? "To change order, choose this lesson’s course in the list and use the drag handles or keyboard controls."
        : "A new lesson is appended to its course. You can reorder lessons after saving."}
    </Typography.Paragraph>
    <Row gutter={12}>
      {/* Students only see a lesson that is both active and enabled (LessonController.visibleTo),
          so one switch sets both instead of two that looked different and were read as one. */}
      <Col xs={24}><Form.Item name="active" label="Visible to students" valuePropName="checked"
        extra="Off hides this lesson and its content from students; staff still see it."><Switch /></Form.Item></Col>
    </Row>
  </>;
}

export default function Lessons({ collegeId }) {
  const router = useRouter();
  const basePath = router.pathname.startsWith("/superadmin") ? "/superadmin" : "/college-admin";
  const isScoped = collegeId != null && Number.isSafeInteger(Number(collegeId)) && Number(collegeId) > 0;
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  const createSubmitRef = useRef(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [data, setData] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [courses, setCourses] = useState([]);
  const [coursesError, setCoursesError] = useState("");
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const selectedCourseRef = useRef(selectedCourseId); // BE-0147: the course on screen now, for late answers
  selectedCourseRef.current = selectedCourseId;
  const [showAll, setShowAll] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  const editSubmitRef = useRef(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedLessonIds, setSelectedLessonIds] = useState([]);
  const [search, setSearch] = useState("");
  const [reordering, setReordering] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkError, setBulkError] = useState(null);
  const bulkRef = useRef(false);
  const deleteBusyRef = useRef(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [partialCount, setPartialCount] = useState(0);
  const [loadedScopeKey, setLoadedScopeKey] = useState(null);
  const loadedScopeRef = useRef(null);
  const requestsSeq = useRef(0);
  const coursesSeq = useRef(0);
  const originalEditRef = useRef(null);
  const savedCourseKey = `admin-lessons-selected-course:${collegeId}`;
  const lessonScopeKey = isScoped && (selectedCourseId || showAll)
    ? `${Number(collegeId)}:${selectedCourseId ? `course:${selectedCourseId}` : "all"}`
    : null;
  const hasCurrentLessons = lessonScopeKey != null && loadedScopeKey === lessonScopeKey;

  useEffect(() => {
    try { const value = Number(window.localStorage.getItem(PAGE_SIZE_KEY)); if (PAGE_SIZES.includes(value)) setPageSize(value); }
    catch (_) { /* Optional preference */ }
  }, []);

  const fetchCourses = useCallback(async () => {
    const request = ++coursesSeq.current;
    if (!isScoped) { setCourses([]); setCoursesError(""); setCoursesLoading(false); return; }
    setCoursesLoading(true); setCoursesError("");
    try {
      const res = await fetchWithErrorHandling(getCoursesByCollege(collegeId));
      if (request !== coursesSeq.current) return;
      if (!res.success) throw new Error(res.message || "Could not load courses");
      const list = res?.data?.data ?? res?.data;
      if (!Array.isArray(list)) throw new Error("Unexpected courses response");
      setCourses(list);
      // Restore only a saved course that genuinely belongs to the current college.
      let saved = null;
      try { saved = window.localStorage.getItem(savedCourseKey); } catch (_) { /* Optional */ }
      if (saved && list.some((item) => String(item.id) === saved)) {
        const chosen = list.find((item) => String(item.id) === saved);
        setSelectedCourseId(chosen.id); setShowAll(false);
        form.setFieldsValue({ courseId: chosen.id });
      }
    } catch (error) {
      if (request !== coursesSeq.current) return;
      setCourses([]); setCoursesError(error?.message || "Could not load courses");
    } finally { if (request === coursesSeq.current) setCoursesLoading(false); }
  }, [collegeId, isScoped, savedCourseKey, form]);

  const fetchLessons = useCallback(async () => {
    const request = ++requestsSeq.current;
    const requestScopeKey = lessonScopeKey;
    if (!isScoped || !requestScopeKey) {
      setData([]);
      setLoadedScopeKey(null);
      loadedScopeRef.current = null;
      setLoadError("");
      setPartialCount(0);
      setTableLoading(false);
      return;
    }
    const sameScope = loadedScopeRef.current === requestScopeKey;
    setTableLoading(true);
    setLoadError("");
    setPartialCount(0);
    if (!sameScope) setData([]);
    try {
      if (selectedCourseId) {
        const result = await fetchWithErrorHandling(getLessonsByCourse(selectedCourseId));
        if (request !== requestsSeq.current) return;
        if (!result.success) throw new Error(result.message || "Could not load lessons");
        setData(sortLessons(asLessons(result)));
        loadedScopeRef.current = requestScopeKey;
        setLoadedScopeKey(requestScopeKey);
      } else {
        // The API has no college-level listing. All-courses view stays opt-in and uses
        // groups of four calls rather than firing an unbounded request burst on page load.
        const merged = [];
        const seen = new Set();
        const failures = [];
        for (let offset = 0; offset < courses.length; offset += 4) {
          const group = await Promise.all(courses.slice(offset, offset + 4).map(async (course) => {
            try {
              const result = await fetchWithErrorHandling(getLessonsByCourse(course.id));
              if (!result.success) throw new Error(result.message || "Request failed");
              return { course, rows: asLessons(result) };
            } catch (error) { return { course, error: error?.message || "Request failed" }; }
          }));
          if (request !== requestsSeq.current) return;
          group.forEach(({ course, rows, error }) => {
            if (error) failures.push(`${course.courseName || course.course_name || course.id}: ${error}`);
            else rows.forEach((lesson) => {
              const id = lesson.id ?? lesson.lessonId;
              if (id != null && !seen.has(id)) { merged.push(lesson); seen.add(id); }
            });
          });
        }
        if (request !== requestsSeq.current) return;
        setData(sortLessons(merged));
        loadedScopeRef.current = requestScopeKey;
        setLoadedScopeKey(requestScopeKey);
        setPartialCount(failures.length);
        if (failures.length) setLoadError(`${failures.length} course lesson list(s) failed: ${failures.slice(0, 3).join("; ")}. Retry before bulk changes.`);
      }
    } catch (error) {
      if (request !== requestsSeq.current) return;
      if (!sameScope) setData([]);
      setLoadError(error?.message || "Could not load lessons");
    } finally { if (request === requestsSeq.current) setTableLoading(false); }
  }, [collegeId, isScoped, selectedCourseId, showAll, courses, lessonScopeKey]);

  useEffect(() => {
    setSelectedCourseId(null); setShowAll(false); setCourses([]); setData([]);
    setLoadedScopeKey(null); loadedScopeRef.current = null;
    setCreateError(null); setEditError(null);
    createSubmitRef.current = false; editSubmitRef.current = false;
    setSearch(""); setSelectedLessonIds([]); setPage(1); form.resetFields();
    fetchCourses();
    return () => { ++coursesSeq.current; ++requestsSeq.current; };
  }, [collegeId, fetchCourses, form]);
  useEffect(() => {
    fetchLessons();
    return () => { ++requestsSeq.current; };
  }, [fetchLessons]);

  const getCourseName = (courseId) => {
    const course = courses.find((item) => idEq(item.id, courseId));
    return course?.courseName || course?.course_name || `Course name unavailable (ID ${courseId ?? "unknown"})`;
  };
  const filteredData = data.filter((lesson) =>
    lessonNameOf(lesson).toLowerCase().includes(search.trim().toLowerCase()));
  const canReorder = Boolean(selectedCourseId) && !search.trim() && !loadError && !tableLoading && !reordering;
  const sortable = useSortableTable({ items: filteredData, rowKeyName: "id", onReorder: async (orderedIds) => {
    if (!canReorder) return;
    const previous = data;
    const courseAtStart = selectedCourseId;
    const byId = Object.fromEntries(previous.map((lesson) => [lesson.id, lesson]));
    setData(orderedIds.map((id) => byId[id]).filter(Boolean));
    setReordering(true);
    try {
      await reorderLessons(selectedCourseId, orderedIds);
      message.success(`Saved lesson order for ${getCourseName(selectedCourseId)}.`);
    } catch (error) {
      if (idEq(selectedCourseRef.current, courseAtStart)) setData(previous);
      message.error(error?.response?.data?.message || "Couldn't save order. Previous order restored.");
    } finally { setReordering(false); }
  } });

  const changeCourse = (courseId) => {
    setSelectedCourseId(courseId || null); setShowAll(false);
    setSearch(""); setSelectedLessonIds([]); setPage(1);
    form.setFieldsValue({ courseId: courseId || undefined });
    try {
      if (courseId) window.localStorage.setItem(savedCourseKey, String(courseId));
      else window.localStorage.removeItem(savedCourseKey);
    } catch (_) { /* Optional preference */ }
  };
  const chooseAll = () => {
    setSelectedCourseId(null); setShowAll(true); setSearch(""); setSelectedLessonIds([]); setPage(1);
    try { window.localStorage.removeItem(savedCourseKey); } catch (_) { /* Optional */ }
  };

  const handleCreate = async (values) => {
    if (createSubmitRef.current || loading) return;
    if (!isScoped) return;
    createSubmitRef.current = true;
    setCreateError(null);
    setLoading(true);
    try {
      const name = String(values.lessonName ?? "").trim();
      const course = courses.find((item) => idEq(item.id, values.courseId));
      await createLesson({ lesson_name: name, course_id: values.courseId,
        ...(course?.slug && { courseSlug: course.slug }),
        // Backend appends when sequence is zero; use one ordering UI rather than two.
        sequence: 0, active: values.active !== false, enabled: values.active !== false });
      message.success(`Created lesson “${name}” in ${getCourseName(values.courseId)}.`);
      form.resetFields(); form.setFieldsValue({ courseId: values.courseId, active: true, enabled: true });
      if (showAll || !idEq(selectedCourseId, values.courseId)) changeCourse(values.courseId);
      else fetchLessons();
    } catch (error) {
      const fieldError = applyServerFieldErrors(form, error, { lesson_name: "lessonName", course_id: "courseId" });
      const errorMessage = getServerFormError(error, "Failed to create lesson.");
      setCreateError(errorMessage);
      if (!fieldError) message.error(errorMessage);
    }
    finally {
      createSubmitRef.current = false;
      setLoading(false);
    }
  };

  const finishEdit = () => { setEditingRecord(null); editForm.resetFields(); originalEditRef.current = null; };
  const handleEdit = (lesson) => {
    setEditError(null);
    editSubmitRef.current = false;
    setEditingRecord(lesson);
    const values = { lessonName: lessonNameOf(lesson), courseId: lessonCourseId(lesson),
      active: lesson.active !== false && lesson.enabled !== false, enabled: lesson.enabled !== false };
    editForm.resetFields(); editForm.setFieldsValue(values);
    originalEditRef.current = snapshot(values);
  };
  const handleEditCancel = () => {
    if (editSubmitRef.current || editLoading) {
      message.info("Wait for the lesson save to finish.");
      return;
    }
    if (!editingRecord || snapshot(editForm.getFieldsValue(true)) === originalEditRef.current) { finishEdit(); return; }
    Modal.confirm({ title: `Discard edits to “${lessonNameOf(editingRecord)}”?`,
      content: "Unsaved changes will be lost.", okText: "Discard edits", okButtonProps: { danger: true }, onOk: finishEdit });
  };
  const handleEditSubmit = async () => {
    if (!editingRecord || editSubmitRef.current || editLoading) return;
    editSubmitRef.current = true;
    setEditError(null);
    try {
      const values = await editForm.validateFields();
      setEditLoading(true);
      const course = courses.find((item) => idEq(item.id, values.courseId));
      await updateLesson(editingRecord.id, {
        lesson_name: String(values.lessonName).trim(), course_id: values.courseId,
        ...(course?.slug && { courseSlug: course.slug }), sequence: lessonSequence(editingRecord),
        active: values.active !== false, enabled: values.active !== false,
      });
      message.success(`Updated lesson “${values.lessonName.trim()}”.`);
      const moved = !idEq(lessonCourseId(editingRecord), values.courseId);
      finishEdit();
      if (moved && !showAll) changeCourse(values.courseId);
      else fetchLessons();
    } catch (error) {
      if (!error?.errorFields) {
        const fieldError = applyServerFieldErrors(editForm, error, { lesson_name: "lessonName", course_id: "courseId" });
        const errorMessage = getServerFormError(error, "Failed to update lesson.");
        setEditError(errorMessage);
        if (!fieldError) message.error(errorMessage);
      }
    } finally {
      editSubmitRef.current = false;
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isScoped || !deleteTarget || deleteBusyRef.current) return;
    deleteBusyRef.current = true;
    setDeleteLoading(true);
    try {
      await deleteLesson(deleteTarget.id);
      message.success(`Deleted “${lessonNameOf(deleteTarget)}”. Its uploaded files are kept, so it can be restored if needed.`); // BE-0143
      setDeleteTarget(null); setDeleteConfirmText(""); fetchLessons();
    } catch (error) { message.error("Failed to delete lesson: " + (error?.response?.data?.message || error?.message)); }
    finally { deleteBusyRef.current = false; setDeleteLoading(false); }
  };

  const runBulk = async (changes, label, rejectOnFailure = false) => {
    if (!selectedLessonIds.length || bulkRef.current || loadError) return false;
    const ids = [...selectedLessonIds];
    bulkRef.current = true;
    setBulkBusy(true);
    setBulkError(null);
    try {
      const response = await bulkUpdateLessonStatus({ lessonIds: ids, ...changes });
      const result = response?.data?.data ?? response?.data ?? {};
      const failures = Array.isArray(result.failed) ? result.failed : [];
      if (failures.length) {
        const failedIds = failures.map((failure) => failure.lessonId).filter((id) => id != null);
        setSelectedLessonIds(failedIds);
        setBulkError({
          changes,
          label,
          failures,
          message: `${result.updatedCount ?? 0} of ${result.requested ?? ids.length} updated. Retry will target only the failed lessons.`,
        });
      } else {
        setSelectedLessonIds([]);
        message.success(`${label}: ${result.updatedCount ?? ids.length} lesson(s) updated.`);
      }
      fetchLessons();
      return failures.length === 0;
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || `Failed to ${label.toLowerCase()}`;
      setBulkError({ changes, label, failures: [], message: errorMessage });
      if (rejectOnFailure) throw error;
      return false;
    } finally {
      bulkRef.current = false;
      setBulkBusy(false);
    }
  };
  const confirmBulk = (changes, label, danger = false) => Modal.confirm({
    title: `${label} ${selectedLessonIds.length} lesson(s)?`,
    content: <div>
      <p>Selected lessons across the current list will be updated. No files are deleted by this action.</p>
      <p>{data.filter((lesson) => selectedLessonIds.includes(lesson.id)).slice(0, 5).map(lessonNameOf).join(", ")}</p>
    </div>,
    okText: label, okButtonProps: { danger }, onOk: () => runBulk(changes, label, true),
  });

  const columns = [
    ...(canReorder ? [sortColumn] : []),
    { title: "Lesson Name", key: "lessonName", render: (_, row) => lessonNameOf(row) },
    { title: "Course", key: "course", render: (_, row) => getCourseName(lessonCourseId(row)) },
    // Position in the course's order as shown. The stored sequence is often the same for every
    // lesson (all five Java lessons read "1"), so printing it said nothing.
    { title: "Order", key: "position", width: 85, render: (_, row, index) => (canReorder ? 0 : (page - 1) * pageSize) + index + 1 },
    { title: "Students see it", key: "visible", width: 120,
      render: (_, row) => row.active !== false && row.enabled !== false ? <Tag color="green">Visible</Tag> : <Tag>Hidden</Tag> },
    { title: "Actions", key: "actions", width: 180, render: (_, lesson) => <Space size="small" wrap>
      <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(lesson)}
        aria-label={`Edit lesson ${lessonNameOf(lesson)}`}>Edit</Button>
      <Button size="small" danger icon={<DeleteOutlined />} aria-label={`Delete lesson ${lessonNameOf(lesson)}`}
        onClick={() => { setDeleteTarget(lesson); setDeleteConfirmText(""); }}>Delete</Button>
    </Space> },
  ];

  return <>
    {!isScoped && <Alert type="warning" showIcon message="Select a college to manage Lessons" />}
    <h1 className="admin-list-page__title">Lessons</h1>
    <Row gutter={24}>
      <Col xs={24} lg={10}>
        <Card title="Create New Lesson" size="small">
          {coursesError && <Alert type="error" showIcon message="Courses could not be loaded" description={coursesError}
            action={<Button size="small" onClick={fetchCourses}>Retry</Button>} style={{ marginBottom: 12 }} />}
          {!coursesError && isScoped && !coursesLoading && courses.length === 0 && <Alert type="info" showIcon
            message="No courses in this college yet"
            description={<span>Create a course first. <Link href={`${basePath}/courses`}>Go to Courses</Link>.</span>}
            style={{ marginBottom: 12 }} />}
          {createError ? (
            <Alert type="error" showIcon closable message="Lesson was not created" description={createError}
              onClose={() => setCreateError(null)} style={{ marginBottom: 12 }} />
          ) : null}
          <Form form={form} layout="vertical" onFinish={handleCreate} disabled={loading}
            initialValues={{ active: true, enabled: true }}>
            <LessonFields courses={courses} />
            <Form.Item><Button type="primary" htmlType="submit" loading={loading} icon={<PlusOutlined />}
              disabled={!isScoped || coursesLoading || Boolean(coursesError) || courses.length === 0}>
              Create Lesson &amp; Add Another
            </Button></Form.Item>
          </Form>
        </Card>
      </Col>
      <Col xs={24} lg={14}>
        <Card title="Lessons" size="small" extra={<AdminTableToolbar searchValue={search}
          onSearch={(value) => { setSearch(value); setPage(1); setSelectedLessonIds([]); }}
          searchPlaceholder="Search lessons" onRefresh={fetchLessons} loading={tableLoading}
          resultCount={filteredData.length} totalCount={data.length} exportFileName="lessons.csv"
          exportRows={() => filteredData.map((lesson) => ({ id: lesson.id,
            lessonName: lessonNameOf(lesson), courseId: lessonCourseId(lesson) ?? "",
            sequence: lesson.sequence ?? "", active: lesson.active === false ? "no" : "yes",
            enabled: lesson.enabled === false ? "no" : "yes" }))} />}>
          <Space wrap style={{ marginBottom: 12 }}>
            <Select aria-label="Filter lessons by course" placeholder="Choose a course to view its lessons"
              allowClear showSearch optionFilterProp="children" value={selectedCourseId}
              onChange={changeCourse} style={{ width: 210, maxWidth: "100%" }}>
              {courses.map((course) => <Option key={course.id} value={course.id}>
                {course.courseName || course.course_name || course.short_title || `Course ${course.id}`}
              </Option>)}
            </Select>
            <Button size="small" onClick={chooseAll} disabled={showAll || courses.length === 0}>
              View all courses (slower)
            </Button>
            {showAll && <Button size="small" onClick={() => { setShowAll(false); setData([]); }}>Close all-courses view</Button>}
          </Space>
          {showAll && <Alert type="info" showIcon style={{ marginBottom: 12 }}
            message="All-courses view makes one request per course"
            description="Requests run four at a time. Choose one course above for faster access. A dedicated college-wide API is still needed for scalable all-courses browsing." />}
          {tableLoading && hasCurrentLessons ? <RefreshStatus label="Refreshing lessons…" /> : null}
          {reordering ? <RefreshStatus label="Saving lesson order…" /> : null}
          {loadError && <Alert type={partialCount || hasCurrentLessons ? "warning" : "error"} showIcon
            message={partialCount ? `${partialCount} course list(s) did not load`
              : hasCurrentLessons ? "Couldn't refresh lessons" : "Could not load lessons"}
            description={hasCurrentLessons && !partialCount ? "Showing the last lessons loaded for this view." : loadError}
            action={<Button size="small" onClick={fetchLessons}>Retry</Button>}
            style={{ marginBottom: 12 }} />}
          {selectedCourseId && search.trim() && <Alert type="info" showIcon style={{ marginBottom: 12 }}
            message="Reordering is paused while searching"
            description={<span>Changing the order of filtered rows would hide lessons from the sequence. <Button type="link" size="small"
              onClick={() => setSearch("")}>Clear search and reorder all lessons</Button>.</span>} />}
          {selectedCourseId && !search.trim() && !loadError && <Alert type="info" showIcon style={{ marginBottom: 8 }}
            message="Reorder lessons for this course"
            description="Drag a handle, or focus it and use the keyboard to move a lesson. No sequence number editing is required." />}
          {bulkError ? (
            <Alert
              type="warning"
              showIcon
              closable
              message={`${bulkError.label} was only partially completed`}
              description={<div>
                <div>{bulkError.message}</div>
                {bulkError.failures.slice(0, 5).map((failure) => (
                  <div key={failure.lessonId}>
                    {lessonNameOf(data.find((item) => idEq(item.id, failure.lessonId)) || { lessonName: `Lesson ${failure.lessonId}` })}: {failure.reason || "Update failed"}
                  </div>
                ))}
              </div>}
              action={<Button size="small" onClick={() => runBulk(bulkError.changes, bulkError.label, false)}
                disabled={bulkBusy || selectedLessonIds.length === 0}>Retry failed</Button>}
              onClose={() => setBulkError(null)}
              style={{ marginBottom: 12 }}
            />
          ) : null}
          {selectedLessonIds.length > 0 && <div style={{ marginBottom: 12 }}>
            <Typography.Text strong>{selectedLessonIds.length} selected</Typography.Text>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
              Selection clears when the course or search changes. Bulk changes never delete files.
            </Typography.Paragraph>
            <Space wrap>
              <Button size="small" loading={bulkBusy} disabled={Boolean(loadError)}
                onClick={() => confirmBulk({ active: true, enabled: true }, "Show to students")}>Show to students</Button>
              <Button size="small" loading={bulkBusy} disabled={Boolean(loadError)}
                onClick={() => confirmBulk({ active: false, enabled: false }, "Hide from students", true)}>Hide from students</Button>
              <Button size="small" type="link" onClick={() => setSelectedLessonIds([])}>Clear selection</Button>
            </Space>
          </div>}
          {tableLoading && lessonScopeKey && !hasCurrentLessons ? (
            <TableSkeleton rows={8} columns={5} label="Loading lessons" />
          ) : loadError && lessonScopeKey && !hasCurrentLessons && !partialCount ? null : (
            <Table dataSource={filteredData} columns={columns} rowKey="id"
              components={canReorder ? sortable.components : undefined}
              rowSelection={{
                selectedRowKeys: selectedLessonIds, onChange: setSelectedLessonIds,
                // Without this, selecting lessons on one page, then filtering/paging away and
                // back, silently drops the earlier selection — inconsistent with Students.js,
                // which already opts in to preserving selection across paging.
                preserveSelectedRowKeys: true,
              }}
              size="small" scroll={{ x: "max-content" }}
              pagination={canReorder ? false : { current: page, pageSize, showSizeChanger: true,
                pageSizeOptions: PAGE_SIZES, onChange: (nextPage, nextSize) => {
                  setPage(nextSize !== pageSize ? 1 : nextPage); setPageSize(nextSize);
                  try { window.localStorage.setItem(PAGE_SIZE_KEY, String(nextSize)); } catch (_) { /* Optional */ }
                }, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}` }}
              locale={{ emptyText: !selectedCourseId && !showAll ? "Choose a course, or opt in to all-courses view."
                : search.trim() ? "No matching lessons. Clear search to see the course."
                : "No lessons in this course yet. Create one on the left." }} />
          )}
        </Card>
      </Col>
    </Row>
    <Modal title={editingRecord ? `Edit lesson “${lessonNameOf(editingRecord)}”` : "Edit Lesson"}
      open={Boolean(editingRecord)} onOk={handleEditSubmit} onCancel={handleEditCancel}
      maskClosable={false} closable={!editLoading} keyboard={!editLoading}
      confirmLoading={editLoading} okButtonProps={{ disabled: editLoading }} cancelButtonProps={{ disabled: editLoading }}
      okText="Save Changes" cancelText="Cancel" width={520} className="admin-list-page-modal">
      {editError ? (
        <Alert type="error" showIcon closable message="Lesson changes were not saved" description={editError}
          onClose={() => setEditError(null)} style={{ marginBottom: 12 }} />
      ) : null}
      <Form form={editForm} layout="vertical" onFinish={handleEditSubmit} disabled={editLoading}><LessonFields courses={courses} editing /></Form>
    </Modal>
    <Modal title="Delete lesson" open={Boolean(deleteTarget)}
      onCancel={() => { if (!deleteLoading) { setDeleteTarget(null); setDeleteConfirmText(""); } }}
      onOk={handleDelete} okText="Delete lesson and its files" cancelText="Cancel"
      okButtonProps={{ danger: true, loading: deleteLoading,
        disabled: deleteConfirmText.trim() !== lessonNameOf(deleteTarget) }} destroyOnClose>
      <Alert type="warning" showIcon message="Students and teachers lose this lesson straight away"
        description={<>
          <p>Deleting <strong>{lessonNameOf(deleteTarget)}</strong> removes the lesson and all its content from the course, for every student and teacher. Uploaded videos, PDFs and presentations are kept on the server, so it can be restored (ask support).</p>
          <p>Student progress and submissions are kept.</p>
        </>} style={{ marginBottom: 16 }} />
      <p>Type <strong>{lessonNameOf(deleteTarget)}</strong> to confirm:</p>
      <Input value={deleteConfirmText} onChange={(event) => setDeleteConfirmText(event.target.value)}
        placeholder={lessonNameOf(deleteTarget)} aria-label="Type lesson name to confirm permanent file deletion" />
    </Modal>
  </>;
}
