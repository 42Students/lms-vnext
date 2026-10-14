"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  mentorMeetingDisplayStatus, safeMentorMeetingJoinUrl, splitMentorMeetings,
  type MentorMeetingCalendarItem,
} from "@/modules/projects/mentor-calendar-view";
import { StatusBadge } from "@/components/ui/status-badge";

const PAST_PREVIEW = 20;
const prettyDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? new Intl.DateTimeFormat("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(d) : "Date TBD";
};
const prettyTime = (iso: string) => {
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? new Intl.DateTimeFormat("en-IN", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZoneName: "short",
    timeZone: "Asia/Kolkata",
  }).format(d) : "Time TBD";
};
function MeetingRow({
  meeting, now,
}: {meeting: MentorMeetingCalendarItem; now: Date;}) {
  const status = mentorMeetingDisplayStatus(meeting, now);
  const href = safeMentorMeetingJoinUrl(meeting);
  return (
    <article className="rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="m-0 break-words font-semibold text-foreground">{meeting.title}</h3>
          <p className="mt-1 text-sm text-body">{meeting.projectTitle}</p>
        </div>
        <StatusBadge tone={
          status === "COMPLETED" ? "success" :
          status === "MISSED" ? "error" : status === "CANCELLED" ? "neutral" :
          status === "REQUESTED" ? "warning" : "info"
        }>{status}</StatusBadge>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        {prettyDate(meeting.startsAt)} · {prettyTime(meeting.startsAt)}
        {" – "}{prettyTime(meeting.endsAt)}
        {meeting.linkedSprintTitle ? " · Sprint: " + meeting.linkedSprintTitle : ""}
      </p>
      {meeting.status === "REQUESTED" ? (
        <p className="mt-2 text-sm text-body">Awaiting your response in the project workspace.</p>
      ) : null}
      {meeting.projectStatus === "ARCHIVED" ? (
        <p className="mt-2 text-xs text-muted-foreground">Archived project · Read-only</p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
        {href ? <a className="font-medium text-primary-text underline" href={href}
          target="_blank" rel="noopener noreferrer">Join meeting</a> : null}
        <Link className="font-medium text-primary-text underline"
          href={"/mentor/projects/" + encodeURIComponent(meeting.projectId) + "?tab=team"}>
          Open project
        </Link>
      </div>
    </article>
  );
}

export function MentorMeetingsCalendar({
  meetings, initialNow,
}: {meetings: readonly MentorMeetingCalendarItem[]; initialNow: string}) {
  const [now, setNow] = useState(initialNow);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    // Hydrate the viewer's timezone after the initial UTC-compatible render.
    // A queued callback avoids synchronous state updates in an effect.
    const frame = window.requestAnimationFrame(() => {
      setNow(new Date().toISOString());
    });
    const tick = window.setInterval(() => setNow(new Date().toISOString()), 60_000);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(tick);
    };
  }, []);
  const instant = useMemo(() => new Date(now), [now]);
  const {upcoming, past} = useMemo(() => splitMentorMeetings(meetings, instant), [meetings, instant]);

  return <div className="space-y-8" aria-label="Mentor meetings calendar">
    <section aria-labelledby="mentor-upcoming-meetings" className="space-y-3">
      <h2 id="mentor-upcoming-meetings" className="text-lg font-semibold text-foreground">
        Upcoming ({upcoming.length})
      </h2>
      {upcoming.length
        ? upcoming.map(meeting => <MeetingRow key={meeting.id} meeting={meeting}
            now={instant} />)
        : <p className="rounded-xl border border-border bg-surface p-5 text-sm text-body">
            No upcoming meetings.
          </p>}
    </section>
    <section aria-labelledby="mentor-past-meetings" className="space-y-3">
      <h2 id="mentor-past-meetings" className="text-lg font-semibold text-foreground">
        Past &amp; Cancelled ({past.length})
      </h2>
      {past.length
        ? (expanded ? past : past.slice(0, PAST_PREVIEW)).map(meeting =>
            <MeetingRow key={meeting.id} meeting={meeting} now={instant}
              />)
        : <p className="rounded-xl border border-border bg-surface p-5 text-sm text-body">
            No past meetings yet.
          </p>}
      {past.length > PAST_PREVIEW ? (
        <button type="button" className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-primary-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
          onClick={() => setExpanded(value => !value)}
          aria-expanded={expanded}>
          {expanded ? "Show fewer" : "Show all " + past.length + " past meetings"}
        </button>
      ) : null}
    </section>
  </div>;
}
