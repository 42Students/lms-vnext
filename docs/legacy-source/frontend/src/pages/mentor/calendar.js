import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc";
import dayjsTimezone from "dayjs/plugin/timezone";
import { Alert, Button, Empty, Tag } from "antd";
import { CalendarOutlined, LinkOutlined } from "@ant-design/icons";
import CourseSectionHeader from "@/components/Course/Common/CourseSectionHeader";
import { extractProjectsPayload, getProjects, normalizeProjectsList } from "@/api/Services/projectService";

dayjs.extend(dayjsUtc);
dayjs.extend(dayjsTimezone);

function meetingDateTime(meeting) {
  if (!meeting?.meetingDate) return null;
  const time = meeting?.startTime ? meeting.startTime : "00:00";
  const sourceTimezone = meeting?.timezone || meeting?.timeZone;
  // Convert from the meeting's own recorded timezone into this viewer's browser timezone — a
  // meeting stored in the organizer's zone was previously rendered as a raw clock string,
  // identical for every viewer regardless of where they actually are.
  if (sourceTimezone) {
    const sourceInstant = dayjs.tz(`${meeting.meetingDate}T${time}`, sourceTimezone);
    if (sourceInstant.isValid()) {
      return sourceInstant.tz(dayjs.tz.guess());
    }
  }
  const parsed = dayjs(`${meeting.meetingDate}T${time}`);
  if (parsed.isValid()) return parsed;
  // The old fallback `dayjs(meeting.meetingDate)` still returns a truthy-but-INVALID Dayjs object
  // when meetingDate itself can't be parsed (e.g. legacy/corrupted rows) — every caller here
  // treats a truthy return as "we have a real date", so `.format()` printed the literal string
  // "Invalid Date" to the user instead of ever reaching the "Date TBD" fallback text. Returning
  // null for a genuinely unparseable date lets every caller's `? real : "TBD"` check work as
  // intended.
  const fallback = dayjs(meeting.meetingDate);
  return fallback.isValid() ? fallback : null;
}

// Mirrors ProjectDetailContent.jsx's meetingDisplayStatus — meeting status is only ever set
// explicitly (nothing transitions SCHEDULED to MISSED automatically once the date passes), and
// this cross-project calendar view used to read meeting.meetingStatus raw with no equivalent
// derivation, so a meeting from weeks ago showed a plain blue "SCHEDULED" tag here while the same
// meeting's own project page correctly showed a red "MISSED" tag — a direct, visible contradiction
// between two mentor-facing views of the same record.
// End instant, so a meeting still in progress counts as upcoming rather than past.
function meetingEndDateTime(meeting) {
  if (!meeting?.meetingDate || !meeting?.endTime) return null;
  const sourceTimezone = meeting?.timezone || meeting?.timeZone;
  const end = sourceTimezone
    ? dayjs.tz(`${meeting.meetingDate}T${meeting.endTime}`, sourceTimezone)
    : dayjs(`${meeting.meetingDate}T${meeting.endTime}`);
  return end.isValid() ? (sourceTimezone ? end.tz(dayjs.tz.guess()) : end) : null;
}

function meetingDisplayStatus(meeting) {
  const status = String(meeting?.meetingStatus || "SCHEDULED").trim().toUpperCase();
  if (status !== "SCHEDULED" && status !== "RESCHEDULED") return status;
  // Mentor audit M-41/M-42: decided by the meeting's end instant (start if it has no end), the same instant that
  // moves it into "Past & Cancelled", so a meeting that ended this morning is not still badged Scheduled.
  const ends = meetingEndDateTime(meeting) || meetingDateTime(meeting);
  if (ends && ends.isBefore(dayjs())) return "MISSED";
  return status;
}

function MeetingRow({ meeting }) {
  const when = meetingDateTime(meeting);
  const sourceTimezone = meeting?.timezone || meeting?.timeZone;
  // Previously only computed when sourceTimezone was present, even if endTime itself was valid —
  // a meeting with no recorded timezone (legacy rows, or flows that never populate it) silently
  // dropped its end time from the display, showing just a start time with no way to tell how long
  // the meeting runs. Fall back to a naive (un-zoned) parse, same as meetingDateTime's own fallback.
  const whenEndRaw =
    meeting?.meetingDate && meeting?.endTime
      ? sourceTimezone
        ? dayjs.tz(`${meeting.meetingDate}T${meeting.endTime}`, sourceTimezone)
        : dayjs(`${meeting.meetingDate}T${meeting.endTime}`)
      : null;
  const whenEnd = whenEndRaw?.isValid() ? (sourceTimezone ? whenEndRaw.tz(dayjs.tz.guess()) : whenEndRaw) : null;
  const timeLabel = when
    ? `${when.format("hh:mm A")}${whenEnd ? ` – ${whenEnd.format("hh:mm A")}` : ""} (GMT${when.format("Z")})`
    : `${meeting.startTime || "--"}${meeting.endTime ? ` – ${meeting.endTime}` : ""}`;
  const status = meetingDisplayStatus(meeting);
  // A cancelled meeting's join link stayed live even though the backend never clears it on
  // cancellation — showing a working "Join link" right next to the gray CANCELLED tag.
  const joinUrl =
    meeting?.meetingStatus !== "CANCELLED" && meeting?.meetingUrl && /^https?:\/\//i.test(meeting.meetingUrl) ? meeting.meetingUrl : null;
  return (
    <div className="ln-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0, flex: "1 1 auto" }}>
          <strong style={{ overflowWrap: "anywhere" }}>{meeting.title}</strong>
          <div style={{ color: "var(--text-secondary, #6b7280)", fontSize: 13, overflowWrap: "anywhere" }}>
            {meeting.projectTitle}
          </div>
        </div>
        {/* REQUESTED and SCHEDULED previously both rendered "blue" — nothing distinguished a
            pending learner request from a confirmed meeting on this cross-project view, exactly
            where a mentor would look to catch one. */}
        <Tag
          color={
            status === "MISSED"
              ? "red"
              : status === "CANCELLED"
                ? "default"
                : status === "REQUESTED"
                  ? "gold"
                  : status === "COMPLETED"
                    ? "green"
                    : "blue"
          }
        >
          {status}
        </Tag>
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "var(--text-secondary, #6b7280)" }}>
        <span>{when ? when.format("ddd, MMM D YYYY") : "Date TBD"}</span>
        <span>{timeLabel}</span>
        {meeting.linkedSprintLabel ? <span>Sprint: {meeting.linkedSprintLabel}</span> : null}
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {joinUrl ? (
          <a href={joinUrl} target="_blank" rel="noopener noreferrer">
            <LinkOutlined /> Join link
          </a>
        ) : null}
        <Link href={`/mentor/projects/${encodeURIComponent(meeting.projectId)}?tab=team`}>Open project</Link>
      </div>
    </div>
  );
}

// Shape-matched loading state for the .ln-card meeting rows below — previously a bare centered
// <Spin/> stood in for this list, then swapped to the real row layout once data landed (the same
// flash-of-one-shape-then-another bug fixed on the Dashboard and Projects list).
function MeetingRowSkeleton() {
  return (
    <div className="ln-card learn-projects-meeting-skeleton" style={{ padding: 16 }} aria-hidden="true">
      <div className="learn-projects-meeting-skeleton__top">
        <div className="learn-projects-meeting-skeleton__meta">
          <span className="learn-projects-meeting-skeleton__title" />
          <span className="learn-projects-meeting-skeleton__subtitle" />
        </div>
        <span className="learn-projects-meeting-skeleton__tag" />
      </div>
      <div className="learn-projects-meeting-skeleton__row">
        <span />
        <span />
      </div>
      <span className="learn-projects-meeting-skeleton__link" />
    </div>
  );
}

const PAST_MEETINGS_PREVIEW_COUNT = 20;

export default function MentorCalendarPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pastExpanded, setPastExpanded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await getProjects();
        if (!mounted) return;
        setProjects(normalizeProjectsList(extractProjectsPayload(response)));
      } catch (err) {
        if (mounted) {
          setProjects([]);
          setError(err?.message || "We couldn't load your meetings.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [retryCount]);

  // The Upcoming/Past split otherwise only recomputes when `projects` changes (i.e. on load) —
  // a meeting that started at 10am kept showing under "Upcoming" all afternoon if the mentor left
  // this tab open, with a stale count and no visual cue anything was frozen. Re-render once a
  // minute so a meeting crosses over to Past as soon as its time actually passes.
  const [clockTick, setClockTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setClockTick((tick) => tick + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const { upcoming, past } = useMemo(() => {
    const now = dayjs();
    const flattened = projects.flatMap((project) =>
      (Array.isArray(project?.meetingsList) ? project.meetingsList : []).map((meeting) => ({
        ...meeting,
        projectId: project.id ?? project.slug,
        projectTitle: project.title,
        _when: meetingDateTime(meeting),
        _whenEnd: meetingEndDateTime(meeting),
      }))
    );
    // A REQUESTED meeting is an unactioned learner request — nobody has confirmed/declined it yet.
    // If its date happens to pass while it's still sitting there, a pure date-based split would
    // drop it into "Past & cancelled" tagged gold REQUESTED, reading as done when it's actually
    // the opposite: still needs the mentor's attention. Keep it in Upcoming regardless of date
    // until it's actually actioned (status changes away from REQUESTED).
    const upcomingList = flattened
      .filter(
        (meeting) =>
          meeting.meetingStatus !== "CANCELLED" &&
          (meeting.meetingStatus === "REQUESTED" || ((meeting._whenEnd || meeting._when) && (meeting._whenEnd || meeting._when).isAfter(now)))
      )
      .sort((a, b) => (a._when?.valueOf() || 0) - (b._when?.valueOf() || 0));
    const pastList = flattened
      .filter(
        (meeting) =>
          meeting.meetingStatus !== "REQUESTED" &&
          (meeting.meetingStatus === "CANCELLED" || !(meeting._whenEnd || meeting._when) || !(meeting._whenEnd || meeting._when).isAfter(now))
      )
      .sort((a, b) => (b._when?.valueOf() || 0) - (a._when?.valueOf() || 0));
    return { upcoming: upcomingList, past: pastList };
    // clockTick is intentionally unused in the body — it exists purely to force this memo to
    // recompute `now` every minute so the Upcoming/Past split doesn't freeze at load time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, clockTick]);

  return (
    <div className="scroll-container learn-projects">
      <div className="ln-module-card learn-projects__shell">
        <CourseSectionHeader
          title="Meetings"
          subtitle="Every scheduled meeting across your assigned projects, in one place."
          ariaLabel="Mentor meetings calendar"
        />
        <div className="learn-projects__content">
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <MeetingRowSkeleton />
              <MeetingRowSkeleton />
              <MeetingRowSkeleton />
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
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CalendarOutlined /> Upcoming ({upcoming.length})
                </h3>
                {upcoming.length === 0 ? (
                  <Empty description="No upcoming meetings." />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {upcoming.map((meeting) => (
                      <MeetingRow key={`${meeting.projectId}-${meeting.meetingKey}`} meeting={meeting} />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h3>Past & Cancelled ({past.length})</h3>
                {past.length === 0 ? (
                  <Empty description="No past meetings yet." />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {(pastExpanded ? past : past.slice(0, PAST_MEETINGS_PREVIEW_COUNT)).map((meeting) => (
                      <MeetingRow key={`${meeting.projectId}-${meeting.meetingKey}-past`} meeting={meeting} />
                    ))}
                    {past.length > PAST_MEETINGS_PREVIEW_COUNT ? (
                      <a
                        role="button"
                        tabIndex={0}
                        onClick={() => setPastExpanded((current) => !current)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setPastExpanded((current) => !current);
                          }
                        }}
                        style={{ alignSelf: "flex-start" }}
                      >
                        {pastExpanded ? "Show fewer" : `Show all ${past.length} past meetings`}
                      </a>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
