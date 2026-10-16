"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {projectMutation} from "./project-api";
type Task={id:string;title:string;sprintId:string|null;carriedFromSprintId?:string|null;assigneeMembershipId:string|null;
 updatedAt:Date;status:string;priority:string};
type Member={membershipId:string;displayName:string|null;role:string};
type Sprint={id:string;title:string;releaseId:string};
type Release={id:string;title:string};
export function MentorTaskAllocation({projectId,initialTasks,members,sprints,releases,readOnly=false}:{
 projectId:string;initialTasks:Task[];members:Member[];sprints:Sprint[];releases:Release[];readOnly?:boolean;
}){
 const router=useRouter();
 const [tasks,setTasks]=useState(initialTasks),[release,setRelease]=useState(""),[sprint,setSprint]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 useEffect(()=>{setTasks(initialTasks)},[initialTasks]);
 const learners=members.filter(member=>member.role==="LEARNER");
 const filtered=useMemo(()=>tasks.filter(task=>{
  const linked=sprints.find(item=>item.id===task.sprintId);
  return (!sprint||task.sprintId===sprint)&&(!release||linked?.releaseId===release);
 }),[tasks,release,sprint,sprints]);
 const groups=[{membershipId:null,displayName:"Unassigned"},...learners];
 const unassigned=filtered.filter(t=>t.assigneeMembershipId===null).length;
 async function assign(id:string,membershipId:string|null){
  const task=tasks.find(row=>row.id===id);
  if(!task||busy||readOnly||["DONE","IN_REVIEW"].includes(task.status)||
   task.assigneeMembershipId===membershipId)return;
  setBusy(true);setError("");setNotice("");
  try{
   const result=await projectMutation("/api/projects/"+encodeURIComponent(projectId)+
    "/tasks/"+encodeURIComponent(id)+"/assignee","PATCH",{
     assigneeMembershipId:membershipId,expectedUpdatedAt:new Date(task.updatedAt).toISOString(),
    }) as {task:Task};
   setTasks(rows=>rows.map(row=>row.id===id?{...row,...result.task}:row));
   setNotice("Task assignment updated.");router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to reassign task.");}
  finally{setBusy(false);}
 }
 function drop(event:React.DragEvent<HTMLElement>,membershipId:string|null){
  event.preventDefault();const id=event.dataTransfer.getData("text/plain");
  if(id)void assign(id,membershipId);
 }
 return <section className="space-y-5">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div><Link href={"/mentor/projects/"+encodeURIComponent(projectId)}
    className="text-sm font-semibold text-primary-text underline">Back to project</Link>
    <h1 className="mt-2 text-xl font-semibold">Task Allocation</h1>
    <p className="mt-1 text-sm text-body">{unassigned} needs assigning · {filtered.length} tasks</p>
   </div>
  </div>
  <div className="flex flex-wrap gap-3 rounded-xl border border-border p-4">
   <label className="text-sm font-semibold">Release
    <select value={release} onChange={e=>{setRelease(e.target.value);setSprint("");}}
      className="ml-2 min-h-10 rounded-md border border-border bg-background p-2">
     <option value="">All releases</option>
     {releases.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}
    </select>
   </label>
   <label className="text-sm font-semibold">Sprint
    <select value={sprint} onChange={e=>setSprint(e.target.value)}
      className="ml-2 min-h-10 rounded-md border border-border bg-background p-2">
     <option value="">All sprints</option>
     {sprints.filter(item=>!release||item.releaseId===release).map(item=>
      <option key={item.id} value={item.id}>{item.title}</option>)}
    </select>
   </label>
  </div>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {notice?<p role="status" className="text-sm text-success">{notice}</p>:null}
  <div className="overflow-x-auto pb-3"><div className="flex min-w-max gap-3">
   {groups.map(group=>{
    const cards=filtered.filter(task=>task.assigneeMembershipId===group.membershipId);
    return <section key={group.membershipId??"unassigned"} aria-label={group.displayName??"Learner"}
      className="w-72 shrink-0 rounded-xl border border-border bg-surface-subtle p-3"
      onDragOver={e=>e.preventDefault()} onDrop={e=>drop(e,group.membershipId)}>
     <h2 className="flex justify-between text-sm font-semibold">
      <span>{group.displayName}</span><span>{cards.length}</span></h2>
     <ul className="mt-3 space-y-3">{cards.map(task=><li key={task.id}
       draggable={!readOnly&&!busy&&!["DONE","IN_REVIEW"].includes(task.status)}
       onDragStart={event=>event.dataTransfer.setData("text/plain",task.id)}
       className="rounded-lg border border-border bg-surface p-3 text-sm">
       <p className="font-semibold">{task.title}</p>
       <p className="mt-1 text-xs text-body">{task.priority} · {task.status}</p>
       {task.sprintId===null?<p className="mt-1 text-xs font-semibold text-warning-text">Product backlog{task.carriedFromSprintId?" · Carried over":""}</p>:null}
       {group.membershipId===null?<p className="mt-1 text-xs font-semibold text-warning-text">Needs assigning</p>:null}
       {!readOnly?<label className="mt-2 block text-xs font-semibold">Assign to
        <select aria-label={"Assign "+task.title} disabled={busy||["DONE","IN_REVIEW"].includes(task.status)}
         value={task.assigneeMembershipId??""}
         onChange={event=>void assign(task.id,event.target.value||null)}
         className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-2 text-sm">
         <option value="">Unassigned</option>{learners.map(member=>
          <option key={member.membershipId} value={member.membershipId}>{member.displayName??"Learner"}</option>)}
        </select></label>:null}
      </li>)}
      {!cards.length?<li className="py-5 text-center text-xs text-muted-foreground">No tasks</li>:null}
     </ul>
    </section>;
   })}
  </div></div>
 </section>;
}
