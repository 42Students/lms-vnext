"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {useState} from "react";
import { Select } from "@/components/ui/select";
import {useRouter} from "next/navigation";
import {projectMutation} from "./project-api";
import {MentorTaskDetailsEdit} from "./mentor-task-details-edit";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useProjectEditorDiscardGuard} from "./project-editor-discard-guard";
type Task={id:string;title:string;status:string;sprintId:string|null;carriedFromSprintId?:string|null;updatedAt:Date;
 priority:string;estimatePoints:number|null;
 description:string|null;approach:string|null;acceptanceCriteria:string|null;
 dueDate:string|null;blockerReason:string|null;taskType:string|null;};
type Sprint={id:string;title:string;status:string};
export function MentorProductBacklog({projectId,tasks,sprints,readOnly=false}:{
 projectId:string;tasks:Task[];sprints:Sprint[];readOnly?:boolean;
}){
 const router=useRouter();
 const [adding,setAdding]=useState(false),[title,setTitle]=useState(""),[description,setDescription]=useState(""),[approach,setApproach]=useState(""),[criteria,setCriteria]=useState(""),[priority,setPriority]=useState("MEDIUM"),[points,setPoints]=useState("");
 const [taskType,setTaskType]=useState(""),[dueDate,setDueDate]=useState(""),[blockerReason,setBlockerReason]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [moveRequest,setMoveRequest]=useState<{task:Task;targetSprintId:string|null}|null>(null);
 const draftDirty=Boolean(title||description||approach||criteria||points||taskType||dueDate||blockerReason||priority!=="MEDIUM");
 function discardDraft(){
  setAdding(false);setTitle("");setDescription("");setApproach("");setCriteria("");
  setPriority("MEDIUM");setPoints("");setTaskType("");setDueDate("");setBlockerReason("");
 }
 const guard=useProjectEditorDiscardGuard(adding,draftDirty,busy,discardDraft);
 const backlog=tasks.filter(task=>task.sprintId===null),completed=tasks.filter(task=>task.status==="DONE");
 const velocity=completed.reduce((sum,task)=>sum+(task.estimatePoints??0),0);
 async function move(){
  if(busy||readOnly||!moveRequest)return;
  const {task,targetSprintId}=moveRequest;
  setBusy(true);setError("");setNotice("");
  try{
   await projectMutation("/api/projects/"+encodeURIComponent(projectId)+"/backlog","PATCH",{
    taskId:task.id,targetSprintId,expectedUpdatedAt:new Date(task.updatedAt).toISOString(),
   });
   setMoveRequest(null);
   setNotice(targetSprintId?"Task pulled into sprint.":"Task returned to backlog.");router.refresh();
  }catch{setError("Cannot move task.");}finally{setBusy(false);}
 }
 const targets=sprints.filter(s=>s.status!=="COMPLETED");
 const returnable=tasks.filter(task=>task.sprintId!==null&&["TODO","IN_PROGRESS","BLOCKED"].includes(task.status));
 return <section className="space-y-3 border-b border-border pb-5">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div><h2 className="text-lg font-semibold">Product backlog</h2>
    <p className="mt-1 text-sm text-body">{backlog.length} backlog tasks</p>
   </div>
   <div className="rounded-[var(--lms-control-radius)] bg-surface-subtle p-3">
    <p className="text-xs font-semibold text-body">Velocity</p>
    <p className="text-xl font-bold">{velocity} points completed</p>
   </div>
  </div>
  {!readOnly?<section className="space-y-2">
    <Button variant="secondary" type="button" onClick={()=>adding?guard.requestClose():setAdding(true)}
      className="min-h-11 px-3">
      Add backlog task
    </Button>
    {adding?<form onSubmit={async e=>{
      e.preventDefault();if(busy)return;setError("");
      if(!title.trim()||!Number.isInteger(points?Number(points):0)||
        (points!==""&&(Number(points)<0||Number(points)>1000))){
        setError("Enter a task title and a valid estimate from 0 to 1000.");return;
      }
      setBusy(true);
      try{
        await projectMutation("/api/projects/"+encodeURIComponent(projectId)+"/backlog","POST",{
          title:title.trim(),description:description.trim()||null,
          approach:approach.trim()||null,
          acceptanceCriteria:criteria.trim()||null,priority,
          estimatePoints:points?Number(points):null,
          taskType:taskType||null,dueDate:dueDate||null,blockerReason:blockerReason.trim()||null,
        });
        setAdding(false);setTitle("");setDescription("");setApproach("");setCriteria("");
        setPriority("MEDIUM");setPoints("");setTaskType("");setDueDate("");setBlockerReason("");
        router.refresh();
      }catch{setError("Could not add backlog task");}
      finally{setBusy(false);}
    }} className="grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
      <label className="text-sm font-semibold">Title<Input required maxLength={200} value={title}
        onChange={e=>setTitle(e.target.value)}
        className="mt-1 min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"/></label>
      <label className="text-sm font-semibold">Priority<Select value={priority}
        onChange={e=>setPriority(e.target.value)}
        className="mt-1 min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        {["LOW","MEDIUM","HIGH","CRITICAL"].map(v=><option key={v} value={v}>{v}</option>)}
      </Select></label>
      <label className="text-sm font-semibold">Description<Textarea maxLength={4000}
        value={description} onChange={e=>setDescription(e.target.value)}
        className="mt-1 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"/></label>
      <label className="text-sm font-semibold">Approach (optional)<Textarea maxLength={4000}
        value={approach} onChange={event=>setApproach(event.target.value)}
        className="mt-1 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"/></label>
      <label className="text-sm font-semibold">Done when<Textarea maxLength={4000}
        value={criteria} onChange={e=>setCriteria(e.target.value)}
        className="mt-1 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"/></label>
      <label className="text-sm font-semibold">Estimate points<Input type="number" min={0} max={1000}
        value={points} onChange={e=>setPoints(e.target.value)}
        className="mt-1 min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"/></label>
      <label className="text-sm font-semibold">Task type
        <Select value={taskType} onChange={e=>setTaskType(e.target.value)}
          className="mt-1 min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <option value="">Not specified</option>
          <option value="STORY">Story</option><option value="BUG">Bug</option>
          <option value="CHORE">Chore</option><option value="SPIKE">Spike</option>
        </Select>
      </label>
      <label className="text-sm font-semibold">Due date
        <Input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}
          className="mt-1 min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"/>
      </label>
      <label className="text-sm font-semibold sm:col-span-2">What&apos;s blocking this task?
        <Textarea value={blockerReason} maxLength={4000} onChange={e=>setBlockerReason(e.target.value)}
          className="mt-1 min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"/>
      </label>
      <div className="flex items-end gap-2"><Button variant="primary" type="submit"
        disabled={busy||!title.trim()||(points!==""&&
          (!Number.isInteger(Number(points))||Number(points)<0||Number(points)>1000))}
        className="min-h-11 px-3">Add task</Button>
      <Button variant="secondary" type="button" onClick={guard.requestClose}
        className="min-h-11 px-3">Cancel</Button></div>
    </form>:null}
  </section>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {notice?<p role="status" className="text-sm text-success">{notice}</p>:null}
  <div className="grid gap-3 sm:grid-cols-2">
   {backlog.map(task=><article key={task.id} className="rounded-[var(--lms-control-radius)] border border-border p-3">
    <p className="font-semibold">{task.title}</p>
    {task.approach?<p className="mt-2 whitespace-pre-wrap break-words text-xs text-body">
      Approach: {task.approach}
    </p>:null}
    <p className="mt-1 text-xs text-body">
      {task.priority} · {task.estimatePoints===null?"Unsized":task.estimatePoints+" points"}
    </p>
    {task.carriedFromSprintId?<span className="mt-1 inline-flex rounded border border-border px-2 py-1 text-xs font-semibold text-warning-text">Carried over</span>:null}
    {!readOnly&&["TODO","IN_PROGRESS","BLOCKED"].includes(task.status)?
      <div className="mt-2">
        <MentorTaskDetailsEdit projectId={projectId} taskId={task.id}
          title={task.title} description={task.description} approach={task.approach}
          acceptanceCriteria={task.acceptanceCriteria} priority={task.priority}
          updatedAt={new Date(task.updatedAt).toISOString()}
          taskType={task.taskType} estimatePoints={task.estimatePoints}
          dueDate={task.dueDate} blockerReason={task.blockerReason}/>
      </div>:null}
    {!readOnly?<label className="mt-2 block text-sm font-semibold">Pull into sprint
     <Select disabled={busy} value="" onChange={e=>{const id=e.target.value;if(id)setMoveRequest({task,targetSprintId:id});}}
      className="mt-1 min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
      <option value="">Choose sprint</option>
      {targets.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}
     </Select>
    </label>:null}
   </article>)}
   {!backlog.length?<p className="py-4 text-sm text-muted-foreground">Backlog is empty.</p>:null}
  </div>
  {!readOnly&&returnable.length>0?<details><summary className="cursor-pointer text-sm font-semibold text-link">
    Return unfinished tasks to backlog</summary>
    <div className="mt-2 space-y-2">
     {returnable.map(task=><Button variant="secondary" key={task.id} type="button" disabled={busy}
        onClick={()=>setMoveRequest({task,targetSprintId:null})}
        className="block min-h-11 w-full p-2 text-left">
        {task.title} · Return to backlog
       </Button>)}
    </div>
  </details>:null}
  <ConfirmDialog open={moveRequest!==null} onOpenChange={open=>{if(!open&&!busy)setMoveRequest(null);}}
   title={moveRequest?.targetSprintId?"Pull task into selected sprint?":"Move task into the product backlog?"}
   description={moveRequest?.task.title??"Task movement will update the project board."}
   confirmLabel="Confirm" pending={busy} confirmVariant="primary" onConfirm={move}>
   {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  </ConfirmDialog>
  <ConfirmDialog open={guard.discardOpen} onOpenChange={guard.setDiscardOpen}
   title="Discard backlog task changes?"
   description="You have unsaved project changes. Leave this page and discard them?"
   confirmLabel="Discard changes" pending={busy} onConfirm={guard.confirmDiscard}/>
 </section>;
}
