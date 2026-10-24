"use client";

import Link from "next/link";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {mentorAttentionReceiptKey} from "@/modules/projects/mentor-attention-read-model";
import type {MentorProjectAttention} from "@/modules/projects/mentor-attention";
import type {MentorStudentWatchItem} from "@/modules/projects/mentor-student-watch-service";
import type {MentorMeetingCalendarItem} from "@/modules/projects/mentor-calendar-view";
import {selectMentorHomeWeekMeetings} from "@/modules/projects/mentor-home-week-meetings-model";
import {mentorHomeGreeting} from "@/modules/projects/mentor-home-greeting-model";

type FocusItem = MentorProjectAttention;

function attentionLabel(kind:FocusItem["kind"]):string {
  switch(kind) {
    case "REVIEW": return "Submission to review";
    case "STALLED": return "Project gone quiet";
    case "REQUESTED": return "Meeting request";
    case "MEETING_SOON": return "Meeting coming up";
    case "TASK_REVIEW": return "Task waiting for approval";
    case "TASK_BLOCKED": return "Blocked task";
    case "SPRINT_SIGN_OFF": return "Sprint ready for sign-off";
    case "UNASSIGNED_NEXT": return "Next sprint needs assignment";
  }
}
function attentionAction(kind:FocusItem["kind"]):string {
  switch(kind) {
    case "REVIEW": return "Review it";
    case "STALLED": return "Plan a check-in";
    case "REQUESTED": return "Answer";
    case "MEETING_SOON": return "See meeting";
    case "TASK_REVIEW": return "Review task";
    case "TASK_BLOCKED": return "Help unblock";
    case "SPRINT_SIGN_OFF": return "Sign off sprint";
    case "UNASSIGNED_NEXT": return "Assign tasks";
  }
}
function activityTime(value:string) {
  const parsed=new Date(value);
  if(!Number.isFinite(parsed.getTime()))return "Recorded update";
  return new Intl.DateTimeFormat("en-IN",{
    day:"numeric",month:"short",year:"numeric",timeZone:"Asia/Kolkata",
  }).format(parsed);
}
/** Prototype screen #45: verified project attention with durable,
 * recipient-scoped Later receipts that reopen when source revisions change.
 */
export function MentorPrototypeHome({
  nowIso,mentorName,courseLabels,attention,teamCount,membershipCount,studentWatch,
  uniqueLearnerCount,learnerAssignmentCount,initialLater,
  weekMeetings,weekMeetingsLoadFailed,
}:{
  nowIso:string;
  mentorName:string|null;
  courseLabels:readonly string[];
  initialLater:readonly string[];
  attention:readonly FocusItem[];
  weekMeetings:readonly MentorMeetingCalendarItem[];
  weekMeetingsLoadFailed:boolean;
  teamCount:number;
  membershipCount:number;
  uniqueLearnerCount:number;
  learnerAssignmentCount:number;
  studentWatch:readonly MentorStudentWatchItem[];
}) {
  const router=useRouter();
  const [snoozed,setSnoozed]=useState<readonly string[]>(initialLater);
  const [laterBusy,setLaterBusy]=useState<string|null>(null);
  const [laterError,setLaterError]=useState("");
  const active=attention.filter(item=>
    !snoozed.includes(mentorAttentionReceiptKey(item)));
  const focus=active.slice(0,5);
  const meetings=selectMentorHomeWeekMeetings(weekMeetings,new Date(nowIso));

  const later=async(item:FocusItem)=>{
    const key=mentorAttentionReceiptKey(item);
    if(laterBusy)return;
    setLaterBusy(key);setLaterError("");
    try{
      const result=await apiFetch<{hidden:boolean}>(
        "/api/mentor/attention/later",{
          method:"POST",headers:{"content-type":"application/json"},
          body:JSON.stringify({key}),timeoutMs:12000,
        });
      if(!result.hidden)throw new Error("Attention was not postponed.");
      setSnoozed(previous=>[...new Set([...previous,key])]);
      router.refresh();
    }catch(reason){
      setLaterError(reason instanceof Error?reason.message:
        "Couldn't postpone the item. Retry.");
    }finally{setLaterBusy(null);}
  };

  return <div className="prototype-mentor-home">
    <div className="prototype-mentor-home-heading">
      <div>
        <p className="text-sm font-semibold">
          {mentorHomeGreeting(nowIso,mentorName)}
        </p>
        <p>{teamCount} {teamCount===1?"team":"teams"} · {uniqueLearnerCount} distinct {uniqueLearnerCount===1?"student":"students"} ·
          {" "}{learnerAssignmentCount} learner team {learnerAssignmentCount===1?"seat":"seats"} ·
          {" "}{membershipCount} total project memberships</p>
        <h1>{active.length
          ? active.length+" "+(active.length===1?"thing needs":"things need")+" you."
          : "You’re all caught up."}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {courseLabels.length?
            "Your recorded courses: "+courseLabels.slice(0,4).join(" · ")+
              (courseLabels.length>4?" · +"+(courseLabels.length-4)+" more":""):
            "No course labels are recorded for your current project assignments."}
        </p>
        <Link className="inline-flex min-h-10 items-center text-sm text-link underline"
          href="/mentor/projects?status=ARCHIVED">Browse archived teams →</Link>
        <p className="mt-1 text-xs text-muted-foreground">
          The system records primary Mentor assignments, not a separate
          student team-lead designation. No student lead is inferred.
        </p>
      </div>
    </div>
    <div className="prototype-mentor-home-columns">
      <section className="prototype-mentor-focus" aria-label="Needs you, oldest first">
        <div className="prototype-mentor-box-heading">
          <strong>Needs you · oldest within priority</strong>
          <span>Later hides it until this event changes</span>
        </div>
        {laterError?<p role="alert">{laterError}</p>:null}
        {focus.length ? focus.map(item=><article className="prototype-mentor-focus-item" key={item.key}>
          <div>
            <span className="prototype-mentor-focus-kind">{attentionLabel(item.kind)} · {activityTime(item.occurredAt)}</span>
            <strong>{item.title}</strong>
            <p>{item.description}</p>
          </div>
          <div className="prototype-mentor-focus-actions">
            <Link href={item.href}>{attentionAction(item.kind)}</Link>
            <button type="button" disabled={laterBusy!==null}
              onClick={()=>void later(item)}
              aria-label={"Later: "+item.title}>
              {laterBusy===mentorAttentionReceiptKey(item)?"Saving…":"Later"}
            </button>
          </div>
        </article>):<p className="prototype-mentor-empty">No pending sprint sign-offs, task reviews, blockers or meeting requests in your current projects.</p>}
        {active.length>5?<p className="prototype-mentor-focus-footer">{active.length-5} more items need attention. <Link href="/mentor/notifications">See notifications</Link></p>:null}
      </section>
      <aside className="prototype-mentor-home-right" aria-label="Team overview">
        <section className="prototype-mentor-small-card">
          <div className="prototype-mentor-small-title">
            <strong>This week · {meetings.length} {meetings.length===1?"meeting":"meetings"}</strong>
            <Link href="/mentor/calendar">All meetings ›</Link>
          </div>
          {weekMeetingsLoadFailed?<p role="alert" className="prototype-mentor-small-empty">
            Meetings could not be loaded. <Link href="/mentor/calendar">Open calendar</Link>
          </p>:meetings.length?<>
            {meetings.slice(0,4).map(item=><Link
              href={"/mentor/calendar?projectId="+encodeURIComponent(item.projectId)}
              className="prototype-mentor-small-row" key={item.id}>
              <span>{new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"short",
                weekday:"short",hour:"numeric",minute:"2-digit",timeZone:"Asia/Kolkata"})
                .format(new Date(item.startsAt))}</span>
              <strong>{item.title} · {item.projectTitle}</strong>
            </Link>)}
            {meetings.length>4?<Link href="/mentor/calendar">
              {meetings.length-4} more this week →</Link>:null}
          </>:<p className="prototype-mentor-small-empty">No more meetings this week.
            {" "}<Link href="/mentor/calendar">Open calendar</Link></p>}
        </section>
        <section className="prototype-mentor-small-card">
          <div className="prototype-mentor-small-title"><strong>Students to watch</strong>
            <Link href="/mentor/projects">Your teams ›</Link>
          </div>
          {studentWatch.length?studentWatch.slice(0,5).map(item=><Link
            href={"/mentor/projects/"+encodeURIComponent(item.projectId)+"?tab=performance"}
            className="prototype-mentor-student-watch-row" key={item.projectId+item.id}>
            <span className="prototype-mentor-student-avatar" aria-hidden="true">
              {item.name.trim().split(/\s+/).slice(0,2).map(part=>part.charAt(0)).join("").toUpperCase()||"S"}
            </span>
            <span><strong>{item.name}</strong><small>{item.projectTitle}</small>
              <small>{[
                item.blocked?item.blocked+" blocked":null,
                item.waiting?item.waiting+" awaiting review":null,
                ...item.signals,
              ].filter(Boolean).join(" · ")}</small>
            </span>
          </Link>):<p className="prototype-mentor-small-empty">No student has blocked or review-pending tasks in the visible teams.</p>}
          <p className="prototype-mentor-watch-note">Based on assigned open-task changes,
            blocked/review states and current workload concentration. Task changes may be
            made by any authorized team member; these are not login, attendance or
            personal-risk predictions.</p>
        </section>
      </aside>
    </div>
  </div>;
}
