import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Table, Select, Tag, Modal, List, InputNumber, Button, message, Empty, Space, Popconfirm, Pagination, Typography, Grid } from "antd";
import { DownloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { getCoursesByCollege, deleteLessonContent, getClassesByCollege } from "@/api/Services/AdminService";
import { formatWallClock } from "@/utils/dateUtils";
import { getClassesForCourseSyllabus } from "@/api/Services/adminServices/departmentService";
import AdminAssignmentBuilderModal from "@/components/admin/AdminAssignmentBuilderModal";
import SubmissionWork, { gradingLabel } from "@/components/admin/SubmissionWork";
import { exportRowsToCsv } from "@/utils/csvExport";
import {
  listAdminAssignments, getAssignmentSubmissions, updateAssignmentPoints,
  publishAssignmentGrade, publishAllAssignmentGrades,
} from "@/api/Services/AdminAssignmentService";

const SUBMISSIONS_PAGE_SIZE = 20;

function SubmissionsDrawer({ assignment, onClose }) {
  const [submissions, setSubmissions] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const savingRef = useRef(false);
  const requestSeq = useRef(0);
  const maxPoints = Number(assignment.points);
  const hasMax = Number.isFinite(maxPoints) && maxPoints >= 0 && assignment.points != null;
  const validPoints = typeof editValue === "number" && Number.isFinite(editValue) && editValue >= 0 && (!hasMax || editValue <= maxPoints);

  const load = useCallback(() => {
    const requestId = ++requestSeq.current;
    setLoading(true);
    setLoadError(null);
    // Never render a prior page's students as if they belong to a newly requested page.
    setSubmissions([]);
    setTotal(0);
    getAssignmentSubmissions(assignment.id, page - 1, SUBMISSIONS_PAGE_SIZE)
      .then((res) => {
        if (requestId !== requestSeq.current) return;
        const data = res?.data?.data ?? res?.data;
        const rows = Array.isArray(data) ? data : data?.content;
        if (!Array.isArray(rows)) throw new Error("Unexpected submissions response. Please retry.");
        setSubmissions(rows);
        setTotal(Array.isArray(data) ? data.length : (data?.totalElements ?? 0));
      })
      .catch((error) => {
        if (requestId !== requestSeq.current) return;
        setSubmissions([]);
        setTotal(0);
        setLoadError(error?.response?.data?.message || error?.message || "Could not load submissions.");
      })
      .finally(() => { if (requestId === requestSeq.current) setLoading(false); });
  }, [assignment.id, page]);

  useEffect(() => {
    load();
    return () => { ++requestSeq.current; };
  }, [load]);

  const persistPoints = async (studentAssignmentId, publish) => {
    if (!validPoints || savingRef.current) return;
    savingRef.current = true;
    setSavingId(studentAssignmentId);
    try {
      await updateAssignmentPoints(studentAssignmentId, editValue);
      if (publish) {
        try {
          await publishAssignmentGrade(studentAssignmentId);
          message.success("Grade saved and published to the student.");
        } catch (publishError) {
          message.error(`Points were saved privately, but publishing failed: ${publishError?.response?.data?.message || publishError?.message || "Please retry"}.`);
          load();
          return;
        }
      } else {
        message.success("Points saved privately; the student cannot see the grade until it is published.");
      }
      setEditingId(null);
      load();
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to save points. Please retry.");
    } finally { savingRef.current = false; setSavingId(null); }
  };

  return (
    <Modal open onCancel={() => { if (!savingId) onClose(); }} footer={null}
      title={assignment.title || `Assignment #${assignment.id}`} width={760}>
      <Typography.Paragraph type="secondary">
        Grades remain private when you save points. Publishing makes the grade visible to the student.
      </Typography.Paragraph>
      {loadError && <Alert type="error" showIcon message="Unable to load submissions" description={loadError}
        action={<Button size="small" onClick={load}>Retry</Button>} style={{ marginBottom: 12 }} />}
      {loading ? (
        <div style={{ textAlign: "center", padding: 24 }}>Loading submissions…</div>
      ) : loadError ? null : submissions.length === 0 ? (
        <Empty description="No submissions yet" />
      ) : (
        <>
          <List dataSource={submissions} rowKey={(s) => s.id} renderItem={(s) => {
            const name = [s.studentFirstName, s.studentLastName].filter(Boolean).join(" ") || `Student ${s.studentId}`;
            const isEditing = editingId === s.id;
            // Jackson serialises the entity's boolean isGradePublished as "gradePublished", so reading
            // isGradePublished alone showed every published grade as "Graded, not published".
            const published = Boolean(s.gradePublished ?? s.isGradePublished);
            const overMax = isEditing && typeof editValue === "number" && hasMax && editValue > maxPoints;
            return (
              <List.Item actions={[
                isEditing ? (
                  <Space key="edit-grade" wrap size="small">
                    {/* No max: antd holds an out-of-range number back from onChange until blur, so typing
                        11 of 10 left the previous value live behind the enabled Save buttons. */}
                    <InputNumber size="small" min={0} status={overMax ? "error" : undefined}
                      step={1} style={{ width: 112 }} value={editValue} onChange={setEditValue}
                      aria-label={`Points for ${name}`} placeholder="Points" />
                    <Typography.Text type={overMax ? "danger" : "secondary"}>
                      {overMax ? `Max is ${maxPoints}` : `of ${hasMax ? maxPoints : "—"}`}
                    </Typography.Text>
                    <Button size="small" loading={savingId === s.id} disabled={!validPoints || savingId != null}
                      title={published ? "Saving without publishing takes the current grade away from the student until you publish again." : undefined}
                      onClick={() => persistPoints(s.id, false)}>{published ? "Save & hide from student" : "Save privately"}</Button>
                    <Popconfirm title={`Publish ${editValue} points for ${name}?`}
                      description="This makes the grade visible to the student."
                      okText="Save and publish" cancelText="Cancel"
                      onConfirm={() => persistPoints(s.id, true)} disabled={!validPoints || savingId != null}>
                      <Button size="small" type="primary" loading={savingId === s.id}
                        disabled={!validPoints || savingId != null}>Save & publish</Button>
                    </Popconfirm>
                    <Button size="small" disabled={savingId != null} onClick={() => setEditingId(null)}>Cancel</Button>
                  </Space>
                ) : (
                  <Button key="grade" size="small" disabled={savingId != null}
                    onClick={() => { setEditingId(s.id); setEditValue(s.pointsObtained == null ? null : Number(s.pointsObtained)); }}>
                    {published ? "Edit grade" : "Grade"}
                  </Button>
                ),
              ]}>
                <List.Item.Meta title={name} description={<>
                  <Tag color={published ? "green" : s.gradingStatus === "NOT_GRADED" ? "default" : "gold"}>
                    {published ? `Published: ${s.pointsObtained ?? 0}/${assignment.points ?? "—"}` : gradingLabel(s.gradingStatus)}
                  </Tag>
                  <SubmissionWork submission={s} assignment={assignment} />
                </>} />
              </List.Item>
            );
          }} />
          {total > SUBMISSIONS_PAGE_SIZE && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <Pagination current={page} pageSize={SUBMISSIONS_PAGE_SIZE} total={total}
                showSizeChanger={false} onChange={(next) => { setEditingId(null); setPage(next); }} />
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

export default function Assignments({ collegeId = null }) {
  const screens = Grid.useBreakpoint();
  const isCollegeScoped = collegeId != null && Number.isSafeInteger(Number(collegeId)) && Number(collegeId) > 0;
  const [courseOptions, setCourseOptions] = useState([]);
  const [courseOptionsLoading, setCourseOptionsLoading] = useState(false);
  const [courseOptionsError, setCourseOptionsError] = useState(null);
  const [courseRetryKey, setCourseRetryKey] = useState(0);
  const [classOptions, setClassOptions] = useState([]);
  const [classOptionsLoading, setClassOptionsLoading] = useState(false);
  const [classOptionsError, setClassOptionsError] = useState(null);
  const [classRetryKey, setClassRetryKey] = useState(0);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState(null);
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [publishingAllId, setPublishingAllId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const assignmentActionRef = useRef(false);
  const fetchToken = useRef(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    if (!isCollegeScoped) {
      setCourseOptions([]);
      setCourseOptionsError(null);
      setCourseOptionsLoading(false);
      return;
    }
    let cancelled = false;
    setCourseOptionsLoading(true);
    setCourseOptionsError(null);
    getCoursesByCollege(collegeId)
      .then((res) => {
        if (cancelled) return;
        const courses = res?.data?.data ?? res?.data ?? [];
        if (!Array.isArray(courses)) throw new Error("Unexpected courses response");
        setCourseOptions(courses.map((course) => ({
          value: course.id, label: course.course_name || course.courseName || `Course ${course.id}`,
        })));
        setCourseOptionsError(null);
      })
      .catch((error) => {
        if (!cancelled) {
          setCourseOptions([]);
          setCourseOptionsError(error?.response?.data?.message || error?.message || "Could not load courses");
        }
      })
      .finally(() => { if (!cancelled) setCourseOptionsLoading(false); });
    return () => { cancelled = true; };
  }, [isCollegeScoped, collegeId, courseRetryKey]);

  useEffect(() => {
    setClassOptionsError(null);
    if (!selectedCourseId) {
      setClassOptions([]);
      setSelectedClassId(null);
      setClassOptionsLoading(false);
      return;
    }
    let cancelled = false;
    setClassOptions([]);
    setSelectedClassId(null);
    setClassOptionsLoading(true);
    getClassesForCourseSyllabus({ courseId: selectedCourseId })
      .then((classes) => {
        if (cancelled) return;
        const options = Object.entries(classes && typeof classes === "object" ? classes : {})
          .filter(([id]) => id !== "undefined" && Number(id) > 0)
          .map(([id, name]) => ({ value: Number(id), label: name || `Section ${id}` }))
          .sort((a, b) => a.label.localeCompare(b.label));
        setClassOptions(options);
        setClassOptionsError(null);
      })
      .catch((error) => {
        if (!cancelled) {
          setClassOptions([]);
          setClassOptionsError(error?.response?.data?.message || error?.message || "Could not load eligible sections");
        }
      })
      .finally(() => { if (!cancelled) setClassOptionsLoading(false); });
    return () => { cancelled = true; };
  }, [selectedCourseId, classRetryKey]);

  const [classNames, setClassNames] = useState({});
  useEffect(() => {
    if (!isCollegeScoped) { setClassNames({}); return; }
    let cancelled = false;
    getClassesByCollege(collegeId)
      .then((res) => {
        if (cancelled) return;
        const rows = res?.data?.data ?? res?.data ?? [];
        setClassNames(Object.fromEntries((Array.isArray(rows) ? rows : []).map((c) => [Number(c.id), c.name || c.className || c.class_name])));
      })
      .catch(() => { if (!cancelled) setClassNames({}); });
    return () => { cancelled = true; };
  }, [isCollegeScoped, collegeId]);

  const fetchAssignments = useCallback(() => {
    const token = ++fetchToken.current;
    if (!isCollegeScoped) { setAssignments([]); setLoading(false); setListError(null); return; }
    setLoading(true);
    setListError(null);
    listAdminAssignments(collegeId, selectedCourseId, selectedClassId, page - 1, PAGE_SIZE)
      .then((res) => {
        if (token !== fetchToken.current) return;
        const data = res?.data?.data ?? res?.data;
        setAssignments(Array.isArray(data?.content) ? data.content : []);
        setTotal(data?.totalElements ?? 0);
      })
      .catch((error) => {
        if (token !== fetchToken.current) return;
        setListError(error?.response?.data?.message || "Could not load assignments.");
        setAssignments([]);
        setTotal(0);
      })
      .finally(() => { if (token === fetchToken.current) setLoading(false); });
  }, [isCollegeScoped, collegeId, selectedCourseId, selectedClassId, page]);

  useEffect(() => {
    fetchAssignments();
    return () => { ++fetchToken.current; };
  }, [fetchAssignments]);

  const courseLabel = (courseId) => courseOptions.find((c) => c.value === courseId)?.label || `Course ${courseId}`;
  const scopeLabel = (classId) => {
    if (!classId || classId < 1) return "All eligible sections";
    return classOptions.find((c) => c.value === classId)?.label || classNames[classId] || `Section ${classId}`;
  };

  const handlePublishAll = async (record) => {
    if (assignmentActionRef.current) return;
    assignmentActionRef.current = true;
    setPublishingAllId(record.id);
    try {
      const res = await publishAllAssignmentGrades(record.id);
      const result = res?.data?.data ?? res?.data ?? {};
      const parts = [`${result.published ?? 0} published`];
      if (result.skippedUngraded) parts.push(`${result.skippedUngraded} not yet marked`);
      if (result.alreadyPublished) parts.push(`${result.alreadyPublished} already published`);
      if (result.failed?.length) {
        Modal.warning({ title: `${result.failed.length} failed`, content: result.failed.map((failed) => (
          <div key={failed.studentAssignmentId}>Student #{failed.studentId}: {failed.reason}</div>
        )) });
      } else message.success(parts.join(" · "));
      fetchAssignments();
    } catch (error) {
      message.error(error?.response?.data?.message || "Could not publish grades");
    } finally { assignmentActionRef.current = false; setPublishingAllId(null); }
  };

  const handleDelete = async (id) => {
    if (assignmentActionRef.current) return;
    assignmentActionRef.current = true;
    setDeletingId(id);
    try {
      await deleteLessonContent(id);
      message.success("Assignment deleted");
      fetchAssignments();
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to delete assignment");
    } finally { assignmentActionRef.current = false; setDeletingId(null); }
  };

  const handleExport = () => {
    exportRowsToCsv(`assignments-college-${collegeId}-page-${page}.csv`, [
      { label: "Title", key: "title" }, { label: "Course", key: "courseLabel" }, { label: "Scope", key: "scopeLabel" },
      { label: "Points", key: "points" }, { label: "Deadline", key: "deadline" },
      { label: "Submitted", key: "totalSubmitted" }, { label: "Total students", key: "totalStudents" },
      { label: "Graded", key: "totalGraded" },
    ], assignments.map((a) => ({
      title: a.title || "Untitled", courseLabel: courseLabel(a.courseId), scopeLabel: scopeLabel(a.classId), points: a.points,
      deadline: formatWallClock(a.deadline, "YYYY-MM-DD HH:mm", ""),
      totalSubmitted: a.stats?.totalSubmitted ?? "", totalStudents: a.stats?.totalStudents ?? "",
      totalGraded: a.stats?.totalGraded ?? "",
    })));
  };

  const columns = [
    { title: "Title", dataIndex: "title", key: "title", render: (v) => v || "Untitled" },
    { title: "Course", dataIndex: "courseId", key: "courseId", render: (v) => courseLabel(v) },
    { title: "Scope", dataIndex: "classId", key: "classId", render: (v) => <Tag color={v && v > 0 ? "purple" : "default"}>{scopeLabel(v)}</Tag> },
    { title: "Points", dataIndex: "points", key: "points" },
    { title: "Deadline", dataIndex: "deadline", key: "deadline", render: (v) => formatWallClock(v) },
    {
      title: "Submissions", key: "stats",
      render: (_, record) => {
        const stats = record.stats;
        if (!stats) return <Tag>Unavailable</Tag>;
        return <span>
          <Tag color="blue">{stats.totalSubmitted}/{stats.totalStudents} submitted</Tag>
          <Tag color={stats.notGraded > 0 ? "gold" : "green"}>{stats.totalGraded} graded</Tag>
        </span>;
      },
    },
    {
      title: "Actions", key: "actions", fixed: screens.md ? "right" : undefined,
      render: (_, record) => (
        <Space size="small">
          <Button size="small" onClick={() => setActiveAssignment(record)}>Submissions</Button>
          <Popconfirm title="Publish all graded submissions?"
            description="Every submission you have already marked becomes visible to its student. Submissions still unmarked are left alone."
            okText="Publish" onConfirm={() => handlePublishAll(record)} disabled={record.stats?.totalGraded === 0}>
            <Button size="small" loading={publishingAllId === record.id}
              title={record.stats?.totalGraded === 0 ? "Nothing graded yet" : undefined}
              disabled={record.stats?.totalGraded === 0 || (publishingAllId != null && publishingAllId !== record.id)}>Publish grades</Button>
          </Popconfirm>
          <Button size="small" icon={<EditOutlined />} aria-label={`Edit assignment ${record.title || record.id}`}
            onClick={() => { setEditingAssignment(record); setBuilderOpen(true); }}>Edit</Button>
          <Popconfirm title="Delete this assignment?"
            description={record.stats?.totalSubmitted > 0 ? `${record.stats.totalSubmitted} student(s) have already submitted to this assignment.` : undefined}
            okButtonProps={{ danger: true }} onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} aria-label={`Delete assignment ${record.title || record.id}`} loading={deletingId === record.id} disabled={(deletingId != null && deletingId !== record.id) || publishingAllId != null}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="ln-module admin-list-page">
      <h1 className="admin-list-page__title">Assignments</h1>
      {!isCollegeScoped ? (
        <Alert type="warning" showIcon message="Select a College to view assignments" />
      ) : (
        <>
          {courseOptionsError && (
            <Alert type="warning" showIcon message="Course list unavailable" description={courseOptionsError}
              action={<Button size="small" onClick={() => setCourseRetryKey((value) => value + 1)}>Retry courses</Button>}
              style={{ marginBottom: 12 }} />
          )}
          {classOptionsError && selectedCourseId && (
            <Alert type="warning" showIcon message="Section list unavailable" description={classOptionsError}
              action={<Button size="small" onClick={() => setClassRetryKey((value) => value + 1)}>Retry sections</Button>}
              style={{ marginBottom: 12 }} />
          )}
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            {/* The two filters sit together; space-between used to float the scope filter mid-row. */}
            <Space wrap>
            <Select allowClear placeholder={courseOptionsError ? "Courses unavailable" : "All courses"} style={{ width: 260, maxWidth: "100%" }} options={courseOptions}
              loading={courseOptionsLoading} disabled={Boolean(courseOptionsError)}
              value={selectedCourseId} onChange={(v) => { setSelectedCourseId(v); setSelectedClassId(null); setPage(1); }}
              showSearch filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())} />
            <Select allowClear placeholder={classOptionsError ? "Sections unavailable" : "All scopes"} style={{ width: 220, maxWidth: "100%" }}
              options={[{ value: 0, label: "All eligible sections" }, ...classOptions]}
              loading={classOptionsLoading}
              value={selectedClassId} disabled={!selectedCourseId || classOptionsLoading || Boolean(classOptionsError)}
              onChange={(v) => { setSelectedClassId(v); setPage(1); }}
              showSearch filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())} />
            </Space>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} disabled={Boolean(courseOptionsError) || courseOptionsLoading}
                onClick={() => { setEditingAssignment(null); setBuilderOpen(true); }}>Create Assignment</Button>
              <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={assignments.length === 0}>Export CSV (page)</Button>
            </Space>
          </div>
          {listError && <Alert type="error" showIcon message="Assignments could not be loaded" description={listError}
            action={<Button size="small" onClick={fetchAssignments}>Retry</Button>} style={{ marginBottom: 12 }} />}
          <Table rowKey="id" columns={columns} dataSource={assignments} loading={loading} size="small"
            pagination={{ current: page, pageSize: PAGE_SIZE, total, onChange: setPage, showSizeChanger: false }}
            scroll={{ x: "max-content" }} locale={{ emptyText: listError ? "Could not load assignments; use Retry above." : "No assignments found for this college" }} />
          {/* Refetch on close: grading inside the modal changes this row's graded count. */}
          {activeAssignment && <SubmissionsDrawer assignment={activeAssignment} onClose={() => { setActiveAssignment(null); fetchAssignments(); }} />}
          <AdminAssignmentBuilderModal open={builderOpen} onClose={() => setBuilderOpen(false)}
            onSaved={() => { setBuilderOpen(false); fetchAssignments(); }} collegeId={collegeId}
            courseOptions={courseOptions} assignment={editingAssignment} />
        </>
      )}
    </div>
  );
}
