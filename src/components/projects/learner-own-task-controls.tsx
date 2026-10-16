"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {projectMutation} from "./project-api";
type Sprint={id:string;title:string;status:string;updatedAt:Date};
export function LearnerAddOwnTask({projectId,sprints}:{projectId:string;sprints:Sprint[]}){
 const router=useRouter();
 const available=sprints.filter(row=>row.status==="ACTIVE");
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [sprintId,setSprintId]=useState(available[0]?.id??"");
 const [title,setTitle]=useState(""),[description,setDescription]=useState(""),[acceptance,setAcceptance]=useState("");
 const [priority,setPriority]=useState("MEDIUM"),[estimate,setEstimate]=useState(""),[due,setDue]=useState("");
 const [type,setType]=useState("");
 async function save(e:FormEvent){
  e.preventDefault();const sprint=available.find(row=>row.id===sprintId);
  if(!sprint||!title.trim()||busy)return;
  setBusy(true);setError("");
  try{
   await projectMutation("/api/projects/"+encodeURIComponent(projectId)+"/tasks","POST",{
    sprintId,title:title.trim(),description:description.trim()||null,
    acceptanceCriteria:acceptance.trim()||null,priority,
    dueDate:due||null,estimatePoints:estimate?Number(estimate):null,
    taskType:type||null,expectedSprintUpdatedAt:new Date(sprint.updatedAt).toISOString(),
   });
   setOpen(false);setTitle("");setDescription("");setAcceptance("");router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Could not create task");}
  finally{setBusy(false);}
 }
 return <section className="space-y-3">
  <button type="button" disabled={!available.length} onClick={()=>setOpen(x=>!x)}
   className="min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">
   Add my task
  </button>
  {!available.length?<p className="text-sm text-muted-foreground">Start a sprint before adding your own tasks.</p>:null}
  {open?<form onSubmit={e=>void save(e)}
   className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2">
   <label className="text-sm font-semibold">Task title
    <input required maxLength={200} value={title} onChange={e=>setTitle(e.target.value)}
     className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3"/></label>
   <label className="text-sm font-semibold">Sprint
    <select required value={sprintId} onChange={e=>setSprintId(e.target.value)}
     className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3">
     {available.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}
    </select></label>
   <label className="text-sm font-semibold sm:col-span-2">Description
    <textarea maxLength={4000} value={description} onChange={e=>setDescription(e.target.value)}
      className="mt-1 min-h-20 w-full rounded-md border border-border bg-background p-2"/></label>
   <label className="text-sm font-semibold sm:col-span-2">Done when
    <textarea maxLength={4000} value={acceptance} onChange={e=>setAcceptance(e.target.value)}
      className="mt-1 min-h-20 w-full rounded-md border border-border bg-background p-2"/></label>
   <label className="text-sm font-semibold">Priority
    <select value={priority} onChange={e=>setPriority(e.target.value)}
     className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3">
     {["LOW","MEDIUM","HIGH","CRITICAL"].map(x=><option key={x} value={x}>{x}</option>)}
    </select></label>
   <label className="text-sm font-semibold">Type
    <select value={type} onChange={e=>setType(e.target.value)}
     className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3">
     <option value="">Not set</option>{["STORY","BUG","CHORE","SPIKE"].map(x=><option key={x} value={x}>{x}</option>)}
    </select></label>
   <label className="text-sm font-semibold">Estimate points
    <input type="number" min={0} max={1000} value={estimate} onChange={e=>setEstimate(e.target.value)}
     className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3"/></label>
   <label className="text-sm font-semibold">Due date
    <input type="date" value={due} onChange={e=>setDue(e.target.value)}
     className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3"/></label>
   {error?<p role="alert" className="text-sm text-error sm:col-span-2">{error}</p>:null}
   <div className="flex flex-wrap gap-2 sm:col-span-2">
    <button type="submit" disabled={busy||!title.trim()}
     className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
     {busy?"Saving…":"Add task"}</button>
    <button type="button" disabled={busy} onClick={()=>setOpen(false)}
     className="rounded-md border border-border px-4 py-2 text-sm">Cancel</button>
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
 return <div><button type="button" disabled={busy} onClick={()=>void remove()}
  className="mt-2 min-h-10 text-xs font-semibold text-error underline">
  {busy?"Deleting…":"Delete my task"}</button>
  {error?<p role="alert" className="text-xs text-error">{error}</p>:null}
 </div>;
}
