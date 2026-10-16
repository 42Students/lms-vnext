"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {LearnerDeleteOwnTask} from "./learner-own-task-controls";
import {groupLearnerBoardLanes} from "@/modules/projects/learner-board-lanes-model";
import {learnerBoardTaskHref,type LearnerTaskBoardUrlFilters} from "@/modules/projects/learner-board-task-detail-model";
type Task={id:string;title:string;status:string;priority:string;sprintId:string;templateKey:string;
 updatedAt:Date;assigneeMembershipId:string|null;blockerReason:string|null};
type Sprint={id:string;status:string;title:string};
const statuses=["TODO","IN_PROGRESS","BLOCKED"] as const;
type EditableStatus=typeof statuses[number];

export function LearnerBoardInteractive({projectId,initialTasks,filters,sprints,membershipId}:{
 projectId:string;initialTasks:Task[];filters:LearnerTaskBoardUrlFilters;
 sprints:Sprint[];membershipId:string|null;
}){
 const router=useRouter();
 const [tasks,setTasks]=useState(initialTasks),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [undo,setUndo]=useState<{taskId:string;status:EditableStatus;blockerReason:string|null}|null>(null);
 const lanes=groupLearnerBoardLanes(tasks,sprints);
 async function move(taskId:string,next:EditableStatus,restoreNote?:string|null){
  const task=tasks.find(row=>row.id===taskId);
  if(!task||busy||!membershipId||task.assigneeMembershipId!==membershipId||
    !statuses.includes(task.status as EditableStatus)||task.status===next)return;
  let note=restoreNote??null;
  if(next==="BLOCKED"&&!note){
   note=window.prompt("What is blocking this task?",task.blockerReason??"");
   if(!note?.trim())return;
  }
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/projects/"+encodeURIComponent(projectId)+
     "/tasks/"+encodeURIComponent(taskId)+"/learner-progress",{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action:"STATUS",status:next,expectedUpdatedAt:new Date(task.updatedAt).toISOString(),
      ...(next==="BLOCKED"?{blockerNote:note?.trim()}:{}),}),
   });
   if(!response.ok)throw Error(response.status===409?"Task changed. Refresh the Board.":"Task could not be moved.");
   const data=await response.json() as {task:Task};
   setUndo({taskId,status:task.status as EditableStatus,blockerReason:task.blockerReason});
   setTasks(rows=>rows.map(row=>row.id===taskId?{...row,...data.task,updatedAt:new Date(data.task.updatedAt)}:row));
   router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Task update failed.");}
  finally{setBusy(false);}
 }
 function drop(event:React.DragEvent<HTMLElement>,lane:string){
  event.preventDefault();
  const id=event.dataTransfer.getData("text/plain");
  if(statuses.includes(lane as EditableStatus))void move(id,lane as EditableStatus);
 }
 return <section aria-label="Project Board lanes" className="space-y-3">
  <p className="text-sm text-body">Drag your own task into a lane, or use the move control for touch and keyboard.</p>
  {error?<p role="alert" className="rounded border border-error p-3 text-sm text-error">{error}</p>:null}
  {undo?<button type="button" disabled={busy} className="min-h-10 text-sm font-semibold text-primary-text underline"
    onClick={()=>{const last=undo;setUndo(null);void move(last.taskId,last.status,last.blockerReason)}}>
    Undo last task move
  </button>:null}
  <div className="overflow-x-auto pb-3">
   <div className="flex min-w-max gap-3">{lanes.map(lane=>
    <section key={lane.id} aria-label={lane.label}
      onDragOver={event=>{if(statuses.includes(lane.id as EditableStatus))event.preventDefault()}}
      onDrop={event=>drop(event,lane.id)}
      className="w-64 shrink-0 rounded-xl border border-border bg-surface-subtle p-3">
     <h2 className="flex items-center justify-between font-semibold">
      <span>{lane.label}</span><span className="rounded-full border border-border px-2 text-sm">{lane.tasks.length}</span>
     </h2>
     <ul className="mt-3 space-y-2">{lane.tasks.map(task=>{
      const own=membershipId!==null&&task.assigneeMembershipId===membershipId;
      const editable=own&&statuses.includes(task.status as EditableStatus);
      return <li key={task.id} draggable={editable&&!busy}
       onDragStart={event=>{if(editable)event.dataTransfer.setData("text/plain",task.id)}}
       className="rounded-lg border border-border bg-surface p-3 text-sm">
        <Link href={learnerBoardTaskHref(projectId,filters,task.id)}
         className="block break-words font-semibold text-primary-text">{task.title}</Link>
        <p className="mt-2 text-xs text-muted-foreground">{task.priority}</p>
        {editable && task.status==="TODO" &&
          task.templateKey.startsWith("learner-"+membershipId!.replaceAll("-","")+"-") ?
          <LearnerDeleteOwnTask projectId={projectId} taskId={task.id}/>:null}
        {editable?<label className="mt-2 block text-xs font-semibold text-body">
          Move {task.title}
          <select aria-label={"Move "+task.title} value={task.status} disabled={busy}
           onChange={event=>void move(task.id,event.target.value as EditableStatus)}
           className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-2 text-sm">
            {statuses.map(status=><option key={status} value={status}>
             {status==="TODO"?"To Do":status==="IN_PROGRESS"?"In Progress":"Blocked"}</option>)}
          </select>
        </label>:null}
       </li>;
     })}
     {!lane.tasks.length?<li className="py-5 text-center text-xs text-muted-foreground">No tasks</li>:null}
     </ul>
    </section>)}</div>
  </div>
 </section>;
}
