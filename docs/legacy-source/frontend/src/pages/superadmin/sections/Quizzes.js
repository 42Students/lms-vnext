import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Table, Select, Tag, Modal, List, Button, message, Empty, Popconfirm, Divider, Typography, Space, Grid } from "antd";
import { PlusOutlined, DownloadOutlined } from "@ant-design/icons";
import { getCoursesByCollege, getLessonsByCourse, getClassesByCollege } from "@/api/Services/AdminService";
import { exportRowsToCsv } from "@/utils/csvExport";
import { formatWallClock, wallClockToDayjs, isPastDeadline } from "@/utils/dateUtils";
import { formatTimestamp, parseServerTimestamp } from "@/components/admin/projects/adminProjectUtils";

// submittedAt is the server clock (UTC); dueAt is the author's India wall-clock.
const submittedLate = (attempt, dueAt) => {
  const due = wallClockToDayjs(dueAt);
  const at = parseServerTimestamp(attempt?.submittedAt);
  return Boolean(due && at && !Number.isNaN(at.date.getTime()) && at.date.getTime() > due.valueOf());
};
import { listAdminQuizzesV2, deleteQuizV2, publishQuizV2, getQuizSubmissionsV2, publishQuizGradesV2, unpublishQuizGradesV2 } from "@/api/Services/quizServices";
import QuizBuilderModal from "@/components/Quiz/QuizBuilderModal";
import { ListSkeleton, RefreshStatus, TableSkeleton } from "@/components/Common/Skeletons";

function SubmissionsModal({ quiz, onClose }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    getQuizSubmissionsV2(quiz.id)
      .then((res) => {
        if (cancelled) return;
        const data = res?.data ?? res;
        if (!Array.isArray(data)) throw new Error("Unexpected submissions response. Please retry.");
        setSubmissions(data);
      })
      .catch((error) => {
        if (cancelled) return;
        setSubmissions([]);
        setLoadError(error?.response?.data?.message || error?.message || "Failed to load submissions");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [quiz.id, retryKey]);

  return (
    <Modal open onCancel={onClose} footer={null} title={quiz.title || `Quiz #${quiz.id}`} width={640}>
      {loadError ? (
        <Alert
          type="error"
          showIcon
          message="Unable to load submissions"
          description={loadError}
          action={<Button size="small" onClick={() => setRetryKey((value) => value + 1)}>Retry</Button>}
          style={{ marginBottom: 12 }}
        />
      ) : null}
      {loading ? (
        <ListSkeleton rows={6} avatar={false} label="Loading quiz submissions" />
      ) : loadError ? null : submissions.length === 0 ? (
        <Empty description="No submissions yet" />
      ) : (
        <List
          dataSource={submissions}
          rowKey={(s) => s.id}
          renderItem={(s) => (
            <List.Item>
              <List.Item.Meta
                title={s.learnerName || `Learner ${s.learnerId}`}
                description={<Space wrap size={[8, 2]}>
                  {s.learnerRollNumber || s.learnerMobile ? <span>{s.learnerRollNumber || s.learnerMobile}</span> : null}
                  {s.submittedAt ? <span>Submitted {formatTimestamp(s.submittedAt)}</span> : null}
                  {s.attemptNumber > 1 ? <Tag>Attempt {s.attemptNumber}</Tag> : null}
                  {submittedLate(s, quiz.dueAt) ? <Tag color="orange">Late</Tag> : null}
                </Space>}
              />
              <Tag color="blue">{s.score ?? 0}/{s.maxScore ?? quiz.totalPoints ?? "—"}</Tag>
            </List.Item>
          )}
        />
      )}
    </Modal>
  );
}

export default function Quizzes({ collegeId = null }) {
  const isCollegeScoped = collegeId != null && Number.isSafeInteger(Number(collegeId)) && Number(collegeId) > 0;

  const [courseOptions, setCourseOptions] = useState([]);
  // Section names for the Audience column, which used to print "Class 123".
  const [classNames, setClassNames] = useState({});
  const [lessonOptions, setLessonOptions] = useState([]);
  const [courseOptionsLoading, setCourseOptionsLoading] = useState(false);
  const [courseOptionsError, setCourseOptionsError] = useState("");
  const [lessonOptionsLoading, setLessonOptionsLoading] = useState(false);
  const [lessonOptionsError, setLessonOptionsError] = useState("");
  const [metadataRetryKey, setMetadataRetryKey] = useState(0);
  const [filterCourseId, setFilterCourseId] = useState(null);
  const [createCourseId, setCreateCourseId] = useState(null);
  const [createLesson, setCreateLesson] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState(null);
  const [errorScopeKey, setErrorScopeKey] = useState(null);
  const [loadedScopeKey, setLoadedScopeKey] = useState(null);
  const loadedScopeRef = useRef(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [editingMetadataOnly, setEditingMetadataOnly] = useState(false);
  const [viewingSubmissionsFor, setViewingSubmissionsFor] = useState(null);
  const [pendingActions, setPendingActions] = useState({});
  const [editCheckBusyId, setEditCheckBusyId] = useState(null);
  const editCheckRef = useRef(false);
  const [mutationError, setMutationError] = useState(null);
  const mutationLocksRef = useRef(new Set());
  const requestSeqRef = useRef(0);
  // Track the active scope synchronously so pending edit dialogs cannot reopen after a switch.
  const activeCollegeRef = useRef(collegeId);
  activeCollegeRef.current = collegeId;
  const PAGE_SIZE = 20;
  const quizScopeKey = isCollegeScoped
    ? JSON.stringify([Number(collegeId), filterCourseId ?? null, page])
    : null;
  const hasCurrentQuizzes = quizScopeKey != null && loadedScopeKey === quizScopeKey;
  const currentListError = errorScopeKey === quizScopeKey ? listError : null;

  // A selected course, lesson or filter from college A must never survive switching to B.
  useEffect(() => {
    // Invalidate in-flight list responses and discard all previous-college UI context.
    requestSeqRef.current += 1;
    setFilterCourseId(null);
    setCreateCourseId(null);
    setCreateLesson(null);
    setCourseOptions([]);
    setLessonOptions([]);
    setCourseOptionsError("");
    setLessonOptionsError("");
    setCourseOptionsLoading(false);
    setLessonOptionsLoading(false);
    setQuizzes([]);
    setTotal(0);
    setLoading(false);
    setListError(null);
    setErrorScopeKey(null);
    setLoadedScopeKey(null);
    loadedScopeRef.current = null;
    setBuilderOpen(false);
    setEditingQuizId(null);
    setEditingMetadataOnly(false);
    setViewingSubmissionsFor(null);
    setMutationError(null);
    setPendingActions({});
    setPage(1);
  }, [collegeId]);

  useEffect(() => {
    if (!isCollegeScoped) {
      setCourseOptions([]);
      setCourseOptionsError("");
      setCourseOptionsLoading(false);
      setFilterCourseId(null);
      setCreateCourseId(null);
      setCreateLesson(null);
      return;
    }
    let cancelled = false;
    setCourseOptionsError("");
    setCourseOptionsLoading(true);
    getClassesByCollege(collegeId)
      .then((res) => {
        if (cancelled) return;
        const rows = res?.data?.data ?? res?.data ?? [];
        setClassNames(Object.fromEntries((Array.isArray(rows) ? rows : []).map((c) => [Number(c.id), c.name || c.className || c.class_name])));
      })
      .catch(() => { if (!cancelled) setClassNames({}); });
    getCoursesByCollege(collegeId)
      .then((res) => {
        if (cancelled) return;
        const courses = res?.data?.data ?? res?.data;
        if (!Array.isArray(courses)) throw new Error("Unexpected courses response");
        setCourseOptions(courses.map((c) => ({ value: c.id, label: c.course_name || c.courseName || `Course ${c.id}` })));
      })
      .catch((error) => {
        if (cancelled) return;
        setCourseOptionsError(error?.response?.data?.message || error?.message || "Could not load course options.");
      })
      .finally(() => { if (!cancelled) setCourseOptionsLoading(false); });
    return () => { cancelled = true; };
  }, [isCollegeScoped, collegeId, metadataRetryKey]);

  useEffect(() => {
    // Course changes are a new scope: old lessons must not survive.
    setLessonOptions([]);
    setCreateLesson(null);
    setLessonOptionsError("");
    setLessonOptionsLoading(false);
    if (!createCourseId) return undefined;
    let cancelled = false;
    setLessonOptionsLoading(true);
    getLessonsByCourse(createCourseId)
      .then((res) => {
        if (cancelled) return;
        const lessons = res?.data?.data ?? res?.data;
        if (!Array.isArray(lessons)) throw new Error("Unexpected lessons response");
        setLessonOptions(lessons.map((l) => ({ value: l.id, label: l.lesson_name || l.lessonName || `Lesson ${l.id}` })));
      })
      .catch((error) => {
        if (cancelled) return;
        setLessonOptionsError(error?.response?.data?.message || error?.message || "Could not load lessons for this course.");
      })
      .finally(() => { if (!cancelled) setLessonOptionsLoading(false); });
    return () => { cancelled = true; };
  }, [createCourseId, metadataRetryKey]);

  const fetchQuizzes = useCallback(() => {
    const requestId = ++requestSeqRef.current;
    const requestScopeKey = quizScopeKey;
    if (!isCollegeScoped || !requestScopeKey) {
      setQuizzes([]);
      setTotal(0);
      setListError(null);
      setErrorScopeKey(null);
      setLoadedScopeKey(null);
      loadedScopeRef.current = null;
      setLoading(false);
      return;
    }
    const sameScope = loadedScopeRef.current === requestScopeKey;
    setLoading(true);
    setListError(null);
    setErrorScopeKey(null);
    if (!sameScope) {
      setQuizzes([]);
      setTotal(0);
    }
    listAdminQuizzesV2({ collegeId, courseId: filterCourseId, page: page - 1, size: PAGE_SIZE })
      .then((res) => {
        if (requestId !== requestSeqRef.current) return;
        const data = res?.data ?? res;
        if (!Array.isArray(data?.content)) throw new Error("Unexpected quizzes response. Please retry.");
        setQuizzes(data.content);
        setTotal(data?.totalElements ?? 0);
        loadedScopeRef.current = requestScopeKey;
        setLoadedScopeKey(requestScopeKey);
      })
      .catch((error) => {
        if (requestId !== requestSeqRef.current) return;
        if (!sameScope) {
          setQuizzes([]);
          setTotal(0);
        }
        setListError(error?.response?.data?.message || error?.message || "Failed to load quizzes");
        setErrorScopeKey(requestScopeKey);
      })
      .finally(() => {
        if (requestId === requestSeqRef.current) setLoading(false);
      });
  }, [isCollegeScoped, collegeId, filterCourseId, page, quizScopeKey]);

  useEffect(() => { fetchQuizzes(); }, [fetchQuizzes]);

  const courseLabel = (courseId) => courseOptions.find((c) => c.value === courseId)?.label || `Course ${courseId}`;

  // Only the currently-loaded page — the list is server-paginated, exporting "all" would need a
  // separate uncapped backend fetch this page doesn't otherwise need.
  const handleExport = () => {
    exportRowsToCsv(
      `quizzes-college-${collegeId}-page-${page}.csv`,
      [
        { label: "Title", key: "title" },
        { label: "Course", key: "courseLabel" },
        { label: "Status", key: "status" },
        { label: "Points", key: "totalPoints" },
        { label: "Due", key: "dueAt" },
      ],
      quizzes.map((q) => ({
        title: q.title || "Untitled quiz",
        courseLabel: courseLabel(q.courseId),
        status: q.status || "DRAFT",
        totalPoints: q.totalPoints,
        dueAt: formatWallClock(q.dueAt, "YYYY-MM-DD HH:mm", ""),
      })),
    );
  };

  const runQuizMutation = async ({ key, kind, record, run, successMessage, rejectOnFailure = false }) => {
    if (mutationLocksRef.current.has(key)) return false;
    mutationLocksRef.current.add(key);
    const actionCollegeId = activeCollegeRef.current;
    setPendingActions((prev) => ({ ...prev, [key]: true }));
    setMutationError(null);
    try {
      await run();
      if (activeCollegeRef.current === actionCollegeId) {
        message.success(successMessage);
        fetchQuizzes();
      }
      return true;
    } catch (err) {
      if (activeCollegeRef.current === actionCollegeId) {
        setMutationError({
          kind,
          recordId: record.id,
          gradePublished: !!record.gradePublished,
          message: err?.response?.data?.message || err?.message || "The action could not be completed.",
        });
      }
      if (rejectOnFailure) throw err;
      return false;
    } finally {
      mutationLocksRef.current.delete(key);
      setPendingActions((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handlePublish = (record) => runQuizMutation({
    key: `publish:${record.id}`,
    kind: "publish",
    record,
    run: () => publishQuizV2(record.id),
    successMessage: "Quiz published",
  });

  // Part B "Quizzes: release or withhold results" -- distinct from the quiz's own
  // draft/published status above: this is whether a learner who already submitted can see their
  // score/correct-answers. The backend endpoints existed with no caller anywhere.
  const handleToggleGradePublish = (record) => runQuizMutation({
    key: `grades:${record.id}`,
    kind: "grades",
    record,
    run: () => record.gradePublished ? unpublishQuizGradesV2(record.id) : publishQuizGradesV2(record.id),
    successMessage: record.gradePublished ? "Results withheld from learners" : "Results released to learners",
  });

  const handleDelete = (record, rejectOnFailure = true) => runQuizMutation({
    key: `delete:${record.id}`,
    kind: "delete",
    record,
    run: () => deleteQuizV2(record.id),
    successMessage: "Quiz deleted",
    rejectOnFailure,
  });

  const retryQuizMutation = () => {
    if (!mutationError) return;
    const record = quizzes.find((item) => Number(item.id) === Number(mutationError.recordId));
    if (!record) {
      setMutationError(null);
      return;
    }
    if (mutationError.kind === "publish") handlePublish(record);
    else if (mutationError.kind === "grades") {
      handleToggleGradePublish({ ...record, gradePublished: mutationError.gradePublished });
    } else if (mutationError.kind === "delete") {
      handleDelete(record, false);
    }
  };

  const isQuizMutationPending = (quizId) =>
    Object.entries(pendingActions).some(([key, pending]) => pending && key.endsWith(`:${quizId}`));

  // Backend now permits metadata edits after attempts and rejects question changes with 409. The
  // admin page should describe that current contract instead of warning about a destructive edit
  // path that no longer exists.
  const openEditor = (quizId, metadataOnly = false) => {
    setEditingQuizId(quizId);
    setEditingMetadataOnly(metadataOnly);
    setBuilderOpen(true);
  };
  const handleEditClick = async (record) => {
    if (editCheckRef.current || isQuizMutationPending(record.id)) return;
    editCheckRef.current = true;
    setEditCheckBusyId(record.id);
    const editCollegeId = collegeId;
    try {
      const res = await getQuizSubmissionsV2(record.id);
      if (activeCollegeRef.current !== editCollegeId) return;
      const data = res?.data ?? res;
      const count = Array.isArray(data) ? data.length : 0;
      if (count > 0) {
        Modal.confirm({
          title: "This quiz already has learner submissions",
          content: `Questions, deadline, attempt limit and randomization are locked after ${count} submitted attempt${count === 1 ? "" : "s"}. You can still correct the title or description.`,
          okText: "Edit metadata",
          cancelText: "Cancel",
          onOk: () => { if (activeCollegeRef.current === editCollegeId) openEditor(record.id, true); },
        });
      } else {
        openEditor(record.id);
      }
    } catch {
      if (activeCollegeRef.current !== editCollegeId) return;
      // Unknown attempt count is not evidence that replacing questions is safe.
      // Keep legitimate metadata edits available but never submit a destructive question rewrite.
      message.warning("Could not verify submissions. Only title/description editing is available right now.");
      openEditor(record.id, true);
    } finally {
      editCheckRef.current = false;
      setEditCheckBusyId((current) => current === record.id ? null : current);
    }
  };

  const screens = Grid.useBreakpoint();
  const columns = [
    { title: "Title", dataIndex: "title", key: "title", render: (v) => v || "Untitled quiz" },
    { title: "Course", dataIndex: "courseId", key: "courseId", render: (v) => courseLabel(v) },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v) => <Tag color={v === "PUBLISHED" ? "green" : "default"}>{v === "PUBLISHED" ? "Published" : "Draft"}</Tag>,
    },
    {
      title: "Results",
      dataIndex: "gradePublished",
      key: "gradePublished",
      render: (v) => <Tag color={v ? "green" : "orange"}>{v ? "Released" : "Withheld"}</Tag>,
    },
    {
      title: "Audience",
      dataIndex: "classId",
      key: "classId",
      render: (value) => (
        <Tag color={value && value > 0 ? "purple" : "default"}>
          {value && value > 0 ? `One section · ${classNames[Number(value)] || `Class ${value}`}` : "All sections taking this course"}
        </Tag>
      ),
    },
    { title: "Points", dataIndex: "totalPoints", key: "totalPoints" },
    {
      title: "Due",
      dataIndex: "dueAt",
      key: "dueAt",
      render: (v) => formatWallClock(v),
    },
    {
      title: "Actions",
      key: "actions",
      // Pinned from tablet width up: the buttons sat past the right edge of a wide table. On a
      // phone a pinned column would take most of the screen, so it scrolls with the rest there.
      fixed: screens.md ? "right" : undefined,
      render: (_, record) => {
        const rowBusy = isQuizMutationPending(record.id) || editCheckBusyId === record.id;
        const releaseBlocked = !record.gradePublished && !isPastDeadline(record.dueAt);
        const publishKey = `publish:${record.id}`;
        const gradesKey = `grades:${record.id}`;
        const deleteKey = `delete:${record.id}`;
        return (
          <span style={{ display: "flex", gap: 8 }}>
            <Button size="small" onClick={() => handleEditClick(record)} disabled={rowBusy}>Edit</Button>
            {record.status !== "PUBLISHED" && (
              <Button
                size="small"
                onClick={() => handlePublish(record)}
                loading={!!pendingActions[publishKey]}
                disabled={rowBusy && !pendingActions[publishKey]}
              >
                Publish
              </Button>
            )}
            <Button size="small" onClick={() => setViewingSubmissionsFor(record)} disabled={rowBusy}>Submissions</Button>
            <Button
              size="small"
              onClick={() => handleToggleGradePublish(record)}
              loading={!!pendingActions[gradesKey]}
              disabled={(rowBusy && !pendingActions[gradesKey]) || releaseBlocked}
              title={releaseBlocked ? "Results can be released after the quiz deadline" : undefined}
            >
              {record.gradePublished ? "Withhold results" : releaseBlocked ? "Release after deadline" : "Release results"}
            </Button>
            <Popconfirm
              title="Delete this quiz?"
              description="Learners will no longer be able to access this quiz. This action cannot be undone from this screen."
              okButtonProps={{ danger: true, loading: !!pendingActions[deleteKey] }}
              onConfirm={() => handleDelete(record)}
              disabled={rowBusy && !pendingActions[deleteKey]}
            >
              <Button size="small" danger loading={!!pendingActions[deleteKey]}
                disabled={rowBusy && !pendingActions[deleteKey]}>Delete</Button>
            </Popconfirm>
          </span>
        );
      },
    },
  ];

  return (
    <div className="ln-module admin-list-page">
      <h1 className="admin-list-page__title">Quizzes</h1>
      {!isCollegeScoped ? (
        <Alert type="warning" showIcon message="Select a College to manage quizzes" />
      ) : (
        <>
          {(courseOptionsError || lessonOptionsError) ? (
            <Alert
              type="error"
              showIcon
              message="Quiz setup options could not be loaded"
              description={[courseOptionsError, lessonOptionsError].filter(Boolean).join(" ")}
              action={<Button size="small" onClick={() => setMetadataRetryKey((value) => value + 1)}
                disabled={courseOptionsLoading || lessonOptionsLoading}>Retry options</Button>}
              style={{ marginBottom: 12 }}
            />
          ) : null}
          <div style={{ display: "flex", gap: 12, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>Filter:</Typography.Text>
            <Select
              allowClear
              placeholder={courseOptionsError ? "Courses unavailable" : "All courses"}
              style={{ width: 240, maxWidth: "100%" }}
              options={courseOptions}
              loading={courseOptionsLoading}
              value={filterCourseId}
              onChange={(v) => { setFilterCourseId(v); setPage(1); }}
              showSearch
              filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
            />
          </div>
          <Divider style={{ margin: "4px 0 12px" }} />
          <Typography.Text strong style={{ display: "block", marginBottom: 8 }}>Create New Quiz</Typography.Text>
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <Select
              placeholder={courseOptionsError ? "Courses unavailable" : "Course for new quiz"}
              style={{ width: 240, maxWidth: "100%" }}
              options={courseOptions}
              loading={courseOptionsLoading}
              disabled={Boolean(courseOptionsError) && courseOptions.length === 0}
              value={createCourseId}
              onChange={setCreateCourseId}
              showSearch
              filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
            />
            <Select
              placeholder={lessonOptionsError ? "Lessons unavailable" : lessonOptionsLoading ? "Loading lessons…" : "Lesson for new quiz"}
              style={{ width: 220, maxWidth: "100%" }}
              options={lessonOptions}
              loading={lessonOptionsLoading}
              value={createLesson?.lessonId ?? null}
              onChange={(value) => {
                const opt = lessonOptions.find((l) => l.value === value);
                setCreateLesson(opt ? { lessonId: opt.value, lessonName: opt.label } : null);
              }}
              disabled={!createCourseId || lessonOptionsLoading || (Boolean(lessonOptionsError) && lessonOptions.length === 0)}
              showSearch
              filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={!createCourseId || !createLesson || Boolean(courseOptionsError) || Boolean(lessonOptionsError)}
              onClick={() => { setEditingQuizId(null); setEditingMetadataOnly(false); setBuilderOpen(true); }}
            >
              Create quiz
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={quizzes.length === 0}>
              Export CSV (page)
            </Button>
          </div>
          {mutationError ? (
            <Alert
              type="error"
              showIcon
              message={
                mutationError.kind === "publish"
                  ? "Quiz was not published"
                  : mutationError.kind === "delete"
                    ? "Quiz was not deleted"
                    : "Result visibility was not changed"
              }
              description={mutationError.message}
              action={<Button size="small" onClick={retryQuizMutation}>Retry</Button>}
              closable
              onClose={() => setMutationError(null)}
              style={{ marginBottom: 12 }}
            />
          ) : null}
          {loading && hasCurrentQuizzes ? <RefreshStatus label="Refreshing quizzes…" /> : null}
          {currentListError ? (
            <Alert
              type={hasCurrentQuizzes ? "warning" : "error"}
              showIcon
              message={hasCurrentQuizzes ? "Couldn't refresh quizzes" : "Quizzes could not be loaded"}
              description={hasCurrentQuizzes ? "Showing the last quizzes loaded for this view." : currentListError}
              action={<Button size="small" onClick={fetchQuizzes}>Retry</Button>}
              style={{ marginBottom: 12 }}
            />
          ) : null}
          {loading && !hasCurrentQuizzes ? (
            <TableSkeleton rows={8} columns={7} label="Loading quizzes" />
          ) : currentListError && !hasCurrentQuizzes ? null : (
            <Table
              rowKey="id"
              columns={columns}
              dataSource={quizzes}
              size="small"
              pagination={{ current: page, pageSize: PAGE_SIZE, total, onChange: setPage, showSizeChanger: false }}
              scroll={{ x: "max-content" }}
              locale={{ emptyText: "No quizzes found for this college" }}
            />
          )}
          {builderOpen && (
            <QuizBuilderModal
              open={builderOpen}
              onClose={() => setBuilderOpen(false)}
              onCreated={() => { setBuilderOpen(false); fetchQuizzes(); }}
              lesson={createLesson}
              courseId={createCourseId}
              classId={null}
              quizId={editingQuizId}
              metadataOnly={editingMetadataOnly}
            />
          )}
          {viewingSubmissionsFor && (
            <SubmissionsModal quiz={viewingSubmissionsFor} onClose={() => setViewingSubmissionsFor(null)} />
          )}
        </>
      )}
    </div>
  );
}
