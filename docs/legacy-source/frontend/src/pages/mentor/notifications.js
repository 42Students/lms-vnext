import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc";
import dayjsTimezone from "dayjs/plugin/timezone";
import { useSelector } from "react-redux";
import { Alert, Button, Empty, Tag } from "antd";
import { BellOutlined, CheckCircleOutlined, ClockCircleOutlined, WarningOutlined } from "@ant-design/icons";
import CourseSectionHeader from "@/components/Course/Common/CourseSectionHeader";
import { extractProjectsPayload, getProjects, normalizeProjectsList } from "@/api/Services/projectService";
import { getNotificationsForRecipient } from "@/api/Services/UserServices";
import { fetchAllTypesAnnouncement } from "@/api/Services/notificationService";
import useCollegeFeatureFlags from "@/utils/useCollegeFeatureFlags";

dayjs.extend(dayjsUtc);
dayjs.extend(dayjsTimezone);

const STALE_AFTER_DAYS = 7;
const MEETING_SOON_HOURS = 48;

// "Under Review" is set both by a genuine fresh learner submission AND by a mentor's own
// "Reopen for revision" action (updateProjectDelivery's REOPEN branch), which bumps reviewedAt
// but leaves submittedAt at its old value — the reviewStatus string alone can't tell these apart.
// Without this, a mentor reopening a delivery they already reviewed immediately re-triggers a
// "submission waiting for your review — Submitted by <learner>" notification against themselves,
// even though the learner hasn't touched anything since.
function deliveryNeedsMentorReview(delivery) {
  const reviewStatus = String(delivery?.reviewStatus || "").toLowerCase();
  if (reviewStatus !== "submitted" && reviewStatus !== "under review") return false;
  const submittedAt = delivery?.submittedAt ? dayjs(delivery.submittedAt) : null;
  const reviewedAt = delivery?.reviewedAt ? dayjs(delivery.reviewedAt) : null;
  if (!submittedAt || !submittedAt.isValid() || !reviewedAt || !reviewedAt.isValid()) return true;
  return submittedAt.isAfter(reviewedAt);
}

// Archived projects are locked from normal mutation, so they shouldn't push any notification —
// not just the "Stalled" one. Shared by the delivery-review and meeting checks below too.
function isArchivedProject(project) {
  return String(project?.status || "").toLowerCase().includes("archiv");
}

function isProjectStalled(project) {
  const statusLower = String(project?.status || "").toLowerCase();
  if (statusLower.includes("archiv") || statusLower.includes("complet") || statusLower.includes("done") || statusLower.includes("block")) {
    return false;
  }
  const activityTimestamps = (project?.resolvedActivity || [])
    .map((entry) => entry?.when)
    .filter(Boolean)
    .map((value) => dayjs(value))
    .filter((value) => value.isValid());
  // getProjects() hits the LIST endpoint, which doesn't populate resolvedActivity (only the
  // single-project detail fetch does) — every project used to fall through to "no timestamps ->
  // stalled" and generate a false "Stalled" notification for nearly every active project,
  // drowning out real notifications like pending reviews. Fall back to the project's own
  // updatedAt/lastActivityAt, and only when there's truly no signal at all, assume NOT stalled
  // rather than alarming the mentor — same fix already applied in ProjectsContent.jsx and
  // adminProjectUtils.js.
  const timestamps = activityTimestamps.length
    ? activityTimestamps
    : [project?.updatedAt, project?.lastActivityAt].filter(Boolean).map((value) => dayjs(value)).filter((value) => value.isValid());
  if (!timestamps.length) return false;
  const latest = timestamps.reduce((a, b) => (a.isAfter(b) ? a : b));
  return dayjs().diff(latest, "day") >= STALE_AFTER_DAYS;
}

function meetingDateTime(meeting) {
  if (!meeting?.meetingDate) return null;
  const time = meeting?.startTime ? meeting.startTime : "00:00";
  const sourceTimezone = meeting?.timezone || meeting?.timeZone;
  // Convert from the meeting's own recorded timezone into this viewer's browser timezone — same
  // fix already applied in calendar.js's identical helper and ProjectDetailContent's
  // resolveMeetingViewerInstant. Without it, the 48h "upcoming meeting" window below compared
  // against a raw clock string as if it were already the viewer's own local time, so a meeting
  // recorded in a different zone than the mentor's browser could silently fall in or out of that
  // window by however many hours the offset is.
  if (sourceTimezone) {
    // dayjs.tz throws synchronously on a non-IANA timezone string instead of just returning an
    // invalid object — uncaught, that would blow up this whole useMemo (and the page) over one
    // bad row. Fall through to the naive parse below on failure, same as an invalid result.
    try {
      const sourceInstant = dayjs.tz(`${meeting.meetingDate}T${time}`, sourceTimezone);
      if (sourceInstant.isValid()) {
        return sourceInstant.tz(dayjs.tz.guess());
      }
    } catch (_) {
      // fall through
    }
  }
  const parsed = dayjs(`${meeting.meetingDate}T${time}`);
  return parsed.isValid() ? parsed : dayjs(meeting.meetingDate);
}

const TONE = {
  announcement: { icon: <BellOutlined />, color: "blue" },
  review: { icon: <WarningOutlined />, color: "gold" },
  stalled: { icon: <WarningOutlined />, color: "red" },
  meeting: { icon: <ClockCircleOutlined />, color: "blue" },
  requested: { icon: <ClockCircleOutlined />, color: "gold" },
};

function NotificationRow({ notification }) {
  const tone = TONE[notification.kind] || TONE.meeting;
  const body = (
    <>
      <span style={{ fontSize: 18, color: tone.color === "red" ? "#cf1322" : tone.color === "gold" ? "#d48806" : "#0a7c88" }}>
        {tone.icon}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <strong>{notification.title}</strong>
          <Tag color={tone.color}>{notification.tag}</Tag>
        </div>
        <p style={{ margin: "4px 0 0", color: "var(--text-secondary, #667085)", fontSize: 13 }}>{notification.description}</p>
      </div>
    </>
  );
  if (notification.href) {
    return (
      <Link href={notification.href} className="ln-card" style={{ padding: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
        {body}
      </Link>
    );
  }
  return (
    <div className="ln-card" style={{ padding: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
      {body}
    </div>
  );
}

// Shape-matched loading state for NotificationRow above — previously a bare centered <Spin/>
// stood in for this list, then swapped to the real icon+title/tag+description row layout once
// data landed (the same flash-of-one-shape-then-another bug fixed on the Dashboard and Projects
// list).
function NotificationRowSkeleton() {
  return (
    <div className="ln-card learn-projects-notification-skeleton" style={{ padding: 16 }} aria-hidden="true">
      <span className="learn-projects-notification-skeleton__icon" />
      <div className="learn-projects-notification-skeleton__body">
        <div className="learn-projects-notification-skeleton__top">
          <span className="learn-projects-notification-skeleton__title" />
          <span className="learn-projects-notification-skeleton__tag" />
        </div>
        <span className="learn-projects-notification-skeleton__desc" />
      </div>
    </div>
  );
}

function getRecordTimestamp(record) {
  const created = record?.created_at ?? record?.createdAt;
  if (Array.isArray(created) && created.length >= 3) {
    const [year, month0, day, hour = 0, minute = 0, second = 0] = created;
    return new Date(year, month0, day, hour, minute, second).getTime();
  }
  if (typeof created === "string") {
    const parsed = new Date(created);
    if (!Number.isNaN(parsed.getTime())) return parsed.getTime();
  }
  return 0;
}

function toMentorAnnouncementItem(record, source) {
  const receiverType = record?.receiverType || record?.receiver_type;
  const type = record?.notification_type || record?.notificationType || receiverType || "Announcement";
  return {
    kind: "announcement",
    // Stored types are constants ("PROJECT_MEETING", "LEARNER"): shown as words, not shouted.
    tag: String(type).replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase()),
    title: record?.title || "Announcement",
    description: record?.message || record?.body || "A new notification was sent to you.",
    href: null,
    sortKey: -1,
    timestamp: getRecordTimestamp(record),
    source,
  };
}

async function loadBroadMentorNotifications(loginUser) {
  if (!loginUser?.id) return { items: [], sourceErrors: [] };
  const PAGE_SIZE = 100;

  async function fetchAnnouncementPages() {
    const all = [];
    let pageNumber = 0;
    for (;;) {
      const resData = await fetchAllTypesAnnouncement({
        collegeId: loginUser?.collegeId || 0,
        deptId: loginUser?.deptId || 0,
        facultyId: loginUser?.id || 0,
        pageNumber,
        pageSize: PAGE_SIZE,
      });
      const records = resData?.records || [];
      all.push(...records);
      const totalRecords = resData?.totalRecords ?? all.length;
      pageNumber += 1;
      if (all.length >= totalRecords || records.length === 0) break;
    }
    return all;
  }

  async function fetchPersonalPages() {
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

  const [announcementsResult, personalResult] = await Promise.allSettled([
    fetchAnnouncementPages(),
    fetchPersonalPages(),
  ]);
  const announcements = announcementsResult.status === "fulfilled" ? announcementsResult.value : [];
  const personal = personalResult.status === "fulfilled" ? personalResult.value : [];
  const sourceErrors = [
    announcementsResult.status === "rejected" ? "announcements" : null,
    personalResult.status === "rejected" ? "personal notifications" : null,
  ].filter(Boolean);
  return {
    items: [
      ...announcements.map((record) => toMentorAnnouncementItem(record, "announcement")),
      ...personal.map((record) => toMentorAnnouncementItem(record, "notification")),
    ],
    sourceErrors,
  };
}

export default function MentorNotificationsPage() {
  const loginUser = useSelector((state) => state.loginUser);
  // Mentor audit M-45/M-50: with Projects switched off the projects API refuses every call, which used to fail this
  // whole page and hide the course and college notifications with it. Same precedence and fail-open default as the
  // module guard: the explicit module map wins, unknown counts as on.
  const { projectsEnabled, modules } = useCollegeFeatureFlags();
  const projectsOn = modules?.projects !== undefined ? modules.projects !== false : projectsEnabled !== false;
  const [projects, setProjects] = useState([]);
  const [broadNotifications, setBroadNotifications] = useState([]);
  const [broadSourceErrors, setBroadSourceErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [projectResult, broad] = await Promise.all([
          projectsOn
            ? getProjects().then((value) => ({ ok: true, value }), () => ({ ok: false }))
            : Promise.resolve({ ok: true, value: null }),
          loadBroadMentorNotifications(loginUser),
        ]);
        if (!mounted) return;
        // A failed projects call is one missing source, not a failed page.
        setProjects(projectResult.ok && projectResult.value ? normalizeProjectsList(extractProjectsPayload(projectResult.value)) : []);
        setBroadNotifications(broad.items);
        setBroadSourceErrors(projectResult.ok ? broad.sourceErrors : ["project reviews and meetings", ...broad.sourceErrors]);
      } catch (err) {
        if (mounted) {
          setProjects([]);
          setBroadNotifications([]);
          setBroadSourceErrors([]);
          setError(err?.message || "We couldn't load your notifications.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [loginUser?.collegeId, loginUser?.deptId, loginUser?.id, retryCount, projectsOn]);

  const notifications = useMemo(() => {
    const now = dayjs();
    const items = [];
    projects.forEach((project) => {
      if (isArchivedProject(project)) return;
      if (deliveryNeedsMentorReview(project?.resolvedDelivery)) {
        items.push({
          kind: "review",
          tag: "Needs review",
          title: `${project.title} — submission waiting for your review`,
          description: project?.resolvedDelivery?.submittedByName
            ? `Submitted by ${project.resolvedDelivery.submittedByName}`
            : "A team member submitted work for this project.",
          href: `/mentor/projects/${encodeURIComponent(project.id)}?tab=overview`,
          sortKey: 0,
        });
      }
      if (isProjectStalled(project)) {
        items.push({
          kind: "stalled",
          tag: "Stalled",
          title: `${project.title} — no activity in ${STALE_AFTER_DAYS}+ days`,
          description: "This project hasn't had any recorded activity recently.",
          href: `/mentor/projects/${encodeURIComponent(project.id)}?tab=activity`,
          sortKey: 1,
        });
      }
      (Array.isArray(project?.meetingsList) ? project.meetingsList : []).forEach((meeting) => {
        if (meeting.meetingStatus === "CANCELLED") return;
        // A learner-requested meeting (requestProjectMeeting) needs the mentor's attention to
        // confirm/reschedule/decline it — this is distinct from "upcoming meeting" below, which
        // only surfaces meetings inside the next 48h and would silently miss a request for a
        // date further out, or one with no date set yet at all. Nothing previously flagged this
        // anywhere the mentor would actually see it outside the Activity tab.
        if (meeting.meetingStatus === "REQUESTED") {
          items.push({
            kind: "requested",
            tag: "Meeting requested",
            title: `${meeting.title} — ${project.title}`,
            description: "A team member requested this meeting — review and confirm the time.",
            href: `/mentor/projects/${encodeURIComponent(project.id)}?tab=team`,
            sortKey: 0,
          });
          return;
        }
        const when = meetingDateTime(meeting);
        if (!when || !when.isAfter(now) || when.diff(now, "hour") > MEETING_SOON_HOURS) return;
        items.push({
          kind: "meeting",
          tag: "Upcoming meeting",
          title: `${meeting.title} — ${project.title}`,
          description: `${when.format("ddd, MMM D")} at ${meeting.startTime || "TBD"}`,
          href: `/mentor/projects/${encodeURIComponent(project.id)}?tab=team`,
          sortKey: 2,
        });
      });
    });
    return [...broadNotifications, ...items].sort((a, b) => {
      const sort = a.sortKey - b.sortKey;
      if (sort !== 0) return sort;
      return (b.timestamp || 0) - (a.timestamp || 0);
    });
  }, [broadNotifications, projects]);

  return (
    <div className="scroll-container learn-projects">
      <div className="ln-module-card learn-projects__shell">
        <CourseSectionHeader
          title="Notifications"
          subtitle="Announcements, submissions waiting for review, stalled projects, and meetings coming up soon."
          ariaLabel="Mentor notifications"
        />
        <div className="learn-projects__content">
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <NotificationRowSkeleton />
              <NotificationRowSkeleton />
              <NotificationRowSkeleton />
            </div>
          ) : error ? (
            <Alert
              type="error"
              message={error}
              showIcon
              style={{ marginBottom: 16 }}
              action={<Button size="small" onClick={() => setRetryCount((count) => count + 1)}>Retry</Button>}
            />
          ) : (
            <>
              {broadSourceErrors.length > 0 && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message="Some notification sources are unavailable"
                  description={`Could not load: ${broadSourceErrors.join(", ")}. Everything else below is current, but this page may be incomplete.`}
                  action={<Button size="small" onClick={() => setRetryCount((count) => count + 1)}>Retry sources</Button>}
                />
              )}
              {notifications.length === 0 ? (
                <Empty
                  image={<CheckCircleOutlined style={{ fontSize: 32, color: "#52c41a" }} />}
                  description={broadSourceErrors.length > 0
                    ? "No project alerts are visible, but some notification sources could not be checked."
                    : "Nothing needs your attention right now."}
                />
              ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {notifications.map((notification, index) => (
                <NotificationRow key={`${notification.kind}-${index}`} notification={notification} />
              ))}
            </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
