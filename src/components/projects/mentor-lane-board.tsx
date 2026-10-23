"use client";
import { Badge } from "@/components/ui/badge";
import styles from "./legacy-project-board.module.css";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { NeedsDoingChips } from "@/components/ui/needs-doing-chips";
import { Disclosure } from "@/components/ui/disclosure";
import {useEffect,useState} from "react";
import Link from "next/link";
import {useRouter,useSearchParams} from "next/navigation";
import {groupLearnerBoardLanes} from "@/modules/projects/learner-board-lanes-model";
import {projectMutation} from "./project-api";
import {ProjectTaskAssigneeControl} from "./project-task-assignee-control";
import {ProjectTaskComments} from "./project-task-comments";
import {TaskReviewActions} from "./project-lifecycle-actions";
import {MentorBoardTaskDetailDialog} from "./mentor-board-task-detail-dialog";
import {MentorTaskCreate} from "./mentor-task-create";
import {projectTaskDueState} from "@/modules/projects/project-task-visible-facts-model";
import {safeProjectExternalHref} from "@/modules/projects/mentor-workspace-evidence-model";
import {MentorTaskDeleteControl} from "./mentor-task-delete-control";
import {EmptyState} from "@/components/ui/empty-state";
import {Alert} from "@/components/ui/alert";
import {BoardColumn} from "@/components/ui/board-column";
type Task={id:string;title:string;status:string;priority:string;sprintId:string|null;carriedFromSprintId?:string|null;createdAt:Date;updatedAt:Date;
 description:string|null;approach:string|null;acceptanceCriteria:string|null;blockerReason:string|null;
 assigneeMembershipId:string|null;dueDate:string|null;estimatePoints:number|null;taskType:string|null};
type Sprint={id:string;title:string;status:string;releaseId:string;updatedAt:Date};
type Release={id:string;title:string;status:string};
type Person={membershipId:string;displayName:string|null;role:string};
type TaskSubmission={id:string;taskId:string;status:string;submissionUrl:string;version:number;createdAt:Date;updatedAt:Date;submittedByMembershipId?:string|null};
type TaskEvent={id:string;subjectId:string;summary:string;occurredAt:Date;actorDisplayName:string|null;eventType:string};
const editable=["TODO","IN_PROGRESS","BLOCKED"] as const;
export function MentorLaneBoard({projectId,initialTasks,sprints,releases,members,taskSubmissions=[],taskActivity=[],readOnly=false}:{
 projectId:string;initialTasks:Task[];sprints:Sprint[];releases:Release[];members:Person[];
 taskSubmissions?:TaskSubmission[];taskActivity?:TaskEvent[];readOnly?:boolean;
}){
 const router=useRouter(),params=useSearchParams();
 const [tasks,setTasks]=useState(initialTasks),[release,setRelease]=useState(params.get("release")??""),
 [sprint,setSprint]=useState(params.get("sprint")??""),[scope,setScope]=useState(params.get("scope")==="all"?"all":"current"),
 [priority,setPriority]=useState(params.get("priority")??""),
 [assignee,setAssignee]=useState(params.get("assignee")??""),[statusFilter,setStatusFilter]=useState(params.get("lane")??""),[busy,setBusy]=useState(false),[error,setError]=useState(""),
 [undo,setUndo]=useState<{id:string;status:string}|null>(null),[selected,setSelected]=useState<string|null>(null),
 [visibleLimit,setVisibleLimit]=useState(150);
 const [prevInitialTasks,setPrevInitialTasks]=useState(initialTasks);
 const [dragging,setDragging]=useState(false);
 const [taskQuery,setTaskQuery]=useState("");
 const [focusedId,setFocusedId]=useState<string|null>(null);
 const [view,setView]=useState<"board"|"list">(params.get("view")==="list"?"list":"board");
 if(prevInitialTasks!==initialTasks){setPrevInitialTasks(initialTasks);setTasks(initialTasks);}
 useEffect(()=>{
  if(!undo)return;
  const expiration=setTimeout(()=>setUndo(null),6000);
  return ()=>clearTimeout(expiration);
 },[undo]);
 function remember(name:string,value:string){
  setVisibleLimit(150);
  const query=new URLSearchParams(window.location.search);
  if(value)query.set(name,value);else query.delete(name);
  window.history.replaceState(null,"",window.location.pathname+"?"+query.toString());
 }
 function clearFilters(){
  setPriority("");setAssignee("");setSprint("");setRelease("");setStatusFilter("");setScope("current");
  ["priority","assignee","sprint","release","lane","scope"].forEach(key=>remember(key,""));
 }
 const bySprint=new Map(sprints.map(item=>[item.id,item]));
 const currentSprint=sprints.find(item=>item.status==="ACTIVE");
 const queryText=taskQuery.trim().toLocaleLowerCase("en-IN");
 const matching=tasks.filter(task=>(!queryText||
    [task.title,task.description??"",task.taskType??"",
      members.find(member=>member.membershipId===task.assigneeMembershipId)?.displayName??""]
      .some(value=>value.toLocaleLowerCase("en-IN").includes(queryText)))&&
    (!sprint||task.sprintId===sprint)&&
   (!release||(task.sprintId?bySprint.get(task.sprintId)?.releaseId:null)===release)&&
   (Boolean(sprint||release)||scope==="all"||task.sprintId===null||
     (Boolean(currentSprint)&&task.sprintId===currentSprint?.id))&&
   (!priority||task.priority===priority)&&
   (!assignee||(assignee==="UNASSIGNED"?task.assigneeMembershipId===null:
     task.assigneeMembershipId===assignee))&&
   (!statusFilter||(statusFilter==="BACKLOG"?task.sprintId===null:task.status===statusFilter)));
 const visible=matching.slice(0,visibleLimit);
 const focused=visible.find(task=>task.id===focusedId)??visible[0]??null;
 useEffect(()=>{
   const onKey=(event:KeyboardEvent)=>{
     if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||
       event.repeat||event.defaultPrevented)return;
     const key=event.key.toLowerCase();
     if(key!=="j"&&key!=="k")return;
     if(event.target instanceof Element&&event.target.closest(
       "input,textarea,select,button,a,[contenteditable],[role=dialog]"))return;
     if(document.querySelector('[role="dialog"]')||visible.length===0)return;
     const index=visible.findIndex(task=>task.id===(focusedId??visible[0]?.id));
     const next=Math.max(0,Math.min(visible.length-1,index+(key==="j"?1:-1)));
     const task=visible[next];
     if(!task)return;
     event.preventDefault();setFocusedId(task.id);
   };
   document.addEventListener("keydown",onKey);
   return()=>document.removeEventListener("keydown",onKey);
 },[focusedId,visible]);
 const submittedReview=focused&&!readOnly&&focused.status==="IN_REVIEW"
   ? [...taskSubmissions].filter(row=>row.taskId===focused.id&&row.status==="SUBMITTED")
     .sort((a,b)=>b.version-a.version)[0]??null
   : null;
 const lanes=groupLearnerBoardLanes(visible,sprints);
 const activeFilterCount=[release,sprint,priority,assignee,statusFilter,scope==="all"?"all":""].filter(Boolean).length;
 async function move(id:string,status:string,isUndo=false){
  const task=tasks.find(item=>item.id===id),sp=task?.sprintId?bySprint.get(task.sprintId):null;
  if(!task||!sp||sp.status!=="ACTIVE"||readOnly||busy||
    !editable.includes(task.status as typeof editable[number])||
    !editable.includes(status as typeof editable[number])||task.status===status)return;
  const blockerReason=status==="BLOCKED"&&!task.blockerReason?.trim()
    ? window.prompt("What's blocking this task?")?.trim() : undefined;
  if(status==="BLOCKED"&&!task.blockerReason?.trim()&&!blockerReason)return;
  if(!isUndo&&!window.confirm("Move task to "+status.replaceAll("_"," ")+"?"))return;
  setError("");setBusy(true);
  try{
   const result=await projectMutation("/api/projects/"+encodeURIComponent(projectId)+
    "/tasks/"+encodeURIComponent(id)+"/mentor-transition","PATCH",{
     status,expectedUpdatedAt:new Date(task.updatedAt).toISOString(),confirmed:true,
     ...(blockerReason?{blockerReason}:{}),
    }) as {task:Task};
   setUndo(isUndo?null:{id,status:task.status});
   setTasks(rows=>rows.map(row=>row.id===id?{...row,...result.task}:row));
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Task transition failed.");}
  finally{setBusy(false);}
 }
 function drop(event:React.DragEvent<HTMLElement>,status:string){
  event.preventDefault();
  const id=event.dataTransfer.getData("text/plain");
  if(id)void move(id,status);
 }
 const learnerChoices=members.filter(member=>member.role==="LEARNER");
 const creationSprints=sprints.filter(item=>item.status!=="COMPLETED"&&
   releases.some(release=>release.id===item.releaseId&&release.status!=="SHIPPED"));
 const creationDefault=creationSprints.find(item=>item.status==="ACTIVE")??
   creationSprints.find(item=>item.status==="PLANNED");
 return <section className="prototype-mentor-board space-y-4">
  <Link href={"/mentor/projects/"+encodeURIComponent(projectId)}
    className="text-sm font-semibold text-link underline focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)]">Back to project</Link>
  <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--lms-canvas-border)] pb-3">
   <h2 className="m-0 text-lg font-semibold text-[var(--lms-heading)]">Board</h2>
   <div className="flex flex-wrap items-center gap-2">
     {!readOnly?<MentorTaskCreate primary projectId={projectId}
       sprintId={creationDefault?.id??""}
       updatedAt={creationDefault?new Date(creationDefault.updatedAt).toISOString():""}
       sprints={creationSprints.map(item=>({
           id:item.id,title:item.title,status:item.status,updatedAt:new Date(item.updatedAt).toISOString(),
         }))}
       learners={members.filter(member=>member.role==="LEARNER").map(member=>({
         membershipId:member.membershipId,displayName:member.displayName,
       }))}/>:null}
     <Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"?tab=delivery"}
       className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:underline">
      Review submission</Link>
   </div>
  </div>
  <div className="flex flex-wrap gap-3 border-b border-[var(--lms-canvas-border)] pb-4">
   <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Release
    <Select data-slot="select" value={release} onChange={e=>{setRelease(e.target.value);setSprint("");remember("release",e.target.value);remember("sprint","");}}
      className="ml-2 min-h-11 min-[768px]:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-2">
     <option value="">All releases</option>{releases.map(r=><option key={r.id} value={r.id}>{r.title}</option>)}
    </Select></label>
   <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Sprint
    <Select data-slot="select" value={sprint} onChange={e=>{setSprint(e.target.value);remember("sprint",e.target.value);}}
      className="ml-2 min-h-11 min-[768px]:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-2">
     <option value="">All sprints</option>{sprints.filter(s=>!release||s.releaseId===release)
      .map(s=><option key={s.id} value={s.id}>{s.title}</option>)}
    </Select></label>
   <Disclosure title="More board filters" defaultOpen={Boolean(scope==="all"||priority||assignee||statusFilter)} className="w-full min-w-0" contentClassName="grid min-w-0 gap-3 pt-3 md:grid-cols-2 xl:grid-cols-4">
   <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Sprint scope
    <Select data-slot="select" value={scope} aria-label="Board sprint scope"
      onChange={e=>{setScope(e.target.value==="all"?"all":"current");remember("scope",e.target.value);}}
      className="ml-2 min-h-11 min-[768px]:min-h-9 rounded border border-border bg-surface p-2">
      <option value="current">Current sprint + backlog</option>
      <option value="all">All sprints (full history)</option>
    </Select>
   </label>
   <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Priority
    <Select data-slot="select" value={priority} onChange={e=>{setPriority(e.target.value);remember("priority",e.target.value);}}
     className="ml-2 min-h-11 min-[768px]:min-h-9 rounded border border-border bg-surface p-2">
     <option value="">All priorities</option>
     {["LOW","MEDIUM","HIGH","CRITICAL"].map(v=><option key={v} value={v}>{v}</option>)}
    </Select>
   </label>
   <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Assignee
    <Select data-slot="select" value={assignee} onChange={e=>{setAssignee(e.target.value);remember("assignee",e.target.value);}}
     className="ml-2 min-h-11 min-[768px]:min-h-9 rounded border border-border bg-surface p-2">
     <option value="">Everyone</option><option value="UNASSIGNED">Unassigned</option>
     {members.filter(m=>m.role==="LEARNER").map(m=>
      <option key={m.membershipId} value={m.membershipId}>{m.displayName??"Learner"}</option>)}
    </Select>
   </label>
   <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Lane
    <Select data-slot="select" value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);remember("lane",e.target.value);}}
      className="ml-2 min-h-11 min-[768px]:min-h-9 rounded border border-border bg-surface p-2">
      <option value="">All lanes</option>
      <option value="BACKLOG">Backlog</option>
      {editable.map(v=><option key={v} value={v}>{v.replaceAll("_"," ")}</option>)}
      <option value="IN_REVIEW">In review</option><option value="DONE">Completed</option>
    </Select>
   </label>
   </Disclosure>
   {activeFilterCount>0?<Button variant="ghost" type="button" onClick={clearFilters}
    className="min-h-11 w-full md:w-auto">Clear all</Button>:null}
  </div>
  <div className="flex flex-wrap items-center gap-2">
    <NeedsDoingChips label="Board lane filters:" selectedKey={statusFilter} onSelect={value=>{
      setStatusFilter(value);
      remember("lane", value);
    }} items={[
      {key:"",label:"All lanes"},{key:"BACKLOG",label:"Backlog"},
      {key:"TODO",label:"To do"},{key:"IN_PROGRESS",label:"In progress"},
      {key:"IN_REVIEW",label:"In review"},{key:"BLOCKED",label:"Blocked"},
      {key:"DONE",label:"Completed"},
    ]} />
    {activeFilterCount > 0 ? <Badge tone="neutral">
      {activeFilterCount} active {activeFilterCount===1?"filter":"filters"}
    </Badge> : null}
  </div>
  <p role="status" className="text-xs text-body">
    {matching.length} matching {matching.length===1?"task":"tasks"} · {tasks.length} total in this project&apos;s full history.
    {!sprint&&!release&&scope==="current"?" Showing the current sprint and backlog. Switch “Sprint scope” to see everything.":""}
  </p>
  {matching.length===0?<EmptyState title={tasks.length===0?"No tasks on this board yet.":"No tasks match these filters."}
    description={tasks.length===0?"Create the first one to give the team somewhere to start.":"Clear all to see the board."} action={tasks.length>0&&activeFilterCount>0?<Button variant="secondary" onClick={clearFilters}>Clear all</Button>:undefined} />:null}
  {error?<Alert tone="error">{error}</Alert>:null}
  {undo?<Button variant="ghost" type="button" disabled={busy} 
    onClick={()=>{const prior=undo;void move(prior.id,prior.status,true);}}>Undo last move</Button>:null}
  <div className="prototype-mentor-board-toolbar">
    <label className="prototype-mentor-board-task-search">
      <span className="sr-only">Search project tasks</span>
      <input type="search" value={taskQuery}
        onChange={event=>{setTaskQuery(event.target.value);setVisibleLimit(150);}}
        placeholder={"Find a task in all "+sprints.length+" sprints"}
        aria-label="Find a task by title, type, description or assignee" />
    </label>
    <div className="prototype-mentor-board-view-toggle" role="group" aria-label="Task presentation">
     <Button type="button" size="sm" variant={view==="board"?"primary":"secondary"}
       aria-pressed={view==="board"} onClick={()=>{setView("board");remember("view","board");}}>Board</Button>
     <Button type="button" size="sm" variant={view==="list"?"primary":"secondary"}
       aria-pressed={view==="list"} onClick={()=>{setView("list");remember("view","list");}}>List</Button>
    </div>
   </div>
   {matching.length>0?<>{view==="board"?<p className="text-xs text-muted-foreground md:hidden">Swipe sideways to see board lanes.</p>:null}
    <p id="mentor-board-keyboard-help" className="sr-only">Use the Move task selection to change a task lane without dragging.</p><div className="prototype-mentor-board-with-pane"><div role="region" aria-label="Project task board; scroll sideways to see more status columns" tabIndex={0} data-dragging={dragging}
    className={styles["scrollRegion"]} style={{display:view==="list"?"none":undefined}}><div className={styles["track"]}>
   {lanes.map(lane=><BoardColumn key={lane.id} label={lane.label}
    className={[styles["lane"], "prototype-mentor-board-lane", lane.id==="BACKLOG"?styles["backlogLane"]:"", lanes.length===1?styles["singleLane"]:""].filter(Boolean).join(" ")}
    data-can-drop={!readOnly&&!busy&&editable.includes(lane.id as typeof editable[number])}
    onDragOver={e=>{if(editable.includes(lane.id as typeof editable[number]))e.preventDefault();}}
    onDrop={e=>drop(e,lane.id)}>
    <h3 className={"prototype-mentor-board-lane-heading "+styles["header"]}><span>{lane.label}</span><Badge tone="neutral">{lane.tasks.length}</Badge></h3>
    <ul className={styles["body"]}>{lane.tasks.map(task=>{
     const sprintRow=task.sprintId?bySprint.get(task.sprintId):null;
     const canMove=!readOnly&&!busy&&sprintRow?.status==="ACTIVE"&&
       editable.includes(task.status as typeof editable[number]);
     return <li key={task.id} draggable={canMove} aria-describedby={canMove?"mentor-board-keyboard-help":undefined}
      onDragStart={e=>{e.dataTransfer.setData("text/plain",task.id);setDragging(true);}}
       onDragEnd={()=>setDragging(false)}
      className={"prototype-mentor-board-task space-y-2 border p-3 text-sm "+styles["card"]}>
      <Button variant="ghost" type="button" onClick={()=>setFocusedId(task.id)}
        className="min-h-11 w-full !justify-start !text-left">{task.title}</Button>
      <p className="prototype-mentor-board-meta">
        <span>{task.taskType??"Task"} · {task.estimatePoints??"—"} pts</span>
        <span>{members.find(member=>member.membershipId===task.assigneeMembershipId)?.displayName??"Unassigned"}</span>
      </p>
      {task.blockerReason?<p className="prototype-mentor-board-blocked" title={task.blockerReason}>
        Blocked · {task.blockerReason}</p>:null}
      <details className="prototype-mentor-board-advanced">
        <summary>Task actions</summary>
      <p className="text-xs text-body">{task.priority} · {sprintRow?.title??"Backlog"}</p>
      <p className="text-xs text-body">Assignee: {members.find(m=>m.membershipId===task.assigneeMembershipId)?.displayName??"Unassigned"} ·
        {" "}Estimate: {task.estimatePoints??"Unsized"} · {task.taskType??"Task"}</p>
      <p className="text-xs text-body">Due: {task.dueDate??"No due date"} ·
        {" "}{projectTaskDueState(task.dueDate,task.status,new Date())}</p>
      {taskSubmissions.some(s=>s.taskId===task.id&&/^https?:\/\//.test(s.submissionUrl))?
        <p className="text-xs font-semibold text-link">Submission link attached</p>:null}
      {task.carriedFromSprintId&&!task.sprintId?<p className="text-xs font-semibold text-warning-text">Carried over</p>:null}
      {task.assigneeMembershipId===null?<p className="text-xs font-semibold text-warning-text">Needs assigning</p>:null}
      {task.blockerReason?<p className="whitespace-pre-wrap text-xs text-warning-text">Blocked: {task.blockerReason}</p>:null}
      {canMove?<label className="block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Move task
       <Select data-slot="select" aria-label={"Move "+task.title+" to lane"} value={task.status} disabled={busy} onChange={e=>void move(task.id,e.target.value)}
        className="mt-1 min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-2">
        {editable.map(x=><option key={x} value={x}>{x.replaceAll("_"," ")}</option>)}
       </Select></label>:null}
      {!readOnly&&["TODO","IN_PROGRESS","BLOCKED"].includes(task.status)?
        <MentorTaskDeleteControl projectId={projectId} taskId={task.id}
          title={task.title} updatedAt={task.updatedAt}/>:null}
      {!readOnly?<ProjectTaskAssigneeControl projectId={projectId} taskId={task.id} taskTitle={task.title}
       assigneeMembershipId={task.assigneeMembershipId}
       updatedAt={new Date(task.updatedAt).toISOString()} learners={learnerChoices}/>:null}
      <Disclosure title="Task details" className="rounded-[var(--lms-control-radius)] border border-border p-2">
       <p className="mt-2 whitespace-pre-wrap text-xs">{task.description||"No description"}</p>
       <p className="mt-2 text-xs font-semibold">Approach</p>
       <p className="whitespace-pre-wrap text-xs">{task.approach||"Not recorded"}</p>
       <p className="mt-2 text-xs font-semibold">Done when</p>
       <p className="whitespace-pre-wrap text-xs">{task.acceptanceCriteria||"Not recorded"}</p>
       <p className="mt-2 text-xs">Assigned to: {members.find(m=>m.membershipId===task.assigneeMembershipId)?.displayName??"Unassigned"}</p>
       <p className="mt-2 text-xs">Due: {task.dueDate??"No due date"} · Estimate: {task.estimatePoints??"—"}</p>
       <p className="text-xs">Task type: {task.taskType??"Not set"}</p>
       <h4 className="mt-3 text-xs font-semibold">Submission</h4>
       {taskSubmissions.filter(s=>s.taskId===task.id).slice(-3).map(item=>
        <div key={item.id} className="mt-1 text-xs">
          <span>{item.status} · version {item.version}</span>
          {safeProjectExternalHref(item.submissionUrl)?<a href={safeProjectExternalHref(item.submissionUrl)!} target="_blank"
            rel="noreferrer noopener" className="ml-2 inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Open submission link</a>:null}
        </div>
       )}
       {!taskSubmissions.some(s=>s.taskId===task.id)?<p className="text-xs text-muted-foreground">No submission yet.</p>:null}
       <h4 className="mt-3 text-xs font-semibold">Activity</h4>
       <ul className="space-y-1">{taskActivity.filter(event=>event.subjectId===task.id).slice(0,8).map(event=>
         <li key={event.id} className="text-xs text-body">{event.summary} · {event.actorDisplayName??"System"} ·
           {" "+new Date(event.occurredAt).toLocaleDateString("en-IN")}</li>
       )}</ul>
       <ProjectTaskComments projectId={projectId} taskId={task.id}
        updatedAt={new Date(task.updatedAt).toISOString()} canPost={!readOnly}/>
      </Disclosure>
      </details>
     </li>;
    })}
    {!lane.tasks.length?<li><EmptyState title="No tasks" description="No tasks in this lane." /></li>:null}
    </ul>
   </BoardColumn>)}
  </div></div>
  {view==="list"?<div className="prototype-mentor-board-list" role="region" aria-label="Project tasks list" tabIndex={0}>
    <div className="prototype-mentor-board-list-heading" aria-hidden="true">
      <span>Task</span><span>Assignee</span><span>Sprint</span><span>State</span><span>Points</span>
    </div>
    {visible.map(task=>{
      const rowSprint=task.sprintId?bySprint.get(task.sprintId):null;
      const canMove=!readOnly&&!busy&&rowSprint?.status==="ACTIVE"&&
        editable.includes(task.status as typeof editable[number]);
      return <div key={task.id} className="prototype-mentor-board-list-row">
        <Button type="button" variant="ghost" size="sm" className="!justify-start !text-left"
          onClick={()=>setFocusedId(task.id)}>{task.title}</Button>
        <span>{members.find(member=>member.membershipId===task.assigneeMembershipId)?.displayName??"Unassigned"}</span>
        <span>{rowSprint?.title??"Backlog"}</span>
        {canMove?<Select value={task.status} disabled={busy}
          aria-label={"Move "+task.title+" to lane"} onChange={e=>void move(task.id,e.target.value)}>
          {editable.map(value=><option key={value} value={value}>{value.replaceAll("_"," ")}</option>)}
        </Select>:<span>{task.status.replaceAll("_"," ")}</span>}
        <span>{task.estimatePoints??"—"}</span>
      </div>;
    })}
  </div>:null}
  <aside className="prototype-mentor-board-detail" aria-label="Selected task details">
    {focused?<>
      <div className="prototype-mentor-board-detail-title">
        <span>{focused.status.replaceAll("_"," ")}</span>
        <button type="button" onClick={()=>setSelected(focused.id)}
          aria-label={"Open complete task details for "+focused.title}>⋯</button>
      </div>
      <h3 aria-live="polite">{focused.title}</h3>
      <div className="prototype-mentor-board-detail-tags">
        <span>{focused.taskType??"Task"}</span>
        <span>{focused.priority.toLocaleLowerCase("en-IN")} priority</span>
        <span>{focused.estimatePoints??"—"} points</span>
      </div>
      <div className="prototype-mentor-board-detail-owner">
        Assigned to <strong>{members.find(person=>person.membershipId===focused.assigneeMembershipId)?.displayName??"Unassigned"}</strong>
      </div>
      <p className="prototype-mentor-board-detail-description">{focused.description||"No task description recorded."}</p>
      <div className="prototype-mentor-board-detail-block">
        <h4>Acceptance criteria</h4>
        <p>{focused.acceptanceCriteria||"No acceptance criteria recorded."}</p>
      </div>
      {focused.approach?<div className="prototype-mentor-board-detail-block">
        <h4>Their approach</h4><p>{focused.approach}</p>
      </div>:null}
      {focused.blockerReason?<div className="prototype-mentor-board-detail-block is-blocked">
        <h4>Blocked</h4><p>{focused.blockerReason}</p>
      </div>:null}
      {submittedReview&&focused?<div className="prototype-mentor-board-review-actions" aria-label="Review task submission">
        <TaskReviewActions projectId={projectId} taskId={focused.id}
          submissionId={submittedReview.id} mode="MENTOR"
          expectedUpdatedAt={new Date(submittedReview.updatedAt).toISOString()}
          initialDecision="APPROVED" triggerLabel="Approve A" shortcut="a"/>
        <TaskReviewActions projectId={projectId} taskId={focused.id}
          submissionId={submittedReview.id} mode="MENTOR"
          expectedUpdatedAt={new Date(submittedReview.updatedAt).toISOString()}
          initialDecision="CHANGES_REQUESTED" triggerLabel="Send back S" shortcut="s"/>
      </div>:null}
      <button type="button" className="prototype-mentor-board-detail-more"
        onClick={()=>setSelected(focused.id)}>Open full task details →</button>
      <div className="prototype-mentor-board-detail-block">
        <h4>Comments and progress</h4>
        <ProjectTaskComments key={focused.id} projectId={projectId} taskId={focused.id}
          updatedAt={new Date(focused.updatedAt).toISOString()} canPost={!readOnly}/>
      </div>
    </>:<p>No task selected.</p>}
  </aside>
  </div></>:null}
  {matching.length>visible.length?<Button variant="secondary" type="button"
    className="min-h-11 px-4"
    onClick={()=>setVisibleLimit(limit=>limit+150)}>Show 150 more</Button>:null}
  {selected&&tasks.find(task=>task.id===selected)?<MentorBoardTaskDetailDialog
    projectId={projectId} task={tasks.find(task=>task.id===selected)!}
    sprintTitle={sprints.find(s=>s.id===tasks.find(task=>task.id===selected)?.sprintId)?.title??null}
    members={members} submissions={taskSubmissions} activity={taskActivity}
    readOnly={readOnly} onClose={()=>setSelected(null)}/>:null}
 </section>;
}
