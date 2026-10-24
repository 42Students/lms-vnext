"use client";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { BoardColumn } from "@/components/ui/board-column";
import styles from "./legacy-project-board.module.css";
import {useMemo,useState} from "react";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import {DataTable} from "@/components/ui/data-table";
import {useConfirmFlow} from "@/components/ui/use-confirm-flow";
import {useRouter,useSearchParams} from "next/navigation";
import {projectMutation} from "./project-api";
import {Button} from "@/components/ui/button";
import {planMentorNextSprintAssignments} from "@/modules/projects/mentor-next-sprint-assignment-model";
type Task={id:string;title:string;sprintId:string|null;carriedFromSprintId?:string|null;assigneeMembershipId:string|null;
 updatedAt:Date;status:string;priority:string;estimatePoints:number|null;
 sequence?:number;deletedAt?:Date|null};
type Member={membershipId:string;displayName:string|null;role:string};
type Sprint={id:string;title:string;releaseId:string;
 sequence?:number;status?:string;updatedAt?:Date};
type Release={id:string;title:string;status?:string};
export function MentorTaskAllocation({projectId,initialTasks,members,sprints,releases,readOnly=false}:{
 projectId:string;initialTasks:Task[];members:Member[];sprints:Sprint[];releases:Release[];readOnly?:boolean;
}){
 const {askConfirm,dialog}=useConfirmFlow();
 const router=useRouter(),searchParams=useSearchParams();
 const [tasks,setTasks]=useState(initialTasks),
   [release,setRelease]=useState(searchParams.get("release")??""),
   [sprint,setSprint]=useState(searchParams.get("sprint")??"");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [dragging,setDragging]=useState(false);
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
 const activeSprint=sprints.find(row=>row.status==="ACTIVE");
 const nextSprint=[...sprints].filter(row=>row.status==="PLANNED"&&
   typeof row.sequence==="number"&&
   (!activeSprint||row.sequence>(activeSprint.sequence??-1)))
   .sort((a,b)=>(a.sequence??0)-(b.sequence??0)||a.id.localeCompare(b.id))[0];
 const nextSprintRelease=nextSprint?
   releases.find(row=>row.id===nextSprint.releaseId):null;
 const nextSprintEligible=Boolean(nextSprint&&nextSprint.updatedAt&&
   nextSprintRelease&&nextSprintRelease.status!=="SHIPPED");
 const nextSprintPlan=nextSprintEligible&&nextSprint?planMentorNextSprintAssignments(
   tasks.map(task=>({...task,sequence:task.sequence??0})),
   learners.map(row=>row.membershipId),nextSprint.id):null;
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
    className="text-sm font-semibold text-link underline focus-visible:underline">Back to project</Link>
    <PageHeader title="Task Allocation" />
    <p className="mt-1 text-sm text-body leading-[22px]">{unassigned} needs assigning · {filtered.length} matching tasks</p>
    <p className="mt-1 text-xs text-muted-foreground leading-[20px]">Auto-assign acts on eligible tasks across the project, not only filtered cards.</p>
    {previousAssignees.length>0?<p role="status" className="mt-1 text-xs text-warning-text leading-[20px]">
      {previousAssignees.length} former assignee(s) have tasks that need review.
    </p>:null}
   </div>
  </div>
  {!readOnly?<Button type="button" disabled={busy||projectUnassigned===0||!learners.length}
     
     onClick={async()=>{
       if(!await askConfirm("Auto-assign unassigned tasks to learners with the fewest open tasks?"))return;
       setBusy(true);setError("");setNotice("");
       try{
        const result=await projectMutation("/api/projects/"+encodeURIComponent(projectId)+
          "/tasks/auto-assign","POST") as {assigned:number};
        setNotice(result.assigned+" task(s) auto-assigned.");router.refresh();
       }catch(err){setError(err instanceof Error?err.message:"Unable to auto-assign tasks");}
       finally{setBusy(false);}
     }}>Auto-assign {projectUnassigned} eligible project task(s)</Button>:null}
  {nextSprint&&nextSprintPlan?<section
    aria-label="Next sprint allocation preview" className="space-y-2 border-y border-border py-3">
    <h3 className="font-semibold">Next sprint · Sprint {nextSprint.sequence}</h3>
    <p className="text-sm">
      {nextSprintPlan.assignments.length} unassigned eligible
      {" "}{nextSprintPlan.assignments.length===1?"task":"tasks"} ·
      {" "}{nextSprintPlan.assignments.reduce((sum,row)=>sum+row.estimatedPoints,0)}
      {" "}estimated points to distribute.
      Suggested owners have the fewest current open estimated project points.
      Ties use task count and stable learner ID. This is a preview, not a write.
    </p>
    <div className="flex flex-wrap gap-2" aria-label="Next sprint proposed student point loads">
      {nextSprintPlan.loads.slice(0,12).map(row=><span key={row.membershipId}
        className="rounded border border-border px-2 py-1 text-xs">
        {learners.find(member=>member.membershipId===row.membershipId)?.displayName??"Student"}:
        {" "}{row.beforePoints} → {row.afterPoints} open pts
      </span>)}
    </div>
    {!readOnly?<Button type="button" size="sm" disabled={busy||
       !nextSprintPlan.assignments.length}
      onClick={async()=>{
        if(!nextSprint.updatedAt||!await askConfirm(
          "Allocate only the "+nextSprintPlan.assignments.length+
          " eligible unassigned tasks in Sprint "+nextSprint.sequence+
          "? Other sprints and the backlog will not be changed."
        ))return;
        setBusy(true);setError("");setNotice("");
        try{
          const response=await projectMutation(
            "/api/projects/"+encodeURIComponent(projectId)+
              "/tasks/auto-assign-next","POST",{
              sprintId:nextSprint.id,
              expectedSprintUpdatedAt:new Date(nextSprint.updatedAt).toISOString(),
          }) as {assigned:number;unassignedRemaining:number};
          setNotice(response.assigned+" Sprint "+nextSprint.sequence+
            " tasks assigned. Recorded learner notifications accompany each assignment.");
          router.refresh();
        }catch(caught){setError(caught instanceof Error?caught.message:
          "Next sprint allocation could not be saved.");}
        finally{setBusy(false);}
      }}>Auto-assign next sprint ({nextSprintPlan.assignments.length})</Button>:null}
   </section>:null}
  <Button variant="secondary" type="button" aria-expanded={filtersOpen}
    aria-controls={filtersOpen?"mentor-allocation-filters":undefined}
    onClick={()=>setFiltersOpen(open=>!open)}
    >
    Filters{activeFilterCount?" ("+activeFilterCount+")":""}
  </Button>
  {filtersOpen?<div id="mentor-allocation-filters"
    className="flex flex-wrap gap-[var(--lms-space-3)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-4)]">
   <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Release
    <Select value={release} onChange={e=>{setRelease(e.target.value);setSprint("");
      remember("release",e.target.value);remember("sprint","");}}
      className="ml-2 min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface p-2">
     <option value="">All releases</option>
     {releases.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}
    </Select>
   </label>
   <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Sprint
    <Select value={sprint} onChange={e=>{setSprint(e.target.value);remember("sprint",e.target.value);}}
      className="ml-2 min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface p-2">
     <option value="">All sprints</option>
     {sprints.filter(item=>!release||item.releaseId===release).map(item=>
      <option key={item.id} value={item.id}>{item.title}</option>)}
    </Select>
   </label>
   <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Priority
    <Select value={priority} onChange={e=>{setPriority(e.target.value);remember("priority",e.target.value);}}
      className="ml-2 min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface p-2">
     <option value="">All priorities</option>
     {["LOW","MEDIUM","HIGH","CRITICAL"].map(value=><option key={value} value={value}>{value}</option>)}
    </Select>
   </label>
   <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Status
    <Select value={status} onChange={e=>{setStatus(e.target.value);remember("status",e.target.value);}}
      className="ml-2 min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface p-2">
     <option value="">All statuses</option>
     {["TODO","IN_PROGRESS","IN_REVIEW","BLOCKED","DONE"].map(value=>
      <option key={value} value={value}>{value.replaceAll("_"," ")}</option>)}
    </Select>
   </label>
   <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Assignment
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
   <Button variant="link" type="button" onClick={()=>{
    setRelease("");setSprint("");setPriority("");setStatus("");setAssignmentScope("");
    ["release","sprint","priority","status","assignment"].forEach(key=>remember(key,""));
   }} className="min-h-11">Clear all</Button>
  </div>:null}
  {activeFilterCount>0?<p role="status" className="text-xs text-body leading-[20px]">
    {activeFilterCount} active {activeFilterCount===1?"filter":"filters"} ·
    {" "}{filtered.length} matching {filtered.length===1?"task":"tasks"}
  </p>:null}
  {error?<Alert tone="error">{error}</Alert>:null}
  {notice?<Alert tone="success">{notice}</Alert>:null}
  <section className="rounded-xl border border-border p-3" aria-labelledby="mentor-allocation-workload">
    <h2 id="mentor-allocation-workload" className="mb-2 font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Workload by learner</h2>
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
      empty={<EmptyState title="No learners to summarize" description="No learners to summarize yet." />}
    />
  </section>
  {filtered.length===0?<p role="status" className="rounded-[var(--lms-control-radius)] border border-border p-4 text-sm text-body leading-[22px]">
    {tasks.length===0?"No tasks to allocate yet.":"No tasks match these filters. Use Clear all to see every task."}
  </p>:null}
  <p className="sr-only" id="mentor-allocation-keyboard-help">
    To assign a task without dragging, use the Assign to selector on its card.
  </p>
  <div role="region" aria-label="Task allocation cards; scroll sideways for more learners" tabIndex={0} data-dragging={dragging}
    className={styles["scrollRegion"]}><div className={styles["track"]}>
   {groups.map(group=>{
    const cards=filtered.filter(task=>task.assigneeMembershipId===group.membershipId);
    return <BoardColumn key={group.membershipId??"unassigned"} label={group.displayName??"Learner"}
       className={[styles["lane"],group.membershipId===null?styles["backlogLane"]:"",groups.length===1?styles["singleLane"]:""].filter(Boolean).join(" ")}
       data-can-drop={!readOnly&&!busy}
      onDragOver={e=>e.preventDefault()} onDrop={e=>drop(e,group.membershipId)}>
     <h2 className={styles["header"]}>
      <span>{group.displayName??"Learner"}</span><span>{cards.length}</span></h2>
     <p className="mt-1 text-xs text-muted-foreground leading-[20px]">
      {cards.filter(task=>task.status==="DONE").length} done ·
      {" "}{cards.filter(task=>task.status==="BLOCKED").length} blocked ·
      {" "}{cards.reduce((sum,task)=>sum+(task.estimatePoints??0),0)} pts
     </p>
     <ul className={styles["body"]}>{cards.map(task=><li key={task.id}
       draggable={!readOnly&&!busy&&!["DONE","IN_REVIEW"].includes(task.status)}
       aria-describedby={!readOnly?"mentor-allocation-keyboard-help":undefined}
       onDragStart={event=>{event.dataTransfer.setData("text/plain",task.id);setDragging(true);}}
        onDragEnd={()=>setDragging(false)}
       className={"border p-3 text-sm "+styles["card"]}>
       <p className="break-words font-semibold">{task.title}</p>
       <p className="mt-1 text-xs text-body leading-[20px]">{task.priority} · {task.status}</p>
       <p className="mt-1 text-xs text-body leading-[20px]">
         {task.estimatePoints===null?"Unsized":task.estimatePoints+" points"}
       </p>
       {task.sprintId===null?<p className="mt-1 text-xs font-semibold text-warning-text leading-[20px]">Product backlog{task.carriedFromSprintId?" · Carried over":""}</p>:
         <p className="mt-1 text-xs text-body leading-[20px]">Sprint: {
           sprints.find(item=>item.id===task.sprintId)?.title??"Unknown sprint"
         }</p>}
       {group.membershipId===null&&task.status!=="DONE"&&task.status!=="IN_REVIEW"?
         <p className="mt-1 text-xs font-semibold text-warning-text leading-[20px]">Needs assigning</p>:null}
       {group.membershipId!==null&&!activeMemberIds.has(group.membershipId)?
         <p className="mt-1 text-xs font-semibold text-warning-text leading-[20px]">
           Reassign from former member
         </p>:null}
       {!readOnly?<label className="mt-2 block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Assign to
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
      {!cards.length?<li><EmptyState title="No tasks" description="No tasks in this lane." /></li>:null}
     </ul>
    </BoardColumn>;
   })}
  </div></div>
 </section>;
}
