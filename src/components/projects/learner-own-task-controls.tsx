"use client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {projectMutation} from "./project-api";
type Sprint={id:string;title:string;status:string;updatedAt:Date};
export function LearnerAddOwnTask({projectId,sprints}:{projectId:string;sprints:Sprint[]}){
 const router=useRouter();
 const available=sprints.filter(row=>row.status==="ACTIVE");
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [sprintId,setSprintId]=useState(available[0]?.id??"");
 const [status,setStatus]=useState<"TODO"|"IN_PROGRESS"|"BLOCKED">("TODO");
 const [title,setTitle]=useState(""),[description,setDescription]=useState(""),
   [approach,setApproach]=useState(""),[acceptance,setAcceptance]=useState(""),
   [blockerReason,setBlockerReason]=useState("");
 const [priority,setPriority]=useState("MEDIUM"),[estimate,setEstimate]=useState(""),[due,setDue]=useState("");
 const [type,setType]=useState("");
 async function save(e:FormEvent){
  e.preventDefault();const sprint=available.find(row=>row.id===sprintId);
  const estimateValid=estimate===""||
    (Number.isInteger(Number(estimate))&&Number(estimate)>=0&&Number(estimate)<=1000);
  if((sprintId!==""&&!sprint)||!title.trim()||busy||!estimateValid||
    (status==="BLOCKED"&&!blockerReason.trim())||(!sprintId&&status!=="TODO"))return;
  setBusy(true);setError("");
  try{
   await projectMutation("/api/projects/"+encodeURIComponent(projectId)+"/tasks","POST",{
    sprintId:sprintId||null,title:title.trim(),description:description.trim()||null,
    approach:approach.trim()||null,status,blockerReason:blockerReason.trim()||null,
    acceptanceCriteria:acceptance.trim()||null,priority,
    dueDate:due||null,estimatePoints:estimate?Number(estimate):null,
    taskType:type||null,
    expectedSprintUpdatedAt:sprint?new Date(sprint.updatedAt).toISOString():null,
   });
   setOpen(false);setTitle("");setDescription("");setApproach("");
   setAcceptance("");setBlockerReason("");setStatus("TODO");setPriority("MEDIUM");
   setEstimate("");setDue("");setType("");router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Could not create task");}
  finally{setBusy(false);}
 }
 return <section className="space-y-3">
  <Button type="button" onClick={()=>setOpen(x=>!x)}
   className="min-h-11">
   Add my task
  </Button>
  {!available.length?<p className="text-sm text-muted-foreground">
    No sprint is active. You can add your task to the product backlog.</p>:null}
  {open?<form onSubmit={e=>void save(e)}
   className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2">
   <label className="text-sm font-semibold">Task title
    <Input required maxLength={200} value={title} onChange={e=>setTitle(e.target.value)}
     className="mt-1 min-h-11"/></label>
   <label className="text-sm font-semibold">Sprint
    <Select value={sprintId} onChange={e=>{setSprintId(e.target.value);setStatus("TODO")}}
     className="mt-1 min-h-11">
     <option value="">Leave blank for the backlog</option>
     {available.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}
    </Select></label>
   <label className="text-sm font-semibold sm:col-span-2">Description
    <Textarea maxLength={4000} value={description} onChange={e=>setDescription(e.target.value)}
      className="mt-1"/></label>
   <label className="text-sm font-semibold sm:col-span-2">Approach (optional)
    <Textarea maxLength={4000} value={approach} onChange={e=>setApproach(e.target.value)}
      className="mt-1"/></label>
   <label className="text-sm font-semibold sm:col-span-2">Done when
    <Textarea maxLength={4000} value={acceptance} onChange={e=>setAcceptance(e.target.value)}
      className="mt-1"/></label>
   <label className="text-sm font-semibold">Priority
    <Select value={priority} onChange={e=>setPriority(e.target.value)}
     className="mt-1 min-h-11">
     {["LOW","MEDIUM","HIGH","CRITICAL"].map(x=><option key={x} value={x}>{x}</option>)}
    </Select></label>
   <label className="text-sm font-semibold">Status
    <Select value={status} disabled={!sprintId}
      onChange={e=>setStatus(e.target.value as typeof status)}
      className="mt-1 min-h-11">
      <option value="TODO">To Do</option>
      {sprintId?<><option value="IN_PROGRESS">In Progress</option>
        <option value="BLOCKED">Blocked</option></>:null}
    </Select>
   </label>
   <label className="text-sm font-semibold">Type
    <Select value={type} onChange={e=>setType(e.target.value)}
     className="mt-1 min-h-11">
     <option value="">Not set</option>{["STORY","BUG","CHORE","SPIKE"].map(x=><option key={x} value={x}>{x}</option>)}
    </Select></label>
   <label className="text-sm font-semibold">Estimate points
    <Input type="number" min={0} max={1000} value={estimate} onChange={e=>setEstimate(e.target.value)}
     className="mt-1 min-h-11"/></label>
   <label className="text-sm font-semibold">Due date
    <Input type="date" value={due} onChange={e=>setDue(e.target.value)}
     className="mt-1 min-h-11"/></label>
   <label className="text-sm font-semibold sm:col-span-2">What&apos;s blocking this task?
    <Textarea maxLength={4000} value={blockerReason} onChange={e=>setBlockerReason(e.target.value)}
      className="mt-1"/></label>
   {status==="BLOCKED"&&!blockerReason.trim()?
     <p role="alert" className="text-sm text-error sm:col-span-2">
       Explain what&apos;s blocking this task before saving.</p>:null}
   {error?<p role="alert" className="text-sm text-error sm:col-span-2">{error}</p>:null}
   <div className="flex flex-wrap gap-2 sm:col-span-2">
    <Button type="submit" disabled={busy||!title.trim()||
      (status==="BLOCKED"&&!blockerReason.trim())||
      (estimate!==""&&(!Number.isInteger(Number(estimate))||Number(estimate)<0||Number(estimate)>1000))}
     className="min-h-11">
     {busy?"Saving…":"Add task"}</Button>
    <Button type="button" disabled={busy} onClick={()=>setOpen(false)}
     variant="secondary" className="min-h-11">Cancel</Button>
   </div>
  </form>:null}
 </section>;
}
export function LearnerDeleteOwnTask({projectId,taskId}:{projectId:string;taskId:string}){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function remove(){
  if(!window.confirm("Delete your task? This cannot be undone."))return;
  setBusy(true);setError("");
  try{
   await projectMutation("/api/projects/"+encodeURIComponent(projectId)+"/tasks/"+
    encodeURIComponent(taskId)+"/learner-own","DELETE");router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Task cannot be deleted.");}
  finally{setBusy(false);}
 }
 return <div><Button type="button" disabled={busy} onClick={()=>void remove()}
  variant="ghost" className="mt-2 min-h-11 text-xs !text-[var(--lms-error)] underline">
  {busy?"Deleting…":"Delete my task"}</Button>
  {error?<p role="alert" className="text-xs text-error">{error}</p>:null}
 </div>;
}
