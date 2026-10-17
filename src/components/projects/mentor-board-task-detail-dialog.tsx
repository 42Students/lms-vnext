"use client";
import {useEffect,useRef} from "react";
import Link from "next/link";
import {ProjectTaskComments} from "./project-task-comments";
import {projectTaskDueState} from "@/modules/projects/project-task-visible-facts-model";
type Task={
 id:string;title:string;status:string;description:string|null;acceptanceCriteria:string|null;
 priority:string;createdAt?:Date;updatedAt:Date;assigneeMembershipId:string|null;blockerReason:string|null;
 sprintId:string|null;dueDate:string|null;estimatePoints:number|null;taskType:string|null;
};
type Submission={id:string;taskId:string;status:string;submissionUrl:string;version:number;createdAt:Date;submittedByMembershipId?:string|null};
type Event={id:string;subjectId:string;summary:string;occurredAt:Date;actorDisplayName:string|null};
type Member={membershipId:string;displayName:string|null;role:string};
export function MentorBoardTaskDetailDialog({projectId,task,sprintTitle,members,submissions,activity,onClose,readOnly}:{
 projectId:string;task:Task;sprintTitle:string|null;members:Member[];
 submissions:Submission[];activity:Event[];onClose:()=>void;readOnly:boolean;
}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{
  const el=ref.current;if(!el)return;
  if(!el.open)el.showModal();
  return ()=>{if(el.open)el.close()};
 },[task.id]);
 const author=members.find(m=>m.membershipId===task.assigneeMembershipId)?.displayName??"Unassigned";
 const recent=activity.filter(event=>event.subjectId===task.id);
 const attempts=submissions.filter(row=>row.taskId===task.id);
 return <dialog ref={ref} aria-labelledby="mentor-board-task-title" onClose={onClose}
  className="fixed inset-0 m-auto max-h-[90dvh] w-[min(95vw,42rem)] overflow-y-auto rounded-xl border border-border bg-surface p-5 text-foreground shadow-xl backdrop:bg-black/50">
  <div className="flex items-start justify-between gap-3">
   <div><p className="text-xs font-semibold uppercase text-muted-foreground">Mentor · Task details</p>
    <h2 id="mentor-board-task-title" className="text-lg font-semibold">{task.title}</h2></div>
   <button type="button" onClick={()=>ref.current?.close()}
    className="min-h-10 rounded border border-border px-3 text-sm font-semibold">Close</button>
  </div>
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
    {task.createdAt ? <div><dt className="font-semibold">Created</dt><dd>{new Date(task.createdAt).toLocaleString("en-IN")}</dd></div> : null}
    <div><dt className="font-semibold">Last edited</dt><dd>{new Date(task.updatedAt).toLocaleString("en-IN")}</dd></div>
  </dl>
  <section className="mt-4"><h3 className="font-semibold">Description / Approach</h3>
    <p className="mt-1 whitespace-pre-wrap text-sm">{task.description||"No description recorded"}</p></section>
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
    <li key={row.id} className="rounded border border-border p-2 text-xs">
     Version {row.version} · {row.status} · {new Date(row.createdAt).toLocaleDateString("en-IN")}
     {row.submittedByMembershipId ? " · Submitted by "+(members.find(member=>member.membershipId===row.submittedByMembershipId)?.displayName??"Project member") : ""}
     {/^(https?:)\/\//i.test(row.submissionUrl)?
      <a href={row.submissionUrl} target="_blank" rel="noopener noreferrer"
       className="ml-2 text-primary-text underline">Open submitted evidence</a>:null}
    </li>)}</ul>:<p className="text-xs text-muted-foreground">No submissions yet</p>}
   <Link href={"/mentor/projects/"+projectId+"?tab=delivery"}
    className="mt-2 inline-block text-sm font-semibold text-primary-text underline">Open delivery review</Link>
  </section>
  <section className="mt-4"><h3 className="font-semibold">Activity</h3>
   {recent.length?<ol className="mt-2 space-y-2">{recent.slice(0,20).map(item=>
    <li key={item.id} className="border-l-2 border-border pl-2 text-xs">{item.summary} ·
      {" "+(item.actorDisplayName??"System")} ·
      {" "+new Date(item.occurredAt).toLocaleString("en-IN")}</li>)}</ol>:
    <p className="text-xs text-muted-foreground">No activity for this task.</p>}
  </section>
  <section className="mt-4"><h3 className="font-semibold">Comments</h3>
   <ProjectTaskComments projectId={projectId} taskId={task.id}
    updatedAt={new Date(task.updatedAt).toISOString()} canPost={!readOnly}/>
  </section>
 </dialog>;
}
