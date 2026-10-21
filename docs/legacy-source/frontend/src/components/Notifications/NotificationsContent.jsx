import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Alert, Button, Tag, Typography, Skeleton, Modal } from "antd";
import useLearnerClassScope from "@/hooks/useLearnerClassScope";

import {
  BellOutlined,
  BookOutlined,
  NotificationOutlined,
  SolutionOutlined,
  ProjectOutlined,
  BankOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import PageShell from "@/components/Common/PageShell";
import { RefreshStatus } from "@/components/Common/Skeletons";
import { PanelEmpty, PanelError, PanelPartial } from "@/components/Common/PanelStates";
import { Markup } from "interweave";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import { getAllNotificationByClassId, getNotificationsForRecipient } from "@/api/Services/UserServices";
import { getAnnouncementsForLearner, fetchAllTypesAnnouncement } from "@/api/Services/notificationService";
import { getCourseName } from "@/api/Services/courseServices";
import { isLearnerRole, isFacultyRole } from "@/utils/roleUtils";
import { ensureArray } from "@/utils/learnerApiUtils";
import { formatNotificationDate } from "@/utils/notificationDateUtils";
import { getFacultyBasePath } from "@/utils/facultyRouteUtils";
import { getNotificationTypeConfig, NOTIFICATION_TYPE_CONFIG } from "@/utils/notificationTypeUtils";

const { Text } = Typography;

const NOTIFICATION_ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'span'];
const NOTIFICATION_ALLOWED_ATTRS = { a: ['href', 'target', 'rel'] };

const LEARNER_TAB_LABELS = {
  course: "Course",
  project: "Project",
  general: "Announcement",
  job: "Job",
};

const FACULTY_TAB_LABELS = {
  college: "College",
  department: "Department",
  faculty: "Faculty",
  personal: "Personal",
};

function getTypeTag(record) {
  // This page's original ultimate fallback (a record with no recognized type/receiverType and no
  // course_id) was GENERAL's purple "Announcement" tag, not the shared helper's plainer default —
  // preserve that here explicitly rather than silently inheriting the dropdown's fallback.
  const config = getNotificationTypeConfig(record, NOTIFICATION_TYPE_CONFIG.GENERAL);
  return <Tag color={config.color}>{config.label}</Tag>;
}

// Resolve a "View" navigation target for a notification's detail modal, reusing the same
// identifying fields the header dropdown (NotifivationDropdown.js) already uses for
// job/interview/application types. Course notifications carry a real course_id/course_slug so
// they can link out too. PROJECT notifications currently carry only classId + a text
// context_label (project title) — no project/workspace id — so there is no safe, correct deep
// link to build for them without a backend change; they intentionally fall through to null here
// rather than guessing at a link that could point at the wrong workspace.
function getNotificationDeepLink(record, { isLearner, facultyType, pathname }) {
  if (!record) return null;

  // Only commit to the assessment-URL branch once the URL actually passes the scheme check —
  // otherwise this returned a "Take Assessment" button whose onClick silently no-op'd on a
  // malformed/relative URL, with no fallback to the applicationId link below (unlike the header
  // dropdown's version of this same logic in NotifivationDropdown.js, which this was modeled on).
  const assessmentUrlRaw = record?.assessment_url ?? record?.assessmentUrl;
  const assessmentUrl = assessmentUrlRaw != null && /^https?:\/\//i.test(String(assessmentUrlRaw).trim())
    ? String(assessmentUrlRaw).trim()
    : null;
  if (assessmentUrl) {
    return {
      label: "Take Assessment",
      onClick: () => window.open(assessmentUrl, "_blank", "noopener,noreferrer"),
    };
  }

  const interviewId = record?.interview_id ?? record?.interviewId;
  if (interviewId != null && isLearner) {
    return {
      label: "View Interview",
      onClick: (router) => router.push("/learn/my-placements/schedule"),
    };
  }

  const applicationId = record?.application_id ?? record?.applicationId;
  if (applicationId != null && isLearner) {
    return {
      label: "View in My Applications",
      onClick: (router) => router.push(`/learn/my-placements/applications?applicationId=${applicationId}`),
    };
  }

  const courseId = record?.course_id ?? record?.courseId;
  if (courseId != null && courseId !== 0) {
    return {
      label: "View Course",
      onClick: (router) => {
        const base = isLearner ? "/learn/courses" : `${getFacultyBasePath(pathname, facultyType)}/courses`;
        router.push(`${base}/${courseId}`);
      },
    };
  }

  return null;
}

function getContextDisplay(record) {
  const ctx = record?.context_label || record?.contextLabel;
  if (ctx && typeof ctx === "string") return ctx;
  const courseName = record?.courseName;
  if (courseName != null) {
    if (typeof courseName === "string") return courseName;
    if (typeof courseName === "object")
      return courseName?.courseName ?? courseName?.course_name ?? courseName?.shortTitle ?? "—";
  }
  const receiverType = record?.receiverType || record?.receiver_type;
  const labels = {
    COLLEGE: "College-wide",
    DEPARTMENT: "Department",
    PROGRAM: "Program",
    CLASS: "Class",
    LEARNER: "Student",
    FACULTY: "Faculty",
  };
  return labels[receiverType] || "—";
}

// Learner tabs group by content domain (course/project/announcement/job).
function getLearnerTabCategory(record) {
  const type = record?.notification_type || record?.notificationType;
  if (type === "JOB") return "job";
  if (type === "COURSE" || record?.course_id > 0 || record?.courseId > 0) return "course";
  if (type === "PROJECT") return "project";
  if (type === "SYSTEM") return "general";
  return "general";
}

// Faculty tabs group by announcement scope, plus a "personal" tab for the separate
// Notification-table (recipient-scoped) source — distinguished by having a notification_type at
// all (Announcement records never carry one).
function getFacultyTabCategory(record) {
  if (record?.notification_type || record?.notificationType) return "personal";
  const t = record?.receiverType || record?.receiver_type;
  if (t === "COLLEGE") return "college";
  if (t === "DEPARTMENT") return "department";
  if (t === "FACULTY") return "faculty";
  return "other";
}

async function enrichWithCourseNames(rawList) {
  const list = ensureArray(rawList);

  const uniqueCourseIds = [
    ...new Set(
      list
        .filter(
          (item) =>
            item &&
            typeof item === "object" &&
            !(item.context_label || item.contextLabel) &&
            !(item.course_name || item.courseName) &&
            (item.course_id ?? item.courseId) != null &&
            (item.course_id ?? item.courseId) !== 0
        )
        .map((item) => item.course_id ?? item.courseId)
    ),
  ];

  const courseNameMap = {};
  await Promise.all(
    uniqueCourseIds.map(async (id) => {
      try {
        const res = await getCourseName({ courseId: id });
        courseNameMap[id] = res?.data ?? null;
      } catch {
        /* ignore individual failures */
      }
    })
  );

  return list.map((item) => {
    if (!item || typeof item !== "object") return { courseName: null };
    const hasContextLabel = !!(item.context_label || item.contextLabel);
    if (hasContextLabel) {
      return { ...item, courseName: item.context_label || item.contextLabel };
    }
    // LRN-N-04: the server now sends course_name, resolved in one batch.
    if (typeof (item.course_name ?? item.courseName) === "string") {
      return { ...item, courseName: item.course_name ?? item.courseName };
    }
    const courseId = item.course_id ?? item.courseId;
    return {
      ...item,
      courseName: courseId != null && courseId !== 0 ? (courseNameMap[courseId] ?? null) : null,
    };
  });
}

function announcementToNotificationItem(a) {
  if (!a || typeof a !== "object") return null;
  const receiverLabels = {
    COLLEGE: "College",
    DEPARTMENT: "Department",
    PROGRAM: "Program",
    CLASS: "Class",
    LEARNER: "Personal",
  };
  const receiverType = a.receiverType || a.receiver_type;
  return {
    ...a,
    id: a.id ?? `announcement-${a.created_at?.join?.("-") ?? Date.now()}`,
    title: a.title || "Announcement",
    message: a.message || "",
    created_at: a.created_at ?? a.createdAt,
    context_label: receiverLabels[receiverType] || receiverType || "Announcement",
    contextLabel: receiverLabels[receiverType] || receiverType || "Announcement",
    notificationType: "GENERAL",
    _source: "lms_announcement",
  };
}

// The merged list interleaves rows from two independent tables (`notification` and
// `announcements`), each with its own auto-increment id sequence starting at 1 — sorting or
// keying by raw `id` alone conflates the two (a brand-new announcement with id=3 sorted/keyed
// against a year-old notification with id=500 as if they shared one namespace). `_source`
// (tagged on every item at merge time) disambiguates both the list key and, since a real
// created_at is what "newest first" actually means, the sort order.
function getSourceTag(record) {
  return record?._source || "lms_notification";
}

function getRecordSortKey(record) {
  return `${getSourceTag(record)}-${record?.id ?? "unknown"}`;
}

function getRecordTimestamp(record) {
  const created = record?.created_at ?? record?.createdAt;
  if (Array.isArray(created) && created.length >= 3) {
    const [year, month0, day] = created;
    return new Date(year, month0, day).getTime();
  }
  if (typeof created === "string") {
    const parsed = new Date(created);
    if (!Number.isNaN(parsed.getTime())) return parsed.getTime();
  }
  return 0;
}

function NotificationsEmptyIllustration() {
  return (
    <svg viewBox="0 0 120 80" className="learn-notifications-empty-illus" aria-hidden>
      <defs>
        <linearGradient id="notifEmptyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#26bac7" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#d97706" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="32" r="24" fill="url(#notifEmptyGrad)" stroke="#26bac7" strokeWidth="1.5" strokeOpacity="0.35" />
      <path d="M48 32 L55 39 L72 22" fill="none" stroke="#26bac7" strokeWidth="2" strokeOpacity="0.6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="30" y="52" width="60" height="20" rx="6" fill="url(#notifEmptyGrad)" stroke="#26bac7" strokeWidth="1.5" strokeOpacity="0.3" />
      <rect x="40" y="60" width="40" height="4" rx="2" fill="#94a3b8" fillOpacity="0.4" />
    </svg>
  );
}

function NotificationListSkeleton() {
  return (
    <article className="learn-notifications-row-card learn-notifications-row-card--skeleton">
      <div className="learn-notifications-row-card__main">
        <div className="learn-notifications-row-card__avatar">
          <Skeleton.Avatar active size={48} shape="square" />
        </div>
        <div className="learn-notifications-row-card__content">
          <Skeleton title={{ width: "60%" }} paragraph={{ rows: 1, width: ["90%"] }} />
        </div>
      </div>
    </article>
  );
}

/** Notification row card — the one shared row layout for every role. */
function NotificationListItem({ record, onClick }) {
  const snippet = record?.message?.length > 80
    ? record.message.slice(0, 80) + "..."
    : (record?.message || "");

  return (
    <button
      type="button"
      className="learn-notifications-row-card"
      onClick={() => onClick(record)}
      data-row-id={record?.id}
      aria-label={`${record?.title || "Notification"} from ${getContextDisplay(record)}`}
    >
      <div className="learn-notifications-row-card__main">
        <div className="learn-notifications-row-card__avatar">
          <div className="learn-notifications-row-card__avatar-inner">
            <BellOutlined aria-hidden="true" />
          </div>
        </div>
        <div className="learn-notifications-row-card__content">
          <div className="learn-notifications-row-card__header">
            <h3 className="learn-notifications-row-card__title ln-lto-bold">{record?.title || "Notification"}</h3>
            <div className="learn-notifications-row-card__badges" aria-hidden="true">{getTypeTag(record)}</div>
          </div>
          <p className="learn-notifications-row-card__snippet ln-lto-reg ln-tbl-markup">
            <Markup content={snippet} allowList={NOTIFICATION_ALLOWED_TAGS} allowAttributes={NOTIFICATION_ALLOWED_ATTRS} />
          </p>
          <div className="learn-notifications-row-card__meta">
            <span className="learn-notifications-row-card__context ln-lto-reg">{getContextDisplay(record)}</span>
            <span className="learn-notifications-row-card__date ln-lto-reg">{formatNotificationDate(record?.created_at)}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

/**
 * Reusable Notifications page — the single shared canvas for every role. Learner and faculty
 * read genuinely different data (learner: class notifications + college-wide announcements;
 * faculty: scoped announcements + their own personal notifications) and group it into different
 * tabs, so those two things stay role-branched below — but the fetch/filter/search/list/detail-
 * modal machinery, and the PageShell canvas it all renders inside, is the same for both. This
 * used to be two independent ~480-line implementations (this file for learners, a full copy
 * inside src/pages/teacher/notifications.js for faculty) that had visibly drifted apart — the
 * faculty one built its own outer wrapper by hand instead of going through PageShell.
 */
export default function NotificationsContent() {
  const router = useRouter();
  const loginUser = useSelector((state) => state.loginUser);
  const [notificationList, setNotificationList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [partialWarning, setPartialWarning] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const notificationListRef = useRef([]);

  useEffect(() => { notificationListRef.current = notificationList; }, [notificationList]);

  const isLearner = isLearnerRole(loginUser);
  const isFaculty = isFacultyRole(loginUser);
  const classId = loginUser?.classId;
  // A classId missing from login state is filled by the shared learner scope hook (LRN-X-01), so
  // class notifications are no longer silently left out.
  useLearnerClassScope({ enabled: isLearner });
  // LRN-N-02: which source failed while the other still loaded.
  const [partialFailure, setPartialFailure] = useState(null);
  const [notifRetry, setNotifRetry] = useState(0);

  // Redirect away if this page is open under the wrong role's route — a deep link, a role
  // switch, or an admin/mentor account (each has its own dedicated notifications page: admin's
  // own management page, mentor's own project-derived action feed — getFacultyBasePath already
  // resolves a mentor to "/mentor", which routes them to that separate page, not this component).
  useEffect(() => {
    if (!loginUser?.userType) return;
    if (loginUser.userType === "FACULTY" && loginUser.facultyType === "ADMIN") {
      if (!router.pathname.startsWith("/college-admin")) router.push("/college-admin/dashboard");
      return;
    }
    const onLearnerRoute = router.pathname.startsWith("/learn");
    const onFacultyRoute = router.pathname.startsWith(getFacultyBasePath(router.pathname, loginUser?.facultyType));
    if (isLearner && !onLearnerRoute) {
      router.push("/learn/notifications");
    } else if (isFaculty && !onFacultyRoute) {
      router.push(`${getFacultyBasePath(router.pathname, loginUser?.facultyType)}/notifications`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginUser?.userType, loginUser?.facultyType, isLearner, isFaculty]);

  const fetchLearnerNotifications = useCallback(() => {
    // LRN-N-03: page through class notifications (a single call stopped silently at the server's
    // default of 100). Capped at 2000 so a runaway class can't stall the page.
    const NOTIF_PAGE = 200;
    async function fetchAllClassNotifications() {
      const all = [];
      for (let page = 0; page < 10; page += 1) {
        const res = await getAllNotificationByClassId({ classId, page, size: NOTIF_PAGE });
        const rows = ensureArray(res?.data ?? res?.data?.data);
        all.push(...rows);
        if (rows.length < NOTIF_PAGE) break;
      }
      return enrichWithCourseNames(all);
    }
    const notifPromise = classId != null && classId !== "" ? fetchAllClassNotifications() : Promise.resolve([]);

    // LRN-N-02: the two sources load independently. One failing used to throw away the other;
    // now the page shows what loaded and names what didn't. Only both failing is a full error.
    return Promise.allSettled([
      notifPromise,
      getAnnouncementsForLearner().then((list) =>
        (Array.isArray(list) ? list : []).map(announcementToNotificationItem).filter(Boolean)
      ),
    ]).then(([notifResult, annResult]) => {
      if (notifResult.status === "rejected" && annResult.status === "rejected") throw notifResult.reason;
      setPartialFailure(notifResult.status === "rejected" ? "class notifications"
        : annResult.status === "rejected" ? "college announcements" : null);
      const taggedNotifs = (notifResult.status === "fulfilled" ? notifResult.value || [] : [])
        .map((n) => ({ ...n, _source: n._source || "lms_notification" }));
      return [...taggedNotifs, ...(annResult.status === "fulfilled" ? annResult.value || [] : [])];
    });
  }, [classId]);

  const fetchFacultyNotifications = useCallback(() => {
    const baseParams = {
      collegeId: loginUser?.collegeId || 0,
      deptId: loginUser?.deptId || 0,
      facultyId: loginUser?.id || 0,
    };

    // The endpoint defaults to pageSize=10 — a bare, unparameterized call silently truncated to
    // the 10 most recent announcements, with the tab counts/filters/search on this page all
    // computed over that already-truncated set. Loop through every page instead: faculty-level
    // announcement volume is realistically bounded (unlike quizzes/assignments), so a full
    // in-memory list is the right fit for this page's existing all-client-side filter/search UI.
    const PAGE_SIZE = 100;
    async function fetchAllPages() {
      const all = [];
      let pageNumber = 0;
      for (;;) {
        const resData = await fetchAllTypesAnnouncement({ ...baseParams, pageNumber, pageSize: PAGE_SIZE });
        const records = resData?.records || [];
        all.push(...records);
        const totalRecords = resData?.totalRecords ?? all.length;
        pageNumber += 1;
        if (all.length >= totalRecords || records.length === 0) break;
      }
      return all;
    }

    // Personal/recipient-scoped notifications (e.g. a mentor's project-assignment
    // notifications) — created against the Notification table with this faculty member as the
    // direct recipient, not scoped to any single class. getNotificationsForRecipient is
    // self-service-guarded server-side. The endpoint doesn't return a totalRecords count (unlike
    // fetchAllTypesAnnouncement), so page until a short page confirms we've reached the end —
    // a bare single size:100 call was silently dropping anything past the 100 most recent.
    async function fetchAllPersonalPages() {
      const all = [];
      let page = 0;
      for (;;) {
        const resData = await getNotificationsForRecipient(loginUser.id, { page, size: PAGE_SIZE });
        const records = Array.isArray(resData?.data) ? resData.data : [];
        all.push(...records);
        if (records.length < PAGE_SIZE) break;
        page += 1;
      }
      return all;
    }

    const personalPromise = loginUser?.id
      ? fetchAllPersonalPages()
        .then((list) => ({
          items: list.map((n) => ({ ...n, _source: "lms_notification" })),
          failed: false,
        }))
        .catch(() => ({ items: [], failed: true }))
      : Promise.resolve({ items: [], failed: false });

    return Promise.all([fetchAllPages(), personalPromise]).then(([announcements, personalResult]) => {
      const taggedAnnouncements = announcements.map((a) => ({ ...a, _source: a._source || "lms_announcement" }));
      return {
        items: [...taggedAnnouncements, ...(personalResult.items || [])],
        warning: personalResult.failed
          ? "Personal notifications could not be loaded. College and faculty announcements are still shown."
          : null,
      };
    });
  }, [loginUser?.collegeId, loginUser?.deptId, loginUser?.id]);

  const fetchNotifications = useCallback(() => {
    if (!isLearner && !isFaculty) {
      setLoading(false);
      setNotificationList([]);
      return () => {};
    }

    let cancelled = false;
    setLoading(true);
    setError(false);
    setPartialWarning(null);

    const load = isLearner ? fetchLearnerNotifications() : fetchFacultyNotifications();
    load
      .then((result) => {
        if (cancelled) return;
        const merged = Array.isArray(result) ? result : (result?.items || []);
        setNotificationList(merged);
        setPartialWarning(Array.isArray(result) ? null : (result?.warning || null));
      })
      .catch(() => {
        if (!cancelled) {
          // A retry/background refresh should not erase a list the user was already reading.
          // Keep the last successful data and surface the refresh failure inline instead.
          if (notificationListRef.current.length === 0) setNotificationList([]);
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [isLearner, isFaculty, fetchLearnerNotifications, fetchFacultyNotifications, notifRetry]);

  useEffect(() => {
    return fetchNotifications();
  }, [fetchNotifications]);

  const getTabCategory = isLearner ? getLearnerTabCategory : getFacultyTabCategory;
  const tabLabels = isLearner ? LEARNER_TAB_LABELS : FACULTY_TAB_LABELS;
  const tabConfig = useMemo(() => (isLearner
    ? [
        { key: "course", label: "Course", icon: <BookOutlined /> },
        { key: "project", label: "Projects", icon: <ProjectOutlined /> },
        { key: "general", label: "Announcements", icon: <NotificationOutlined /> },
        { key: "job", label: "Job", icon: <SolutionOutlined /> },
      ]
    : [
        { key: "college", label: "College", icon: <BankOutlined /> },
        { key: "department", label: "Department", icon: <TeamOutlined /> },
        { key: "faculty", label: "Faculty", icon: <UserOutlined /> },
        { key: "personal", label: "Personal", icon: <SolutionOutlined /> },
      ]), [isLearner]);

  const requestedTabRaw = Array.isArray(router.query?.tab)
    ? router.query.tab[0]
    : router.query?.tab;
  const requestedTab = typeof requestedTabRaw === "string" && requestedTabRaw
    ? requestedTabRaw
    : "all";
  const activeTab =
    requestedTab === "all" || tabConfig.some(({ key }) => key === requestedTab)
      ? requestedTab
      : "all";

  const setActiveTab = useCallback((key) => {
    const next = { ...(router.query || {}) };
    if (!key || key === "all") delete next.tab;
    else next.tab = key;
    router.replace(
      { pathname: router.pathname, query: next },
      undefined,
      { shallow: true, scroll: false }
    );
  }, [router]);

  useEffect(() => {
    if (!router.isReady || requestedTab === activeTab) return;
    setActiveTab(activeTab);
  }, [router.isReady, requestedTab, activeTab, setActiveTab]);

  const tabCounts = useMemo(() => {
    const list = notificationList || [];
    const counts = { all: list.length };
    tabConfig.forEach(({ key }) => {
      counts[key] = list.filter((n) => getTabCategory(n) === key).length;
    });
    return counts;
  }, [notificationList, tabConfig, getTabCategory]);

  const filteredList = useMemo(() => {
    let list = notificationList || [];
    if (activeTab !== "all") {
      list = list.filter((n) => getTabCategory(n) === activeTab);
    }
    return [...list].sort((a, b) => getRecordTimestamp(b) - getRecordTimestamp(a));
  }, [notificationList, activeTab, getTabCategory]);

  const emptyState = (
    <div className="learn-notifications-empty learn-notifications-empty--rich">
      <div className="learn-notifications-empty__illustration">
        <NotificationsEmptyIllustration />
      </div>
      <h4 className="learn-notifications-empty__title ln-lto-bold">No notifications yet</h4>
      <p className="learn-notifications-empty__subtitle ln-lto-reg">
        {isLearner
          ? "You'll see course updates and announcements here when available."
          : "Announcements across college, department, and faculty will appear here."}
      </p>
    </div>
  );

  if (!isLearner && !isFaculty) return null;

  if (error && notificationList.length === 0) {
    return (
      <div className="scroll-container learn-notifications-page learn-notifications-page--scroll learn-placements-dashboard">
        <PageShell>
            <ListingPageHeader title="Notifications" ariaLabel="Notifications overview" />
            <section className="learn-notifications-grid-section">
              <div className="learn-notifications-error-card">
                <PanelError
                  title="Couldn't load notifications"
                  description="Notifications could not be loaded. Retry without leaving this page."
                  onRetry={fetchNotifications}
                />
              </div>
            </section>
        </PageShell>
      </div>
    );
  }

  return (
    <div className="scroll-container learn-notifications-page learn-notifications-page--scroll learn-placements-dashboard">
      <PageShell>
          {/* Compact header with filter pills */}
          <ListingPageHeader
            title="Notifications"
            ariaLabel="Notifications overview"
            metrics={
              <div className="learn-notifications-header__filters">
                <button
                  type="button"
                  aria-pressed={activeTab === "all"}
                  className={`learn-notifications-filter-pill ln-lto-reg${activeTab === "all" ? " learn-notifications-filter-pill--active" : ""}`}
                  onClick={() => setActiveTab("all")}
                >
                  <BellOutlined />
                  All
                  <span className="learn-notifications-filter-pill__count">{tabCounts.all}</span>
                </button>
                {tabConfig.map(({ key, label, icon }) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={activeTab === key}
                    className={`learn-notifications-filter-pill ln-lto-reg${activeTab === key ? " learn-notifications-filter-pill--active" : ""}`}
                    onClick={() => setActiveTab(key)}
                  >
                    {icon}
                    {label}
                    <span className="learn-notifications-filter-pill__count">{tabCounts[key] ?? 0}</span>
                  </button>
                ))}
              </div>
            }
          />

          {isLearner && partialFailure && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 12 }}
              message={`Couldn't load ${partialFailure}`}
              description="Everything else below loaded normally."
              action={<Button size="small" onClick={() => setNotifRetry((n) => n + 1)}>Retry</Button>}
            />
          )}
          {/* Notification list — floats directly on gray background */}
          <section className="learn-notifications-grid-section" aria-label="Notification list"
            aria-busy={loading ? "true" : undefined}>
            {loading && notificationList.length > 0 && (
              <RefreshStatus label="Refreshing notifications…" />
            )}
            {error && notificationList.length > 0 && (
              <PanelPartial
                compact
                title="Couldn't refresh notifications"
                description="Showing the last notifications we loaded."
                onRetry={fetchNotifications}
                retryLabel="Retry"
              />
            )}
            {partialWarning && (
              <Alert
                type="warning"
                showIcon
                className="mb-3"
                message="Some notifications could not be loaded"
                description={partialWarning}
                action={<Button size="small" onClick={fetchNotifications}>Retry</Button>}
              />
            )}
            {loading && notificationList.length === 0 ? (
              <ul className="learn-notifications-list">
                {[1, 2, 3, 4, 5].map((i) => (
                  <li key={i} className="learn-notifications-list__item">
                    <NotificationListSkeleton />
                  </li>
                ))}
              </ul>
            ) : notificationList.length === 0 ? (
              emptyState
            ) : filteredList.length === 0 ? (
              // tabCounts[activeTab] is 0 here — the selected category simply has nothing in it.
              <PanelEmpty
                compact
                title={`No ${tabLabels[activeTab] || ""} notifications yet`}
                description="Try another category or return to the complete notification feed."
                ctaLabel="View all"
                onCta={() => setActiveTab("all")}
              />
            ) : (
              <ul className="learn-notifications-list">
                {filteredList.map((record, index) => (
                  <li key={record?.id != null ? getRecordSortKey(record) : `notif-${record?.classId ?? ''}-${record?.title ?? ''}-${index}`} className="learn-notifications-list__item">
                    <NotificationListItem record={record} onClick={setSelectedNotification} />
                  </li>
                ))}
              </ul>
            )}
          </section>
      </PageShell>

      <Modal
        className="learn-notification-detail-modal"
        title={selectedNotification?.title || "Notification"}
        open={!!selectedNotification}
        onCancel={() => setSelectedNotification(null)}
        footer={
          <div className="d-flex align-items-center justify-content-end" style={{ gap: 8 }}>
            {(() => {
              const link = getNotificationDeepLink(selectedNotification, {
                isLearner,
                facultyType: loginUser?.facultyType,
                pathname: router.pathname,
              });
              if (!link) return null;
              return (
                <Button
                  onClick={() => {
                    link.onClick(router);
                    setSelectedNotification(null);
                  }}
                >
                  {link.label}
                </Button>
              );
            })()}
            <Button type="primary" onClick={() => setSelectedNotification(null)}>
              Got it
            </Button>
          </div>
        }
        width={520}
        style={{ maxWidth: "calc(100vw - 32px)", margin: "0 auto" }}
        destroyOnClose
      >
        {selectedNotification && (
          <div className="learn-notification-modal__body">
            <div className="learn-notification-modal__message ln-tbl-markup">
              <Markup content={selectedNotification?.message} allowList={NOTIFICATION_ALLOWED_TAGS} allowAttributes={NOTIFICATION_ALLOWED_ATTRS} />
            </div>
            <div className="learn-notification-modal__meta">
              {getTypeTag(selectedNotification)}{" "}
              <span className="learn-notification-modal__context">{getContextDisplay(selectedNotification)}</span>
            </div>
            <div className="learn-notification-modal__date">{formatNotificationDate(selectedNotification?.created_at)}</div>
          </div>
        )}
      </Modal>
    </div>
  );
}
