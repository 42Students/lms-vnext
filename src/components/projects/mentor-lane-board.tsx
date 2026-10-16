"use client";
import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {groupLearnerBoardLanes} from "@/modules/projects/learner-board-lanes-model";
import {projectMutation} from "./project-api";
import {ProjectTaskAssigneeControl} from "./project-task-assignee-control";
import {ProjectTaskComments} from "./project-task-comments";
type Task={id:string;title:string;status:string;priority:string;sprintId:string;updatedAt:Date;
 description:string|null;acceptanceCriteria:string|null;blockerReason:string|null;
 assigneeMembershipId:string|null;dueDate:string|null;estimatePoints:number|null;taskType:string|null};
type Sprint={id:string;title:string;status:string;releaseId:string};
type Release={id:string;title:string};
type Person={membershipId:string;displayName:string|null;role:string};
const editable=["TODO","IN_PROGRESS","BLOCKED"] as const;
export function MentorLaneBoard({projectId,initialTasks,sprints,releases,members,readOnly=false}:{
 projectId:string;initialTasks:Task[];sprints:Sprint[];releases:Release[];members:Person[];readOnly?:boolean;
}){
 const router=useRouter(),[tasks,setTasks]=useState(initialTasks),[release,setRelease]=useState(""),
 [sprint,setSprint]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),
 [undo,setUndo]=useState<{id:string;status:string}|null>(null);
 const bySprint=new Map(sprints.map(item=>[item.id,item]));
 const visible=tasks.filter(task=>(!sprint||task.sprintId===sprint)&&
   (!release||bySprint.get(task.sprintId)?.releaseId===release));
 const lanes=groupLearnerBoardLanes(visible,sprints);
 async function move(id:string,status:string){
  const task=tasks.find(item=>item.id===id),sp=task?bySprint.get(task.sprintId):null;
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
    <select value={release} onChange={e=>{setRelease(e.target.value);setSprint("");}}
      className="ml-2 min-h-10 rounded-md border border-border bg-background px-2">
     <option value="">All releases</option>{releases.map(r=><option key={r.id} value={r.id}>{r.title}</option>)}
    </select></label>
   <label className="text-sm font-semibold">Sprint
    <select value={sprint} onChange={e=>setSprint(e.target.value)}
      className="ml-2 min-h-10 rounded-md border border-border bg-background px-2">
     <option value="">All sprints</option>{sprints.filter(s=>!release||s.releaseId===release)
      .map(s=><option key={s.id} value={s.id}>{s.title}</option>)}
    </select></label>
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
     const sprintRow=bySprint.get(task.sprintId);
     const canMove=!readOnly&&!busy&&sprintRow?.status==="ACTIVE"&&
       editable.includes(task.status as typeof editable[number]);
     return <li key={task.id} draggable={canMove}
      onDragStart={e=>e.dataTransfer.setData("text/plain",task.id)}
      className="space-y-2 rounded-lg border border-border bg-surface p-3 text-sm">
      <p className="font-semibold">{task.title}</p>
      <p className="text-xs text-body">{task.priority} · {sprintRow?.title??"Backlog"}</p>
      {task.assigneeMembershipId===null?<p className="text-xs font-semibold text-warning-text">Needs assigning</p>:null}
      {task.blockerReason?<p className="whitespace-pre-wrap text-xs text-warning-text">Blocked: {task.blockerReason}</p>:null}
      {canMove?<label className="block text-xs font-semibold">Move task
       <select value={task.status} disabled={busy} onChange={e=>void move(task.id,e.target.value)}
        className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-2">
        {editable.map(x=><option key={x} value={x}>{x.replaceAll("_"," ")}</option>)}
       </select></label>:null}
      {!readOnly?<ProjectTaskAssigneeControl projectId={projectId} taskId={task.id}
       assigneeMembershipId={task.assigneeMembershipId}
       updatedAt={new Date(task.updatedAt).toISOString()} learners={learnerChoices}/>:null}
      <details className="rounded-lg border border-border p-2">
       <summary className="cursor-pointer font-semibold text-primary-text">Task details</summary>
       <p className="mt-2 whitespace-pre-wrap text-xs">{task.description||"No description"}</p>
       <p className="mt-2 text-xs font-semibold">Done when</p>
       <p className="whitespace-pre-wrap text-xs">{task.acceptanceCriteria||"Not recorded"}</p>
       <p className="mt-2 text-xs">Due: {task.dueDate??"No due date"} · Estimate: {task.estimatePoints??"—"}</p>
       <p className="text-xs">Task type: {task.taskType??"Not set"}</p>
       <ProjectTaskComments projectId={projectId} taskId={task.id}
        updatedAt={new Date(task.updatedAt).toISOString()} canPost={!readOnly}/>
      </details>
     </li>;
    })}
    {!lane.tasks.length?<li className="py-4 text-center text-xs text-muted-foreground">No tasks</li>:null}
    </ul>
   </section>)}
  </div></div>
 </section>;
}
