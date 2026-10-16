"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
type Sprint={id:string;title:string;status:string;updatedAt:string};
export function LearnerOwnTaskForm({projectId,sprints}:{projectId:string;sprints:readonly Sprint[]}){
 const active=sprints.filter(row=>row.status==="ACTIVE");
 const router=useRouter();
 const [open,setOpen]=useState(false);
 const [sprintId,setSprintId]=useState(active[0]?.id??"");
 const [title,setTitle]=useState("");
 const [description,setDescription]=useState("");
 const [acceptanceCriteria,setAcceptanceCriteria]=useState("");
 const [priority,setPriority]=useState<"LOW"|"MEDIUM"|"HIGH"|"CRITICAL">("MEDIUM");
 const [taskType,setTaskType]=useState<""|"STORY"|"BUG"|"CHORE"|"SPIKE">("");
 const [dueDate,setDueDate]=useState("");
 const [estimatePoints,setEstimatePoints]=useState("");
 const [pending,setPending]=useState(false);
 const [error,setError]=useState("");
 async function create(event:React.FormEvent){
  event.preventDefault();
  const sprint=active.find(row=>row.id===sprintId);
  if(!sprint||!title.trim()||pending)return;
  setPending(true);setError("");
  try{
   const response=await fetch("/api/projects/"+encodeURIComponent(projectId)+"/tasks",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({sprintId,title:title.trim(),description:description.trim()||null,
     acceptanceCriteria:acceptanceCriteria.trim()||null,priority,
     taskType:taskType||null,dueDate:dueDate||null,
     estimatePoints:estimatePoints?Number(estimatePoints):null,
     expectedSprintUpdatedAt:sprint.updatedAt}),
   });
   if(!response.ok)throw new Error(response.status===409?
    "This sprint changed. Reload and try again.":"Could not add your task. Check the fields and try again.");
   setTitle("");setDescription("");setAcceptanceCriteria("");setDueDate("");setEstimatePoints("");
   setOpen(false);router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Could not add your task.");}
  finally{setPending(false);}
 }
 if(!active.length)return <p role="status" className="mt-3 text-sm text-muted-foreground">
  Start an active sprint before adding your own task.
 </p>;
 return <section aria-label="Add my project task" className="rounded-xl border border-border bg-surface p-4">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <h2 className="font-semibold text-foreground">My tasks</h2>
   <button type="button" onClick={()=>setOpen(v=>!v)}
    aria-expanded={open} aria-controls="learner-own-task-form"
    className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">
    {open?"Close form":"Add my task"}
   </button>
  </div>
  {open?<form id="learner-own-task-form" onSubmit={event=>void create(event)}
    className="mt-4 grid gap-3 sm:grid-cols-2">
    <label className="text-sm font-semibold">Active sprint
     <select required value={sprintId} onChange={e=>setSprintId(e.target.value)}
      className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3">
      {active.map(row=><option key={row.id} value={row.id}>{row.title}</option>)}
     </select>
    </label>
    <label className="text-sm font-semibold">Task title
     <input required maxLength={200} value={title} onChange={e=>setTitle(e.target.value)}
      className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3"/>
    </label>
    <label className="text-sm font-semibold sm:col-span-2">Description
     <textarea maxLength={4000} value={description} onChange={e=>setDescription(e.target.value)}
      className="mt-1 min-h-24 w-full rounded-md border border-border bg-surface p-3"/>
    </label>
    <label className="text-sm font-semibold sm:col-span-2">Done when
     <textarea maxLength={4000} value={acceptanceCriteria} onChange={e=>setAcceptanceCriteria(e.target.value)}
      className="mt-1 min-h-24 w-full rounded-md border border-border bg-surface p-3"/>
    </label>
    <label className="text-sm font-semibold">Priority
     <select value={priority} onChange={e=>setPriority(e.target.value as typeof priority)}
      className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3">
      {(["LOW","MEDIUM","HIGH","CRITICAL"] as const).map(x=><option key={x} value={x}>{x}</option>)}
     </select>
    </label>
    <label className="text-sm font-semibold">Task type
     <select value={taskType} onChange={e=>setTaskType(e.target.value as typeof taskType)}
      className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3">
      <option value="">Not specified</option>
      {(["STORY","BUG","CHORE","SPIKE"] as const).map(x=><option key={x} value={x}>{x}</option>)}
     </select>
    </label>
    <label className="text-sm font-semibold">Due date
     <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}
      className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3"/>
    </label>
    <label className="text-sm font-semibold">Story points
     <input type="number" min={0} max={1000} step={1} value={estimatePoints}
      onChange={e=>setEstimatePoints(e.target.value)}
      className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3"/>
    </label>
    <p className="text-xs text-muted-foreground sm:col-span-2">New tasks are assigned to you. Your mentor reviews work before it is marked complete.</p>
    {error?<p role="alert" className="text-sm text-error sm:col-span-2">{error}</p>:null}
    <button type="submit" disabled={pending||!title.trim()||!sprintId}
     className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
     {pending?"Adding task…":"Add my task"}
    </button>
   </form>:null}
 </section>;
}
