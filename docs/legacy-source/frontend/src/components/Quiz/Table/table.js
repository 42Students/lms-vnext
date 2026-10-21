import { deadlineMs, formatWallClock } from "@/utils/dateUtils";
import { formatTimestamp } from "@/components/admin/projects/adminProjectUtils";
import {
  Button,
  Space,
  Table,
  message,
  notification,
  Skeleton,
  Empty,
  Alert,
  Modal,
  List,
  Typography,
  Popconfirm,
  Select,
  Pagination,
} from "antd";
import { useState, useEffect, useRef } from "react";
import Name from "./quizeTitle";
import {
  listQuizzesV2,
  getQuizSubmissionsV2,
  getMyQuizSubmissionsV2,
  deleteQuizV2,
  publishQuizGradesV2,
  unpublishQuizGradesV2,
} from "@/api/Services/quizServices";
import { getFacultyProgram, getLearnerCoursesForFilter } from "@/api/Services/courseServices";

import { useSelector } from "react-redux";
import ActionQuiz from "./action";
import QuizSubmissions from "./submission";
import QuizBuilderModal from "@/components/Quiz/QuizBuilderModal";
import { useRouter } from "next/router";
import useLearnerClassScope from "@/hooks/useLearnerClassScope";
import { FormOutlined, EditOutlined, DeleteOutlined, BarChartOutlined } from "@ant-design/icons";
import { RefreshStatus, SkeletonRegion } from "@/components/Common/Skeletons";

const PAGE_SIZE = 20;

const noWrapHeader = () => ({ style: { whiteSpace: "nowrap" } });

// Faculty: "Submissions" broke mid-word at 9% and the actions sat against the right edge at 14% (full test run, 15 Oct 2026).
// Course and Lesson give the room; they already end in "…" with the full name on hover.
export const QUIZ_COLUMNS_TEACHER = [
  { title: "Overview", dataIndex: "name", width: "18%" },
  { title: "Course", dataIndex: "Course", width: "11%", ellipsis: true },
  { title: "Lesson", dataIndex: "Lesson", width: "10%", ellipsis: true },
  { title: "Due Date", dataIndex: "DueDate", width: "12%", ellipsis: true },
  { title: "Status", dataIndex: "FacultyStatus", width: "8%" },
  { title: "Results", dataIndex: "Results", width: "13%" },
  { title: "Submissions", dataIndex: "Submissions", width: "11%", onHeaderCell: noWrapHeader },
  { title: "Actions", dataIndex: "Actions", width: "17%" },
];

// One status column (a separate "Submission" column repeated it: "Submitted / Submitted", "Missed / Not attempted") and an
// Actions column wide enough for "Review attempt" / "View answers" (at 8% they were cut off; full test run, 15 Oct 2026).
export const QUIZ_COLUMNS_STUDENT = [
  { title: "Overview", dataIndex: "name", width: "22%" },
  { title: "Course", dataIndex: "Course", width: "14%", ellipsis: true },
  { title: "Lesson", dataIndex: "Lesson", width: "14%", ellipsis: true },
  { title: "Due Date", dataIndex: "DueDate", width: "14%", ellipsis: true },
  { title: "Status", dataIndex: "Status", width: "11%" },
  { title: "Grade", dataIndex: "Grade", width: "8%" },
  { title: "Actions", dataIndex: "Actions", width: "17%" },
];

const Quiztable = ({ onDataLoad }) => {
  const [api, contextHolder] = notification.useNotification();
  const loginUser = useSelector(state => state.loginUser);
  // LRN-Q-03: a missing classId used to mean "zero quizzes". Wait for it, or say what is wrong.
  const isTeacherRole = loginUser?.userType == "FACULTY" ? true : false;
  const { status: classStatus, retry: retryClass } = useLearnerClassScope({ enabled: !isTeacherRole });
  const [Refresh, setRefresh] = useState(false);
  const [Data, setData] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const router = useRouter();
  const contentQuery = Array.isArray(router.query?.content) ? router.query.content[0] : router.query?.content;
  const autoOpenedContentRef = useRef(null);

  const [spin, setSpin] = useState(true);
  const [error, setError] = useState(null);
  const [v2SubmissionModal, setV2SubmissionModal] = useState({ open: false, title: "", submissions: [] });
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [editingMetadataOnly, setEditingMetadataOnly] = useState(false);
  const submissionsLoadingRef = useRef(false);
  const quizActionRef = useRef(null);

  // Course filter — default "All courses" (courseSlug = null), matching the pre-pagination behavior.
  const [courseSlug, setCourseSlug] = useState(null);
  const [courseOptions, setCourseOptions] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  // LRN-A-05: a failed course lookup says so next to the filter instead of the filter vanishing.
  const [coursesError, setCoursesError] = useState(false);
  const [coursesRetry, setCoursesRetry] = useState(0);
  const [page, setPage] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loadedScopeKey, setLoadedScopeKey] = useState(null);
  const [errorScopeKey, setErrorScopeKey] = useState(null);
  const quizScopeKey = JSON.stringify([
    isTeacherRole ? "faculty" : "learner",
    loginUser?.id ?? null,
    loginUser?.classId ?? null,
    courseSlug || "",
    page,
  ]);
  const scopeHasSettledData = loadedScopeKey === quizScopeKey;
  const currentError = errorScopeKey === quizScopeKey ? error : null;
  const initialLoading = !scopeHasSettledData && !currentError;
  const refreshing = spin && scopeHasSettledData;

  useEffect(() => {
    const facultyId = loginUser?.id;
    const learnerId = loginUser?.id;
    setCoursesLoading(true);
    // getFacultyCoursesForFilter (fetchAllCoursesByFacultyId) returns an empty list for faculty who
    // do have courses -- the dropdown always showed just "All courses" because of it, while the
    // course COLUMN a few lines below correctly shows real names because it reads from the quiz
    // data itself. getFacultyProgram hits the same teaching-assignment endpoint that already
    // powers the course/lesson pickers elsewhere (see newAssignment.js) and actually returns data;
    // one course can have several class assignments, so dedupe by slug.
    const fetchCourses = isTeacherRole
      ? getFacultyProgram({ facultyId }).then((res) => {
          const assignments = res?.data?.data ?? [];
          const bySlug = new Map();
          assignments.forEach((item) => {
            const slug = item?.courseSlug ?? item?.course_slug;
            if (slug && !bySlug.has(slug)) {
              bySlug.set(slug, { slug, courseName: item?.courseName });
            }
          });
          return Array.from(bySlug.values());
        })
      : getLearnerCoursesForFilter(learnerId);
    fetchCourses
      .then((list) => { setCourseOptions(Array.isArray(list) ? list : []); setCoursesError(false); })
      .catch(() => { setCourseOptions([]); setCoursesError(true); })
      .finally(() => setCoursesLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTeacherRole, loginUser?.id, coursesRetry]);

  const learnerSubmissionLabel = (item) => {
    const name = item?.learnerName || item?.learnerRollNumber || (item?.learnerId ? `Learner ${item.learnerId}` : "Learner");
    const detail = [
      item?.learnerRollNumber ? `Roll ${item.learnerRollNumber}` : null,
      item?.learnerMobile,
    ].filter(Boolean).join(" - ");
    return { name, detail };
  };

  const quizScoreLabel = (item) => {
    const score = item?.score ?? item?.pointsObtained ?? item?.points_obtained ?? item?.grade ?? 0;
    const maxScore = item?.maxScore ?? item?.totalPoints ?? item?.points ?? item?.max_points;
    return maxScore != null ? `${score}/${maxScore}` : `${score}`;
  };

  // Bare `ant-list` + `List.Item.Meta` gave every submission the same visual weight regardless of
  // how a student actually did, which is exactly what made the modal feel "basic" -- a score band
  // reads at a glance in a way "Score 3/10" buried in a comma-joined description string doesn't.
  const quizScoreBand = (item) => {
    const score = Number(item?.score ?? item?.pointsObtained ?? item?.points_obtained ?? item?.grade ?? 0);
    const maxScore = Number(item?.maxScore ?? item?.totalPoints ?? item?.points ?? item?.max_points);
    if (!maxScore) return "neutral";
    const pct = (score / maxScore) * 100;
    if (pct >= 75) return "high";
    if (pct >= 40) return "mid";
    return "low";
  };

  const learnerInitials = (name) => {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return (parts[0]?.[0] ?? "?").toUpperCase();
  };

  const AVATAR_TINTS = [
    { bg: "#e0f2f1", fg: "#0f766e" },
    { bg: "#ede9fe", fg: "#5b21b6" },
    { bg: "#fef3c7", fg: "#92400e" },
    { bg: "#e0e7ff", fg: "#3730a3" },
    { bg: "#fce7f3", fg: "#9d174d" },
    { bg: "#dcfce7", fg: "#166534" },
  ];

  const learnerAvatarTint = (seedValue) => {
    const seed = String(seedValue ?? "").split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return AVATAR_TINTS[seed % AVATAR_TINTS.length];
  };

  // A submission time is server UTC (read as local it showed 5½ hours early); a due time is what the
  // author typed (wall-clock). Both used to go through one toLocaleString() ("15/09/2026, 12:43:00").
  const formatSubmissionDate = (value) => {
    if (!value) return null;
    const text = formatTimestamp(Array.isArray(value) ? value : value?.date ?? value);
    return text && text !== "—" ? text : null;
  };

  const formatDueDate = (value) => formatWallClock(Array.isArray(value) ? value : value?.date ?? value, "MMM D, YYYY h:mm A", "-");

  const pickQuizCourseName = (item) => (
    item?.courseName
    || item?.course_name
    || (item?.courseId || item?.course_id ? `Course ${item.courseId || item.course_id}` : "-")
  );

  const pickQuizLessonName = (item) => (
    item?.lessonName
    || item?.lesson_name
    || (item?.lessonId || item?.lesson_id ? `Lesson ${item.lessonId || item.lesson_id}` : "-")
  );

  const pickQuizDueDate = (item) => (
    item?.dueAt
    || item?.due_date
    || item?.dueDate
    || null
  );

  // Course/Lesson columns are `ellipsis: true`, but AntD's automatic hover-title only works when
  // the cell value is a plain string -- these render a <span> instead, so the tooltip silently
  // never appeared for a truncated name. Setting `title` here gives the browser its own tooltip.
  const CourseNameCell = ({ item }) => <span title={pickQuizCourseName(item)}>{pickQuizCourseName(item)}</span>;
  const LessonNameCell = ({ item }) => <span title={pickQuizLessonName(item)}>{pickQuizLessonName(item)}</span>;

  useEffect(() => {
    const controller = { cancelled: false };
    GetQuizes(controller, quizScopeKey);
    return () => { controller.cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Refresh, quizScopeKey, classStatus]);

  // Filtering to a different course invalidates the current page number.
  useEffect(() => {
    setPage(1);
  }, [courseSlug]);

  const toggleResults = async (quizId, currentlyPublished) => {
    if (quizActionRef.current) return;
    const actionKey = `quiz-results-${quizId}`;
    quizActionRef.current = actionKey;
    message.loading({ key: actionKey, content: currentlyPublished ? "Withholding results…" : "Releasing results…", duration: 0 });
    try {
      if (currentlyPublished) await unpublishQuizGradesV2(quizId);
      else await publishQuizGradesV2(quizId);
      message.success({ key: actionKey, content: currentlyPublished ? "Results withheld" : "Results released to students" });
      setRefresh((value) => !value);
    } catch (err) {
      message.error({ key: actionKey, content: err?.response?.data?.message || "Couldn't update results visibility" });
    } finally {
      quizActionRef.current = null;
    }
  };

  const GetQuizes = (controller, scopeKey) => {
    setError(null);
    setErrorScopeKey(null);
    setSpin(true);

    const toV2Row = (quizItem) => {
      const submitted = Boolean(quizItem?.submitted)
        || Number(quizItem?.attemptCount || 0) > 0
        || quizItem?.latestScore != null;
      const attemptCount = Number(quizItem?.attemptCount || 0);
      const maxAttempts = Math.max(1, Number(quizItem?.maxAttempts || quizItem?.max_attempts || 1));
      const dueMsForRow = (() => {
        const raw = quizItem?.dueAt || quizItem?.due_date || quizItem?.dueDate || null;
        // LRN-X-03: a zone-less dueAt is India time, as the server enforces it.
        const ms = raw != null ? deadlineMs(raw) : NaN;
        return Number.isFinite(ms) ? ms : null;
      })();
      const deadlineConfigured = dueMsForRow != null;
      const pastDeadline = deadlineConfigured && dueMsForRow < Date.now();
      const learnerDeadlineUnavailable = !isTeacherRole && !deadlineConfigured;
      // A retake is a new attempt -- closed once the deadline passes, and legacy rows without
      // a valid deadline are non-attemptable until faculty repairs them.
      const canRetake = !isTeacherRole && submitted && attemptCount < maxAttempts
        && deadlineConfigured && !pastDeadline;
      // Results are an assessment-wide release, not a per-learner reward for finishing early.
      // Even an exhausted learner sees no score/key while classmates can still attempt the quiz.
      const resultsVisible = pastDeadline
        && quizItem?.resultsVisible !== false
        && quizItem?.gradePublished !== false;
      let scoreText = "-";
      if (submitted) {
        if (!resultsVisible) {
          scoreText = "Not released";
        } else if (quizItem?.latestScore != null) {
          scoreText = `${quizItem.latestScore}/${quizItem.latestMaxScore ?? quizItem.totalPoints ?? 0}`;
        } else {
          scoreText = "Not graded yet";
        }
      }
      // The attempt page (quizpanel.js) already blocks opening a past-deadline quiz -- but only
      // once you click in. This list still showed a plain "Pending" status and a fully clickable
      // "Start Quiz" button with zero acknowledgement of the due date, so a learner got no warning
      // before the click-through-and-bounce. Matches the "Expired" tag already added to the
      // roadmap's own list rows for the identical gap.
      const dueDateValue = pickQuizDueDate(quizItem);
      const isExpired = !isTeacherRole && !submitted && pastDeadline;
      const isDraft = String(quizItem?.status || "").toUpperCase() === "DRAFT";
      const facultyStatus = isDraft
        ? { tone: "pending", label: "Draft" }
        : !deadlineConfigured
          ? { tone: "pending", label: "Needs due date" }
          : pastDeadline
            ? { tone: "expired", label: "Closed" }
            : { tone: "graded", label: "Open" };
      const gradesPublished = quizItem?.gradePublished === true;
      const canReleaseResults = pastDeadline;
      return {
        key: quizItem.id,
        FacultyStatus: (
          <div className={`ln-syllabus-status ln-status ln-status--${facultyStatus.tone}`}>
            <span className="text-capitalize">{facultyStatus.label}</span>
          </div>
        ),
        Results: (
          <Popconfirm
            disabled={!gradesPublished && !canReleaseResults}
            title={gradesPublished ? "Withhold results?" : "Release results?"}
            description={gradesPublished
              ? "Students will stop seeing their scores and the correct answers."
              : "Students will see scores and the answer key now that the quiz is closed."}
            okText={gradesPublished ? "Withhold" : "Release"}
            onConfirm={() => toggleResults(quizItem.id, gradesPublished)}
          >
            <Button
              size="small"
              type={gradesPublished ? "default" : "primary"}
              ghost={!gradesPublished}
              disabled={!gradesPublished && !canReleaseResults}
              title={!gradesPublished && !canReleaseResults ? "Results can be released after the quiz deadline" : undefined}
              className={`ln-quiz-results-toggle${gradesPublished ? " is-released" : ""}`}
            >
              {gradesPublished ? "Released · Withhold" : canReleaseResults ? "Release results" : "Release after deadline"}
            </Button>
          </Popconfirm>
        ),
        Submissions: (
          <QuizSubmissions
            onClick={() => ViewSubmissions(quizItem.id, quizItem.title || "Untitled quiz")}
            disabled={loadingSubmissions}
          />
        ),
        name: <Name name={quizItem.title || "Untitled quiz"} />,
        Course: <CourseNameCell item={quizItem} />,
        Lesson: <LessonNameCell item={quizItem} />,
        DueDate: (
          <span className={isExpired ? "ln-quiz-due-date--expired" : undefined}>
            {formatDueDate(dueDateValue)}
          </span>
        ),
        Status: submitted ? (
          <div className="ln-syllabus-status ln-status ln-status--graded">
            <span className="text-capitalize">Submitted</span>
          </div>
        ) : learnerDeadlineUnavailable ? (
          <div className="ln-syllabus-status ln-status ln-status--pending">
            <span className="text-capitalize">Unavailable</span>
          </div>
        ) : isExpired ? (
          <div className="ln-syllabus-status ln-status ln-status--expired">
            <span className="text-capitalize">Missed</span>
          </div>
        ) : (
          <div className="ln-syllabus-status ln-status ln-status--pending">
            <span className="text-capitalize">Pending</span>
          </div>
        ),
        Grade: submitted ? scoreText : "-",
        Submission: submitted ? (
          <div className="ln-syllabus-status ln-status ln-status--submitted">
            <span className="text-capitalize">Submitted</span>
          </div>
        ) : (
          <div className="ln-syllabus-status ln-status ln-status--not-submitted">
            <span className="text-capitalize">{learnerDeadlineUnavailable ? "Not available" : isExpired ? "Not attempted" : "Not Submitted"}</span>
          </div>
        ),
        Actions: (
          // Was one flat `Space size="small"` (uniform 8px) across all three buttons, so the gap
          // after the wide, teal "Preview Quiz" pill read the same as the gap between the two
          // small icon-only buttons -- Edit/Delete looked glued to Preview Quiz instead of reading
          // as their own secondary pair. A bigger outer gap groups Edit+Delete apart from it.
          <Space size="middle">
            <ActionQuiz
              click={() => {
                // Missed (past deadline, never attempted) or submitted with no retake left: open
                // the read-only review -- questions with the answer key, or the learner's attempt.
                if (!isTeacherRole && (isExpired || (submitted && !canRetake))) {
                  router.push({
                    pathname: "/quiz",
                    query: { quizId: quizItem.id, contentTitle: quizItem.title || "", review: "true" },
                  });
                  return;
                }
                router.push({ pathname: "/quiz", query: { quizId: quizItem.id, contentTitle: quizItem.title || "" } });
              }}
              text={isTeacherRole ? "Preview Quiz" : learnerDeadlineUnavailable && !submitted ? "Unavailable" : isExpired ? (gradesPublished ? "View answers" : "Review quiz") : submitted ? (canRetake ? "Retake Quiz" : "Review attempt") : "Start Quiz"}
              disabled={!isTeacherRole && learnerDeadlineUnavailable && !submitted}
            />
            {isTeacherRole && (
              <Space size={4}>
                {/* #26: score distribution, question accuracy, and the full student list, in one
                    place instead of only a raw submissions list. */}
                <Button
                  type="text"
                  size="small"
                  icon={<BarChartOutlined />}
                  aria-label="View quiz report"
                  title="View report"
                  onClick={() => router.push({ pathname: "/teacher/report/quiz/[quizId]", query: { quizId: quizItem.id } })}
                />
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  aria-label="Edit quiz"
                  title="Edit quiz"
                  onClick={() => handleEditClick(quizItem)}
                />
                <Popconfirm
                  title="Delete this quiz?"
                  description="Learners will no longer be able to open it. This cannot be undone."
                  okText="Delete"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => deleteQuiz(quizItem.id)}
                >
                  <Button type="text" danger size="small" icon={<DeleteOutlined />} aria-label="Delete quiz" title="Delete quiz" />
                </Popconfirm>
              </Space>
            )}
          </Space>
        ),
        source: "quiz-v2",
      };
    };

    const baseParams = isTeacherRole
      ? {}
      : loginUser?.classId
        ? { classId: loginUser.classId }
        : null;

    if (!isTeacherRole && !baseParams && classStatus === "loading") {
      setSpin(true);
      return;
    }
    if (!isTeacherRole && !baseParams) {
      setData([]);
      setSpin(false);
      setTotalElements(0);
      setLoadedScopeKey(scopeKey);
      onDataLoad?.({ total: 0, uniqueCourses: 0, submittedCount: 0, courseBreakdown: {}, submittedNames: [] });
      return;
    }

    const params = {
      ...baseParams,
      page: page - 1,
      size: PAGE_SIZE,
      ...(courseSlug ? { courseSlug } : {}),
    };

    listQuizzesV2(params)
      .then((res) => {
        if (controller.cancelled) return;
        const payload = res?.data ?? res;
        // Paginated response is { content, totalElements, ... }; guard for any legacy plain-array
        // shape too so this doesn't break if the endpoint is ever called without page/size.
        const v2List = Array.isArray(payload) ? payload : (payload?.content ?? []);
        const total = Array.isArray(payload) ? v2List.length : (payload?.totalElements ?? v2List.length);
        const rows = v2List.map(toV2Row);
        setData(rows);
        setTotalElements(total);
        setLoadedScopeKey(scopeKey);
        setErrorScopeKey(null);

        const autoOpenContentId = Number(contentQuery);
        if (autoOpenContentId && autoOpenedContentRef.current !== autoOpenContentId) {
          const match = v2List.find((item) => Number(item?.id) === autoOpenContentId);
          if (match) {
            autoOpenedContentRef.current = autoOpenContentId;
            ViewSubmissions(match.id, match.title);
          }
        }

        const courseMap = {};
        let submittedCount = 0;
        const submittedNames = [];
        v2List.forEach((e) => {
          const cName = pickQuizCourseName(e);
          courseMap[cName] = (courseMap[cName] || 0) + 1;
          const submitted = Boolean(e?.submitted) || Number(e?.attemptCount || 0) > 0 || e?.latestScore != null;
          if (submitted) {
            submittedCount++;
            submittedNames.push(e.title || "Untitled");
          }
        });
        // LRN-Q-04: the whole-list submitted count comes from the server; counting this page only made
        // "2 Submitted" change as you paged. Page-local count is the fallback for older servers.
        const serverSubmitted = payload?.summary?.submitted;
        onDataLoad?.({ total, uniqueCourses: Object.keys(courseMap).length, submittedCount: typeof serverSubmitted === "number" ? serverSubmitted : submittedCount, courseBreakdown: courseMap, submittedNames });
      })
      .catch((err) => {
        if (controller.cancelled) return;
        if (err.name !== 'AbortError') {
          setError('Failed to load quizzes. Please try again.');
          setErrorScopeKey(scopeKey);
        }
      })
      .finally(() => { if (!controller.cancelled) setSpin(false); });
  };

  const ViewSubmissions = (quizId, title) => {
    if (submissionsLoadingRef.current) return;
    submissionsLoadingRef.current = true;
    setLoadingSubmissions(true);
    const request = isTeacherRole ? getQuizSubmissionsV2(quizId) : getMyQuizSubmissionsV2(quizId);
    request
      .then((res) => {
        const submissions = res?.data?.data ?? res?.data ?? [];
        setV2SubmissionModal({ open: true, title, submissions: Array.isArray(submissions) ? submissions : [] });
      })
      .catch((err) => {
        message.error(err?.response?.data?.message || "Failed to load quiz submissions");
      })
      .finally(() => { submissionsLoadingRef.current = false; setLoadingSubmissions(false); });
  };

  // Bug fix: this table used to open the builder in full edit mode unconditionally
  // (`setEditingQuizId(quizItem.id)` with no submissions check), so `metadataOnly` was never
  // passed to QuizBuilderModal here even though the modal has always supported it (see
  // src/pages/superadmin/sections/Quizzes.js, which already does this check). A faculty member
  // editing a quiz that already has learner submissions would submit a full question rewrite;
  // the backend now rejects that with a 409 (see the comment in Quizzes.js), so this wasn't
  // silently destructive, but it did surface a confusing generic "Unable to update quiz" error
  // instead of the same "metadata only" flow the admin page offers. Mirror that flow here.
  const handleEditClick = async (quizItem) => {
    if (quizActionRef.current) return;
    const actionKey = `quiz-edit-check-${quizItem.id}`;
    quizActionRef.current = actionKey;
    message.loading({ key: actionKey, content: "Checking quiz submissions…", duration: 0 });
    try {
      const res = await getQuizSubmissionsV2(quizItem.id);
      const data = res?.data ?? res;
      const count = Array.isArray(data) ? data.length : 0;
      message.destroy(actionKey);
      if (count > 0) {
        Modal.confirm({
          title: "This quiz already has learner submissions",
          content: `Questions, deadline, attempt limit and randomization are locked after ${count} submitted attempt${count === 1 ? "" : "s"}. You can still correct the title or description.`,
          okText: "Edit metadata",
          cancelText: "Cancel",
          onOk: () => {
            setEditingMetadataOnly(true);
            setEditingQuizId(quizItem.id);
          },
        });
      } else {
        setEditingMetadataOnly(false);
        setEditingQuizId(quizItem.id);
      }
    } catch {
      // Unknown attempt count is not evidence that assessment-defining fields are safe to edit.
      message.warning({ key: actionKey, content: "Could not verify submissions. Only title/description editing is available right now." });
      setEditingMetadataOnly(true);
      setEditingQuizId(quizItem.id);
    } finally {
      quizActionRef.current = null;
    }
  };

  const deleteQuiz = async (quizId) => {
    if (quizActionRef.current) return;
    const actionKey = `quiz-delete-${quizId}`;
    quizActionRef.current = actionKey;
    message.loading({ key: actionKey, content: "Deleting quiz…", duration: 0 });
    try {
      await deleteQuizV2(quizId);
      message.success({ key: actionKey, content: "Quiz deleted successfully" });
      setRefresh((value) => !value);
    } catch (err) {
      message.error({ key: actionKey, content: err?.response?.data?.message || "Failed to delete quiz" });
    } finally {
      quizActionRef.current = null;
    }
  };

  const columns = QUIZ_COLUMNS_TEACHER;
  const columnsStudent = QUIZ_COLUMNS_STUDENT;

  const emptyStateCopy = isTeacherRole
    ? { title: "No quizzes yet", detail: "Create your first quiz to get started." }
    : { title: "No quizzes yet", detail: "Quizzes assigned to you by your teachers will appear here." };

  return (
    <div>
      {contextHolder}
      {refreshing ? <RefreshStatus label="Refreshing quizzes…" /> : null}
      {currentError && (
        <Alert
          type={scopeHasSettledData ? "warning" : "error"}
          message={scopeHasSettledData ? "Couldn't refresh quizzes" : currentError}
          description={scopeHasSettledData ? "Showing the last quizzes loaded for this view." : undefined}
          className="mb-3"
          action={
            <Button size="small" onClick={() => setRefresh(!Refresh)}>
              Retry
            </Button>
          }
        />
      )}
      <Modal
        title={v2SubmissionModal.title || "Quiz submissions"}
        open={v2SubmissionModal.open}
        onCancel={() => setV2SubmissionModal({ open: false, title: "", submissions: [] })}
        footer={null}
        centered
        width={720}
        className="ln-mobile-safe-modal quiz-submissions-v2-modal"
        wrapClassName="ln-mobile-safe-modal-wrap"
      >
        {v2SubmissionModal.submissions.length ? (
          <>
            <div className="quiz-submissions-v2-summary">
              {v2SubmissionModal.submissions.length} {v2SubmissionModal.submissions.length === 1 ? "submission" : "submissions"}
            </div>
            <List
              className="quiz-submissions-v2-list"
              itemLayout="horizontal"
              dataSource={v2SubmissionModal.submissions}
              renderItem={(item) => {
                const { name, detail } = learnerSubmissionLabel(item);
                const dateLabel = formatSubmissionDate(
                  item.submittedAt ?? item.submitted_at ?? item.createdAt ?? item.created_at
                );
                const tint = learnerAvatarTint(item?.learnerId ?? name);
                return (
                  <List.Item className="quiz-submission-row">
                    <span
                      className="quiz-submission-row__avatar"
                      style={{ background: tint.bg, color: tint.fg }}
                      aria-hidden="true"
                    >
                      {learnerInitials(name)}
                    </span>
                    <span className="quiz-submission-row__body">
                      <span className="quiz-submission-row__name">{name}</span>
                      <span className="quiz-submission-row__detail">
                        {[detail, item.status || "Submitted"].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <span className="quiz-submission-row__meta">
                      <span className={`quiz-submission-row__score quiz-submission-row__score--${quizScoreBand(item)}`}>
                        {quizScoreLabel(item)}
                      </span>
                      {dateLabel && (
                        <Typography.Text type="secondary" className="quiz-submission-row__date">
                          {dateLabel}
                        </Typography.Text>
                      )}
                    </span>
                  </List.Item>
                );
              }}
            />
          </>
        ) : (
          <Empty description="No submissions yet" />
        )}
      </Modal>
      <QuizBuilderModal
        open={editingQuizId != null}
        quizId={editingQuizId}
        metadataOnly={editingMetadataOnly}
        onClose={() => { setEditingQuizId(null); setEditingMetadataOnly(false); }}
        onCreated={() => { setEditingQuizId(null); setEditingMetadataOnly(false); setRefresh(!Refresh); }}
      />
      {!isTeacherRole && classStatus === "none" && (
        <Alert type="info" showIcon style={{ marginBottom: 16 }} message="You haven't been added to a class yet"
          description="Quizzes appear once your college puts you in a class or section." />
      )}
      {!isTeacherRole && classStatus === "error" && (
        <Alert type="warning" showIcon style={{ marginBottom: 16 }} message="Couldn't load your class, so quizzes can't be shown"
          action={<Button size="small" onClick={retryClass}>Retry</Button>} />
      )}
      <div className="learn-quizzes-filters" style={{ marginBottom: 16, maxWidth: 320 }}>
        <Select
          value={courseSlug ?? ""}
          onChange={(v) => setCourseSlug(v || null)}
          loading={coursesLoading}
          placeholder="All courses"
          allowClear
          style={{ width: "100%" }}
          options={[
            { label: "All courses", value: "" },
            ...courseOptions.map((c) => ({ label: c.courseName || c.slug, value: c.slug })),
          ]}
        />
        {coursesError && (
          <Button type="link" size="small" style={{ paddingLeft: 0 }} onClick={() => setCoursesRetry((n) => n + 1)}>Couldn&apos;t load your courses · Retry</Button>
        )}
      </div>
      <div>
        {initialLoading ? (
          <SkeletonRegion label="Loading quizzes" className="learn-quizzes-loading">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="learn-quizzes-skeleton-row">
                <Skeleton.Input active size="small" style={{ width: "30%", minWidth: 120 }} />
                <Skeleton.Input active size="small" style={{ width: "18%", minWidth: 80 }} />
                <Skeleton.Input active size="small" style={{ width: "18%", minWidth: 80 }} />
                <Skeleton.Input active size="small" style={{ width: "12%", minWidth: 60 }} />
              </div>
            ))}
          </SkeletonRegion>
        ) : currentError && !scopeHasSettledData ? null : (
          <>
            <div className="learn-quizzes-desktop">
              {Data.length > 0 ? (
                <div className="learn-quizzes-table-wrap">
                  <Table
                    className="ln-table ln-table-filter"
                    columns={isTeacherRole ? columns : columnsStudent}
                    dataSource={Data}
                    pagination={{
                      current: page,
                      pageSize: PAGE_SIZE,
                      total: totalElements,
                      onChange: (nextPage) => setPage(nextPage),
                      showSizeChanger: false,
                    }}
                  />
                </div>
              ) : (
                <div className="learn-quizzes-empty-state">
                  <FormOutlined className="learn-quizzes-empty-state__icon" aria-hidden />
                  <p>{emptyStateCopy.title}</p>
                  <span>{emptyStateCopy.detail}</span>
                </div>
              )}
            </div>
            <div className="learn-quizzes-mobile">
              {Data.length === 0 ? (
                <div className="learn-quizzes-empty-state">
                  <FormOutlined className="learn-quizzes-empty-state__icon" aria-hidden />
                  <p>{emptyStateCopy.title}</p>
                  <span>{emptyStateCopy.detail}</span>
                </div>
              ) : (
                <div className="learn-quiz-cards">
                  {Data.map((record, idx) => (
                    <div key={record.key ?? idx} className="learn-quiz-card">
                      <div className="learn-quiz-card__title">{record.name}</div>
                      <div className="learn-quiz-card__meta">
                        <span>{record.Course}</span>
                        <span className="learn-quiz-card__sep"> · </span>
                        <span>{record.Lesson}</span>
                      </div>
                      {isTeacherRole ? (
                        <>
                          <div className="learn-quiz-card__row">
                            <span className="learn-quiz-card__label">Due date</span>
                            <span className="learn-quiz-card__value">{record.DueDate}</span>
                          </div>
                          <div className="learn-quiz-card__row">
                            <span className="learn-quiz-card__label">Status</span>
                            <span className="learn-quiz-card__value">{record.FacultyStatus}</span>
                          </div>
                          <div className="learn-quiz-card__row">
                            <span className="learn-quiz-card__label">Results</span>
                            <span className="learn-quiz-card__value">{record.Results}</span>
                          </div>
                          <div className="learn-quiz-card__row">
                            <span className="learn-quiz-card__label">Submissions</span>
                            <span className="learn-quiz-card__value">{record.Submissions}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="learn-quiz-card__row">
                            <span className="learn-quiz-card__label">Due date</span>
                            <span className="learn-quiz-card__value">{record.DueDate}</span>
                          </div>
                          <div className="learn-quiz-card__row">
                            <span className="learn-quiz-card__label">Status</span>
                            <span className="learn-quiz-card__value">{record.Status}</span>
                          </div>
                          <div className="learn-quiz-card__row">
                            <span className="learn-quiz-card__label">Grade</span>
                            <span className="learn-quiz-card__value">{record.Grade}</span>
                          </div>
                          <div className="learn-quiz-card__row">
                            <span className="learn-quiz-card__label">Submission</span>
                            <span className="learn-quiz-card__value">{record.Submission}</span>
                          </div>
                        </>
                      )}
                      <div className="learn-quiz-card__actions">{record.Actions}</div>
                    </div>
                  ))}
                </div>
              )}
              {totalElements > PAGE_SIZE && (
                <Pagination
                  className="learn-quizzes-mobile-pagination"
                  style={{ marginTop: 16, textAlign: "center" }}
                  current={page}
                  pageSize={PAGE_SIZE}
                  total={totalElements}
                  onChange={setPage}
                  showSizeChanger={false}
                  simple
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Quiztable;
