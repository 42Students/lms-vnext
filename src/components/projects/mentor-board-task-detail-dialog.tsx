"use client";
import { Dialog } from "@/components/ui/dialog";
import Link from "next/link";
import {ProjectTaskComments} from "./project-task-comments";
import {projectTaskDueState} from "@/modules/projects/project-task-visible-facts-model";
import {safeProjectExternalHref} from "@/modules/projects/mentor-workspace-evidence-model";
type Task={
 id:string;title:string;status:string;description:string|null;approach:string|null;acceptanceCriteria:string|null;
 priority:string;createdAt?:Date;updatedAt:Date;assigneeMembershipId:string|null;blockerReason:string|null;
 sprintId:string|null;dueDate:string|null;estimatePoints:number|null;taskType:string|null;
};
type Submission={id:string;taskId:string;status:string;submissionUrl:string;version:number;createdAt:Date;submittedByMembershipId?:string|null};
type Event={id:string;subjectId:string;summary:string;occurredAt:Date;actorDisplayName:string|null;eventType?:string};
type Member={membershipId:string;displayName:string|null;role:string};
export function MentorBoardTaskDetailDialog({projectId,task,sprintTitle,members,submissions,activity,onClose,readOnly}:{
 projectId:string;task:Task;sprintTitle:string|null;members:Member[];
 submissions:Submission[];activity:Event[];onClose:()=>void;readOnly:boolean;
}){

 const author=members.find(m=>m.membershipId===task.assigneeMembershipId)?.displayName??"Unassigned";
 const recent=activity.filter(event=>event.subjectId===task.id);
 const creator=recent.find(event=>event.eventType==="projects.task.created")?.actorDisplayName;
 const editor=recent.filter(event=>event.eventType==="projects.task.details_updated")
   .sort((a,b)=>new Date(b.occurredAt).getTime()-new Date(a.occurredAt).getTime())[0]?.actorDisplayName;
 const attempts=submissions.filter(row=>row.taskId===task.id);
 return <Dialog open={true} onOpenChange={next=>{if(!next)onClose();}} title={task.title} description="Mentor · Task details" className="max-w-[42rem]">
  <p className="mt-3 text-xs text-muted-foreground">Scroll for more task details and activity.</p>
   <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
   {([{label:"Status",value:task.status},{label:"Priority",value:task.priority},
      {label:"Assignee",value:author},{label:"Sprint",value:sprintTitle??"Product backlog"},
      {label:"Due date",value:(task.dueDate??"No due date")+
        (projectTaskDueState(task.dueDate,task.status,new Date())?" · "+projectTaskDueState(task.dueDate,task.status,new Date()):"")},
      {label:"Estimate",value:task.estimatePoints===null?"Unsized":task.estimatePoints+" points"},
      {label:"Task type",value:task.taskType??"Not set"}]).map(f=>
      <div key={f.label}><dt className="font-semibold text-body">{f.label}</dt><dd className="mt-1">{f.value}</dd></div>)}
  </dl>
  <dl className="mt-4 grid gap-3 text-xs text-body sm:grid-cols-2">
    {task.createdAt ? <div><dt className="font-semibold">Created</dt>
      <dd>{creator ? "Created by "+creator+" · " : ""}{new Date(task.createdAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})}</dd></div> : null}
    <div><dt className="font-semibold">Last edited</dt>
      <dd>{editor ? "Last edited by "+editor+" · " : ""}{new Date(task.updatedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})}</dd></div>
  </dl>
  <section className="mt-4"><h3 className="font-semibold">Description / Approach</h3>
    <p className="mt-1 whitespace-pre-wrap text-sm">{task.description||"No description recorded"}</p></section>
  <section className="mt-4"><h3 className="font-semibold">Approach</h3>
    <p className="mt-1 whitespace-pre-wrap text-sm">{task.approach||"No approach recorded"}</p></section>
  <section className="mt-4"><h3 className="font-semibold">Done when</h3>
    <p className="mt-1 whitespace-pre-wrap text-sm">{task.acceptanceCriteria||"No criteria recorded"}</p></section>
  {task.blockerReason||task.status==="BLOCKED"?
   <section role="alert" className="mt-4 rounded border border-warning-border bg-warning-subtle p-3 text-sm">
    <h3 className="font-semibold">Blocked</h3>
    <p className="mt-1 whitespace-pre-wrap">{task.blockerReason||"No blocker reason recorded."}</p>
   </section>:null}
  <section className="mt-4">
   <h3 className="font-semibold">Submissions · {attempts.length}</h3>
   {attempts.length?<ul className="mt-2 space-y-2">{attempts.map(row=>
    <li key={row.id} className="border-b border-border py-2 text-xs">
     Version {row.version} · {row.status} · {new Date(row.createdAt).toLocaleDateString("en-IN",{timeZone:"Asia/Kolkata"})}
     {row.submittedByMembershipId ? " · Submitted by "+(members.find(member=>member.membershipId===row.submittedByMembershipId)?.displayName??"Project member") : ""}
     {safeProjectExternalHref(row.submissionUrl)?
      <a href={safeProjectExternalHref(row.submissionUrl)!} target="_blank" rel="noopener noreferrer"
       className="ml-2 inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Open submitted evidence</a>:null}
    </li>)}</ul>:<p className="text-xs text-muted-foreground">No submissions yet</p>}
   <Link href={"/mentor/projects/"+projectId+"?tab=delivery"}
    className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Open delivery review</Link>
  </section>
  <section className="mt-4"><h3 className="font-semibold">Activity</h3>
   {recent.length?<ol className="mt-2 space-y-2">{recent.slice(0,20).map(item=>
    <li key={item.id} className="border-l-2 border-border pl-2 text-xs">{item.summary} ·
      {" "+(item.actorDisplayName??"System")} ·
      {" "+new Date(item.occurredAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})}</li>)}</ol>:
    <p className="text-xs text-muted-foreground">No activity for this task.</p>}
  </section>
  <section className="mt-4"><h3 className="font-semibold">Comments</h3>
   <ProjectTaskComments projectId={projectId} taskId={task.id}
    updatedAt={new Date(task.updatedAt).toISOString()} canPost={!readOnly}/>
  </section>
 </Dialog>;
}
