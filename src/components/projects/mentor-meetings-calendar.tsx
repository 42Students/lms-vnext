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
/** Export a real RFC 5545-compatible calendar invitation on explicit
 * interaction. Never export a pending/invalid meeting as a confirmed event. */
function downloadMeetingCalendar(meeting:MentorMeetingCalendarItem){
  if(!["SCHEDULED","RESCHEDULED"].includes(meeting.status))return;
  const starts=new Date(meeting.startsAt),ends=new Date(meeting.endsAt);
  if(!Number.isFinite(starts.getTime())||!Number.isFinite(ends.getTime())||
      ends.getTime()<=starts.getTime())return;
  const escape=(text:string)=>text.replace(/\\/g,"\\\\").replace(/\n/g,"\\n")
    .replace(/,/g,"\\,").replace(/;/g,"\\;");
  const utc=(value:Date)=>value.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z");
  const calendar=[
    "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//42LMS//Mentor Meeting//EN","CALSCALE:GREGORIAN",
    "METHOD:PUBLISH","BEGIN:VEVENT",
    "UID:"+escape(meeting.id+"@42lms"),
    "DTSTAMP:"+utc(new Date()),"DTSTART:"+utc(starts),"DTEND:"+utc(ends),
    "SUMMARY:"+escape(meeting.title),"DESCRIPTION:"+escape(meeting.projectTitle),
    "STATUS:CONFIRMED","END:VEVENT","END:VCALENDAR","",
  ].join("\r\n");
  const url=URL.createObjectURL(new Blob([calendar],{type:"text/calendar;charset=utf-8"}));
  const anchor=document.createElement("a");
  anchor.href=url;anchor.download="42lms-mentor-meeting.ics";document.body.appendChild(anchor);
  anchor.click();anchor.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
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
        {(meeting.status==="SCHEDULED"||meeting.status==="RESCHEDULED")&&
         Number.isFinite(Date.parse(meeting.startsAt))&&
         Number.isFinite(Date.parse(meeting.endsAt))&&
         Date.parse(meeting.endsAt)>Date.parse(meeting.startsAt) ? (
          <Button type="button" variant="secondary" size="sm"
            onClick={()=>downloadMeetingCalendar(meeting)}>Add to my calendar (.ics)</Button>
        ) : null}
        <Link className={styles.action}
          href={"/mentor/projects/" + encodeURIComponent(meeting.projectId) + "?tab=team"}>
          Schedule or manage meeting
        </Link>
        {safeProjectExternalHref(href) ? <a className={styles.action} href={safeProjectExternalHref(href)!}
          >Join link</a> : null}
        {meeting.status==="COMPLETED"?<Link className={styles.action}
          href={"/mentor/projects/"+encodeURIComponent(meeting.projectId)+
            "/meetings/"+encodeURIComponent(meeting.id)+"/notes"}>
          Meeting notes and outcome
        </Link>:null}
        {meeting.status==="REQUESTED"?<Link className={styles.action}
          href={"/mentor/projects/"+encodeURIComponent(meeting.projectId)+"/team-meetings"}>
          Answer meeting request
        </Link>:null}
        <Link className={styles.action}
          href={"/mentor/projects/"+encodeURIComponent(meeting.projectId)+"/team-meetings"}>
          Meeting history and actions
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
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const visiblePast=expanded?past:past.slice(0,PAST_PREVIEW);
  const allVisible=[...upcoming,...visiblePast];
  const selected=allVisible.find(item=>item.id===selectedId)??allVisible[0]??null;
  const dayKey=(input:Date)=>new Intl.DateTimeFormat("en-CA",{
    year:"numeric",month:"2-digit",day:"2-digit",timeZone:"Asia/Kolkata",
  }).format(input);
  // Seven day strip is aligned to the IST week containing the server clock.
  const istNow=new Date(instant.getTime()+330*60_000);
  const mondayOffset=(istNow.getUTCDay()+6)%7;
  const mondayUtc=Date.UTC(istNow.getUTCFullYear(),istNow.getUTCMonth(),
    istNow.getUTCDate()-mondayOffset);
  const week=Array.from({length:7},(_,offset)=>{
    const display=new Date(mondayUtc+offset*86400000);
    const key=dayKey(new Date(display.getTime()-330*60_000));
    return {
      key,label:new Intl.DateTimeFormat("en-IN",{
        weekday:"short",day:"numeric",timeZone:"Asia/Kolkata",
      }).format(new Date(display.getTime()-330*60_000)),
      count:meetings.filter(item=>validTime(item.startsAt)&&
        dayKey(new Date(item.startsAt))===key).length,
      today:key===dayKey(instant),
    };
  });

  return <div className="prototype-mentor-meetings" aria-label="Mentor meetings calendar">
    <div className="prototype-mentor-week-strip" aria-label="Meetings this week">
      {week.map(day=><div key={day.key} className={day.today?"prototype-mentor-weekday is-today":"prototype-mentor-weekday"}>
        <strong>{day.label}{day.today?" · today":""}</strong>
        <span>{day.count} {day.count===1?"meeting":"meetings"}</span>
      </div>)}
    </div>
    <div className="prototype-mentor-meeting-columns">
      <section aria-label="Meeting requests, upcoming and past" className="prototype-mentor-meeting-list">
        <div className="prototype-mentor-meeting-pills">
          <span>{upcoming.length} upcoming</span>
          <span>{past.length} past or cancelled</span>
        </div>
        <h2>Upcoming</h2>
        {upcoming.length ? upcoming.map(item=><button key={item.id}
          type="button" className="prototype-mentor-meeting-option"
          aria-pressed={selected?.id===item.id}
          onClick={()=>setSelectedId(item.id)}>
          <span>{dateLabel(item.startsAt)}<small>{clockLabel(item.startsAt)??"Time pending"}</small></span>
          <span><strong>{item.projectTitle}</strong> · {item.title}
            <small>{mentorMeetingDisplayStatus(item,instant)}</small>
          </span>
        </button>):<p className={styles.empty}>No upcoming meetings.</p>}
        <h2>Past and cancelled</h2>
        {visiblePast.length ? visiblePast.map(item=><button key={item.id}
          type="button" className="prototype-mentor-meeting-option"
          aria-pressed={selected?.id===item.id}
          onClick={()=>setSelectedId(item.id)}>
          <span>{dateLabel(item.startsAt)}</span>
          <span><strong>{item.projectTitle}</strong> · {item.title}
            <small>{mentorMeetingDisplayStatus(item,instant)}</small>
          </span>
        </button>):<p className={styles.empty}>No past meetings yet.</p>}
        {past.length>PAST_PREVIEW?<Button variant="secondary" type="button"
          onClick={()=>setExpanded(value=>!value)} aria-expanded={expanded}
          className="m-3">
          {expanded?"Show fewer":"Show all "+past.length+" past meetings"}
        </Button>:null}
      </section>
      <section aria-label="Selected meeting details" className="prototype-mentor-meeting-detail">
        {selected ? <>
          <span className="prototype-mentor-meeting-detail-label">Meeting details</span>
          <MeetingRow key={selected.id} meeting={selected} now={instant}/>
        </> : <p className={styles.empty}>Select a meeting to see its details.</p>}
      </section>
    </div>
  </div>;
}
