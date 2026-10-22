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
const validTime=(raw:string)=>raw.trim().length>0&&Number.isFinite(Date.parse(raw));
function dateLabel(raw:string){
 if(!validTime(raw))return "Date TBD";
 const parts=new Intl.DateTimeFormat("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric",timeZone:"Asia/Kolkata"}).formatToParts(new Date(raw));
 const pick=(kind:Intl.DateTimeFormatPartTypes)=>parts.find(p=>p.type===kind)?.value??"";
 return `${pick("weekday")}, ${pick("month")} ${pick("day")} ${pick("year")}`;
}
function clockLabel(raw:string):string|null{
 if(!validTime(raw))return null;
 const parts=new Intl.DateTimeFormat("en-US",{hour:"2-digit",minute:"2-digit",hour12:true,timeZone:"Asia/Kolkata"}).formatToParts(new Date(raw));
 const pick=(kind:Intl.DateTimeFormatPartTypes)=>parts.find(p=>p.type===kind)?.value??"";
 return `${pick("hour")}:${pick("minute")} ${pick("dayPeriod").toUpperCase()}`;
}
function meetingTimeLabel(meeting:MentorMeetingCalendarItem){
 const start=clockLabel(meeting.startsAt);
 if(!start)return (meeting.legacyStartTime?.trim()||"--")+
    (meeting.legacyEndTime?.trim()?" – "+meeting.legacyEndTime.trim():"");
 const end=clockLabel(meeting.endsAt);
 return start+(end&&meeting.endsAt!==meeting.startsAt?" – "+end:"")+" (GMT+05:30)";
}
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
        {dateLabel(meeting.startsAt)} · {meetingTimeLabel(meeting)}
        {(meeting.linkedSprintTitle||meeting.legacySprintLabel)
          ? " · Sprint: " + (meeting.linkedSprintTitle||meeting.legacySprintLabel) : ""}
      </p>
      {meeting.projectStatus === "ARCHIVED" ? (
        <p className="mt-2 text-xs text-muted-foreground leading-[20px]">Archived project · Read-only</p>
      ) : null}
      <div className={styles.actions}>
        {safeProjectExternalHref(href) ? <a className={styles.action} href={safeProjectExternalHref(href)!}
          >Join link</a> : null}
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
