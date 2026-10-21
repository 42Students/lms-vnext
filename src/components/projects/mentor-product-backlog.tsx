"use client";
import { Alert } from "@/components/ui/alert";

import { Disclosure } from "@/components/ui/disclosure";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {useId,useState} from "react";
import { Select } from "@/components/ui/select";
import {useRouter} from "next/navigation";
import {projectMutation} from "./project-api";
import {MentorTaskDetailsEdit} from "./mentor-task-details-edit";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useProjectEditorDiscardGuard} from "./project-editor-discard-guard";
import {useToast} from "@/components/ui/toast";
import {FriendlyFetchError} from "@/lib/api-fetch";
type Task={id:string;title:string;status:string;sprintId:string|null;carriedFromSprintId?:string|null;updatedAt:Date;
 priority:string;estimatePoints:number|null;
 description:string|null;approach:string|null;acceptanceCriteria:string|null;
 dueDate:string|null;blockerReason:string|null;taskType:string|null;};
type Sprint={id:string;title:string;status:string};
export function MentorProductBacklog({projectId,tasks,sprints,readOnly=false}:{
 projectId:string;tasks:Task[];sprints:Sprint[];readOnly?:boolean;
}){
 const router=useRouter();
 const {showToast}=useToast();
 const [recentlySaved,setRecentlySaved]=useState<Task[]>([]);
 const draftId=useId();
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
 // A server-confirmed new row remains visible until the next route snapshot.
 const snapshotIds=new Set(tasks.map(task=>task.id));
 const visibleTasks=[...tasks,...recentlySaved.filter(task=>!snapshotIds.has(task.id))];
 const backlog=visibleTasks.filter(task=>task.sprintId===null),completed=visibleTasks.filter(task=>task.status==="DONE");
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
  }catch(reason){
    const stale=reason instanceof FriendlyFetchError&&reason.status===409;
    setError(stale?"Task plan changed. Reload the latest workspace before saving.":"Failed to update tasks");
   }finally{setBusy(false);}
 }
 const targets=sprints.filter(s=>s.status!=="COMPLETED");
 const returnable=tasks.filter(task=>task.sprintId!==null&&["TODO","IN_PROGRESS","BLOCKED"].includes(task.status));
 return <section className="space-y-3 border-b border-border pb-5">
  <p className="text-xs text-muted-foreground">Task edits are individually version-checked. Reload after a conflict to avoid overwriting another editor.</p>
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div><h2 className="text-lg font-semibold">Product backlog</h2>
    <p className="mt-1 text-sm text-body">{backlog.length} backlog tasks</p>
   </div>
   <p className="text-sm text-body"><span className="font-semibold">Velocity</span> · {velocity} points completed</p>
  </div>
  {!readOnly&&targets.length===0?<Alert tone="warning" role="status">No active sprints found. You can create backlog tasks now, but cannot pull them into a sprint until a sprint is active.</Alert>:null}
  {!readOnly?<section className="space-y-2">
    <Button variant="primary" type="button" aria-expanded={adding} aria-controls={draftId} onClick={()=>adding?guard.requestClose():setAdding(true)}
      className="min-h-11 px-3">
      Add backlog task
    </Button>
    {adding?<form id={draftId} onSubmit={async e=>{
      e.preventDefault();if(busy)return;setError("");
      if(!title.trim()){setError("Item 1: Title required");return;}
      if(!Number.isInteger(points?Number(points):0)||
        (points!==""&&(Number(points)<0||Number(points)>1000))){
        setError("Item 1: Estimate must be between 0 and 1000.");return;
      }
      setBusy(true);
      try{
        const receipt=await projectMutation("/api/projects/"+encodeURIComponent(projectId)+"/backlog","POST",{
          title:title.trim(),description:description.trim()||null,
          approach:approach.trim()||null,
          acceptanceCriteria:criteria.trim()||null,priority,
          estimatePoints:points?Number(points):null,
          taskType:taskType||null,dueDate:dueDate||null,blockerReason:blockerReason.trim()||null,
        });
        if(!receipt || typeof receipt!=="object" || !("task" in receipt) ||
           !receipt.task || typeof receipt.task!=="object" ||
           !("id" in receipt.task) || typeof receipt.task.id!=="string")
          throw new Error("Task save receipt is invalid.");
        setRecentlySaved(old=>[...old,receipt.task as Task]);
        showToast({tone:"success",title:"Tasks updated"});
        setAdding(false);setTitle("");setDescription("");setApproach("");setCriteria("");
        setPriority("MEDIUM");setPoints("");setTaskType("");setDueDate("");setBlockerReason("");
        router.refresh();
      }catch(reason){
        const stale=reason instanceof FriendlyFetchError&&reason.status===409;
        setError(stale?"Task plan changed. Reload the latest workspace before saving.":"Failed to update tasks");
      }
      finally{setBusy(false);}
    }} className="grid gap-3 border-t border-border pt-3 min-[768px]:grid-cols-2">
      <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Title<Input required maxLength={200} value={title}
        onChange={e=>setTitle(e.target.value)}
        className="mt-1 min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"/></label>
      <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Priority<Select value={priority}
        onChange={e=>setPriority(e.target.value)}
        className="mt-1 min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        {["LOW","MEDIUM","HIGH","CRITICAL"].map(v=><option key={v} value={v}>{v}</option>)}
      </Select></label>
      <Disclosure title="Additional task details" className="min-w-0 min-[768px]:col-span-2" contentClassName="grid min-w-0 gap-3 pt-3 min-[768px]:grid-cols-2">
      <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Description<Textarea maxLength={4000}
        value={description} onChange={e=>setDescription(e.target.value)}
        className="mt-1 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"/></label>
      <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Approach (optional)<Textarea maxLength={4000}
        value={approach} onChange={event=>setApproach(event.target.value)}
        className="mt-1 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"/></label>
      <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Done when<Textarea maxLength={4000}
        value={criteria} onChange={e=>setCriteria(e.target.value)}
        className="mt-1 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"/></label>
      <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Estimate points
        <span className="mt-1 block text-xs font-normal text-body">Select a classic story-point estimate (1, 2, 3, 5, 8, 13) or enter a custom whole number (0–1000).</span>
        <Input type="number" list={draftId+"-estimates"} min={0} max={1000}
        value={points} onChange={e=>setPoints(e.target.value)}
        className="mt-1 min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"/>
        <datalist id={draftId+"-estimates"}>{[1,2,3,5,8,13].map(n=><option key={n} value={n}/>)}</datalist>
      </label>
      <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Task type
        <Select value={taskType} onChange={e=>setTaskType(e.target.value)}
          className="mt-1 min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <option value="">Not specified</option>
          <option value="STORY">Story</option><option value="BUG">Bug</option>
          <option value="CHORE">Chore</option><option value="SPIKE">Spike</option>
        </Select>
      </label>
      <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Due date
        <Input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}
          className="mt-1 min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"/>
      </label>
      <label className="font-semibold min-[768px]:col-span-2 text-[13px] leading-4 text-[var(--lms-neutral-400)]">What&apos;s blocking this task?
        <Textarea value={blockerReason} maxLength={4000} onChange={e=>setBlockerReason(e.target.value)}
          className="mt-1 min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"/>
      </label>
      </Disclosure>
      <div className="flex min-w-0 flex-col gap-2 md:flex-row min-[768px]:col-span-2"><Button variant="primary" type="submit"
        disabled={busy||!title.trim()||(points!==""&&
          (!Number.isInteger(Number(points))||Number(points)<0||Number(points)>1000))}
        className="min-h-11 w-full px-3 md:w-auto">Add task</Button>
      <Button variant="secondary" type="button" onClick={guard.requestClose}
        className="min-h-11 w-full px-3 md:w-auto">Cancel</Button></div>
    </form>:null}
  </section>:null}
  {error&&!moveRequest?<Alert tone="error">{error}</Alert>:null}
  {notice?<Alert tone="success">{notice}</Alert>:null}
  <div className="min-w-0 divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">
   {backlog.map(task=><article key={task.id} className="min-w-0 py-3">
    <p className="font-semibold">{task.title}</p>
    {task.approach?<Disclosure title="Approach" className="mt-2"><p className="whitespace-pre-wrap break-words text-xs text-body">Approach: {task.approach}</p></Disclosure>:null}
    <p className="mt-1 text-xs text-body">
      {task.priority} · {task.estimatePoints===null?"Unsized":task.estimatePoints+" points"}
    </p>
    {task.carriedFromSprintId?<Badge tone="warning" className="mt-1">Carried over</Badge>:null}
    {!readOnly&&["TODO","IN_PROGRESS","BLOCKED"].includes(task.status)?
      <div className="mt-2">
        <MentorTaskDetailsEdit projectId={projectId} taskId={task.id}
          title={task.title} description={task.description} approach={task.approach}
          acceptanceCriteria={task.acceptanceCriteria} priority={task.priority}
          updatedAt={new Date(task.updatedAt).toISOString()}
          taskType={task.taskType} estimatePoints={task.estimatePoints}
          dueDate={task.dueDate} blockerReason={task.blockerReason}/>
      </div>:null}
    {!readOnly?<label className="mt-2 block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Pull into sprint
     <Select disabled={busy||targets.length===0} value="" onChange={e=>{const id=e.target.value;if(id)setMoveRequest({task,targetSprintId:id});}}
      className="mt-1 min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
      <option value="">Choose sprint</option>
      {targets.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}
     </Select>
    </label>:null}
   </article>)}
   {!backlog.length?<div><EmptyState title="No backlog tasks yet" description="Add backlog tasks, then pull them into a sprint when the plan is ready." /></div>:null}
  </div>
  {!readOnly&&returnable.length>0?<Disclosure title="Return unfinished tasks to backlog">
    <div className="mt-2 space-y-2">
     {returnable.map(task=><Button variant="secondary" key={task.id} type="button" disabled={busy}
        onClick={()=>setMoveRequest({task,targetSprintId:null})}
        className="min-h-11 w-full !justify-start p-2 !text-left">
        {task.title} · Return to backlog
       </Button>)}
    </div>
  </Disclosure>:null}
  <ConfirmDialog open={moveRequest!==null} onOpenChange={open=>{if(!open&&!busy)setMoveRequest(null);}}
   title={moveRequest?.targetSprintId?"Pull task into selected sprint?":"Move task into the product backlog?"}
   description={moveRequest?.task.title??"Task movement will update the project board."}
   confirmLabel="Confirm" pending={busy} confirmVariant="primary" onConfirm={move}>
   {error?<Alert tone="error">{error}</Alert>:null}
  </ConfirmDialog>
  <ConfirmDialog open={guard.discardOpen} onOpenChange={guard.setDiscardOpen}
   title="Discard backlog task changes?"
   description="You have unsaved project changes. Leave this page and discard them?"
   confirmLabel="Discard changes" pending={busy} onConfirm={guard.confirmDiscard}/>
 </section>;
}
