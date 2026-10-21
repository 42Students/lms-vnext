import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  BookOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  RiseOutlined,
  FormOutlined,
  BarChartOutlined,
  ExclamationCircleOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import { getCourse, getCourseBySlug } from "@/api/Services/courseServices";
import { useRouter } from "next/router";
import {
  InThisCourseSection,
  UnifiedActivityList,
  AtRiskStudentsCard,
  PerformanceCard,
} from "@/components/Course/Home";
import { useCourseHomeWidgets } from "@/hooks/useCourseHomeWidgets";
import { useLearnerHomeStats } from "@/hooks/useLearnerHomeStats";
import { useFacultyCourseStats } from "@/hooks/useFacultyCourseStats";
import { getFacultyBasePath } from "@/utils/facultyRouteUtils";

const getContentType = (item) => String(item?.contentType ?? item?.content_type ?? "").toUpperCase();

// Zero is a number and renders as one. It used to render as a word ('Open' / 'Clear'), which
// meant the value slot mixed vocabularies and 'Open' as a live-session count said nothing.
const formatCount = (value) => String(Number(value) > 0 ? value : 0);

const formatPercent = (value, fallback = "--") => (value == null ? fallback : `${value}%`);

const Home = () => {
  const router = useRouter();
  const loginUser = useSelector((state) => state.loginUser);
  const course = useSelector((state) => state.course);
  const isTeacherRole = loginUser?.userType === "FACULTY";
  const [courseDetails, setCourseDetails] = useState(null);
  const [courseDetailsLoading, setCourseDetailsLoading] = useState(false);
  const [courseDetailsError, setCourseDetailsError] = useState(null);

  const courseIdentifier = course?.selectedCourseSlug ?? (course?.selectedCourseId != null ? String(course.selectedCourseId) : null);

  const {
    deadlines,
    announcements,
    sessions,
    loading: widgetsLoading,
    error: widgetsError,
    hasDeadlines,
    hasAnnouncements,
    hasSessions,
    missingClassId,
  } = useCourseHomeWidgets({
    courseSlug: course?.selectedCourseSlug,
    courseId: course?.selectedCourseId,
    classId: loginUser?.classId,
    isLearner: !isTeacherRole,
  });

  const { data: learnerStats, loading: statsLoading, error: statsError } = useLearnerHomeStats(
    isTeacherRole ? null : {
      courseSlug: course?.selectedCourseSlug,
      courseId: course?.selectedCourseId,
    }
  );

  const facultyStats = useFacultyCourseStats({
    courseSlug: course?.selectedCourseSlug,
    courseId: course?.selectedCourseId,
    classId: loginUser?.classId,
    facultyId: loginUser?.id,
    enabled: isTeacherRole,
  });

  const showActivity = hasDeadlines || hasAnnouncements || hasSessions || widgetsLoading;

  useEffect(() => {
    const slug = course?.selectedCourseSlug;
    const id = course?.selectedCourseId;
    if (!slug && !id) {
      setCourseDetails(null);
      setCourseDetailsLoading(false);
      setCourseDetailsError(null);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    const fetchCourse = async () => {
      setCourseDetailsLoading(true);
      setCourseDetailsError(null);
      try {
        const res = slug
          ? await getCourseBySlug(slug, { signal: controller.signal })
          : await getCourse({ courseId: id }, { signal: controller.signal });
        if (cancelled) return;
        const details = res?.data?.data ?? res?.data ?? null;
        setCourseDetails(details);
        if (!details) {
          setCourseDetailsError("Course details are currently unavailable.");
        }
      } catch (e) {
        if (cancelled || e?.code === 'ERR_CANCELED') return;
        setCourseDetails(null);
        setCourseDetailsError("Failed to load course details.");
      } finally {
        if (!cancelled) setCourseDetailsLoading(false);
      }
    };

    fetchCourse();
    return () => { cancelled = true; controller.abort(); };
  }, [course?.selectedCourseSlug, course?.selectedCourseId]);

  // A card's value slot must never show a measured-looking number before the measurement exists.
  // Reliability matters too: a failed source is "unknown", never zero.
  const statsPending = isTeacherRole ? Boolean(facultyStats.loading) : Boolean(statsLoading);
  const facultySubmissionSignalsReliable = Boolean(
    !facultyStats.error && facultyStats.submissionsReliable
  );
  const facultyAttendanceSignalsReliable = Boolean(
    !facultyStats.error && facultyStats.attendanceReliable && facultyStats.studentsReliable
  );

  const aboutMeta = courseDetails?.meta_data ?? courseDetails?.metaData;
  const hasAboutContent = Boolean(
    aboutMeta?.introduction_content ||
    aboutMeta?.html_content ||
    aboutMeta?.htmlContent ||
    (Array.isArray(aboutMeta?.takeaways) && aboutMeta.takeaways.length > 0) ||
    aboutMeta?.credits ||
    courseDetails?.credits ||
    courseDetails?.faculty?.name
  );

  // Neither role has standalone lectures/resources/assessments/live-sessions routes anymore —
  // those all redirect to the unified content view (roadmap for learners, blueprint for faculty).
  // Sending every card to a bare roadmap/blueprint made them behave identically, so instead each
  // one deep-links to its own slice via ?filter=, which that view seeds from.
  const FILTERED_TABS = new Set(["lectures", "resources", "assessments", "live-sessions"]);

  const routeToCourseTab = (tab, extraParams) => {
    if (!courseIdentifier) return;
    let routeTab = tab === "attendance" ? "attendanceDetail" : tab;
    const basePath = isTeacherRole
      ? `${getFacultyBasePath(router.pathname, loginUser?.facultyType)}/courses`
      : "/learn/courses";

    const params = new URLSearchParams(router.asPath.split("?")[1] ?? "");
    params.delete("filter");
    if (FILTERED_TABS.has(routeTab)) {
      params.set("filter", routeTab);
      routeTab = isTeacherRole ? "blueprint" : "roadmap";
    }
    if (extraParams) {
      Object.entries(extraParams).forEach(([key, value]) => {
        if (value != null) params.set(key, value);
      });
    }
    const qs = params.toString() ? `?${params.toString()}` : "";
    router.push(`${basePath}/${encodeURIComponent(courseIdentifier)}/${routeTab}${qs}`);
  };

  // Pick a specific submission to land on: "Review work" used to always drop the faculty
  // member on the unfiltered Assessments list, forcing them to re-find whichever assignment
  // actually had pending grades. If we know which content has ungraded submissions, deep-link
  // straight to it via the same ?lesson=&content= params syllabus.js already reads to focus
  // a single item; otherwise fall back to the generic filtered list.
  const firstPendingContent = useMemo(() => {
    const contents = facultyStats.submissionStats?.contents;
    if (!Array.isArray(contents)) return null;
    return contents.find((c) => (c?.ungraded ?? 0) > 0 && c?.lessonId != null) ?? null;
  }, [facultyStats.submissionStats]);

  const nextAction = useMemo(() => {
    if (isTeacherRole) {
      if (facultyStats.loading) {
        return {
          eyebrow: "Checking course signals",
          title: "Loading pending work",
          detail: "We are checking submissions and attendance before showing a status.",
          tab: "lectures",
          label: "Open course content",
          icon: <BookOutlined />,
        };
      }
      if (!facultySubmissionSignalsReliable) {
        return {
          eyebrow: "Status unavailable",
          title: "Pending work could not be verified",
          detail: "Submission signals are incomplete. You can still open the course content while they are retried.",
          tab: "lectures",
          label: "Open course content",
          icon: <ExclamationCircleOutlined />,
        };
      }
      if (facultyStats.pendingToGrade > 0) {
        return {
          eyebrow: "Needs review",
          title: `${facultyStats.pendingToGrade} submission${facultyStats.pendingToGrade === 1 ? "" : "s"} waiting`,
          detail: "Review pending learner work before it piles up.",
          tab: "assessments",
          label: "Review work",
          icon: <FormOutlined />,
          routeParams: firstPendingContent
            ? { lesson: firstPendingContent.lessonId, content: firstPendingContent.id }
            : null,
        };
      }
      return {
        eyebrow: "All clear",
        title: "Nothing waiting on you",
        detail: "No submissions pending review. Jump back into the course content.",
        tab: "lectures",
        label: "Open course content",
        icon: <BookOutlined />,
      };
    }

    if (deadlines?.length > 0) {
      const deadline = deadlines[0];
      return {
        eyebrow: "Due soon",
        title: deadline?.title || deadline?.contentTitle || "Assessment pending",
        detail: deadline?.dueLabel || deadline?.dueDateLabel || "Complete the pending task.",
        tab: "assessments",
        label: "Open task",
        icon: <ClockCircleOutlined />,
      };
    }

    if (sessions?.length > 0) {
      const session = sessions[0];
      return {
        eyebrow: "Upcoming live session",
        title: session?.title || session?.classTitle || "Live class scheduled",
        detail: session?.startLabel || session?.dateLabel || "Join from the live sessions tab.",
        tab: "live-sessions",
        label: "View session",
        icon: <CalendarOutlined />,
      };
    }

    if (learnerStats?.nextContent) {
      const type = getContentType(learnerStats.nextContent);
      const tab = type === "RESOURCE" ? "resources" : "lectures";
      return {
        eyebrow: "Next up",
        title: learnerStats.nextContent?.title || learnerStats.nextContent?.contentTitle || "Next lesson item",
        detail: "Continue from the next pending item.",
        tab,
        label: "Continue",
        icon: <PlayCircleOutlined />,
        // #3: this used to land on the roadmap's Lectures/Resources filter with nothing opened --
        // the exact item was never identified, just the section it lives in. syllabus.js already
        // has a full ?lesson=&content= deep-link handler (finds the lesson, opens it, focuses the
        // matching content item) -- useCourseHomeWidgets.js's own "continue" link already relies
        // on it. This card was simply never passing those params.
        routeParams: {
          lesson: learnerStats.nextContent?.lessonId,
          content: learnerStats.nextContent?.contentId,
        },
      };
    }

    return {
      eyebrow: "Start here",
      title: "Begin with the first lecture",
      detail: "Open lectures to start the course in sequence.",
      tab: "lectures",
      label: "Start learning",
      icon: <PlayCircleOutlined />,
    };
  }, [isTeacherRole, facultyStats.loading, facultySubmissionSignalsReliable, facultyStats.pendingToGrade, firstPendingContent, deadlines, sessions, learnerStats]);


  // At-risk Students and Performance used to live in this same flat grid as one-number buttons --
  // both have real computed depth (named students with reasons; a full grade distribution) that a
  // single number threw away. They're now their own rich cards below (AtRiskStudentsCard,
  // PerformanceCard); Reviews and Attendance stay here since a single count is genuinely all
  // there is to say about either one.
  const facultyPriorityCards = useMemo(() => {
    const attendanceAverage = facultyStats.attendanceStats?.avgPercent;
    const recentSessions = facultyStats.attendanceStats?.totalSessions ?? 0;

    return [
      {
        title: "Reviews",
        value: facultySubmissionSignalsReliable ? formatCount(facultyStats.pendingToGrade) : "—",
        subtitle: !facultySubmissionSignalsReliable
          ? "Submission status unavailable"
          : facultyStats.pendingToGrade > 0
            ? "Submissions need grading"
            : "No pending grading right now",
        tab: "assessments",
        icon: <FormOutlined />,
        tone: !facultySubmissionSignalsReliable ? "neutral" : facultyStats.pendingToGrade > 0 ? "warning" : "success",
      },
      {
        title: "Attendance",
        value: facultyAttendanceSignalsReliable ? formatPercent(attendanceAverage) : "—",
        subtitle: !facultyAttendanceSignalsReliable
          ? "Attendance status unavailable"
          : recentSessions > 0
            ? `${recentSessions} recent class sessions tracked`
            : "No attendance sessions tracked yet",
        tab: "attendance",
        icon: <BarChartOutlined />,
        tone: facultyAttendanceSignalsReliable && attendanceAverage != null && attendanceAverage < 75 ? "warning" : "neutral",
      },
    ];
  }, [facultyStats, facultySubmissionSignalsReliable, facultyAttendanceSignalsReliable]);

  // Structure mirrors ProjectDetailContent's Overview tab exactly: a sr-only heading (the pill
  // tab above already says "Overview" — repeating it as a visible H2 here is the same duplicate
  // signal Projects' own OV-20 fix removed) + a visible subtitle, then one content card housing
  // everything else. The page previously rendered its own full ln-module-card shell here, which
  // double-boxed inside CourseTabsLayout's new learn-projects__shell card.
  return (
    <div className="learn-projects-detail learn-course-home learn-course-home--placements">
      <div className="learn-projects-detail__page-head">
        <div>
          <h3 className="learn-projects-detail__page-head-title--sr-only">Overview</h3>
          {!isTeacherRole && (
            <p className="learn-projects-detail__page-head-subtitle">
              See progress, next steps, and updates for this course at a glance.
            </p>
          )}
        </div>
      </div>
      <div className="learn-projects-detail__body">
        <section className="learn-projects-detail__content learn-placements-dashboard__body">

          {/* Wrapper is conditional: InThisCourseSection returns null when a course has no
              metadata, and rendering the bordered/padded card around nothing produced an empty
              box under the page title — the most likely state for a newly rolled-out course. */}
          {(hasAboutContent || courseDetailsLoading || courseDetailsError) && (
          <div className="ln-module-card learn-placements-section-card learn-course-home__about-card">
            {courseDetailsError && (
              <div className="fcd-alert-item fcd-alert-item--amber" role="status" style={{ marginBottom: "0.75rem" }}>
                <ExclamationCircleOutlined />
                <span>{courseDetailsError}</span>
              </div>
            )}
            <InThisCourseSection
              introductionContent={
                courseDetails?.meta_data?.introduction_content ?? courseDetails?.metaData?.introduction_content
              }
              htmlContent={
                courseDetails?.meta_data?.html_content ??
                courseDetails?.meta_data?.htmlContent ??
                courseDetails?.metaData?.html_content ??
                courseDetails?.metaData?.htmlContent
              }
              takeaways={courseDetails?.meta_data?.takeaways ?? courseDetails?.metaData?.takeaways}
              credits={
                courseDetails?.meta_data?.credits ?? courseDetails?.metaData?.credits ?? courseDetails?.credits
              }
              instructor={courseDetails?.faculty?.name}
              loading={!!courseIdentifier && courseDetailsLoading}
            />
          </div>
          )}

          <section className="learn-course-home-command" aria-label="Next action">
            <div
              className="ln-module-card learn-placements-section-card learn-course-home-command__next"
            >
              <div className="learn-course-home-command__copy">
                <div className="learn-course-home-command__eyebrow">
                  {nextAction.eyebrow}
                </div>
                <h3 className="ln-lto-bold learn-course-home-command__title">
                  {nextAction.title}
                </h3>
                <p className="learn-course-home-command__detail">
                  {nextAction.detail}
                </p>
              </div>
              <Button
                type="primary"
                size="large"
                icon={nextAction.icon}
                onClick={() => routeToCourseTab(nextAction.tab, nextAction.routeParams)}
                disabled={!courseIdentifier}
                title={!courseIdentifier ? "Loading course…" : undefined}
                className="learn-course-home-command__button"
              >
                {nextAction.label}
              </Button>
            </div>

          </section>

          {(facultyStats.error || Object.values(facultyStats.sourceErrors || {}).some(Boolean)) && isTeacherRole && !facultyStats.loading && (
            <div className="ln-module-card learn-placements-section-card learn-course-home__activity-card">
              <div className="fcd-alert-item fcd-alert-item--amber" role="status">
                <ExclamationCircleOutlined />
                <span>
                  {facultyStats.error
                    ? "Faculty course signals could not be loaded. You can still use the other course tabs."
                    : `Some faculty course signals are incomplete (${Object.entries(facultyStats.sourceErrors || {}).filter(([, failed]) => failed).map(([name]) => name).join(", ")}). Unknown metrics are shown as unavailable, not zero.`}
                </span>
                <Button size="small" onClick={() => facultyStats.refetch?.()}>Retry signals</Button>
              </div>
            </div>
          )}

          {statsError && !isTeacherRole && (
            <div className="ln-module-card learn-placements-section-card learn-course-home__activity-card">
              <div className="fcd-alert-item fcd-alert-item--amber" role="status">
                <ExclamationCircleOutlined />
                <span>Progress could not be loaded. You can still open course content.</span>
              </div>
            </div>
          )}

          <section className="learn-course-home__content">
            {isTeacherRole && (
              <section className="learn-course-home-section" aria-label="Pending work">
                <div className="learn-course-home-section__head">
                  <div>
                    <h3 className="learn-course-home-section__title ln-lto-bold">Pending work</h3>
                    <p className="learn-course-home-section__subtitle">Items that need faculty attention.</p>
                  </div>
                </div>
                <div className="learn-course-home-priorities">
                  {facultyPriorityCards.map((card) => (
                    <button
                      key={card.title}
                      type="button"
                      onClick={() => routeToCourseTab(card.tab)}
                      disabled={!courseIdentifier}
                      title={!courseIdentifier ? "Loading course…" : undefined}
                      className={`ln-module-card learn-placements-section-card learn-course-home-priorities__card learn-course-home-priorities__card--${card.tone}`}
                    >
                      <span className="learn-course-home-priorities__icon">{card.icon}</span>
                      <span className="learn-course-home-priorities__content">
                        <strong className="learn-course-home-priorities__title">{card.title}</strong>
                        <span className="learn-course-home-priorities__subtitle">{card.subtitle}</span>
                      </span>
                      {statsPending ? (
                        <span className="learn-course-home-map__value-skeleton" aria-hidden="true" />
                      ) : (
                        <span className="learn-course-home-priorities__value">{card.value}</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Faculty previously had NO activity feed at all — the whole section was gated
                    on !isTeacherRole — so the higher-value user's page was eight near-identical
                    rectangles and nothing else. Meanwhile useFacultyCourseStats already computes
                    atRiskStudents WITH names and reasons, and a full grade distribution for
                    performance, both of which a single stat-button count threw away. */}
                <div className="learn-course-home-insights">
                  <AtRiskStudentsCard
                    students={[...(facultyStats.atRiskStudents ?? [])].sort((a, b) => (b.severity ?? 0) - (a.severity ?? 0))}
                    loading={statsPending}
                    onViewAll={() => routeToCourseTab("students")}
                    studentAverages={facultyStats.performanceStats?.studentAverages ?? []}
                  />
                  <PerformanceCard
                    stats={facultyStats.performanceStats}
                    loading={statsPending}
                    onViewAll={() => routeToCourseTab("assessments")}
                  />
                </div>
              </section>
            )}

            {!isTeacherRole && widgetsError && (
              <div className="ln-module-card learn-placements-section-card learn-course-home__activity-card">
                <div className="fcd-alert-item fcd-alert-item--amber" role="status">
                  <ExclamationCircleOutlined />
                  <span>Some activity widgets could not be loaded. Please refresh to retry.</span>
                </div>
              </div>
            )}

            {!isTeacherRole && missingClassId && (
              <div className="ln-module-card learn-placements-section-card learn-course-home__activity-card">
                <p style={{ color: '#888', textAlign: 'center', padding: '2rem' }}>
                  Your class assignment is pending. Please contact your administrator.
                </p>
              </div>
            )}

            {!isTeacherRole && !missingClassId && showActivity && (
              <div id="activity" className="ln-module-card learn-placements-section-card learn-course-home__activity-card">
                <UnifiedActivityList
                  deadlines={deadlines}
                  announcements={announcements}
                  sessions={sessions}
                  loading={widgetsLoading}
                  courseIdentifier={courseIdentifier}
                />
              </div>
            )}

          </section>
        </section>
      </div>
    </div>
  );
};

export default React.memo(Home);
