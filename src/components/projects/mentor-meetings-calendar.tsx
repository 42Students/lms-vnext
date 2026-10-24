"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  mentorMeetingDisplayStatus, safeMentorMeetingJoinUrl, splitMentorMeetings,
  type MentorMeetingCalendarItem,
} from "@/modules/projects/mentor-calendar-view";
import { StatusBadge } from "@/components/ui/status-badge";
import { safeProjectExternalHref } from "@/modules/projects/mentor-workspace-evidence-model";
import {mentorCalendarWeekWorkload} from "@/modules/projects/mentor-calendar-week-workload-model";
import {mentorMeetingListKinds,mentorMeetingListScopes,mentorMeetingListMatch,type MentorMeetingListKind,type MentorMeetingListScope} from "@/modules/projects/mentor-meeting-list-filter-model";
import {buildMentorMeetingIcs} from "@/modules/projects/mentor-calendar-ics-model";
import {Button} from "@/components/ui/button";
import {MentorMeetingRequestActions} from "./mentor-meeting-request-actions";
import {MentorMeetingReschedule} from "./mentor-meeting-reschedule";
import {MentorMeetingCancelInline} from "./mentor-meeting-cancel-inline";
import {MentorMeetingOutcomeQuickEdit} from "./mentor-meeting-outcome-quick-edit";
import {MentorMeetingFacilitationQuickEdit} from "./mentor-meeting-facilitation-quick-edit";
import {MentorGoogleMeetingProviderStatus} from "./mentor-google-meeting-provider-status";
import {MentorGoogleMeetingSyncControls} from "./mentor-google-meeting-sync-controls";
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
/** Download only an explicitly requested local ICS export. This does not
 * synchronize a cloud calendar or imply team invitations were delivered.
 */
function downloadIcs(meetings:readonly MentorMeetingCalendarItem[],filename:string){
 const content=buildMentorMeetingIcs(meetings);
 if(!content)return;
 const url=URL.createObjectURL(new Blob([content],{
  type:"text/calendar;charset=utf-8",
 }));
 const anchor=document.createElement("a");
 anchor.href=url;anchor.download=filename;
 document.body.appendChild(anchor);anchor.click();anchor.remove();
 window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function downloadMeetingCalendar(meeting:MentorMeetingCalendarItem){
 downloadIcs([meeting],"42lms-mentor-meeting.ics");
}
function downloadAllMentorMeetings(meetings:readonly MentorMeetingCalendarItem[]){
 downloadIcs(meetings,"42lms-mentor-meetings.ics");
}
function MeetingRow({
  meeting, now,
}: {meeting: MentorMeetingCalendarItem; now: Date;}) {
  const status = mentorMeetingDisplayStatus(meeting, now);
  const editable=meeting.canMutate===true&&meeting.projectStatus==="ACTIVE";
  // A recorded safe join link must be reachable before a scheduled meeting
  // starts, not only during its duration. Hide actions for already-ended slots.
  const href = Date.parse(meeting.endsAt)>now.getTime()
    ?safeMentorMeetingJoinUrl(meeting):null;
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
      {meeting.status==="REQUESTED"?<div className="prototype-mentor-meeting-section"
        aria-label="Recorded meeting request details">
        <h3>Asked to meet</h3>
        <p>Requested by: {meeting.requestedByName??"Requester name unavailable"}</p>
        <p>Suggested slot: {dateLabel(meeting.startsAt)} ·
          {" "}{meetingTimeLabel(meeting)}</p>
        {meeting.linkedTaskId&&meeting.linkedTaskTitle?<p>
          Related task: <Link href={"/mentor/projects/"+
            encodeURIComponent(meeting.projectId)+
            "?tab=board&scope=all&task="+encodeURIComponent(meeting.linkedTaskId)}>
            {meeting.linkedTaskTitle} →
          </Link></p>:null}
      </div>:null}
      <MentorMeetingRequestActions meeting={meeting}/>
      {editable&&meeting.updatedAt&&
        (meeting.status==="SCHEDULED"||meeting.status==="RESCHEDULED")?
        <div className="flex flex-wrap items-center gap-2">
          <MentorMeetingReschedule projectId={meeting.projectId}
            meetingId={meeting.id} startsAt={meeting.startsAt}
            endsAt={meeting.endsAt} updatedAt={meeting.updatedAt}/>
          <MentorMeetingCancelInline projectId={meeting.projectId}
            meetingId={meeting.id} expectedUpdatedAt={meeting.updatedAt}/>
        </div>:null}
      <div className="prototype-mentor-meeting-section"
        aria-label="Recorded calendar integration status">
        {meeting.googleProviderStatus?<MentorGoogleMeetingProviderStatus status={meeting.googleProviderStatus}/>:null}
        {meeting.legacyCalendarSyncStatus?<p>
          Imported calendar status: {meeting.legacyCalendarSyncStatus}.
          {" "}This historical field is not proof of a current Google connection.
        </p>:meeting.googleProviderStatus?null:<p>No verified live calendar sync for this meeting.
          Download an .ics file if you want a local calendar copy.</p>}
        {meeting.calendarSyncError?<p role="status">
          Recorded calendar error: {meeting.calendarSyncError}</p>:null}
        {(meeting.status==="SCHEDULED"||meeting.status==="RESCHEDULED")?
          <MentorGoogleMeetingSyncControls projectId={meeting.projectId}
            meetingId={meeting.id} canEdit={editable&&Date.parse(meeting.startsAt)>now.getTime()}/>:null}
      </div>
      {meeting.agenda?.trim()?<section className="prototype-mentor-meeting-section">
        <h3>Agenda</h3><p>{meeting.agenda}</p>
      </section>:null}
      {(meeting.facilitation?.attendees?.length??0)>0?<section className="prototype-mentor-meeting-section">
        <h3>Who came · {meeting.facilitation?.attendees?.length??0}</h3>
        <ul className="prototype-mentor-meeting-attendees">
          {meeting.facilitation?.attendees?.map((person,index)=><li key={person.membershipId??index}>
            <span>{person.name}</span>
            <small>{person.attended?"Came":"Didn't attend"}</small>
          </li>)}
        </ul>
      </section>:null}
      {meeting.facilitation?.notes?.trim()||meeting.outcome?.trim()?
        <section className="prototype-mentor-meeting-section">
          <h3>Recorded mentor notes and outcome</h3>
          <p>{meeting.facilitation?.notes?.trim()||meeting.outcome}</p>
        </section>:null}
      {(meeting.facilitation?.actionItemRows?.length??0)>0?
        <section className="prototype-mentor-meeting-section">
          <h3>Action items · one a line, @ who</h3>
          <ol>{meeting.facilitation?.actionItemRows?.map((item,index)=>
            <li key={index}><span>{item.text}</span>
              {item.owner?<small>Owner: {item.owner}</small>:null}
              {item.complete?<small>Done</small>:null}
            </li>)}</ol>
        </section>:null}
      {meeting.facilitation?.wentWell||meeting.facilitation?.improve?
        <section className="prototype-mentor-meeting-section">
          <h3>Retrospective</h3>
          {meeting.facilitation.wentWell?<p>Went well: {meeting.facilitation.wentWell}</p>:null}
          {meeting.facilitation.improve?<p>Improve: {meeting.facilitation.improve}</p>:null}
          {meeting.facilitation.nextTime?<p>Next time: {meeting.facilitation.nextTime}</p>:null}
        </section>:null}
      {meeting.facilitation?.followUpStatus&&meeting.facilitation.followUpStatus!=="NOT_PLANNED"?
        <p className="prototype-mentor-meeting-followup">
          Follow-up: {meeting.facilitation.followUpStatus.replaceAll("_"," ")}
          {meeting.facilitation.followUpNotes?" · "+meeting.facilitation.followUpNotes:""}
        </p>:null}
      <MentorMeetingOutcomeQuickEdit key={meeting.id}
        projectId={meeting.projectId} meetingId={meeting.id}
        recorded={meeting.outcome??null} updatedAt={meeting.updatedAt??null}
        editable={editable&&meeting.status==="COMPLETED"}/>
      <MentorMeetingFacilitationQuickEdit key={meeting.id+":facilitation"}
        projectId={meeting.projectId} meetingId={meeting.id}
        recorded={meeting.facilitation} updatedAt={meeting.updatedAt??null}
        editable={editable&&meeting.status==="COMPLETED"}/>
      {!editable ? (
        <p className="mt-2 text-xs text-muted-foreground leading-[20px]">
          {meeting.projectStatus==="ARCHIVED"?"Archived project · Read-only":
            "This Mentor assignment is read-only for meeting changes."}
        </p>
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
          href={"/mentor/projects/" + encodeURIComponent(meeting.projectId) +
            "?tab=team#meeting-"+encodeURIComponent(meeting.id)}>
          {editable?
            "Edit attendance, notes & action items":"View meeting record"}
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
  const [listKind,setListKind]=useState<MentorMeetingListKind>("ALL");
  const [listScope,setListScope]=useState<MentorMeetingListScope>("ALL");
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
  const matchingMeetings=useMemo(()=>meetings.filter(item=>
    mentorMeetingListMatch(item,listKind,listScope,instant)),
    [meetings,listKind,listScope,instant]);
  const {upcoming, past} = useMemo(() => splitMentorMeetings(matchingMeetings, instant), [matchingMeetings, instant]);
  const weekWorkload=useMemo(()=>mentorCalendarWeekWorkload(meetings,instant),
    [meetings,instant]);
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
    <div className="prototype-mentor-calendar-export">
      <span>All your active scheduled meetings · IST</span>
      <Button type="button" size="sm" variant="secondary"
        disabled={!meetings.some(meeting=>["SCHEDULED","RESCHEDULED"].includes(meeting.status))}
        onClick={()=>downloadAllMentorMeetings(meetings)}>Add to my calendar (.ics)</Button>
    </div>
    <div className="prototype-mentor-calendar-export" aria-label="This week meeting workload">
      <strong>{weekWorkload.scheduled} scheduled meetings ·
        {" "}{weekWorkload.hours} hours this week (IST)</strong>
      <span>{weekWorkload.requests} requested · {weekWorkload.reviews} reviews ·
        {" "}{weekWorkload.retros} retrospectives</span>
    </div>
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
        <div role="group" aria-label="Meeting ceremony types"
          className="flex flex-wrap gap-2 p-3">
          {mentorMeetingListKinds.map(kind=><Button type="button" key={kind.id}
            size="sm" variant={listKind===kind.id?"primary":"secondary"}
            aria-pressed={listKind===kind.id}
            onClick={()=>{setListKind(kind.id);setSelectedId(null);setExpanded(false);}}>
            {kind.label}
          </Button>)}
        </div>
        <label className="block p-3 text-xs font-semibold">Show
          <select aria-label="Meeting period and notes" value={listScope}
            className="ml-2 rounded border border-border bg-surface px-2 py-2"
            onChange={event=>{
              setListScope(event.target.value as MentorMeetingListScope);
              setSelectedId(null);setExpanded(false);
            }}>
            {mentorMeetingListScopes.map(option=>
              <option value={option.id} key={option.id}>{option.label}</option>)}
          </select>
          <small className="ml-2 font-normal text-muted-foreground">
            {matchingMeetings.length} of {meetings.length} loaded meetings
          </small>
        </label>
        <h2>{listScope==="ASKED"?"Meeting requests":"Upcoming"}</h2>
        {upcoming.length ? upcoming.map(item=><button key={item.id}
          type="button" className="prototype-mentor-meeting-option"
          aria-pressed={selected?.id===item.id}
          onClick={()=>setSelectedId(item.id)}>
          <span>{dateLabel(item.startsAt)}<small>{clockLabel(item.startsAt)??"Time pending"}</small></span>
          <span><strong>{item.projectTitle}</strong> · {item.title}
            <small>{mentorMeetingDisplayStatus(item,instant)}</small>
          </span>
        </button>):<p className={styles.empty}>No upcoming meetings.</p>}
        <h2>{listScope==="NOTES_MISSING"?"Past · notes to finish":"Past and cancelled"}</h2>
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
