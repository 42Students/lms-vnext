import Link from "next/link";
import type {getProjectWorkspaceView} from "@/modules/projects/workspace-view-service";

type Workspace=Awaited<ReturnType<typeof getProjectWorkspaceView>>;
type ProjectTask=Workspace["tasks"][number];
const countTasks=(tasks:readonly ProjectTask[],status:string)=>tasks.filter(task=>task.status===status).length;
const points=(tasks:readonly ProjectTask[])=>tasks.reduce((total,task)=>
  total+(typeof task.estimatePoints==="number"?task.estimatePoints:0),0);
const dateLabel=(value:Date|string|null|undefined)=>{
  if(!value)return "Date not set";
  const d=new Date(value);
  return Number.isFinite(d.getTime())?
    new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"short",timeZone:"Asia/Kolkata"}).format(d):
    "Date not set";
};
const statusTone=(status:string)=>status==="COMPLETED"||status==="SHIPPED"?"done":
  status==="ACTIVE"?"active":"planned";

export function MentorPrototypeSprintPlan({workspace}:{workspace:Workspace}){
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
                <span style={{height:Math.max(5,Math.round(100*planned/maxPts))+"%"}} className="prototype-mentor-bar-planned" />
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
          <div className="prototype-mentor-release-sprints">
            {group.map(sprint=><Link key={sprint.id} href={base+"?tab=board&sprint="+encodeURIComponent(sprint.id)}
              title={"Sprint "+sprint.sequence+": "+sprint.status}
              className={"prototype-mentor-release-dot "+statusTone(sprint.status)}>
              {sprint.sequence}
            </Link>)}
          </div>
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
