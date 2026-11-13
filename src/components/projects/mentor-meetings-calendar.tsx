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
import {MENTOR_INITIAL_VIEWER_ZONE,mentorViewerDateLabel,mentorViewerClockLabel,mentorViewerMeetingTimeLabel,safeMentorViewerZone} from "@/modules/projects/mentor-calendar-viewer-time-model";
import {Button} from "@/components/ui/button";
import {MentorMeetingRequestActions} from "./mentor-meeting-request-actions";
import {MentorMeetingReschedule} from "./mentor-meeting-reschedule";
import {MentorMeetingCancelInline} from "./mentor-meeting-cancel-inline";
import {MentorMeetingOutcomeQuickEdit} from "./mentor-meeting-outcome-quick-edit";
import {MentorMeetingFacilitationQuickEdit} from "./mentor-meeting-facilitation-quick-edit";
import {MentorGoogleMeetingProviderStatus} from "./mentor-google-meeting-provider-status";
import {MentorGoogleMeetingSyncControls} from "./mentor-google-meeting-sync-controls";
import styles from "./mentor-meetings-calendar.module.css";
import { Select } from "@/components/ui/select";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";
import { Label } from "@/components/ui/label";
import { Disclosure } from "@/components/ui/disclosure";
import { istIsoDateFormatter } from "@/lib/format-date";
import { createDateFormatter } from "@/lib/format-date";

import { DEFAULT_TIME_ZONE } from "@/config/locale";
const PAST_PREVIEW = 20;
const validTime=(raw:string)=>raw.trim().length>0&&Number.isFinite(Date.parse(raw));
const dateLabel=mentorViewerDateLabel;
const clockLabel=mentorViewerClockLabel;
const meetingTimeLabel=mentorViewerMeetingTimeLabel;
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
  meeting, now, viewerTimeZone,
}: {meeting: MentorMeetingCalendarItem; now: Date; viewerTimeZone:string;}) {
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
          <Heading level={3} className={styles.title}>{meeting.title}</Heading>
          <p className={styles.subtitle}>{meeting.projectTitle}</p>
        </div>
        <StatusBadge tone={
          status === "COMPLETED" ? "success" :
          status === "MISSED" ? "error" : status === "CANCELLED" ? "neutral" :
          status === "REQUESTED" ? "warning" : "info"
        }>{status}</StatusBadge>
      </div>
      <p className={styles.meta}>
        {dateLabel(meeting.startsAt,viewerTimeZone)} · {meetingTimeLabel(meeting,viewerTimeZone)}
        {(meeting.linkedSprintTitle||meeting.legacySprintLabel)
          ? " · Sprint: " + (meeting.linkedSprintTitle||meeting.legacySprintLabel) : ""}
      </p>
      {meeting.status==="REQUESTED"?<div className="prototype-mentor-meeting-section"
        aria-label="Recorded meeting request details">
        <Heading level={3}>Asked to meet</Heading>
        <p>Requested by: {meeting.requestedByName??"Requester name unavailable"}</p>
        <p>Suggested slot: {dateLabel(meeting.startsAt,viewerTimeZone)} ·
          {" "}{meetingTimeLabel(meeting,viewerTimeZone)}</p>
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
        {(["DRAFT","SCHEDULED","RESCHEDULED","CANCELLED"].includes(meeting.status))?
          <MentorGoogleMeetingSyncControls projectId={meeting.projectId}
            meetingId={meeting.id} draft={meeting.status==="DRAFT"}
            cancelled={meeting.status==="CANCELLED"}
            canEdit={editable&&(
              meeting.status==="CANCELLED"||Date.parse(meeting.startsAt)>now.getTime())}/>:null}
      </div>
      {meeting.agenda?.trim()?<section className="prototype-mentor-meeting-section">
        <Heading level={3}>Agenda</Heading><p>{meeting.agenda}</p>
      </section>:null}
      {(meeting.facilitation?.attendees?.length??0)>0?<section className="prototype-mentor-meeting-section">
        <Heading level={3}>Who came · {meeting.facilitation?.attendees?.length??0}</Heading>
        <ul className="prototype-mentor-meeting-attendees">
          {meeting.facilitation?.attendees?.map((person,index)=><li key={person.membershipId??index}>
            <span>{person.name}</span>
            <small>{person.attended?"Came":"Didn't attend"}</small>
          </li>)}
        </ul>
      </section>:null}
      {meeting.facilitation?.notes?.trim()||meeting.outcome?.trim()?
        <section className="prototype-mentor-meeting-section">
          <Heading level={3}>Recorded mentor notes and outcome</Heading>
          <p>{meeting.facilitation?.notes?.trim()||meeting.outcome}</p>
        </section>:null}
      {(meeting.facilitation?.actionItemRows?.length??0)>0?
        <section className="prototype-mentor-meeting-section">
          <Heading level={3}>Action items · one a line, @ who</Heading>
          <ol>{meeting.facilitation?.actionItemRows?.map((item,index)=>
            <li key={index}><span>{item.text}</span>
              {item.owner?<small>Owner: {item.owner}</small>:null}
              {item.complete?<small>Done</small>:null}
            </li>)}</ol>
        </section>:null}
      {meeting.facilitation?.wentWell||meeting.facilitation?.improve?
        <section className="prototype-mentor-meeting-section">
          <Heading level={3}>Retrospective</Heading>
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
        <TextLink variant="bare" className={styles.action}
          href={"/mentor/projects/" + encodeURIComponent(meeting.projectId) +
            "?tab=team#meeting-"+encodeURIComponent(meeting.id)}>
          {editable?
            "Edit attendance, notes & action items":"View meeting record"}
        </TextLink>
        {safeProjectExternalHref(href) ? <TextLink variant="bare" className={styles.action} href={safeProjectExternalHref(href)!}
          >Join link</TextLink> : null}
        {meeting.status==="COMPLETED"?<TextLink variant="bare" className={styles.action}
          href={"/mentor/projects/"+encodeURIComponent(meeting.projectId)+
            "/meetings/"+encodeURIComponent(meeting.id)+"/notes"}>
          Meeting notes and outcome
        </TextLink>:null}
        {meeting.status==="REQUESTED"?<TextLink variant="bare" className={styles.action}
          href={"/mentor/projects/"+encodeURIComponent(meeting.projectId)+"/team-meetings"}>
          Answer meeting request
        </TextLink>:null}
        <TextLink variant="bare" className={styles.action}
          href={"/mentor/projects/"+encodeURIComponent(meeting.projectId)+"/team-meetings"}>
          Meeting history and actions
        </TextLink>
      </div>
    </article>
  );
}


/** The old LMS calendar displayed two quiet lists, not a dashboard.
 * Keep this faithful primary view while the richer vNext scheduling tools
 * remain available in the optional advanced disclosure below. */
function LegacyMeetingRow({meeting,now,viewerTimeZone}:{
  meeting:MentorMeetingCalendarItem;now:Date;viewerTimeZone:string;
}){
  const status=mentorMeetingDisplayStatus(meeting,now);
  const join=Date.parse(meeting.endsAt)>now.getTime()
    ?safeMentorMeetingJoinUrl(meeting):null;
  const safeJoin=join?safeProjectExternalHref(join):null;
  return <article className={styles.legacyMeetingRow}>
    <div className={styles.legacyMeetingTop}>
      <div className={styles.legacyMeetingName}>
        <strong>{meeting.title}</strong>
        <div>{meeting.projectTitle}</div>
      </div>
      <StatusBadge tone={
        status==="COMPLETED"?"success":
        status==="MISSED"?"error":
        status==="CANCELLED"?"neutral":
        status==="REQUESTED"?"warning":"info"
      }>{status}</StatusBadge>
    </div>
    <div className={styles.legacyMeetingMeta}>
      <span>{dateLabel(meeting.startsAt,viewerTimeZone)}</span>
      <span>{meetingTimeLabel(meeting,viewerTimeZone)}</span>
      {(meeting.linkedSprintTitle||meeting.legacySprintLabel)?
        <span>{"Sprint: "+(meeting.linkedSprintTitle||meeting.legacySprintLabel)}</span>:null}
    </div>
    <div className={styles.legacyMeetingActions}>
      {safeJoin?<TextLink href={safeJoin} target="_blank" rel="noopener noreferrer">
        Join link</TextLink>:null}
      <Link href={"/mentor/projects/"+encodeURIComponent(meeting.projectId)+"?tab=team"}>
        Open project
      </Link>
    </div>
  </article>;
}

export function MentorMeetingsCalendar({
  meetings, initialNow,
}: {meetings: readonly MentorMeetingCalendarItem[]; initialNow: string}) {
  const [now, setNow] = useState(initialNow);
  const [viewerTimeZone,setViewerTimeZone]=useState(MENTOR_INITIAL_VIEWER_ZONE);
  const [expanded, setExpanded] = useState(false);
  const [listKind,setListKind]=useState<MentorMeetingListKind>("ALL");
  const [listScope,setListScope]=useState<MentorMeetingListScope>("ALL");
  useEffect(() => {
    // Hydrate the viewer's timezone after the initial UTC-compatible render.
    // A queued callback avoids synchronous state updates in an effect.
    const frame = window.requestAnimationFrame(() => {
      setNow(new Date().toISOString());
      // Browser-only: hydrate the viewer-local timezone without a server/CSR mismatch.
      setViewerTimeZone(safeMentorViewerZone(Intl.DateTimeFormat().resolvedOptions().timeZone));
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
  const dayKey=(input:Date)=>istIsoDateFormatter.format(input);
  // Seven day strip is aligned to the IST week containing the server clock.
  const istNow=new Date(instant.getTime()+330*60_000);
  const mondayOffset=(istNow.getUTCDay()+6)%7;
  const mondayUtc=Date.UTC(istNow.getUTCFullYear(),istNow.getUTCMonth(),
    istNow.getUTCDate()-mondayOffset);
  const week=Array.from({length:7},(_,offset)=>{
    const display=new Date(mondayUtc+offset*86400000);
    const key=dayKey(new Date(display.getTime()-330*60_000));
    return {
      key,label:createDateFormatter("en-IN", {
        weekday:"short",day:"numeric",timeZone:DEFAULT_TIME_ZONE,
      }).format(new Date(display.getTime()-330*60_000)),
      count:meetings.filter(item=>validTime(item.startsAt)&&
        dayKey(new Date(item.startsAt))===key).length,
      today:key===dayKey(instant),
    };
  });

  return <div className="prototype-mentor-meetings" aria-label="Mentor meetings calendar">
    <div className={styles.legacyCalendar} aria-label="Meetings list">
      <p className="text-xs text-muted-foreground" aria-live="polite">Meeting times are shown in {viewerTimeZone}.</p>
      <section className={styles.legacySection} aria-label="Upcoming meetings">
        <Heading level={2} className={styles.legacySectionHeading}>
          <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"
            fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="16" rx="1"/>
            <path d="M7 3v4M17 3v4M3 10h18"/>
          </svg>
          Upcoming ({upcoming.length})
        </Heading>
        {upcoming.length?upcoming.map(item=>
          <LegacyMeetingRow key={item.id} meeting={item} now={instant} viewerTimeZone={viewerTimeZone}/>):
          <p className={styles.legacyEmpty}>No upcoming meetings.</p>}
      </section>
      <section className={styles.legacySection} aria-label="Past and cancelled meetings">
        <Heading level={2} className={styles.legacySectionHeading}>Past &amp; Cancelled ({past.length})</Heading>
        {past.length?past.slice(0,expanded?past.length:PAST_PREVIEW).map(item=>
          <LegacyMeetingRow key={item.id} meeting={item} now={instant} viewerTimeZone={viewerTimeZone}/>):
          <p className={styles.legacyEmpty}>No past meetings yet.</p>}
        {past.length>PAST_PREVIEW?<Button variant="bare" type="button"
          className={styles.legacyShowMore}
          onClick={()=>setExpanded(value=>!value)}>
          {expanded?"Show fewer":"Show all "+past.length+" past meetings"}
        </Button>:null}
      </section>
    </div>
    <Disclosure title="Meeting filters and calendar tools">
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
        <Label className="block p-3">Show
          <Select aria-label="Meeting period and notes" value={listScope}
            className="ml-2 rounded border border-border bg-surface px-2 py-2"
            onChange={event=>{
              setListScope(event.target.value as MentorMeetingListScope);
              setSelectedId(null);setExpanded(false);
            }}>
            {mentorMeetingListScopes.map(option=>
              <option value={option.id} key={option.id}>{option.label}</option>)}
          </Select>
          <small className="ml-2 font-normal text-muted-foreground">
            {matchingMeetings.length} of {meetings.length} loaded meetings
          </small>
        </Label>
        <Heading level={2}>{listScope==="ASKED"?"Meeting requests":"Upcoming"}</Heading>
        {upcoming.length ? upcoming.map(item=><Button variant="menu-item" key={item.id}
          type="button"
          aria-pressed={selected?.id===item.id}
          onClick={()=>setSelectedId(item.id)}>
          <span>{dateLabel(item.startsAt,viewerTimeZone)}<small>{clockLabel(item.startsAt,viewerTimeZone)??"Time pending"}</small></span>
          <span><strong>{item.projectTitle}</strong> · {item.title}
            <small>{mentorMeetingDisplayStatus(item,instant)}</small>
          </span>
        </Button>):<p className={styles.empty}>No upcoming meetings.</p>}
        <Heading level={2}>{listScope==="NOTES_MISSING"?"Past · notes to finish":"Past and cancelled"}</Heading>
        {visiblePast.length ? visiblePast.map(item=><Button variant="menu-item" key={item.id}
          type="button"
          aria-pressed={selected?.id===item.id}
          onClick={()=>setSelectedId(item.id)}>
          <span>{dateLabel(item.startsAt,viewerTimeZone)}</span>
          <span><strong>{item.projectTitle}</strong> · {item.title}
            <small>{mentorMeetingDisplayStatus(item,instant)}</small>
          </span>
        </Button>):<p className={styles.empty}>No past meetings yet.</p>}
        {past.length>PAST_PREVIEW?<Button variant="secondary" type="button"
          onClick={()=>setExpanded(value=>!value)} aria-expanded={expanded}
          className="m-3">
          {expanded?"Show fewer":"Show all "+past.length+" past meetings"}
        </Button>:null}
      </section>
      <section aria-label="Selected meeting details" className="prototype-mentor-meeting-detail">
        {selected ? <>
          <span className="prototype-mentor-meeting-detail-label">Meeting details</span>
          <MeetingRow key={selected.id} meeting={selected} now={instant} viewerTimeZone={viewerTimeZone}/>
        </> : <p className={styles.empty}>Select a meeting to see its details.</p>}
      </section>
    </div>
    </Disclosure>
  </div>;
}
