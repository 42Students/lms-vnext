"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {projectMutation} from "./project-api";
type Task={id:string;title:string;status:string;sprintId:string|null;carriedFromSprintId?:string|null;updatedAt:Date;
 priority:string;estimatePoints:number|null;};
type Sprint={id:string;title:string;status:string};
export function MentorProductBacklog({projectId,tasks,sprints,readOnly=false}:{
 projectId:string;tasks:Task[];sprints:Sprint[];readOnly?:boolean;
}){
 const router=useRouter();
 const [adding,setAdding]=useState(false),[title,setTitle]=useState(""),[description,setDescription]=useState(""),[criteria,setCriteria]=useState(""),[priority,setPriority]=useState("MEDIUM"),[points,setPoints]=useState("");
 const [taskType,setTaskType]=useState(""),[dueDate,setDueDate]=useState(""),[blockerReason,setBlockerReason]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const backlog=tasks.filter(task=>task.sprintId===null),completed=tasks.filter(task=>task.status==="DONE");
 const velocity=completed.reduce((sum,task)=>sum+(task.estimatePoints??0),0);
 async function move(task:Task,targetSprintId:string|null){
  if(busy||readOnly||!window.confirm(targetSprintId?
    "Pull task into selected sprint?":"Move task into the product backlog?"))return;
  setBusy(true);setError("");setNotice("");
  try{
   await projectMutation("/api/projects/"+encodeURIComponent(projectId)+"/backlog","PATCH",{
    taskId:task.id,targetSprintId,expectedUpdatedAt:new Date(task.updatedAt).toISOString(),
   });
   setNotice(targetSprintId?"Task pulled into sprint.":"Task returned to backlog.");router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Cannot move task.");}finally{setBusy(false);}
 }
 const targets=sprints.filter(s=>s.status!=="COMPLETED");
 return <section className="space-y-3 rounded-xl border border-border bg-surface p-4">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div><h2 className="text-lg font-semibold">Product backlog</h2>
    <p className="mt-1 text-sm text-body">{backlog.length} backlog tasks</p>
   </div>
   <div className="rounded-lg bg-surface-subtle p-3">
    <p className="text-xs font-semibold text-body">Velocity</p>
    <p className="text-xl font-bold">{velocity} points completed</p>
   </div>
  </div>
  {!readOnly?<section className="space-y-2">
    <button type="button" onClick={()=>setAdding(v=>!v)}
      className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold text-primary-text">
      Add backlog task
    </button>
    {adding?<form onSubmit={async e=>{
      e.preventDefault();setBusy(true);setError("");
      try{
        await projectMutation("/api/projects/"+encodeURIComponent(projectId)+"/backlog","POST",{
          title:title.trim(),description:description.trim()||null,
          acceptanceCriteria:criteria.trim()||null,priority,
          estimatePoints:points?Number(points):null,
          taskType:taskType||null,dueDate:dueDate||null,blockerReason:blockerReason.trim()||null,
        });
        setAdding(false);setTitle("");setDescription("");setCriteria("");
        setPriority("MEDIUM");setPoints("");setTaskType("");setDueDate("");setBlockerReason("");
        router.refresh();
      }catch(err){setError(err instanceof Error?err.message:"Could not add backlog task");}
      finally{setBusy(false);}
    }} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-2">
      <label className="text-sm font-semibold">Title<input required maxLength={200} value={title}
        onChange={e=>setTitle(e.target.value)}
        className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3"/></label>
      <label className="text-sm font-semibold">Priority<select value={priority}
        onChange={e=>setPriority(e.target.value)}
        className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3">
        {["LOW","MEDIUM","HIGH","CRITICAL"].map(v=><option key={v} value={v}>{v}</option>)}
      </select></label>
      <label className="text-sm font-semibold">Description<textarea maxLength={4000}
        value={description} onChange={e=>setDescription(e.target.value)}
        className="mt-1 w-full rounded-md border border-border bg-background p-2"/></label>
      <label className="text-sm font-semibold">Done when<textarea maxLength={4000}
        value={criteria} onChange={e=>setCriteria(e.target.value)}
        className="mt-1 w-full rounded-md border border-border bg-background p-2"/></label>
      <label className="text-sm font-semibold">Estimate points<input type="number" min={0} max={1000}
        value={points} onChange={e=>setPoints(e.target.value)}
        className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3"/></label>
      <div className="flex items-end gap-2"><button type="submit" disabled={busy||!title.trim()}
        className="min-h-10 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground">Add task</button>
      <button type="button" onClick={()=>setAdding(false)}
        className="min-h-10 rounded-md border border-border px-3 text-sm">Cancel</button></div>
    </form>:null}
  </section>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {notice?<p role="status" className="text-sm text-success">{notice}</p>:null}
  <div className="grid gap-3 sm:grid-cols-2">
   {backlog.map(task=><article key={task.id} className="rounded-lg border border-border p-3">
    <p className="font-semibold">{task.title}</p>
    <p className="mt-1 text-xs text-body">{task.priority} · {task.estimatePoints??0} points</p>
    {task.carriedFromSprintId?<span className="mt-1 inline-flex rounded border border-border px-2 py-1 text-xs font-semibold text-warning-text">Carried over</span>:null}
    {!readOnly?<label className="mt-2 block text-sm font-semibold">Pull into sprint
     <select disabled={busy} defaultValue="" onChange={e=>{const id=e.target.value;if(id)void move(task,id);}}
      className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-2">
      <option value="">Choose sprint</option>
      {targets.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}
     </select>
    </label>:null}
   </article>)}
   {!backlog.length?<p className="py-4 text-sm text-muted-foreground">Backlog is empty.</p>:null}
  </div>
  {!readOnly&&targets.length>0?<details><summary className="cursor-pointer text-sm font-semibold text-primary-text">
    Return unfinished tasks to backlog</summary>
    <div className="mt-2 space-y-2">
     {tasks.filter(task=>task.sprintId!==null&&["TODO","IN_PROGRESS","BLOCKED"].includes(task.status))
       .map(task=><button key={task.id} type="button" disabled={busy}
        onClick={()=>void move(task,null)}
        className="block min-h-10 w-full rounded-md border border-border p-2 text-left text-sm">
        {task.title} · Return to backlog
       </button>)}
    </div>
  </details>:null}
 </section>;
}
