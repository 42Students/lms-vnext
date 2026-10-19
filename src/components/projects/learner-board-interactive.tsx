"use client";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {LearnerDeleteOwnTask} from "./learner-own-task-controls";
import {canLearnerMoveOwnTask} from "@/modules/projects/learner-task-status-policy";
import {groupLearnerBoardLanes} from "@/modules/projects/learner-board-lanes-model";
import {learnerBoardTaskHref,type LearnerTaskBoardUrlFilters} from "@/modules/projects/learner-board-task-detail-model";
type Task={id:string;title:string;status:string;priority:string;sprintId:string|null;templateKey:string;
 updatedAt:Date;assigneeMembershipId:string|null;blockerReason:string|null};
type Sprint={id:string;status:string;title:string};
const statuses=["TODO","IN_PROGRESS","BLOCKED"] as const;
type EditableStatus=typeof statuses[number];

export function LearnerBoardInteractive({projectId,initialTasks,filters,sprints,membershipId,readOnly=false}:{
 projectId:string;initialTasks:Task[];filters:LearnerTaskBoardUrlFilters;
 sprints:Sprint[];membershipId:string|null;readOnly?:boolean;
}){
 const router=useRouter();
 const [tasks,setTasks]=useState(initialTasks),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [undo,setUndo]=useState<{taskId:string;status:EditableStatus;blockerReason:string|null}|null>(null);
 const [prevInitialTasks,setPrevInitialTasks]=useState(initialTasks);
 if(prevInitialTasks!==initialTasks){setPrevInitialTasks(initialTasks);setTasks(initialTasks);}
 useEffect(()=>{
  if(!undo)return;
  const timeout=setTimeout(()=>setUndo(null),6000);
  return ()=>clearTimeout(timeout);
 },[undo]);
 const sprintState=new Map(sprints.map(sprint=>[sprint.id,sprint.status]));
 const lanes=groupLearnerBoardLanes(tasks,sprints);
 async function move(taskId:string,next:EditableStatus,restoreNote?:string|null,isUndo=false){
  const task=tasks.find(row=>row.id===taskId);
  if(!task||busy||readOnly||!membershipId||task.assigneeMembershipId!==membershipId||
    !task.sprintId||sprintState.get(task.sprintId)!=="ACTIVE"||
    !canLearnerMoveOwnTask(task.status,next))return;
  let note=restoreNote??null;
  if(next==="BLOCKED"&&!note){
   note=window.prompt("What is blocking this task?",task.blockerReason??"");
  }
  if(next==="BLOCKED"&&(!note||note.trim().length<3||note.trim().length>2000)){
   setError("Describe the blocker in 3 to 2,000 characters, then try again.");
   return;
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
   setUndo(isUndo?null:{taskId,status:task.status as EditableStatus,blockerReason:task.blockerReason});
   setTasks(rows=>rows.map(row=>row.id===taskId?{...row,...data.task,updatedAt:new Date(data.task.updatedAt)}:row));
   router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Task update failed.");}
  finally{setBusy(false);}
 }
 async function pull(task:Task,sprintId:string){
  if(busy||readOnly||!membershipId||task.assigneeMembershipId!==membershipId||task.sprintId!==null||
    !window.confirm('Pull "'+task.title+'" into the active sprint?'))return;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/projects/"+encodeURIComponent(projectId)+"/backlog/pull",{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({taskId:task.id,sprintId,
      expectedUpdatedAt:new Date(task.updatedAt).toISOString()}),
   });
   if(!response.ok)throw Error("The task or sprint changed. Refresh before trying again.");
   const payload=await response.json() as {task:Task};
   setTasks(rows=>rows.map(row=>row.id===task.id?{
     ...row,...payload.task,updatedAt:new Date(payload.task.updatedAt),
   }:row));
   setNotice('Pulled "'+task.title+'" into '+(sprints.find(s=>s.id===sprintId)?.title??"sprint")+'.');
   router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Could not pull task");}
  finally{setBusy(false);}
 }
 function drop(event:React.DragEvent<HTMLElement>,lane:string){
  event.preventDefault();
  const id=event.dataTransfer.getData("text/plain");
  if(statuses.includes(lane as EditableStatus))void move(id,lane as EditableStatus);
 }
 return <section aria-label="Project Board lanes" className="space-y-3">
  <p className="text-sm text-body">{readOnly
    ?"This workspace is read-only. Task moves and backlog pulls are disabled."
    :"Drag your own task into a lane, or use the move control for touch and keyboard."}</p>
  {busy?<p role="status" aria-live="polite" className="text-sm text-body">Saving your change…</p>:null}
  {notice?<p role="status" aria-live="polite" className="text-sm text-success-text">{notice}</p>:null}
  {error?<p role="alert" className="rounded border border-error p-3 text-sm text-error">{error}</p>:null}
  {undo&&tasks.some(task=>task.id===undo.taskId&&canLearnerMoveOwnTask(task.status,undo.status))?
   <Button type="button" disabled={busy||readOnly} variant="ghost" className="min-h-9 !text-[var(--lms-primary-text)] underline"
    onClick={()=>{const last=undo;void move(last.taskId,last.status,last.blockerReason,true)}}>
    Undo last task move
  </Button>:null}
  <p className="text-xs text-muted-foreground sm:hidden">Scroll sideways to see all Board lanes.</p>
  <div role="region" aria-label="Project Board lanes, scroll horizontally to see more"
    tabIndex={0} className="overflow-x-auto overscroll-x-contain pb-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
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
      const editable=!readOnly&&own&&Boolean(task.sprintId)&&sprintState.get(task.sprintId!)==="ACTIVE"&&statuses.includes(task.status as EditableStatus);
      return <li key={task.id} draggable={editable&&!busy}
       onDragStart={event=>{if(editable)event.dataTransfer.setData("text/plain",task.id)}}
       className="rounded-lg border border-border bg-surface p-3 text-sm">
        <Link href={learnerBoardTaskHref(projectId,filters,task.id)}
         className="block break-words font-semibold text-primary-text">{task.title}</Link>
        <p className="mt-2 text-xs text-muted-foreground">{task.priority}</p>
        {!readOnly && own && (task.sprintId===null||editable) && task.status==="TODO" &&
          task.templateKey.startsWith("learner-"+membershipId!.replaceAll("-","")+"-") ?
          <LearnerDeleteOwnTask projectId={projectId} taskId={task.id}/>:null}
        {task.sprintId===null && own && !readOnly ?
          <label className="mt-2 block text-xs font-semibold text-body">
            Pull into sprint
            <Select defaultValue="" disabled={busy||!sprints.some(s=>s.status==="ACTIVE")}
              onChange={event=>{if(event.target.value)void pull(task,event.target.value);}}
              className="mt-1 min-h-9">
              <option value="">Choose active sprint</option>
              {sprints.filter(s=>s.status==="ACTIVE").map(s=><option key={s.id} value={s.id}>{s.title}</option>)}
            </Select>
            {!sprints.some(s=>s.status==="ACTIVE")?
              <span className="mt-1 block text-xs font-normal">Start a sprint before moving backlog tasks onto the board.</span>:null}
          </label> : null}
        {editable?<label className="mt-2 block text-xs font-semibold text-body">
          Move {task.title}
          <Select aria-label={"Move "+task.title} value={task.status} disabled={busy}
           onChange={event=>void move(task.id,event.target.value as EditableStatus)}
           className="mt-1 min-h-9">
            {statuses.filter(status=>status===task.status||canLearnerMoveOwnTask(task.status,status))
              .map(status=><option key={status} value={status} disabled={status===task.status}>
               {status==="TODO"?"To Do":status==="IN_PROGRESS"?"In Progress":"Blocked"}</option>)}
          </Select>
        </label>:null}
       </li>;
     })}
     {!lane.tasks.length?<li className="py-5 text-center text-xs text-muted-foreground">No tasks</li>:null}
     </ul>
    </section>)}</div>
  </div>
 </section>;
}
