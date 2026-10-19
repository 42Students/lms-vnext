"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  mentorMeetingDisplayStatus, safeMentorMeetingJoinUrl, splitMentorMeetings,
  type MentorMeetingCalendarItem,
} from "@/modules/projects/mentor-calendar-view";
import { StatusBadge } from "@/components/ui/status-badge";
import { safeProjectExternalHref } from "@/modules/projects/mentor-workspace-evidence-model";
import {Button} from "@/components/ui/button";
import styles from "./mentor-meetings-calendar.module.css";

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
  const href = safeMentorMeetingJoinUrl(meeting, now);
  return (
    <article className={styles.row}>
      <div className={styles.head}>
        <div className={styles.titleBlock}>
          <h3 className={styles.title}>{meeting.title}</h3>
          <p className={styles.subtitle}>{meeting.projectTitle}</p>
        </div>
        <StatusBadge tone={
          status === "COMPLETED" ? "success" :
          status === "MISSED" ? "error" : status === "CANCELLED" ? "neutral" :
          status === "REQUESTED" ? "warning" : "info"
        }>{status}</StatusBadge>
      </div>
      <p className={styles.meta}>
        {prettyDate(meeting.startsAt)} · {prettyTime(meeting.startsAt)}
        {" – "}{prettyTime(meeting.endsAt)}
        {meeting.linkedSprintTitle ? " · Sprint: " + meeting.linkedSprintTitle : ""}
      </p>
      {meeting.projectStatus === "ARCHIVED" ? (
        <p className="mt-2 text-xs text-muted-foreground">Archived project · Read-only</p>
      ) : null}
      <div className={styles.actions}>
        {safeProjectExternalHref(href) ? <a className={styles.action} href={safeProjectExternalHref(href)!}
          target="_blank" rel="noopener noreferrer">Join link</a> : null}
        <Link className={styles.action}
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

  return <div className={styles.calendar} aria-label="Mentor meetings calendar">
    <section aria-labelledby="mentor-upcoming-meetings" className={styles.section}>
      <h2 id="mentor-upcoming-meetings" className={styles.heading}>
        Upcoming ({upcoming.length})
      </h2>
      {upcoming.length
        ? upcoming.map(meeting => <MeetingRow key={meeting.id} meeting={meeting}
            now={instant} />)
        : <p className={styles.empty}>
            No upcoming meetings.
          </p>}
    </section>
    <section aria-labelledby="mentor-past-meetings" className={styles.section}>
      <h2 id="mentor-past-meetings" className={styles.heading}>
        Past &amp; Cancelled ({past.length})
      </h2>
      {past.length
        ? (expanded ? past : past.slice(0, PAST_PREVIEW)).map(meeting =>
            <MeetingRow key={meeting.id} meeting={meeting} now={instant}
              />)
        : <p className={styles.empty}>
            No past meetings yet.
          </p>}
      {past.length > PAST_PREVIEW ? (
        <Button variant="secondary" className={styles.expand} type="button" 
          onClick={() => setExpanded(value => !value)}
          aria-expanded={expanded}>
          {expanded ? "Show fewer" : "Show all " + past.length + " past meetings"}
        </Button>
      ) : null}
    </section>
  </div>;
}
