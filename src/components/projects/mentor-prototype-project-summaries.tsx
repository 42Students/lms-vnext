import Link from "next/link";
import {recentMentorWorkedSprintIds} from "@/modules/projects/mentor-recent-worked-sprints-model";
import {projectMentorVelocity} from "@/modules/projects/mentor-sprint-velocity-model";
import type {getProjectWorkspaceView} from "@/modules/projects/workspace-view-service";
import {safeProjectExternalHref} from "@/modules/projects/mentor-workspace-evidence-model";
import {ReleaseLifecycleActions,SprintLifecycleActions} from "./project-lifecycle-actions";
import {MentorSprintSignOff} from "./mentor-sprint-sign-off";
import {MentorEvidenceGallery} from "./mentor-evidence-gallery";
import {compareMentorEvidenceReferences} from "@/modules/projects/mentor-evidence-revision-model";
import {MentorPrototypePerformanceTable} from "./mentor-prototype-performance-table";

type Workspace=Awaited<ReturnType<typeof getProjectWorkspaceView>>;
type ProjectTask=Workspace["tasks"][number];
const countTasks=(tasks:readonly ProjectTask[],status:string)=>tasks.filter(task=>task.status===status).length;
const points=(tasks:readonly ProjectTask[])=>tasks.reduce((total,task)=>
  total+(typeof task.estimatePoints==="number"?task.estimatePoints:0),0);
const statusTone=(status:string)=>status==="COMPLETED"||status==="SHIPPED"?"done":
  status==="ACTIVE"?"active":"planned";

export function MentorPrototypeSprintPlan({workspace,readOnly}:{workspace:Workspace;readOnly:boolean}){
  const liveTasks=workspace.tasks.filter(task=>!task.deletedAt);
  const backlog=liveTasks.filter(task=>task.sprintId===null);
  const sprints=[...workspace.sprints].sort((a,b)=>a.sequence-b.sequence);
  const historical=new Map(workspace.mentorSprintSnapshots.map(snapshot=>
    [snapshot.sprintId,snapshot] as const));
  const chartPoints=(sprint:Workspace["sprints"][number])=>{
    if(sprint.status==="COMPLETED"){
      const snapshot=historical.get(sprint.id);
      return snapshot?{planned:snapshot.plannedPoints,done:snapshot.donePoints,recorded:true}:
        {planned:0,done:0,recorded:false};
    }
    const group=liveTasks.filter(task=>task.sprintId===sprint.id);
    return {planned:points(group),done:points(group.filter(task=>task.status==="DONE")),
      recorded:true};
  };
  const maxPts=Math.max(1,...sprints.map(sprint=>chartPoints(sprint).planned));
  const base="/mentor/projects/"+encodeURIComponent(workspace.project.id);
  return <div className="prototype-mentor-sprint-plan">
    <section className="prototype-mentor-kpi-card" aria-label="Sprint and release totals">
      <div><span>Sprints</span><strong>{sprints.length}</strong></div>
      <div><span>Signed off</span><strong>{sprints.filter(s=>s.status==="COMPLETED").length}</strong></div>
      <div><span>Releases</span><strong>{workspace.releases.length}</strong></div>
      <div><span>Backlog</span><strong>{backlog.length} tasks · {points(backlog)} pts</strong></div>
    </section>
    <section className="prototype-mentor-chart-card" aria-label="Points per sprint">
      <div className="prototype-mentor-card-title"><h2>Points per sprint · planned and done</h2>
        <span>From your recorded task estimates</span></div>
      {sprints.length?
        <div className="prototype-mentor-sprint-bars">
          {sprints.map(sprint=>{
            const value=chartPoints(sprint);
            const planned=value.planned,completed=value.done;
            return <Link href={base+"?tab=board&sprint="+encodeURIComponent(sprint.id)}
              key={sprint.id} className="prototype-mentor-sprint-bar"
              aria-label={"Sprint "+sprint.sequence+": "+(value.recorded?
                completed+" of "+planned+" points done":"historical points not recorded")}>
              <span className="prototype-mentor-bar-columns">
                <span style={{height:(planned?Math.max(5,Math.round(100*planned/maxPts)):0)+"%"}} className="prototype-mentor-bar-planned" />
                <span style={{height:Math.max(0,Math.round(100*completed/maxPts))+"%"}} className="prototype-mentor-bar-done" />
              </span>
              <small>{sprint.sequence}</small>
            </Link>;
          })}
        </div>:<p className="prototype-mentor-summary-empty">No sprints have been planned yet.</p>}
      <div className="prototype-mentor-chart-legend"><span>■ Points at sign-off (completed)</span>
        <span>■ Done</span></div>
      <p>Completed sprint points are frozen at sign-off; earlier completed sprints
        without a recorded snapshot are shown as unavailable, not zero.</p>
    </section>
    <section className="prototype-mentor-chart-card" aria-label="Release progress">
      <div className="prototype-mentor-card-title"><h2>Release plan</h2>
        <Link href={base+"?tab=board&scope=all"}>Open full task history →</Link></div>
      {workspace.releases.length?workspace.releases.map(release=>{
        const group=sprints.filter(sprint=>sprint.releaseId===release.id);
        const complete=group.filter(sprint=>sprint.status==="COMPLETED").length;
        return <div key={release.id} className="prototype-mentor-release-row">
          <div><strong>{release.title}</strong><small>{complete} of {group.length} sprints signed off</small></div>
          <span className={"prototype-mentor-release-status "+statusTone(release.status)}>{release.status.replaceAll("_"," ")}</span>
          {!readOnly&&workspace.project.status==="ACTIVE"?(
            <div className="prototype-mentor-release-actions">
              <ReleaseLifecycleActions projectId={workspace.project.id}
                releaseId={release.id} status={release.status}
                expectedUpdatedAt={release.updatedAt.toISOString()} />
            </div>
          ):null}
          <div className="prototype-mentor-release-sprints">
            {group.map(sprint=><Link key={sprint.id} href={base+"?tab=board&sprint="+encodeURIComponent(sprint.id)}
              title={"Sprint "+sprint.sequence+": "+sprint.status}
              className={"prototype-mentor-release-dot "+statusTone(sprint.status)}>
              {sprint.sequence}
            </Link>)}
          </div>
          {!readOnly&&workspace.project.status==="ACTIVE"?(
            <div className="prototype-mentor-sprint-action-list">
              {group.map(sprint=><div key={sprint.id}>
                <span>Sprint {sprint.sequence} · {sprint.title}</span>
                {sprint.status==="ACTIVE"?
                  <MentorSprintSignOff projectId={workspace.project.id}
                    sprintId={sprint.id} title={"Sprint "+sprint.sequence+" · "+sprint.title}
                    unfinished={liveTasks.filter(task=>task.sprintId===sprint.id&&task.status!=="DONE")
                      .map(task=>({id:task.id,title:task.title,status:task.status,
                        updatedAt:task.updatedAt.toISOString()}))}
                    nextSprint={sprints.find(next=>next.sequence>sprint.sequence&&next.status==="PLANNED")??null}
                  />:
                  <SprintLifecycleActions projectId={workspace.project.id}
                    sprintId={sprint.id} status={sprint.status}
                    releaseStatus={release.status}/>}

              </div>)}
            </div>
          ):null}
        </div>;
      }):<p className="prototype-mentor-summary-empty">No releases have been recorded.</p>}
    </section>
    <section className="prototype-mentor-backlog-card">
      <div className="prototype-mentor-card-title"><h2>Backlog · {backlog.length} tasks · {points(backlog)} pts</h2>
        <Link href={base+"?tab=board&scope=all&lane=BACKLOG"}>Open on the board →</Link></div>
      <p>These tasks are not assigned to a sprint. Plan them using the release and sprint controls below.</p>
    </section>
  </div>;
}

export function MentorPrototypeTeamOverview({workspace}:{workspace:Workspace}){
  const students=workspace.members.filter(member=>member.role==="LEARNER");
  const mentors=workspace.members.filter(member=>member.role==="MENTOR");
  const active=workspace.sprints.find(sprint=>sprint.status==="ACTIVE");
  const recentIds=new Set(recentMentorWorkedSprintIds(workspace.sprints));
  const completedRecent=workspace.sprints.filter(sprint=>
    sprint.status==="COMPLETED"&&recentIds.has(sprint.id));
  const recentSnapshots=workspace.mentorSprintSnapshots.filter(snapshot=>
    completedRecent.some(sprint=>sprint.id===snapshot.sprintId));
  const missingHistory=completedRecent.length>recentSnapshots.length;
  const base="/mentor/projects/"+encodeURIComponent(workspace.project.id);
  const lastTaskChange=(tasks:typeof workspace.tasks)=>{
    const latest=tasks.reduce<Date|null>((most,task)=>{
      const when=task.updatedAt;
      return !most||when>most?when:most;
    },null);
    return latest?new Intl.DateTimeFormat("en-IN",{
      day:"numeric",month:"short",timeZone:"Asia/Kolkata",
    }).format(latest):"No task changes";
  };
  return <section className="prototype-mentor-team-overview" aria-label="Current project team">
    <div className="prototype-mentor-card-title">
      <h2>The team · {students.length} students · {mentors.length} mentors</h2>
      <Link href={base+"?tab=team#project-meetings"}>Meetings and requests →</Link>
    </div>
    <div className="prototype-mentor-roster-head prototype-mentor-roster-period-head" aria-hidden="true">
      <span>Person and role</span><span>{active?"Sprint "+active.sequence:"Current sprint"}</span>
      <span>Last 4 sprints</span><span>Last task change</span>
    </div>
    {workspace.members.map(member=>{
      const assigned=workspace.tasks.filter(task=>!task.deletedAt&&
        task.assigneeMembershipId===member.membershipId);
      const sprintTasks=active?assigned.filter(task=>task.sprintId===active.id):[];
      const sprintDone=sprintTasks.filter(task=>task.status==="DONE");
      const historyMembers=recentSnapshots.map(snapshot=>
        snapshot.memberRows.find(row=>row.membershipId===member.membershipId));
      const historyPoints=historyMembers.reduce((sum,row)=>sum+(row?.donePoints??0),0);
      const historyDone=historyMembers.reduce((sum,row)=>sum+(row?.doneCount??0),0);
      const historyCarried=historyMembers.reduce((sum,row)=>sum+(row?.carriedCount??0),0);
      const activeInRecent=Boolean(active&&recentIds.has(active.id));
      const activePoints=activeInRecent?points(sprintDone):0;
      const activeDone=activeInRecent?sprintDone.length:0;
      const activeCarried=activeInRecent?sprintTasks.filter(task=>
        Boolean(task.carriedFromSprintId)).length:0;
      const initials=(member.displayName??"Team member").trim()
        .split(/\s+/).slice(0,2).map(part=>part[0]??"").join("").toUpperCase();
      return <div key={member.membershipId}
        className="prototype-mentor-roster-row prototype-mentor-roster-period-row">
        <div className="prototype-mentor-roster-person">
          <span aria-hidden="true">{initials||"42"}</span>
          <div><strong>{member.displayName||"Team member"}</strong>
            <small>{member.isPrimary?"Primary mentor · ":""}{member.roleLabel||member.role.replaceAll("_"," ")}</small>
          </div>
        </div>
        <span>{sprintDone.length} done · {countTasks(sprintTasks,"IN_REVIEW")} waiting
          {countTasks(sprintTasks,"BLOCKED")>0?" · "+countTasks(sprintTasks,"BLOCKED")+" blocked":""}
        </span>
        <span>{historyPoints+activePoints} pts · {historyDone+activeDone} done
          {historyCarried+activeCarried>0?
            " · "+(historyCarried+activeCarried)+" carried":""}
        </span>
        <span>{lastTaskChange(assigned)}</span>
      </div>;
    })}
    {!workspace.members.length?<p className="prototype-mentor-summary-empty">No active team members.</p>:null}
    <p className="prototype-mentor-roster-foot">
      Last task change is based on recorded task timestamps, not a user's sign-in or online status.
      Membership changes use the authorized team editor below.
      {missingHistory?" Earlier sign-offs lack a historical workload snapshot;
        their contribution to the last-four total is unavailable.":""}
    </p>
  </section>;
}

export function MentorPrototypePerformance({workspace}:{workspace:Workspace}){
  return <MentorPrototypePerformanceTable
    students={workspace.members.filter(member=>member.role==="LEARNER").map(member=>({
      id:member.membershipId,
      name:member.displayName||"Student",
      label:member.roleLabel||"Student",
    }))}
    tasks={workspace.tasks.filter(task=>!task.deletedAt).map(task=>({
      id:task.id,
      assigneeMembershipId:task.assigneeMembershipId,
      sprintId:task.sprintId,status:task.status,
      estimatePoints:task.estimatePoints,
      carriedFromSprintId:task.carriedFromSprintId??null,
    }))}
    sprints={workspace.sprints.map(sprint=>({
      id:sprint.id,sequence:sprint.sequence,title:sprint.title,status:sprint.status,
      releaseId:sprint.releaseId,
    }))}
    releases={workspace.releases.map(release=>({id:release.id,title:release.title}))}
    snapshots={workspace.mentorSprintSnapshots} />;
}


export function MentorPrototypeActivitySummary({workspace}:{workspace:Workspace}){
  const now=new Date();
  const weekStart=now.getTime()-7*86400000;
  const recent=workspace.activity.filter(event=>event.occurredAt.getTime()>=weekStart);
  const classify=(type:string):"task"|"resource"|"meeting"|"other"=>
    /TASK/i.test(type)?"task":/RESOURCE|FILE|LINK/i.test(type)?"resource":
      /MEETING/i.test(type)?"meeting":"other";
  const taskEvents=recent.filter(event=>classify(event.eventType)==="task").length;
  const resourceEvents=recent.filter(event=>classify(event.eventType)==="resource").length;
  const meetingEvents=recent.filter(event=>classify(event.eventType)==="meeting").length;
  const otherEvents=recent.filter(event=>classify(event.eventType)==="other").length;
  return <section className="prototype-mentor-activity-summary" aria-label="Recorded activity this week">
    <div className="prototype-mentor-card-title">
      <h2>Project activity · last seven days</h2>
      <span>{recent.length} recorded {recent.length===1?"event":"events"}</span>
    </div>
    <div className="prototype-mentor-activity-stat-row">
      <div><strong>{taskEvents}</strong><span>Task events</span></div>
      <div><strong>{meetingEvents}</strong><span>Meeting events</span></div>
      <div><strong>{resourceEvents}</strong><span>Resource events</span></div>
      <div><strong>{otherEvents}</strong><span>Other events</span></div>
    </div>
    <p>Use the activity filters below to browse the complete recorded history. Event counts are based on stored project activity types, not inferred actions.</p>
  </section>;
}

export function MentorPrototypeDeliveryEvidence({workspace}:{workspace:Workspace}){
  const latest=workspace.finalDelivery.submissions.at(-1);
  const previous=workspace.finalDelivery.submissions.length>1?
    workspace.finalDelivery.submissions.at(-2):null;
  const review=workspace.finalDelivery.reviews.at(-1);
  const previousFeedback=previous?workspace.finalDelivery.reviews
    .filter(item=>item.submissionId===previous.id).at(-1):null;
  const source=latest?.sourceUrl?safeProjectExternalHref(latest.sourceUrl):null;
  const demo=latest?.demoUrl?safeProjectExternalHref(latest.demoUrl):null;
  const base="/mentor/projects/"+encodeURIComponent(workspace.project.id);
  const normalizeArtifacts=(entries:readonly unknown[])=>
    entries.flatMap((entry,index)=>{
    if(!entry||typeof entry!=="object"||Array.isArray(entry))return [];
    const item=entry as Record<string,unknown>;
    const name=safeBriefString(item["name"])||safeBriefString(item["fileName"])||
      safeBriefString(item["title"])||"Evidence "+(index+1);
    const url=safeBriefString(item["url"])||safeBriefString(item["href"])||
      safeBriefString(item["downloadUrl"]);
    const href=url?safeProjectExternalHref(url):null;
    const type=safeBriefString(item["type"])||safeBriefString(item["mimeType"])||"Attachment";
    return [{name,href,type,index}];
  }).slice(0,30);
  const artifacts=compareMentorEvidenceReferences(
    normalizeArtifacts(latest?.attachments??[]),
    previous?normalizeArtifacts(previous.attachments??[]):null,
  );
  const events=[...workspace.finalDelivery.history]
    .sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt)).slice(0,15);
  return <section className="prototype-mentor-delivery-evidence" aria-label="Final submission evidence">
    <div className="prototype-mentor-card-title">
      <h2>Final submission · evidence</h2>
      <span>{latest?"Version "+latest.version:"Not submitted"}</span>
    </div>
    {latest?<div className="prototype-mentor-delivery-main">
      <div className="prototype-mentor-delivery-details">
        <strong>{latest.summary||"Final project submission"}</strong>
        <p>Status: {latest.status.replaceAll("_"," ")}{review?" · Latest review: "+review.decision.replaceAll("_"," "):""}</p>
        {latest.notes?<p className="prototype-mentor-delivery-notes">{latest.notes}</p>:null}
      </div>
      <div className="prototype-mentor-delivery-links">
        {source?<a href={source} rel="noopener noreferrer" target="_blank">Source repository ↗</a>:null}
        {demo?<a href={demo} rel="noopener noreferrer" target="_blank">Demo ↗</a>:null}
        <Link href={base+"?tab=delivery"}>Review on this page ↓</Link>
      </div>
    </div>:<p className="prototype-mentor-summary-empty">No final submission has been recorded for this project yet.</p>}
    <section className="prototype-mentor-chart-card" aria-label="Final submission readiness">
      <h3>Ready for review · recorded prerequisites</h3>
      <ul className="prototype-mentor-overview-actions">
        <li>{workspace.readiness.execution.sprints.completed} of
          {" "}{workspace.readiness.execution.sprints.total} sprints signed off</li>
        <li>{workspace.readiness.execution.tasks.done} of
          {" "}{workspace.readiness.execution.tasks.total} current tasks completed</li>
        <li>{workspace.readiness.execution.releases.shipped} of
          {" "}{workspace.readiness.execution.releases.total} releases shipped
          {" "}(advisory; the current submission policy does not require shipment)</li>
        <li>{workspace.readiness.execution.tasks.proofCovered} completed tasks
          with recorded submission evidence links</li>
        <li>Submission gate: {workspace.readiness.legacyReadiness.readyForSubmission?
          "Ready":"Not ready"}
          {workspace.readiness.legacyReadiness.reason?
            " · "+workspace.readiness.legacyReadiness.reason:""}</li>
      </ul>
      {workspace.readiness.legacyReadiness.overrideActive?
        <p>Recorded administrator readiness override:
          {" "}{workspace.readiness.legacyReadiness.overrideValue?
            "Unlocked":"Blocked"}.
          {" "}This is a recorded permission decision, not a prototype fixture.</p>:null}
      <p>Due-date and release-shipment facts are displayed for review; the
        authoritative submit and accept permissions are enforced by the server.</p>
    </section>
    {previous?<section className="prototype-mentor-delivery-history">
      <h3>Previous attempt · version {previous.version}</h3>
      <p>{previous.status.replaceAll("_"," ")}</p>
      {previousFeedback?.feedback?<p>Previous reviewer feedback: {previousFeedback.feedback}</p>:
        <p>No reviewer feedback recorded for the previous attempt.</p>}
      <p>Evidence badges compare saved names and links, not the contents of external files.</p>
    </section>:null}
    {artifacts.length>0?<MentorEvidenceGallery items={artifacts}/>:null}
    <div className="prototype-mentor-delivery-history">
      <h3>History · {workspace.finalDelivery.history.length} events</h3>
      {events.length?<ol>{events.map(event=><li key={event.id}>
        <strong>{event.kind.replaceAll("_"," ")}</strong>
        <span>{event.actorName||"Project team"} · {new Intl.DateTimeFormat("en-IN",{
          day:"numeric",month:"short",year:"numeric",timeZone:"Asia/Kolkata",
        }).format(new Date(event.occurredAt))}</span>
        {event.feedback?<p>{event.feedback}</p>:null}
      </li>)}</ol>:<p className="prototype-mentor-summary-empty">
        No submission history recorded.</p>}
    </div>
  </section>;
}


export function MentorPrototypeProjectOverview({workspace}:{workspace:Workspace}){
  const projectId=encodeURIComponent(workspace.project.id);
  const base="/mentor/projects/"+projectId;
  const live=workspace.tasks.filter(task=>!task.deletedAt);
  const completed=live.filter(task=>task.status==="DONE");
  const active=workspace.sprints.find(sprint=>sprint.status==="ACTIVE");
  const inSprint=active?live.filter(task=>task.sprintId===active.id):[];
  const awaiting=inSprint.filter(task=>task.status==="IN_REVIEW");
  const blocked=inSprint.filter(task=>task.status==="BLOCKED");
  const students=workspace.members.filter(member=>member.role==="LEARNER");
  const nextPlanned=[...workspace.sprints].filter(sprint=>sprint.status==="PLANNED"&&
    (!active||sprint.sequence>active.sequence)).sort((a,b)=>a.sequence-b.sequence)[0];
  const unassignedNext=nextPlanned?live.filter(task=>
    task.sprintId===nextPlanned.id&&task.assigneeMembershipId===null):[];
  const requestedMeetings=workspace.meetings.filter(meeting=>meeting.status==="REQUESTED");
  const backlog=live.filter(task=>task.sprintId===null);
  const now=Date.now();
  const nextMeeting=workspace.meetings
    .filter(meeting=>["SCHEDULED","RESCHEDULED"].includes(meeting.status)&&meeting.startsAt.getTime()>now)
    .sort((a,b)=>a.startsAt.getTime()-b.startsAt.getTime())[0];
  const submitted=workspace.finalDelivery.submissions.at(-1);
  const recentActivity=[...workspace.activity]
    .sort((a,b)=>b.occurredAt.getTime()-a.occurredAt.getTime())
    .slice(0,5);
  const signedOff=workspace.sprints.filter(row=>row.status==="COMPLETED").length;
  const shipped=workspace.releases.filter(row=>row.status==="SHIPPED").length;
  const progress=live.length?Math.round(100*completed.length/live.length):0;
  const velocity=projectMentorVelocity(workspace.sprints,workspace.mentorSprintSnapshots,
    points(live.filter(task=>task.status!=="DONE")));
  const summary=[
    ["To do",countTasks(inSprint,"TODO")],
    ["In progress",countTasks(inSprint,"IN_PROGRESS")],
    ["Waiting for you",awaiting.length],
    ["Blocked",blocked.length],
    ["Done",countTasks(inSprint,"DONE")],
    ["Backlog",backlog.length],
  ] as const;
  return <div className="prototype-mentor-overview">
    <section className="prototype-mentor-chart-card">
      <div className="prototype-mentor-card-title"><h2>Where they are</h2>
        <span>{completed.length} of {live.length} recorded tasks done</span></div>
      <div className="prototype-mentor-health-summary">
        <strong>{progress}% of recorded tasks complete</strong>
        <span className="prototype-mentor-health-progress" role="progressbar"
          aria-label="Project tasks completed" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <span style={{width:progress+"%"}}/>
        </span>
        <p>{workspace.project.summary||"This project has not yet published a summary."}</p>
      </div>
    </section>
    <section className="prototype-mentor-chart-card" aria-label="Signed-off sprint velocity">
      <div className="prototype-mentor-card-title">
        <h2>Momentum · signed-off sprint results</h2>
        <Link href={base+"?tab=sprints"}>Sprint history →</Link>
      </div>
      {velocity.kind==="ESTIMATE"?<div className="prototype-mentor-health-summary">
        <strong>{velocity.averageDonePoints} points per completed sprint</strong>
        <p>Based on {velocity.sampleCount} saved sign-offs.
          {" "}{velocity.trend==="UNKNOWN"?"Trend unknown":
            velocity.trend==="STEADY"?"Recent points broadly steady":
            velocity.trend==="RISING"?"Recent points increasing":"Recent points decreasing"}.</p>
        <p>{velocity.remainingPoints} open estimated points.
          Roughly {velocity.approximateSprints} further
          {" "}{velocity.approximateSprints===1?"sprint":"sprints"} at the recorded average.
          Not a confirmed finish date.</p>
      </div>:<p className="prototype-mentor-summary-empty">
        Forecast unavailable: {velocity.reason}
      </p>}
    </section>
    <section className="prototype-mentor-chart-card">
      <div className="prototype-mentor-card-title">
        <h2>{active?"Sprint "+active.sequence+" · "+active.title:"Current sprint"}</h2>
        <Link href={base+"?tab=board"}>Board →</Link>
      </div>
      <div className="prototype-mentor-status-grid">
        {summary.map(([label,value])=><Link key={label} href={base+"?tab=board&lane="+(
          label==="To do"?"TODO":label==="In progress"?"IN_PROGRESS":
          label==="Waiting for you"?"IN_REVIEW":label==="Blocked"?"BLOCKED":
          label==="Done"?"DONE":"BACKLOG"
        )}><strong>{value}</strong><span>{label}</span></Link>)}
      </div>
    </section>
    <section className="prototype-mentor-chart-card">
      <div className="prototype-mentor-card-title">
        <h2>Team · {active?"Sprint "+active.sequence:"No active sprint"}</h2>
        <Link href={base+"?tab=performance"}>All student performance →</Link>
      </div>
      {students.length?<ul className="prototype-mentor-overview-actions">
        {students.slice(0,5).map(member=>{
          const assigned=inSprint.filter(task=>task.assigneeMembershipId===member.membershipId);
          const done=assigned.filter(task=>task.status==="DONE");
          const waiting=assigned.filter(task=>task.status==="IN_REVIEW");
          return <li key={member.membershipId}>
            <strong>{member.displayName||"Student"}</strong>
            <span> · {done.length} done · {waiting.length} awaiting review
              · {assigned.length-done.length-waiting.length} open
              · {points(done)} done points</span>
          </li>;
        })}
        {students.length>5?<li><Link href={base+"?tab=performance"}>
          View all {students.length} students →</Link></li>:null}
      </ul>:<p className="prototype-mentor-summary-empty">No learners assigned yet.</p>}
    </section>
    <section className="prototype-mentor-chart-card">
      <div className="prototype-mentor-card-title"><h2>Needs you on this project</h2></div>
      <div className="prototype-mentor-overview-actions">
        {awaiting.length?<Link href={base+"?tab=board&lane=IN_REVIEW"}>
          Review {awaiting.length} {awaiting.length===1?"task":"tasks"} waiting for a decision →
        </Link>:null}
        {blocked.length?<Link href={base+"?tab=board&lane=BLOCKED"}>
          Help unblock {blocked.length} {blocked.length===1?"task":"tasks"} →
        </Link>:null}
        {active&&awaiting.length===0?<Link href={base+"?tab=sprints"}>
          Review sprint {active.sequence} for sign-off →
        </Link>:null}
        {unassignedNext.length?<Link href={base+"?tab=performance"}>
          Assign {unassignedNext.length} next-sprint {unassignedNext.length===1?"task":"tasks"} →
        </Link>:null}
        {requestedMeetings.length?<Link href={base+"?tab=team#project-meetings"}>
          Answer {requestedMeetings.length} meeting {requestedMeetings.length===1?"request":"requests"} →
        </Link>:null}
        {workspace.project.nextAction?<p>{workspace.project.nextAction}</p>:null}
        {!awaiting.length&&!blocked.length&&!active&&!unassignedNext.length&&
         !requestedMeetings.length&&!workspace.project.nextAction?
          <p>No pending project action recorded.</p>:null}
      </div>
    </section>
    <section className="prototype-mentor-chart-card">
      <div className="prototype-mentor-card-title"><h2>Next meeting</h2>
        <Link href={base+"?tab=team"}>All meetings →</Link></div>
      {nextMeeting?<div className="prototype-mentor-overview-actions">
        <strong>{nextMeeting.title}</strong>
        <p>{new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"short",weekday:"short",
          hour:"numeric",minute:"2-digit",timeZone:"Asia/Kolkata"}).format(nextMeeting.startsAt)} IST
          {" · "+Math.max(0,Math.round((nextMeeting.endsAt.getTime()-
            nextMeeting.startsAt.getTime())/60000))+" minutes"}</p>
        {nextMeeting.agenda?<p>Agenda: {nextMeeting.agenda}</p>:null}
        {safeProjectExternalHref(nextMeeting.meetingUrl)?<a
          href={safeProjectExternalHref(nextMeeting.meetingUrl)!}
          target="_blank" rel="noopener noreferrer">Join meeting ↗</a>:null}
        <Link href={base+"?tab=team#project-meetings"}>Open meeting →</Link>
      </div>:<p className="prototype-mentor-summary-empty">No upcoming meeting recorded.</p>}
    </section>
    <section className="prototype-mentor-chart-card">
      <div className="prototype-mentor-card-title"><h2>Latest project activity</h2>
        <Link href={base+"?tab=activity"}>All activity →</Link></div>
      {recentActivity.length?recentActivity.map(update=>(
        <div key={update.id} className="prototype-mentor-overview-actions">
          <p>{update.summary}</p>
          <span>{update.actorDisplayName||"Recorded project event"} · {new Intl.DateTimeFormat("en-IN",{
            day:"numeric",month:"short",timeZone:"Asia/Kolkata",
          }).format(update.occurredAt)}</span>
          <Link href={base+"?tab="+(
            update.subjectType==="project_task"?"board":
            update.subjectType==="project_sprint"?"sprints":
            update.subjectType==="project_meeting"?"team":"activity"
          )}>View related section →</Link>
        </div>
      )):<p className="prototype-mentor-summary-empty">No project activity recorded yet.</p>
    </section>
    <section className="prototype-mentor-chart-card">
      <div className="prototype-mentor-card-title"><h2>Final submission</h2>
        <Link href={base+"?tab=delivery"}>Open review →</Link></div>
      <div className="prototype-mentor-overview-actions">
        <p>{signedOff} of {workspace.sprints.length} recorded sprints signed off
          · {shipped} of {workspace.releases.length} releases shipped</p>
        <p>{completed.length} of {live.length} current tasks marked done</p>
        <p>{submitted?"Version "+submitted.version+" · "+submitted.status.replaceAll("_"," "):
          "No final submission has been recorded yet."}</p>
        {workspace.project.endDate?<p>Project target: {workspace.project.endDate}</p>:null}
        <p>These are recorded readiness facts, not permission to submit or an automatic acceptance decision.</p>
      </div>
    </section>
  </div>;
}


function safeBriefString(value:unknown):string|null{
  return typeof value==="string"&&value.trim()?value.trim():null;
}
function safeBriefList(value:unknown):string[]{
  return Array.isArray(value)?value.filter((item):item is string=>
    typeof item==="string"&&Boolean(item.trim())).map(item=>item.trim()).slice(0,30):[];
}

/** #46 "About this project" reads the student's persisted authored brief;
 * never substitutes canned example deliverables/acceptance conditions. */
export function MentorPrototypeProjectBrief({workspace}:{workspace:Workspace}){
  const brief=workspace.project.authoredBrief;
  const record=typeof brief==="object"&&brief!==null&&!Array.isArray(brief)
    ? brief as Record<string,unknown> : {};
  const goal=safeBriefString(record["goal"]);
  const description=safeBriefString(record["description"]);
  const deliverables=safeBriefList(record["deliverables"]);
  const done=safeBriefList(record["completionConditions"]);
  const personas=safeBriefList(record["personas"]);
  const dates=[workspace.project.startDate,workspace.project.endDate].filter(Boolean);
  return <section className="prototype-mentor-project-brief" aria-label="About this project">
    <div className="prototype-mentor-card-title">
      <h2>About this project · what students see on their Overview</h2>
    </div>
    <div className="prototype-mentor-brief-body">
      <div><h3>Goal</h3><p>{goal||description||"No project goal has been recorded."}</p></div>
      {description&&description!==goal?<div><h3>Description</h3><p>{description}</p></div>:null}
      <div><h3>Deliverables</h3>
        {deliverables.length?<ol>{deliverables.map((item,index)=><li key={index}>{item}</li>)}</ol>
          :<p>No deliverables recorded.</p>}
      </div>
      <div><h3>Done looks like</h3>
        {done.length?<ul>{done.map((item,index)=><li key={index}>{item}</li>)}</ul>
          :<p>No completion conditions recorded.</p>}
      </div>
      {personas.length?<div><h3>Who it’s for</h3>
        <ul>{personas.map((item,index)=><li key={index}>{item}</li>)}</ul>
      </div>:null}
      <dl>
        <div><dt>Dates</dt><dd>{dates.length?dates.join(" – "):"Not scheduled"}</dd></div>
        <div><dt>Sprints</dt><dd>{workspace.sprints.length} recorded</dd></div>
        <div><dt>Estimates</dt><dd>{workspace.project.estimationUnit||"Not specified"}</dd></div>
        <div><dt>Next step</dt><dd>{workspace.project.nextAction||"Not set"}</dd></div>
      </dl>
    </div>
  </section>;
}
