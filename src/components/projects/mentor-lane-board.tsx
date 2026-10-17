"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {useRouter,useSearchParams} from "next/navigation";
import {groupLearnerBoardLanes} from "@/modules/projects/learner-board-lanes-model";
import {projectMutation} from "./project-api";
import {ProjectTaskAssigneeControl} from "./project-task-assignee-control";
import {ProjectTaskComments} from "./project-task-comments";
import {MentorBoardTaskDetailDialog} from "./mentor-board-task-detail-dialog";
import {projectTaskDueState} from "@/modules/projects/project-task-visible-facts-model";
import {MentorTaskDeleteControl} from "./mentor-task-delete-control";
type Task={id:string;title:string;status:string;priority:string;sprintId:string|null;carriedFromSprintId?:string|null;updatedAt:Date;
 description:string|null;acceptanceCriteria:string|null;blockerReason:string|null;
 assigneeMembershipId:string|null;dueDate:string|null;estimatePoints:number|null;taskType:string|null};
type Sprint={id:string;title:string;status:string;releaseId:string};
type Release={id:string;title:string};
type Person={membershipId:string;displayName:string|null;role:string};
type TaskSubmission={id:string;taskId:string;status:string;submissionUrl:string;version:number;createdAt:Date;submittedByMembershipId?:string|null};
type TaskEvent={id:string;subjectId:string;summary:string;occurredAt:Date;actorDisplayName:string|null};
const editable=["TODO","IN_PROGRESS","BLOCKED"] as const;
export function MentorLaneBoard({projectId,initialTasks,sprints,releases,members,taskSubmissions=[],taskActivity=[],readOnly=false}:{
 projectId:string;initialTasks:Task[];sprints:Sprint[];releases:Release[];members:Person[];
 taskSubmissions?:TaskSubmission[];taskActivity?:TaskEvent[];readOnly?:boolean;
}){
 const router=useRouter(),params=useSearchParams();
 const [tasks,setTasks]=useState(initialTasks),[release,setRelease]=useState(params.get("release")??""),
 [sprint,setSprint]=useState(params.get("sprint")??""),[scope,setScope]=useState(params.get("scope")==="all"?"all":"current"),
 [priority,setPriority]=useState(params.get("priority")??""),
 [assignee,setAssignee]=useState(params.get("assignee")??""),[statusFilter,setStatusFilter]=useState(params.get("lane")??""),[busy,setBusy]=useState(false),[error,setError]=useState(""),
 [undo,setUndo]=useState<{id:string;status:string}|null>(null),[selected,setSelected]=useState<string|null>(null);
 useEffect(()=>{setTasks(initialTasks)},[initialTasks]);
 function remember(name:string,value:string){
  setVisibleLimit(150);
  const query=new URLSearchParams(window.location.search);
  if(value)query.set(name,value);else query.delete(name);
  window.history.replaceState(null,"",window.location.pathname+"?"+query.toString());
 }
 const bySprint=new Map(sprints.map(item=>[item.id,item]));
 const visible=tasks.filter(task=>(!sprint||task.sprintId===sprint)&&
   (!release||(task.sprintId?bySprint.get(task.sprintId)?.releaseId:null)===release)&&
   (!priority||task.priority===priority)&&
   (!assignee||(assignee==="UNASSIGNED"?task.assigneeMembershipId===null:
     task.assigneeMembershipId===assignee))&&
   (!statusFilter||task.status===statusFilter));
 const lanes=groupLearnerBoardLanes(visible,sprints);
 async function move(id:string,status:string){
  const task=tasks.find(item=>item.id===id),sp=task?.sprintId?bySprint.get(task.sprintId):null;
  if(!task||!sp||sp.status!=="ACTIVE"||readOnly||busy||
    !editable.includes(task.status as typeof editable[number])||
    !editable.includes(status as typeof editable[number])||task.status===status)return;
  if(status==="BLOCKED"&&!task.blockerReason?.trim()){
   setError("Record a blocker reason in task details before moving to Blocked.");return;
  }
  if(!window.confirm("Move task to "+status.replaceAll("_"," ")+"?"))return;
  setError("");setBusy(true);
  try{
   const result=await projectMutation("/api/projects/"+encodeURIComponent(projectId)+
    "/tasks/"+encodeURIComponent(id)+"/mentor-transition","PATCH",{
     status,expectedUpdatedAt:new Date(task.updatedAt).toISOString(),confirmed:true,
    }) as {task:Task};
   setUndo({id,status:task.status});
   setTasks(rows=>rows.map(row=>row.id===id?{...row,...result.task}:row));
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Task transition failed.");}
  finally{setBusy(false);}
 }
 function drop(event:React.DragEvent<HTMLElement>,status:string){
  event.preventDefault();
  const id=event.dataTransfer.getData("text/plain");
  if(id)void move(id,status);
 }
 const learnerChoices=members.filter(member=>member.role==="LEARNER");
 return <section className="space-y-4">
  <Link href={"/mentor/projects/"+encodeURIComponent(projectId)}
    className="text-sm font-semibold text-primary-text underline">Back to project</Link>
  <div className="flex flex-wrap items-center justify-between gap-3">
   <h1 className="text-xl font-semibold">Board</h1>
   <Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"?tab=delivery"}
     className="min-h-10 rounded-md border border-border px-3 py-2 text-sm font-semibold text-primary-text">
    Review submission</Link>
  </div>
  <div className="flex flex-wrap gap-3 rounded-xl border border-border p-3">
   <label className="text-sm font-semibold">Release
    <select value={release} onChange={e=>{setRelease(e.target.value);setSprint("");remember("release",e.target.value);remember("sprint","");}}
      className="ml-2 min-h-10 rounded-md border border-border bg-background px-2">
     <option value="">All releases</option>{releases.map(r=><option key={r.id} value={r.id}>{r.title}</option>)}
    </select></label>
   <label className="text-sm font-semibold">Sprint
    <select value={sprint} onChange={e=>{setSprint(e.target.value);remember("sprint",e.target.value);}}
      className="ml-2 min-h-10 rounded-md border border-border bg-background px-2">
     <option value="">All sprints</option>{sprints.filter(s=>!release||s.releaseId===release)
      .map(s=><option key={s.id} value={s.id}>{s.title}</option>)}
    </select></label>
   <label className="text-sm font-semibold">Priority
    <select value={priority} onChange={e=>{setPriority(e.target.value);remember("priority",e.target.value);}}
     className="ml-2 min-h-10 rounded border border-border bg-background p-2">
     <option value="">All priorities</option>
     {["LOW","MEDIUM","HIGH","CRITICAL"].map(v=><option key={v} value={v}>{v}</option>)}
    </select>
   </label>
   <label className="text-sm font-semibold">Assignee
    <select value={assignee} onChange={e=>{setAssignee(e.target.value);remember("assignee",e.target.value);}}
     className="ml-2 min-h-10 rounded border border-border bg-background p-2">
     <option value="">Everyone</option><option value="UNASSIGNED">Unassigned</option>
     {members.filter(m=>m.role==="LEARNER").map(m=>
      <option key={m.membershipId} value={m.membershipId}>{m.displayName??"Learner"}</option>)}
    </select>
   </label>
   <label className="text-sm font-semibold">Lane
    <select value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);remember("lane",e.target.value);}}
      className="ml-2 min-h-10 rounded border border-border bg-background p-2">
      <option value="">All lanes</option>
      {editable.map(v=><option key={v} value={v}>{v.replaceAll("_"," ")}</option>)}
      <option value="IN_REVIEW">In review</option><option value="DONE">Completed</option>
    </select>
   </label>
   <button type="button" onClick={()=>{setPriority("");setAssignee("");setSprint("");setRelease("");setStatusFilter("");["priority","assignee","sprint","release","lane"].forEach(k=>remember(k,""));}}
    className="min-h-10 text-sm font-semibold text-primary-text underline">Clear all</button>
  </div>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {undo?<button type="button" disabled={busy} className="text-sm font-semibold text-primary-text underline"
    onClick={()=>{const prior=undo;setUndo(null);void move(prior.id,prior.status);}}>Undo last move</button>:null}
  <div className="overflow-x-auto pb-3"><div className="flex min-w-max gap-3">
   {lanes.map(lane=><section key={lane.id} aria-label={lane.label}
    className="w-72 shrink-0 rounded-xl border border-border bg-surface-subtle p-3"
    onDragOver={e=>{if(editable.includes(lane.id as typeof editable[number]))e.preventDefault();}}
    onDrop={e=>drop(e,lane.id)}>
    <h2 className="flex justify-between font-semibold"><span>{lane.label}</span><span>{lane.tasks.length}</span></h2>
    <ul className="mt-3 space-y-2">{lane.tasks.map(task=>{
     const sprintRow=task.sprintId?bySprint.get(task.sprintId):null;
     const canMove=!readOnly&&!busy&&sprintRow?.status==="ACTIVE"&&
       editable.includes(task.status as typeof editable[number]);
     return <li key={task.id} draggable={canMove}
      onDragStart={e=>e.dataTransfer.setData("text/plain",task.id)}
      className="space-y-2 rounded-lg border border-border bg-surface p-3 text-sm">
      <button type="button" onClick={()=>setSelected(task.id)}
        className="min-h-10 text-left font-semibold text-primary-text underline">{task.title}</button>
      <p className="text-xs text-body">{task.priority} · {sprintRow?.title??"Backlog"}</p>
      <p className="text-xs text-body">Assignee: {members.find(m=>m.membershipId===task.assigneeMembershipId)?.displayName??"Unassigned"} ·
        {" "}Estimate: {task.estimatePoints??"Unsized"} · {task.taskType??"Task"}</p>
      <p className="text-xs text-body">Due: {task.dueDate??"No due date"} ·
        {" "}{projectTaskDueState(task.dueDate,task.status,new Date())}</p>
      {taskSubmissions.some(s=>s.taskId===task.id&&/^https?:\/\//.test(s.submissionUrl))?
        <p className="text-xs font-semibold text-primary-text">Submission link attached</p>:null}
      {task.carriedFromSprintId&&!task.sprintId?<p className="text-xs font-semibold text-warning-text">Carried over</p>:null}
      {task.assigneeMembershipId===null?<p className="text-xs font-semibold text-warning-text">Needs assigning</p>:null}
      {task.blockerReason?<p className="whitespace-pre-wrap text-xs text-warning-text">Blocked: {task.blockerReason}</p>:null}
      {canMove?<label className="block text-xs font-semibold">Move task
       <select value={task.status} disabled={busy} onChange={e=>void move(task.id,e.target.value)}
        className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-2">
        {editable.map(x=><option key={x} value={x}>{x.replaceAll("_"," ")}</option>)}
       </select></label>:null}
      {!readOnly&&["TODO","IN_PROGRESS","BLOCKED"].includes(task.status)?
        <MentorTaskDeleteControl projectId={projectId} taskId={task.id}
          title={task.title} updatedAt={task.updatedAt}/>:null}
      {!readOnly?<ProjectTaskAssigneeControl projectId={projectId} taskId={task.id} taskTitle={task.title}
       assigneeMembershipId={task.assigneeMembershipId}
       updatedAt={new Date(task.updatedAt).toISOString()} learners={learnerChoices}/>:null}
      <details className="rounded-lg border border-border p-2">
       <summary className="cursor-pointer font-semibold text-primary-text">Task details</summary>
       <p className="mt-2 whitespace-pre-wrap text-xs">{task.description||"No description"}</p>
       <p className="mt-2 text-xs font-semibold">Done when</p>
       <p className="whitespace-pre-wrap text-xs">{task.acceptanceCriteria||"Not recorded"}</p>
       <p className="mt-2 text-xs">Assigned to: {members.find(m=>m.membershipId===task.assigneeMembershipId)?.displayName??"Unassigned"}</p>
       <p className="mt-2 text-xs">Due: {task.dueDate??"No due date"} · Estimate: {task.estimatePoints??"—"}</p>
       <p className="text-xs">Task type: {task.taskType??"Not set"}</p>
       <h4 className="mt-3 text-xs font-semibold">Submission</h4>
       {taskSubmissions.filter(s=>s.taskId===task.id).slice(-3).map(item=>
        <div key={item.id} className="mt-1 text-xs">
          <span>{item.status} · version {item.version}</span>
          {/^https?:\/\//i.test(item.submissionUrl)?<a href={item.submissionUrl} target="_blank"
            rel="noreferrer noopener" className="ml-2 text-primary-text underline">Open submission link</a>:null}
        </div>
       )}
       {!taskSubmissions.some(s=>s.taskId===task.id)?<p className="text-xs text-muted-foreground">No submission yet.</p>:null}
       <h4 className="mt-3 text-xs font-semibold">Activity</h4>
       <ul className="space-y-1">{taskActivity.filter(event=>event.subjectId===task.id).slice(0,8).map(event=>
         <li key={event.id} className="text-xs text-body">{event.summary} · {event.actorDisplayName??"System"} ·
           {" "+new Date(event.occurredAt).toLocaleDateString("en-IN")}</li>
       )}</ul>
       <ProjectTaskComments projectId={projectId} taskId={task.id}
        updatedAt={new Date(task.updatedAt).toISOString()} canPost={!readOnly}/>
      </details>
     </li>;
    })}
    {!lane.tasks.length?<li className="py-4 text-center text-xs text-muted-foreground">No tasks</li>:null}
    </ul>
   </section>)}
  </div></div>
  {selected&&tasks.find(task=>task.id===selected)?<MentorBoardTaskDetailDialog
    projectId={projectId} task={tasks.find(task=>task.id===selected)!}
    sprintTitle={sprints.find(s=>s.id===tasks.find(task=>task.id===selected)?.sprintId)?.title??null}
    members={members} submissions={taskSubmissions} activity={taskActivity}
    readOnly={readOnly} onClose={()=>setSelected(null)}/>:null}
 </section>;
}
