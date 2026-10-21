import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import { Alert, Button, message, Skeleton, Select, Pagination } from "antd";
import { RefreshStatus } from "@/components/Common/Skeletons";
import { PlusOutlined, FileTextOutlined, BookOutlined, CalendarOutlined, BarChartOutlined } from "@ant-design/icons";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import PageShell from "@/components/Common/PageShell";
import MetricPill from "@/components/Global/MetricPill/MetricPill";
import moment from "moment";
import { deadlineMs } from "@/utils/dateUtils";

import { getAllAssignments, getAssignmentSubmissions, getFacultyProgram, getLearnerCoursesForFilter, getSubmittedAssign } from "@/api/Services/courseServices";
import { ensureArray } from "@/utils/learnerApiUtils";
import DrawerAssignment from "@/components/Global/Offcanvas/Assignment/newAssignment";
import dynamic from "next/dynamic";
const ViewAssignmentDrawer = dynamic(() => import("@/components/Assignments/ViewAssignmentModal"), { ssr: false });
const ActionAssignment = dynamic(() => import("@/components/Assignments/ActionAssignment"), { ssr: false });
const ViewSubmissionsModal = dynamic(() => import("@/pages/Dashboard/course/syllabus/viewSubmissionsModal"), { ssr: false });
import { createLessonContent } from "@/api/Services/courseServices";
import { monthNames } from "@/common/lists";

const PAGE_SIZE = 20;

function formatCreatedAt(createdAt) {
  // Handles both shapes actually seen on the wire in this codebase: a [year, month0Based, day]
  // array (the convention used by NotificationResponseDTO/AnnouncementResponseDTO — monthNames
  // is 1-indexed, so this needs +1, same fix applied to notificationDateUtils.js) and a plain
  // ISO date string (what a raw entity's LocalDateTime field serializes to via the app's global
  // UtcLocalDateTimeSerializer, which is what LessonContents.createdAt actually is here — the
  // old array-only check silently returned "N/A" for every single assignment's date).
  if (Array.isArray(createdAt) && createdAt.length >= 3) {
    const [y, month0, d] = createdAt;
    const monthLabel = monthNames[month0 + 1] ?? "N/A";
    return monthLabel === "N/A" || d == null || y == null ? "—" : `${d} ${monthLabel.slice(0, 3)} ${y}`;
  }
  if (createdAt) {
    const parsed = moment(createdAt);
    if (parsed.isValid()) return parsed.format("D MMM YYYY");
  }
  // "6 Oct 2026", like every other date on these cards (was "6 / October / 2026", or "N/A").
  return "—";
}

function assignmentDueDate(record) {
  const data = record?.contentDataDTO || record?.content_data_dto || {};
  const raw = record?.deadline ?? data.due_date ?? data.dueDate ?? record?.dueDate ?? record?.due_date ?? null;
  if (!raw) return null;
  const ms = deadlineMs(raw);
  const date = Number.isFinite(ms) ? moment(ms) : moment(raw);
  return date.isValid() ? date : null;
}

function submittedAtOf(submission) {
  const raw = submission?.createdAt ?? submission?.submittedAt ?? null;
  if (Array.isArray(raw) && raw.length >= 3) {
    const [y, m, d, hh = 0, mm = 0] = raw;
    return moment({ year: y, month: m - 1, day: d, hour: hh, minute: mm });
  }
  const parsed = raw ? moment(raw) : null;
  return parsed && parsed.isValid() ? parsed : null;
}

/**
 * Backend and UI share the same hard cutoff: once the deadline passes, a learner who has not
 * submitted may review the assignment but cannot start a new submission.
 */
// submissionStatus: "known" (default), "loading", or "error"/true when the learner's submissions could not be loaded.
export function learnerAssignmentState(record, submission, now = moment(), submissionStatus = "known") {
  const due = assignmentDueDate(record);
  // Never turn an unknown submission lookup into "Not submitted" (or offer Submit) while it loads or after it fails.
  if (!submission && submissionStatus === "loading") return { tone: "pending", label: "Checking submission status…", action: "View" };
  if (!submission && (submissionStatus === true || submissionStatus === "error")) {
    return { tone: "unknown", label: "Submission status unavailable · retry above", action: "View" };
  }
  if (submission) {
    const at = submittedAtOf(submission);
    const late = Boolean(due && at && at.isAfter(due));
    const graded = Number(submission?.graded) === 1 && submission?.isGradePublished !== false && submission?.gradePublished !== false;
    if (graded) {
      const max = submission?.points;
      return { tone: "graded", label: max ? `Graded · ${submission?.pointsObtained ?? 0}/${max}` : "Graded", action: "View" };
    }
    return { tone: late ? "late" : "submitted", label: late ? "Submitted late · awaiting grade" : "Submitted · awaiting grade", action: "View" };
  }
  if (!due) return { tone: "unknown", label: "Submission unavailable · deadline missing", action: "View" };
  if (due.isBefore(now)) return { tone: "overdue", label: "Closed · not submitted", action: "View" };
  if (due.diff(now, "hours") < 48) return { tone: "soon", label: "Due soon", action: "Submit" };
  return { tone: "open", label: "Not submitted", action: "Submit" };
}

function AssignmentsEmptyIllustration() {
  return (
    <svg viewBox="0 0 120 80" className="learn-assignments-empty-illus" aria-hidden>
      <defs>
        <linearGradient id="assignEmptyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#26bac7" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#d97706" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <rect x="22" y="14" width="76" height="52" rx="10" fill="url(#assignEmptyGrad)" stroke="#26bac7" strokeWidth="1.5" strokeOpacity="0.35" />
      <rect x="34" y="26" width="52" height="6" rx="3" fill="#26bac7" fillOpacity="0.4" />
      <rect x="34" y="40" width="30" height="4" rx="2" fill="#26bac7" fillOpacity="0.25" />
      <rect x="34" y="50" width="24" height="4" rx="2" fill="#059669" fillOpacity="0.35" />
      <path d="M38 64 L42 68 L52 58" fill="none" stroke="#26bac7" strokeWidth="2" strokeOpacity="0.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AssignmentListItem({ record, isTeacher, submission, submissionState, onView, onViewSubmissions, onViewReport, onEdit, onDelete, deleting = false, deleteDisabled = false }) {
  const dateStr = formatCreatedAt(record?.createdAt);
  const courseName = record?.courseName || record?.course_name;
  const due = assignmentDueDate(record);
  // Never turn an unknown submission lookup into a confident "Not submitted" state. If the
  // learner-submissions request is loading or failed, the card stays neutral and the assignment
  // drawer performs its own guarded lookup before exposing the submit action.
  const learnerState = !isTeacher
    ? submissionState === "ready"
      ? learnerAssignmentState(record, submission)
      : submissionState === "error"
        ? { tone: "open", label: "Submission status unavailable", action: "View" }
        : { tone: "open", label: "Checking submission status…", action: "View" }
    : null;

  return (
    <article className="learn-assignments-row-card">
      {/* Card-level primary action button — covers the non-interactive area */}
      <button
        type="button"
        className="learn-assignments-row-card__primary-btn"
        onClick={() => onView(record)}
        aria-label={`View assignment: ${record?.contentTitle || "Untitled"}`}
      />
      <div className="learn-assignments-row-card__main">
        <div className="learn-assignments-row-card__icon-wrap">
          <FileTextOutlined className="learn-assignments-row-card__icon" aria-hidden="true" />
        </div>
        <div className="learn-assignments-row-card__content">
          <h3 className="learn-assignments-row-card__title ln-lto-bold">{record?.contentTitle || "Untitled"}</h3>
          <div className="learn-assignments-row-card__meta ln-lto-reg">
            {courseName && <span className="learn-assignments-row-card__course">{courseName}</span>}
            {courseName && " · "}
            {due ? (
              <span className={`learn-assignments-row-card__due${learnerState?.tone === "overdue" ? " is-overdue" : learnerState?.tone === "soon" ? " is-soon" : ""}`}>
                <CalendarOutlined aria-hidden="true" /> Due {due.format("DD MMM YYYY, h:mm A")}
              </span>
            ) : (
              <>Created: {dateStr}</>
            )}
          </div>
          {learnerState ? (
            <span className={`learn-assignments-state learn-assignments-state--${learnerState.tone}`}>{learnerState.label}</span>
          ) : null}
        </div>
      </div>
      <div className="learn-assignments-row-card__actions">
        {isTeacher && (
          <>
            <button
              type="button"
              className="learn-assignments-row-card__link"
              onClick={(event) => {
                event.stopPropagation();
                onViewSubmissions(record);
              }}
              aria-label="View submissions for this assignment"
            >
              View Submissions
            </button>
            {/* #26: score distribution, on-time/late split, and who hasn't submitted, in one
                place instead of only a raw submissions list. */}
            <button
              type="button"
              className="learn-assignments-row-card__link"
              onClick={(event) => {
                event.stopPropagation();
                onViewReport(record);
              }}
              aria-label="View report for this assignment"
            >
              <BarChartOutlined aria-hidden /> Report
            </button>
            <ActionAssignment onEdit={() => onEdit(record)} onDelete={() => onDelete(record)} deleting={deleting} mutationBusy={deleteDisabled} />
          </>
        )}
        {!isTeacher && (
          <span className={`learn-assignments-row-card__cta learn-assignments-row-card__cta--${learnerState?.action === "Submit" ? "submit" : "view"}`} aria-hidden="true">
            {learnerState?.action || "View"} →
          </span>
        )}
      </div>
    </article>
  );
}

function AssignmentListSkeleton() {
  return (
    <div className="learn-assignments-row-card learn-assignments-row-card--skeleton">
      <div className="learn-assignments-row-card__main">
        <div className="learn-assignments-row-card__icon-wrap">
          <Skeleton.Avatar active size={40} />
        </div>
        <div className="learn-assignments-row-card__content">
          <Skeleton.Input active size="small" style={{ width: "60%", marginBottom: 8 }} />
          <Skeleton.Input active size="small" style={{ width: "40%" }} />
        </div>
      </div>
    </div>
  );
}

export default function AssignmentsContent() {
  const router = useRouter();
  const actualLoginUser = useSelector((s) => s?.loginUser);
  const isTeacherRole = actualLoginUser?.userType === "FACULTY";

  const [assignmentList, setAssignmentList] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentContent, setAssignmentContent] = useState("");
  const [teacherView, setTeacherViewer] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [selectedViewAssignment, setSelectedViewAssignment] = useState(null);
  const [deletingAssignmentId, setDeletingAssignmentId] = useState(null);
  const deletingAssignmentRef = useRef(null);
  const [loading, setLoading] = useState(true);
  // LRN-A-02 / A-03: a failed load is its own state, not an empty list or "not submitted".
  const [listError, setListError] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const assignmentListRef = useRef([]);
  const [retryKey, setRetryKey] = useState(0);
  // LRN-A-04: "N this month" over the whole list, from the server (null on older servers).
  const [serverThisMonth, setServerThisMonth] = useState(null);
  const key = "updatable";
  const userId = actualLoginUser?.id;

  // Course filter — default "All courses" (courseSlug = null).
  const [courseSlug, setCourseSlug] = useState(null);
  const [courseOptions, setCourseOptions] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  // LRN-A-05: a failed course lookup says so next to the filter instead of the filter vanishing.
  const [coursesError, setCoursesError] = useState(false);
  const [coursesRetry, setCoursesRetry] = useState(0);
  const [page, setPage] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [submissionsByContentId, setSubmissionsByContentId] = useState(() => new Map());
  const [submissionsState, setSubmissionsState] = useState(isTeacherRole ? "ready" : "idle");

  useEffect(() => {
    if (userId == null) return;
    setCoursesLoading(true);
    // getFacultyCoursesForFilter (fetchAllCoursesByFacultyId) returns an empty list for faculty who
    // do have courses, so this dropdown always showed just "All courses" (see the identical fix in
    // Quiz/Table/table.js). getFacultyProgram hits the working teaching-assignment endpoint used
    // elsewhere in the app; one course can have several class assignments, so dedupe by slug.
    const fetchCourses = isTeacherRole
      ? getFacultyProgram({ facultyId: userId }).then((res) => {
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
      : getLearnerCoursesForFilter(userId);
    fetchCourses
      .then((list) => { setCourseOptions(Array.isArray(list) ? list : []); setCoursesError(false); })
      .catch(() => { setCourseOptions([]); setCoursesError(true); })
      .finally(() => setCoursesLoading(false));
  }, [isTeacherRole, userId, coursesRetry]);

  // Filtering to a different course invalidates the current page number.
  useEffect(() => {
    setPage(1);
  }, [courseSlug]);

  const fetchAssignments = useCallback(() => {
    if (userId == null) {
      setAssignmentList([]);
      setLoading(false);
      return;
    }
    const params = {
      ...(isTeacherRole ? { facultyId: userId } : { learnerId: userId }),
      active: true,
      enabled: true,
      page: page - 1,
      size: PAGE_SIZE,
      ...(courseSlug ? { courseSlug } : {}),
    };

    setLoading(true);
    getAllAssignments(params, isTeacherRole)
      .then((assignmentRes) => {
        const payload = assignmentRes?.data;
        // Paginated response is { content, totalElements, ... }; fall back to a plain array in
        // case this is ever called without page/size.
        const rawList = Array.isArray(payload) ? payload : (payload?.content ?? []);
        const total = Array.isArray(payload) ? rawList.length : (payload?.totalElements ?? rawList.length);
        // enabled=false (soft-deleted) rows are now excluded server-side (in the paginated SQL
        // query itself), so totalElements already matches what's in rawList — filtering again
        // here would silently drop rows from an already-paginated page without adjusting the
        // total, producing a page that visibly renders fewer rows than the count says it should.
        setAssignmentList(ensureArray(rawList));
        setTotalElements(total);
        setServerThisMonth(typeof payload?.summary?.thisMonth === "number" ? payload.summary.thisMonth : null);
        setListError(false);
      })
      .catch(() => {
        if (assignmentListRef.current.length === 0) {
          setAssignmentList([]);
          setTotalElements(0);
        }
        setListError(true);
      })
      .finally(() => setLoading(false));
  }, [userId, isTeacherRole, courseSlug, page, retryKey]);
  useEffect(() => { assignmentListRef.current = assignmentList; }, [assignmentList]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments, drawerOpen, refresh]);

  // The learner's own submissions (grades are masked server-side until published), so each card
  // can say Submitted / Graded / Overdue instead of only a created date.
  useEffect(() => {
    if (isTeacherRole || userId == null) {
      setSubmissionsByContentId(new Map());
      setSubmissionsState(isTeacherRole ? "ready" : "idle");
      return undefined;
    }
    let cancelled = false;
    setSubmissionsState("loading");
    getSubmittedAssign({ learnerId: userId })
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        const map = new Map();
        for (const item of list) {
          const key = Number(item?.lessonContentId);
          const previous = map.get(key);
          if (!previous || Number(item?.attemptNumber || 1) >= Number(previous?.attemptNumber || 1)) map.set(key, item);
        }
        setSubmissionsByContentId(map);
        setSubmissionsState("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setSubmissionsByContentId(new Map());
        setSubmissionsState("error");
      });
    return () => { cancelled = true; };
  }, [isTeacherRole, userId, drawerOpen, refresh, retryKey]);

  const uniqueCoursesCount = useMemo(() => {
    const ids = new Set(assignmentList.map((a) => a?.courseId).filter(Boolean));
    return ids.size;
  }, [assignmentList]);

  const thisMonthCount = useMemo(() => {
    if (serverThisMonth != null) return serverThisMonth;
    const now = moment();
    return assignmentList.filter((a) => {
      const at = a?.createdAt;
      if (!Array.isArray(at) || at.length < 3) return false;
      const m = moment({ year: at[0], month: (at[1] ?? 1) - 1, date: at[2] ?? 1 });
      return m.isSame(now, "month");
    }).length;
  }, [assignmentList, serverThisMonth]);

  // Popover content for metric pills
  const coursesPopover = useMemo(() => {
    const courseMap = {};
    assignmentList.forEach((a) => {
      const name = a?.courseName || a?.course_name || "Unknown";
      courseMap[name] = (courseMap[name] || 0) + 1;
    });
    const entries = Object.entries(courseMap);
    if (entries.length === 0) return null;
    return (
      <ul className="metric-popover-list">
        {entries.map(([name, count]) => (
          <li key={name} className="metric-popover-item">
            <span className="metric-popover-item__name">{name}</span>
            <span className="metric-popover-item__value">{count} {count === 1 ? "assignment" : "assignments"}</span>
          </li>
        ))}
      </ul>
    );
  }, [assignmentList]);

  const onClickViewAssignment = useCallback((record) => {
    setAssignmentContent({ record, contentTitle: record?.contentTitle, lessonContentId: record?.id });
    isTeacherRole ? setTeacherViewer(true) : setDrawerOpen(true);
  }, [isTeacherRole]);

  const thisMonthPopover = useMemo(() => {
    const now = moment();
    const items = assignmentList.filter((a) => {
      const at = a?.createdAt;
      if (!Array.isArray(at) || at.length < 3) return false;
      const m = moment({ year: at[0], month: (at[1] ?? 1) - 1, date: at[2] ?? 1 });
      return m.isSame(now, "month");
    });
    if (items.length === 0) return null;
    return (
      <ul className="metric-popover-list">
        {items.map((a) => (
          <li key={a?.id} className="metric-popover-item">
            <span className="metric-popover-item__name">{a?.contentTitle || "Untitled"}</span>
            <span className="metric-popover-item__value">{formatCreatedAt(a?.createdAt)}</span>
          </li>
        ))}
      </ul>
    );
  }, [assignmentList]);

  const onClickViewSubmissions = useCallback((assignment) => {
    setSelectedViewAssignment(assignment);
  }, []);

  const onClickViewReport = useCallback((assignment) => {
    router.push({ pathname: "/teacher/report/assignment/[contentId]", query: { contentId: assignment?.id } });
  }, [router]);

  const onClickEdit = useCallback((ele) => {
    setSelectedAssignment(ele);
    setDrawerOpen(true);
  }, []);

  const onClickCreate = useCallback(() => {
    setSelectedAssignment(null);
    setDrawerOpen(true);
  }, []);

  const onClickDelete = useCallback(async (ele) => {
    const assignmentId = ele?.id;
    if (!assignmentId || deletingAssignmentRef.current != null) return;
    const messageKey = `assignment-delete-${assignmentId}`;
    try {
      const response = await getAssignmentSubmissions({ lessonContentId: assignmentId, page: 0, size: 1 });
      const data = response?.data ?? response;
      const rows = Array.isArray(data) ? data
        : Array.isArray(data?.content) ? data.content
        : Array.isArray(data?.data?.content) ? data.data.content
        : Array.isArray(data?.data) ? data.data
        : [];
      const total = Number(data?.totalElements ?? data?.data?.totalElements ?? rows.length);
      if (total > 0) {
        messageApi.open({
          type: "warning",
          content: "This assignment has learner submissions and must be kept for assessment history.",
          duration: 3,
          key: messageKey,
        });
        return;
      }
    } catch {
      messageApi.open({
        type: "warning",
        content: "Could not verify submissions, so delete is disabled right now. Retry after the submission check succeeds.",
        duration: 3,
        key: messageKey,
      });
      return;
    }
    deletingAssignmentRef.current = assignmentId;
    setDeletingAssignmentId(assignmentId);
    setDeleteError(null);
    const NewData = {
      lesson_content_id: ele?.id,
      faculty_id: actualLoginUser?.id,
      sequence: 0,
      course_id: ele?.courseId,
      lesson_id: ele?.lessonId,
      content_type: "ASSIGNMENT",
      content_title: ele?.contentTitle,
      content_data_dto: {
        file_dto: {
          size: 0, encoding: "", mimetype: "", field_name: "", original_name: "",
          cloud_storage_object: ele?.contentDataDTO?.file_dto?.cloud_storage_object,
        },
        html_content: ele?.contentDataDTO?.html_content,
        allow_discussions: "", view_after_schedule: true, view_before_schedule: true,
        text: "", duration: 0, due_date: "", link: "", end_time: "", start_time: "",
      },
      active: true,
      enabled: false,
    };
    createLessonContent(NewData)
      .then(() => {
        messageApi.open({ type: "success", content: "Assignment deleted.", duration: 2, key: messageKey });
        setRefresh((r) => !r);
      })
      .catch((error) => {
        messageApi.destroy(messageKey);
        setDeleteError({
          record: ele,
          message: error?.response?.data?.message || error?.message || "Failed to delete assignment. Please try again.",
        });
      })
      .finally(() => {
        deletingAssignmentRef.current = null;
        setDeletingAssignmentId(null);
      });
  }, [actualLoginUser?.id, messageApi]);

  const handleViewAssignment = useCallback(async (record) => {
    onClickViewAssignment(record);
  }, [onClickViewAssignment]);

  const courseFilterSelect = (
    <>
    <Select
      value={courseSlug ?? ""}
      onChange={(v) => setCourseSlug(v || null)}
      loading={coursesLoading}
      placeholder="All courses"
      allowClear
      style={{ minWidth: 200 }}
      className="learn-assignments-course-filter"
      options={[
        { label: "All courses", value: "" },
        ...courseOptions.map((c) => ({ label: c.courseName || c.slug, value: c.slug })),
      ]}
    />
    {coursesError && (
      <Button type="link" size="small" onClick={() => setCoursesRetry((n) => n + 1)}>Couldn&apos;t load your courses · Retry</Button>
    )}
    </>
  );

  const pageClasses =`scroll-container learn-assignments-page learn-assignments-page--placements learn-placements-dashboard${isTeacherRole ? " teacher-assignments-page" : ""}`;

  // Loading state. PageShell (see src/components/Common/PageShell.jsx) already provides the
  // outer card; this used to wrap its own ln-module-card around the same content a second time.
  if (loading && assignmentList.length === 0) {
    return (
      <div className={pageClasses}>
        <PageShell>
          <ListingPageHeader
            title={<Skeleton.Input active style={{ width: 160, height: 28 }} />}
            metrics={
              <>
                <Skeleton.Button active size="small" style={{ width: 120, height: 28, borderRadius: 8 }} />
                <Skeleton.Button active size="small" style={{ width: 90, height: 28, borderRadius: 8 }} />
              </>
            }
          />
          <section className="learn-assignments-grid-section">
            <ul className="learn-assignments-list">
              {[1, 2, 3, 4, 5].map((i) => (
                <li key={i} className="learn-assignments-list__item">
                  <AssignmentListSkeleton />
                </li>
              ))}
            </ul>
          </section>
        </PageShell>
      </div>
    );
  }

  // Load failure: its own state with Retry, never "No assignments yet" (LRN-A-02).
  if (listError && assignmentList.length === 0) {
    return (
      <div className={pageClasses}>
        {contextHolder}
        <PageShell>
          <ListingPageHeader title={isTeacherRole ? "My Assignments" : "All Assignments"} ariaLabel="Assignments overview" />
          <section className="learn-assignments-grid-section">
            <div className="learn-assignments-empty" role="alert">
              <h4 className="learn-assignments-empty__title ln-lto-bold">Assignments could not be loaded</h4>
              <p className="learn-assignments-empty__subtitle ln-lto-reg">This is a loading problem, not an empty list. Check your connection and try again.</p>
              <Button type="primary" onClick={() => setRetryKey((k) => k + 1)}>Retry</Button>
            </div>
          </section>
        </PageShell>
      </div>
    );
  }

  // Empty state
  if (assignmentList.length === 0) {
    return (
      <div className={pageClasses}>
        {contextHolder}
        {selectedViewAssignment && (
          <ViewSubmissionsModal selectedViewAssignment={selectedViewAssignment} open={!!selectedViewAssignment} onClose={() => setSelectedViewAssignment(null)} />
        )}
        <PageShell>
          <ListingPageHeader
            title={isTeacherRole ? "My Assignments" : "All Assignments"}
            ariaLabel="Assignments overview"
            rightContent={
              <>
                {courseFilterSelect}
                {isTeacherRole && (
                  <button type="button" className="listing-page-create-btn" onClick={onClickCreate}>
                    <PlusOutlined /> Create Assignment
                  </button>
                )}
              </>
            }
          />
          <section className="learn-assignments-grid-section">
            <div className="learn-assignments-empty learn-assignments-empty--rich">
              <div className="learn-assignments-empty__illustration"><AssignmentsEmptyIllustration /></div>
              <FileTextOutlined className="learn-assignments-empty__icon" />
              <h4 className="learn-assignments-empty__title ln-lto-bold">No assignments yet</h4>
              <p className="learn-assignments-empty__subtitle ln-lto-reg">
                {isTeacherRole ? "Create your first assignment to get started." : "Your assignments will appear here once your teachers add them."}
              </p>
              {isTeacherRole && (
                <Button type="primary" size="middle" className="learn-assignments-empty__cta" icon={<PlusOutlined />} onClick={onClickCreate}>
                  Create your first assignment
                </Button>
              )}
            </div>
          </section>
        </PageShell>
        {isTeacherRole && drawerOpen && (
          <DrawerAssignment open={drawerOpen} editSelectedAssignment={selectedAssignment} prevAssignments={assignmentList} onClose={() => { setDrawerOpen(false); setSelectedAssignment(null); }} />
        )}
        {((!isTeacherRole && drawerOpen) || teacherView) && (
          <ViewAssignmentDrawer open={drawerOpen || teacherView} onClose={() => { setDrawerOpen(false); setTeacherViewer(false); }} assignmentContent={assignmentContent} />
        )}
      </div>
    );
  }

  // Main content
  return (
    <div className={pageClasses}>
      {contextHolder}
      {selectedViewAssignment && (
        <ViewSubmissionsModal selectedViewAssignment={selectedViewAssignment} open={!!selectedViewAssignment} onClose={() => setSelectedViewAssignment(null)} />
      )}
      {isTeacherRole && drawerOpen && (
        <DrawerAssignment open={drawerOpen} editSelectedAssignment={selectedAssignment} prevAssignments={assignmentList} onClose={() => { setDrawerOpen(false); setSelectedAssignment(null); }} />
      )}
      {((!isTeacherRole && drawerOpen) || teacherView) && (
        <ViewAssignmentDrawer open={drawerOpen || teacherView} onClose={() => { setDrawerOpen(false); setTeacherViewer(false); }} assignmentContent={assignmentContent} />
      )}
      <PageShell>
        <ListingPageHeader
          title={isTeacherRole ? "My Assignments" : "All Assignments"}
          ariaLabel="Assignments overview"
          metrics={
              <>
                <MetricPill
                  icon={<FileTextOutlined />}
                  label={`${totalElements} ${totalElements === 1 ? "Assignment" : "Assignments"}`}
                  variant="teal"
                />
                {isTeacherRole && uniqueCoursesCount > 0 && (
                  <MetricPill
                    icon={<BookOutlined />}
                    label={`${uniqueCoursesCount} ${uniqueCoursesCount === 1 ? "Course" : "Courses"}`}
                    variant="green"
                    popoverTitle="Assignments by Course"
                    popover={coursesPopover}
                  />
                )}
                {!isTeacherRole && thisMonthCount > 0 && (
                  <MetricPill
                    icon={<CalendarOutlined />}
                    label={`${thisMonthCount} this month`}
                    variant="amber"
                    popoverTitle="This Month's Assignments"
                    popover={thisMonthPopover}
                  />
                )}
              </>
            }
            rightContent={
              <>
                {courseFilterSelect}
                {isTeacherRole && (
                  <button type="button" className="listing-page-create-btn" onClick={onClickCreate}>
                    <PlusOutlined /> Create Assignment
                  </button>
                )}
              </>
            }
          />
          {deleteError ? (
            <Alert
              type="error"
              showIcon
              message="Assignment was not deleted"
              description={deleteError.message}
              action={assignmentList.some((item) => Number(item.id) === Number(deleteError.record?.id)) ? (
                <Button size="small" onClick={() => onClickDelete(deleteError.record)} disabled={deletingAssignmentId != null}>
                  Retry delete
                </Button>
              ) : null}
              closable
              onClose={() => setDeleteError(null)}
              style={{ marginBottom: 12 }}
            />
          ) : null}
          {loading && assignmentList.length > 0 && <RefreshStatus label="Refreshing assignments…" />}
          {listError && assignmentList.length > 0 && (
            <Alert
              type="warning"
              showIcon
              message="Couldn't refresh assignments"
              description="Showing the last assignments we loaded."
              action={<Button size="small" onClick={() => setRetryKey((k) => k + 1)}>Retry</Button>}
              style={{ marginBottom: 12 }}
            />
          )}
          <section className="learn-assignments-grid-section" aria-label="Assignment list">
            {!isTeacherRole && submissionsState === "error" && (
              <Alert
                type="warning"
                showIcon
                className="mb-3"
                message="Submission status is temporarily unavailable"
                description="We couldn't verify which assignments you have already submitted. Open an assignment to retry before submitting anything."
                action={<Button size="small" onClick={() => setRetryKey((k) => k + 1)}>Retry</Button>}
              />
            )}
            <ul className="learn-assignments-list">
              {assignmentList.map((record) => (
                <li key={record.id} className="learn-assignments-list__item">
                  <AssignmentListItem
                    record={record}
                    isTeacher={isTeacherRole}
                    submission={submissionsByContentId.get(Number(record?.id ?? record?.lessonContentId))}
                    submissionState={submissionsState}
                    onView={handleViewAssignment}
                    onViewSubmissions={onClickViewSubmissions}
                    onViewReport={onClickViewReport}
                    onEdit={onClickEdit}
                    onDelete={onClickDelete}
                    deleting={Number(deletingAssignmentId) === Number(record?.id)}
                    deleteDisabled={deletingAssignmentId != null}
                  />
                </li>
              ))}
            </ul>
            {totalElements > PAGE_SIZE && (
              <div style={{ marginTop: 20, textAlign: "center" }}>
                <Pagination
                  current={page}
                  pageSize={PAGE_SIZE}
                  total={totalElements}
                  onChange={setPage}
                  showSizeChanger={false}
                />
              </div>
            )}
          </section>
      </PageShell>
    </div>
  );
}
