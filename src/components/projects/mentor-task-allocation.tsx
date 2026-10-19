"use client";
import {useEffect,useMemo,useState} from "react";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import {DataTable} from "@/components/ui/data-table";
import {useConfirmFlow} from "@/components/ui/use-confirm-flow";
import {useRouter,useSearchParams} from "next/navigation";
import {projectMutation} from "./project-api";
type Task={id:string;title:string;sprintId:string|null;carriedFromSprintId?:string|null;assigneeMembershipId:string|null;
 updatedAt:Date;status:string;priority:string;estimatePoints:number|null};
type Member={membershipId:string;displayName:string|null;role:string};
type Sprint={id:string;title:string;releaseId:string};
type Release={id:string;title:string};
export function MentorTaskAllocation({projectId,initialTasks,members,sprints,releases,readOnly=false}:{
 projectId:string;initialTasks:Task[];members:Member[];sprints:Sprint[];releases:Release[];readOnly?:boolean;
}){
 const {askConfirm,dialog}=useConfirmFlow();
 const router=useRouter(),searchParams=useSearchParams();
 const [tasks,setTasks]=useState(initialTasks),
   [release,setRelease]=useState(searchParams.get("release")??""),
   [sprint,setSprint]=useState(searchParams.get("sprint")??"");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [filtersOpen,setFiltersOpen]=useState(false);
 const [assignmentScope,setAssignmentScope]=useState(searchParams.get("assignment")??"");
 const [priority,setPriority]=useState(searchParams.get("priority")??"");
 const [status,setStatus]=useState(searchParams.get("status")??"");
 const [prevInitialTasks,setPrevInitialTasks]=useState(initialTasks);
 if(prevInitialTasks!==initialTasks){setPrevInitialTasks(initialTasks);setTasks(initialTasks);}
 function remember(name:string,value:string){
  const query=new URLSearchParams(window.location.search);
  if(value)query.set(name,value);else query.delete(name);
  query.delete("page");
  window.history.replaceState(null,"",window.location.pathname+
    (query.toString()?"?"+query.toString():""));
 }
 const learners=members.filter(member=>member.role==="LEARNER");
 const filtered=useMemo(()=>tasks.filter(task=>{
  const linked=sprints.find(item=>item.id===task.sprintId);
  return (!sprint||task.sprintId===sprint)&&(!release||linked?.releaseId===release)&&
   (!priority||task.priority===priority)&&(!status||task.status===status)&&
   (!assignmentScope||(assignmentScope==="UNASSIGNED"?task.assigneeMembershipId===null:
     assignmentScope==="ASSIGNED"?task.assigneeMembershipId!==null:
     task.assigneeMembershipId===assignmentScope));
 }),[tasks,release,sprint,sprints,priority,status,assignmentScope]);
 const activeMemberIds=new Set(learners.map(row=>row.membershipId));
 const previousAssignees=[...new Set(tasks.map(row=>row.assigneeMembershipId)
   .filter((id):id is string=>typeof id==="string"&&id!==""&&!activeMemberIds.has(id)))];
 const groups=[{membershipId:null,displayName:"Unassigned"},...learners,
   ...previousAssignees.map(id=>({membershipId:id,displayName:"Former member"}))];
 const unassigned=filtered.filter(t=>t.assigneeMembershipId===null).length;
 const projectUnassigned=tasks.filter(t=>t.assigneeMembershipId===null &&
   !["DONE","IN_REVIEW"].includes(t.status)).length;
 const activeFilterCount=[release,sprint,priority,status,assignmentScope].filter(Boolean).length;
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
  {dialog}
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div><Link href={"/mentor/projects/"+encodeURIComponent(projectId)}
    className="text-sm font-semibold text-link underline">Back to project</Link>
    <h1 className="mt-2 text-[30px] font-semibold leading-[1.35] tracking-[-0.02em] text-[var(--lms-heading)]">Task Allocation</h1>
    <p className="mt-1 text-sm text-body">{unassigned} needs assigning · {filtered.length} matching tasks</p>
    <p className="mt-1 text-xs text-muted-foreground">Auto-assign acts on eligible tasks across the project, not only filtered cards.</p>
    {previousAssignees.length>0?<p role="status" className="mt-1 text-xs text-warning-text">
      {previousAssignees.length} former assignee(s) have tasks that need review.
    </p>:null}
   </div>
  </div>
  {!readOnly?<button type="button" disabled={busy||projectUnassigned===0||!learners.length}
     className="min-h-11 rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
     onClick={async()=>{
       if(!await askConfirm("Auto-assign unassigned tasks to learners with the fewest open tasks?"))return;
       setBusy(true);setError("");setNotice("");
       try{
        const result=await projectMutation("/api/projects/"+encodeURIComponent(projectId)+
          "/tasks/auto-assign","POST") as {assigned:number};
        setNotice(result.assigned+" task(s) auto-assigned.");router.refresh();
       }catch(err){setError(err instanceof Error?err.message:"Unable to auto-assign tasks");}
       finally{setBusy(false);}
     }}>Auto-assign {projectUnassigned} eligible project task(s)</button>:null}
  <button type="button" aria-expanded={filtersOpen}
    aria-controls={filtersOpen?"mentor-allocation-filters":undefined}
    onClick={()=>setFiltersOpen(open=>!open)}
    className="min-h-11 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3 py-2 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:min-h-9">
    Filters{activeFilterCount?" ("+activeFilterCount+")":""}
  </button>
  {filtersOpen?<div id="mentor-allocation-filters"
    className="flex flex-wrap gap-[var(--lms-space-3)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-4)]">
   <label className="text-sm font-semibold">Release
    <Select value={release} onChange={e=>{setRelease(e.target.value);setSprint("");
      remember("release",e.target.value);remember("sprint","");}}
      className="ml-2 min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface p-2">
     <option value="">All releases</option>
     {releases.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}
    </Select>
   </label>
   <label className="text-sm font-semibold">Sprint
    <Select value={sprint} onChange={e=>{setSprint(e.target.value);remember("sprint",e.target.value);}}
      className="ml-2 min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface p-2">
     <option value="">All sprints</option>
     {sprints.filter(item=>!release||item.releaseId===release).map(item=>
      <option key={item.id} value={item.id}>{item.title}</option>)}
    </Select>
   </label>
   <label className="text-sm font-semibold">Priority
    <Select value={priority} onChange={e=>{setPriority(e.target.value);remember("priority",e.target.value);}}
      className="ml-2 min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface p-2">
     <option value="">All priorities</option>
     {["LOW","MEDIUM","HIGH","CRITICAL"].map(value=><option key={value} value={value}>{value}</option>)}
    </Select>
   </label>
   <label className="text-sm font-semibold">Status
    <Select value={status} onChange={e=>{setStatus(e.target.value);remember("status",e.target.value);}}
      className="ml-2 min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface p-2">
     <option value="">All statuses</option>
     {["TODO","IN_PROGRESS","IN_REVIEW","BLOCKED","DONE"].map(value=>
      <option key={value} value={value}>{value.replaceAll("_"," ")}</option>)}
    </Select>
   </label>
   <label className="text-sm font-semibold">Assignment
    <Select value={assignmentScope}
      onChange={e=>{setAssignmentScope(e.target.value);remember("assignment",e.target.value);}}
      className="ml-2 min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface p-2">
     <option value="">Everyone</option>
     <option value="UNASSIGNED">Unassigned</option>
     <option value="ASSIGNED">Assigned</option>
     {learners.map(member=><option value={member.membershipId} key={member.membershipId}>
      {member.displayName??"Learner"}</option>)}
    </Select>
   </label>
   <button type="button" onClick={()=>{
    setRelease("");setSprint("");setPriority("");setStatus("");setAssignmentScope("");
    ["release","sprint","priority","status","assignment"].forEach(key=>remember(key,""));
   }} className="min-h-11 text-sm font-semibold text-link underline">Clear all</button>
  </div>:null}
  {activeFilterCount>0?<p role="status" className="text-xs text-body">
    {activeFilterCount} active {activeFilterCount===1?"filter":"filters"} ·
    {" "}{filtered.length} matching {filtered.length===1?"task":"tasks"}
  </p>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {notice?<p role="status" className="text-sm text-success">{notice}</p>:null}
  <section className="rounded-xl border border-border p-3" aria-labelledby="mentor-allocation-workload">
    <h2 id="mentor-allocation-workload" className="mb-2 text-sm font-semibold">Workload by learner</h2>
    <DataTable
      caption="Workload by learner"
      rows={groups.map(group=>{
        const assigned=filtered.filter(task=>task.assigneeMembershipId===group.membershipId);
        return {
          id:group.membershipId??"unassigned",
          learner:group.displayName??"Learner",
          tasks:assigned.length,
          done:assigned.filter(task=>task.status==="DONE").length,
          blocked:assigned.filter(task=>task.status==="BLOCKED").length,
          points:assigned.reduce((sum,task)=>sum+(task.estimatePoints??0),0),
          unsized:assigned.filter(task=>task.estimatePoints===null).length,
        };
      })}
      getRowKey={row=>row.id}
      columns={[
        {key:"learner",header:"Learner",cell:row=>row.learner,mobilePriority:"primary"},
        {key:"tasks",header:"Tasks",cell:row=>row.tasks,mobilePriority:"secondary"},
        {key:"done",header:"Done",cell:row=>row.done,mobilePriority:"secondary"},
        {key:"blocked",header:"Blocked",cell:row=>row.blocked,mobilePriority:"secondary"},
        {key:"points",header:"Points",cell:row=>row.points,mobilePriority:"secondary"},
        {key:"unsized",header:"Unsized",cell:row=>row.unsized,mobilePriority:"secondary"},
      ]}
      empty={<p>No learners to summarize yet.</p>}
    />
  </section>
  {filtered.length===0?<p role="status" className="rounded-[var(--lms-control-radius)] border border-border p-4 text-sm text-body">
    {tasks.length===0?"No tasks to allocate yet.":"No tasks match these filters. Use Clear all to see every task."}
  </p>:null}
  <div role="region" aria-label="Task allocation cards; scroll sideways for more learners" tabIndex={0}
    className="overflow-x-auto overscroll-x-contain pb-3 [mask-image:linear-gradient(to_right,black_0%,black_94%,transparent_100%)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><div className="flex min-w-max gap-3">
   {groups.map(group=>{
    const cards=filtered.filter(task=>task.assigneeMembershipId===group.membershipId);
    return <section key={group.membershipId??"unassigned"} aria-label={group.displayName??"Learner"}
      className="w-72 shrink-0 rounded-xl border border-border bg-surface-subtle p-3"
      onDragOver={e=>e.preventDefault()} onDrop={e=>drop(e,group.membershipId)}>
     <h2 className="flex justify-between text-sm font-semibold">
      <span>{group.displayName??"Learner"}</span><span>{cards.length}</span></h2>
     <p className="mt-1 text-xs text-muted-foreground">
      {cards.filter(task=>task.status==="DONE").length} done ·
      {" "}{cards.filter(task=>task.status==="BLOCKED").length} blocked ·
      {" "}{cards.reduce((sum,task)=>sum+(task.estimatePoints??0),0)} pts
     </p>
     <ul className="mt-3 space-y-3">{cards.map(task=><li key={task.id}
       draggable={!readOnly&&!busy&&!["DONE","IN_REVIEW"].includes(task.status)}
       onDragStart={event=>event.dataTransfer.setData("text/plain",task.id)}
       className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-3 text-sm">
       <p className="break-words font-semibold">{task.title}</p>
       <p className="mt-1 text-xs text-body">{task.priority} · {task.status}</p>
       <p className="mt-1 text-xs text-body">
         {task.estimatePoints===null?"Unsized":task.estimatePoints+" points"}
       </p>
       {task.sprintId===null?<p className="mt-1 text-xs font-semibold text-warning-text">Product backlog{task.carriedFromSprintId?" · Carried over":""}</p>:
         <p className="mt-1 text-xs text-body">Sprint: {
           sprints.find(item=>item.id===task.sprintId)?.title??"Unknown sprint"
         }</p>}
       {group.membershipId===null&&task.status!=="DONE"&&task.status!=="IN_REVIEW"?
         <p className="mt-1 text-xs font-semibold text-warning-text">Needs assigning</p>:null}
       {group.membershipId!==null&&!activeMemberIds.has(group.membershipId)?
         <p className="mt-1 text-xs font-semibold text-warning-text">
           Reassign from former member
         </p>:null}
       {!readOnly?<label className="mt-2 block text-xs font-semibold">Assign to
        <Select aria-label={"Reassign "+task.title} disabled={busy||["DONE","IN_REVIEW"].includes(task.status)}
         value={task.assigneeMembershipId??""}
         onChange={event=>void assign(task.id,event.target.value||null)}
         className="mt-1 min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-2 text-sm">
         <option value="">Unassigned</option>
         {task.assigneeMembershipId&&!activeMemberIds.has(task.assigneeMembershipId)?
           <option value={task.assigneeMembershipId} disabled>Former member (reassign)</option>:null}
         {learners.map(member=>
          <option key={member.membershipId} value={member.membershipId}>{member.displayName??"Learner"}</option>)}
        </Select></label>:null}
      </li>)}
      {!cards.length?<li className="py-5 text-center text-xs text-muted-foreground">No tasks</li>:null}
     </ul>
    </section>;
   })}
  </div></div>
 </section>;
}
