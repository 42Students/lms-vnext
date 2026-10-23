import Link from "next/link";
import type {getProjectWorkspaceView} from "@/modules/projects/workspace-view-service";
import {safeProjectExternalHref} from "@/modules/projects/mentor-workspace-evidence-model";
import {ReleaseLifecycleActions,SprintLifecycleActions} from "./project-lifecycle-actions";

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
  const maxPts=Math.max(1,...sprints.map(sprint=>points(liveTasks.filter(task=>task.sprintId===sprint.id))));
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
            const group=liveTasks.filter(task=>task.sprintId===sprint.id);
            const planned=points(group),completed=points(group.filter(task=>task.status==="DONE"));
            return <Link href={base+"?tab=board&sprint="+encodeURIComponent(sprint.id)}
              key={sprint.id} className="prototype-mentor-sprint-bar"
              aria-label={"Sprint "+sprint.sequence+": "+completed+" of "+planned+" points done"}>
              <span className="prototype-mentor-bar-columns">
                <span style={{height:(planned?Math.max(5,Math.round(100*planned/maxPts)):0)+"%"}} className="prototype-mentor-bar-planned" />
                <span style={{height:Math.max(0,Math.round(100*completed/maxPts))+"%"}} className="prototype-mentor-bar-done" />
              </span>
              <small>{sprint.sequence}</small>
            </Link>;
          })}
        </div>:<p className="prototype-mentor-summary-empty">No sprints have been planned yet.</p>}
      <div className="prototype-mentor-chart-legend"><span>■ Planned</span><span>■ Done</span></div>
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
                <SprintLifecycleActions projectId={workspace.project.id}
                  sprintId={sprint.id} status={sprint.status}
                  releaseStatus={release.status} />
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
  const base="/mentor/projects/"+encodeURIComponent(workspace.project.id);
  return <section className="prototype-mentor-team-overview" aria-label="Current project team">
    <div className="prototype-mentor-card-title">
      <h2>The team · {students.length} students · {mentors.length} mentors</h2>
      <Link href={base+"?tab=team#project-meetings"}>Meetings and requests →</Link>
    </div>
    <div className="prototype-mentor-roster-head" aria-hidden="true">
      <span>Person and role</span><span>Done</span><span>Waiting</span><span>Open</span><span>Points completed</span>
    </div>
    {workspace.members.map(member=>{
      const assigned=workspace.tasks.filter(task=>task.assigneeMembershipId===member.membershipId);
      const done=assigned.filter(task=>task.status==="DONE");
      const initials=(member.displayName??"Team member").trim().split(/\s+/).slice(0,2).map(part=>part[0]??"").join("").toUpperCase();
      return <div key={member.membershipId} className="prototype-mentor-roster-row">
        <div className="prototype-mentor-roster-person">
          <span aria-hidden="true">{initials||"42"}</span>
          <div><strong>{member.displayName||"Team member"}</strong>
            <small>{member.isPrimary?"Primary mentor · ":""}{member.roleLabel||member.role.replaceAll("_"," ")}</small>
          </div>
        </div>
        <span>{done.length}</span><span>{countTasks(assigned,"IN_REVIEW")}</span>
        <span>{assigned.filter(task=>!["DONE","IN_REVIEW"].includes(task.status)).length}</span>
        <span>{points(done)} pts</span>
      </div>;
    })}
    {!workspace.members.length?<p className="prototype-mentor-summary-empty">No active team members.</p>:null}
    <p className="prototype-mentor-roster-foot">Team membership changes are managed through the existing authorized roster controls below.</p>
  </section>;
}

export function MentorPrototypePerformance({workspace}:{workspace:Workspace}){
  const students=workspace.members.filter(member=>member.role==="LEARNER");
  const tasks=workspace.tasks.filter(task=>!task.deletedAt);
  const unassigned=tasks.filter(task=>task.assigneeMembershipId===null&&
    !["DONE","IN_REVIEW"].includes(task.status));
  return <div className="prototype-mentor-performance">
    <section className="prototype-mentor-chart-card">
      <div className="prototype-mentor-card-title"><h2>Who did what · all recorded sprints</h2>
        <span>Done, waiting, open and carried work from real tasks</span></div>
      <div className="prototype-mentor-performance-table">
        <div className="prototype-mentor-performance-head" aria-hidden="true">
          <span>Student</span><span>Done</span><span>Waiting</span><span>Open</span><span>Carried</span><span>Points done</span>
        </div>
        {students.map(member=>{
          const owned=tasks.filter(task=>task.assigneeMembershipId===member.membershipId);
          const done=owned.filter(task=>task.status==="DONE");
          return <div key={member.membershipId} className="prototype-mentor-performance-row">
            <strong>{member.displayName||"Student"}</strong>
            <span>{done.length}</span><span>{countTasks(owned,"IN_REVIEW")}</span>
            <span>{owned.filter(task=>!["DONE","IN_REVIEW"].includes(task.status)).length}</span>
            <span>{owned.filter(task=>Boolean(task.carriedFromSprintId)).length}</span>
            <span>{points(done)} pts</span>
          </div>;
        })}
        {!students.length?<p className="prototype-mentor-summary-empty">No assigned students.</p>:null}
      </div>
    </section>
    <section className="prototype-mentor-backlog-card">
      <div className="prototype-mentor-card-title"><h2>Unassigned work · {unassigned.length} tasks</h2>
        <span>{points(unassigned)} estimated points</span></div>
      <p>Review the assignment controls below to allocate these eligible tasks. Auto-assign still requires confirmation.</p>
    </section>
  </div>;
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
  const review=workspace.finalDelivery.reviews.at(-1);
  const source=latest?.sourceUrl?safeProjectExternalHref(latest.sourceUrl):null;
  const demo=latest?.demoUrl?safeProjectExternalHref(latest.demoUrl):null;
  const base="/mentor/projects/"+encodeURIComponent(workspace.project.id);
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
  const backlog=live.filter(task=>task.sprintId===null);
  const now=Date.now();
  const nextMeeting=workspace.meetings
    .filter(meeting=>["SCHEDULED","RESCHEDULED"].includes(meeting.status)&&meeting.startsAt.getTime()>now)
    .sort((a,b)=>a.startsAt.getTime()-b.startsAt.getTime())[0];
  const submitted=workspace.finalDelivery.submissions.at(-1);
  const mentorUpdates=workspace.activity.filter(event=>
    event.eventType==="projects.mentor_update.posted")
    .sort((a,b)=>b.occurredAt.getTime()-a.occurredAt.getTime()).slice(0,3);
  const progress=live.length?Math.round(100*completed.length/live.length):0;
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
      <div className="prototype-mentor-card-title"><h2>Needs you on this project</h2></div>
      <div className="prototype-mentor-overview-actions">
        {awaiting.length?<Link href={base+"?tab=board&lane=IN_REVIEW"}>
          Review {awaiting.length} {awaiting.length===1?"task":"tasks"} waiting for a decision →
        </Link>:null}
        {blocked.length?<Link href={base+"?tab=board&lane=BLOCKED"}>
          Help unblock {blocked.length} {blocked.length===1?"task":"tasks"} →
        </Link>:null}
        {workspace.project.nextAction?<p>{workspace.project.nextAction}</p>:null}
        {!awaiting.length&&!blocked.length&&!workspace.project.nextAction?
          <p>No pending review or blocked sprint tasks recorded.</p>:null}
      </div>
    </section>
    <section className="prototype-mentor-chart-card">
      <div className="prototype-mentor-card-title"><h2>Next meeting</h2>
        <Link href={base+"?tab=team"}>All meetings →</Link></div>
      {nextMeeting?<div className="prototype-mentor-overview-actions">
        <strong>{nextMeeting.title}</strong>
        <p>{new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"short",weekday:"short",
          hour:"numeric",minute:"2-digit",timeZone:"Asia/Kolkata"}).format(nextMeeting.startsAt)} IST</p>
        <Link href={base+"?tab=team"}>Open meeting →</Link>
      </div>:<p className="prototype-mentor-summary-empty">No upcoming meeting recorded.</p>}
    </section>
    <section className="prototype-mentor-chart-card">
      <div className="prototype-mentor-card-title"><h2>Latest team updates</h2>
        <Link href={base+"?tab=activity"}>All activity →</Link></div>
      {mentorUpdates.length?mentorUpdates.map(update=>(
        <div key={update.id} className="prototype-mentor-overview-actions">
          <p>{update.summary}</p>
          <span>{update.actorDisplayName||"Mentor"} · {new Intl.DateTimeFormat("en-IN",{
            day:"numeric",month:"short",timeZone:"Asia/Kolkata",
          }).format(update.occurredAt)}</span>
        </div>
      )):<p className="prototype-mentor-summary-empty">No team updates posted yet.</p>}
    </section>
    <section className="prototype-mentor-chart-card">
      <div className="prototype-mentor-card-title"><h2>Final submission</h2>
        <Link href={base+"?tab=delivery"}>Open review →</Link></div>
      <div className="prototype-mentor-overview-actions">
        <p>{submitted?"Version "+submitted.version+" · "+submitted.status.replaceAll("_"," "):
          "No final submission has been recorded yet."}</p>
        {workspace.project.endDate?<p>Project target: {workspace.project.endDate}</p>:null}
      </div>
    </section>
  </div>;
}
