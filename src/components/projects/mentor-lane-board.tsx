import { Select } from "@/components/ui/select";
"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {useRouter,useSearchParams} from "next/navigation";
import {groupLearnerBoardLanes} from "@/modules/projects/learner-board-lanes-model";
import {projectMutation} from "./project-api";
import {ProjectTaskAssigneeControl} from "./project-task-assignee-control";
import {ProjectTaskComments} from "./project-task-comments";
import {MentorBoardTaskDetailDialog} from "./mentor-board-task-detail-dialog";
import {MentorTaskCreate} from "./mentor-task-create";
import {projectTaskDueState} from "@/modules/projects/project-task-visible-facts-model";
import {safeProjectExternalHref} from "@/modules/projects/mentor-workspace-evidence-model";
import {MentorTaskDeleteControl} from "./mentor-task-delete-control";
type Task={id:string;title:string;status:string;priority:string;sprintId:string|null;carriedFromSprintId?:string|null;createdAt:Date;updatedAt:Date;
 description:string|null;approach:string|null;acceptanceCriteria:string|null;blockerReason:string|null;
 assigneeMembershipId:string|null;dueDate:string|null;estimatePoints:number|null;taskType:string|null};
type Sprint={id:string;title:string;status:string;releaseId:string;updatedAt:Date};
type Release={id:string;title:string;status:string};
type Person={membershipId:string;displayName:string|null;role:string};
type TaskSubmission={id:string;taskId:string;status:string;submissionUrl:string;version:number;createdAt:Date;submittedByMembershipId?:string|null};
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
 const bySprint=new Map(sprints.map(item=>[item.id,item]));
 const currentSprint=sprints.find(item=>item.status==="ACTIVE");
 const matching=tasks.filter(task=>(!sprint||task.sprintId===sprint)&&
   (!release||(task.sprintId?bySprint.get(task.sprintId)?.releaseId:null)===release)&&
   (Boolean(sprint||release)||scope==="all"||task.sprintId===null||
     (Boolean(currentSprint)&&task.sprintId===currentSprint?.id))&&
   (!priority||task.priority===priority)&&
   (!assignee||(assignee==="UNASSIGNED"?task.assigneeMembershipId===null:
     task.assigneeMembershipId===assignee))&&
   (!statusFilter||(statusFilter==="BACKLOG"?task.sprintId===null:task.status===statusFilter)));
 const visible=matching.slice(0,visibleLimit);
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
 return <section className="space-y-4">
  <Link href={"/mentor/projects/"+encodeURIComponent(projectId)}
    className="text-sm font-semibold text-link underline">Back to project</Link>
  <div className="flex flex-wrap items-center justify-between gap-3">
   <h1 className="text-[30px] font-semibold leading-[1.35] tracking-[-0.02em] text-[var(--lms-heading)]">Board</h1>
   <div className="flex flex-wrap items-center gap-2">
     {!readOnly?<MentorTaskCreate projectId={projectId}
       sprintId={creationDefault?.id??""}
       updatedAt={creationDefault?new Date(creationDefault.updatedAt).toISOString():""}
       sprints={creationSprints.map(item=>({
           id:item.id,title:item.title,status:item.status,updatedAt:new Date(item.updatedAt).toISOString(),
         }))}
       learners={members.filter(member=>member.role==="LEARNER").map(member=>({
         membershipId:member.membershipId,displayName:member.displayName,
       }))}/>:null}
     <Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"?tab=delivery"}
       className="min-h-11 rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm font-semibold text-link">
      Review submission</Link>
   </div>
  </div>
  <div className="flex flex-wrap gap-3 rounded-xl border border-border p-3">
   <label className="text-sm font-semibold">Release
    <Select data-slot="select" value={release} onChange={e=>{setRelease(e.target.value);setSprint("");remember("release",e.target.value);remember("sprint","");}}
      className="ml-2 min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-2">
     <option value="">All releases</option>{releases.map(r=><option key={r.id} value={r.id}>{r.title}</option>)}
    </Select></label>
   <label className="text-sm font-semibold">Sprint
    <Select data-slot="select" value={sprint} onChange={e=>{setSprint(e.target.value);remember("sprint",e.target.value);}}
      className="ml-2 min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-2">
     <option value="">All sprints</option>{sprints.filter(s=>!release||s.releaseId===release)
      .map(s=><option key={s.id} value={s.id}>{s.title}</option>)}
    </Select></label>
   <label className="text-sm font-semibold">Sprint scope
    <Select data-slot="select" value={scope} aria-label="Board sprint scope"
      onChange={e=>{setScope(e.target.value==="all"?"all":"current");remember("scope",e.target.value);}}
      className="ml-2 min-h-11 rounded border border-border bg-surface p-2">
      <option value="current">Current sprint + backlog</option>
      <option value="all">All sprints (full history)</option>
    </Select>
   </label>
   <label className="text-sm font-semibold">Priority
    <Select data-slot="select" value={priority} onChange={e=>{setPriority(e.target.value);remember("priority",e.target.value);}}
     className="ml-2 min-h-11 rounded border border-border bg-surface p-2">
     <option value="">All priorities</option>
     {["LOW","MEDIUM","HIGH","CRITICAL"].map(v=><option key={v} value={v}>{v}</option>)}
    </Select>
   </label>
   <label className="text-sm font-semibold">Assignee
    <Select data-slot="select" value={assignee} onChange={e=>{setAssignee(e.target.value);remember("assignee",e.target.value);}}
     className="ml-2 min-h-11 rounded border border-border bg-surface p-2">
     <option value="">Everyone</option><option value="UNASSIGNED">Unassigned</option>
     {members.filter(m=>m.role==="LEARNER").map(m=>
      <option key={m.membershipId} value={m.membershipId}>{m.displayName??"Learner"}</option>)}
    </Select>
   </label>
   <label className="text-sm font-semibold">Lane
    <Select data-slot="select" value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);remember("lane",e.target.value);}}
      className="ml-2 min-h-11 rounded border border-border bg-surface p-2">
      <option value="">All lanes</option>
      <option value="BACKLOG">Backlog</option>
      {editable.map(v=><option key={v} value={v}>{v.replaceAll("_"," ")}</option>)}
      <option value="IN_REVIEW">In review</option><option value="DONE">Completed</option>
    </Select>
   </label>
   <button type="button" onClick={()=>{setPriority("");setAssignee("");setSprint("");setRelease("");setStatusFilter("");setScope("current");["priority","assignee","sprint","release","lane","scope"].forEach(k=>remember(k,""));}}
    className="min-h-11 text-sm font-semibold text-link underline">Clear all</button>
  </div>
  <div className="flex flex-wrap items-center gap-2" aria-label="Board lane filters">
    {[{value:"",label:"All lanes"},{value:"BACKLOG",label:"Backlog"},
      {value:"TODO",label:"To Do"},{value:"IN_PROGRESS",label:"In Progress"},
      {value:"IN_REVIEW",label:"In Review"},{value:"BLOCKED",label:"Blocked"},
      {value:"DONE",label:"Completed"}].map(option=>
      <button key={option.value||"all"} type="button"
        aria-pressed={statusFilter===option.value}
        onClick={()=>{setStatusFilter(option.value);remember("lane",option.value);}}
        className={"min-h-9 rounded-full border px-3 text-xs font-semibold "+
          (statusFilter===option.value?"border-primary bg-primary text-primary-foreground":
          "border-border bg-surface text-body")}>
        {option.label}
      </button>)}
    {activeFilterCount>0?<span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold text-body">
      {activeFilterCount} active {activeFilterCount===1?"filter":"filters"}
    </span>:null}
  </div>
  <p role="status" className="text-xs text-body">
    {matching.length} matching {matching.length===1?"task":"tasks"} · {tasks.length} total in this project&apos;s full history.
    {!sprint&&!release&&scope==="current"?" Showing the current sprint and backlog. Switch “Sprint scope” to see everything.":""}
  </p>
  {matching.length===0?<p role="status" className="rounded-[var(--lms-control-radius)] border border-border p-4 text-sm text-body">
    {tasks.length===0?"No tasks on this board yet. Create the first one to give the team somewhere to start.":
      "No tasks match these filters. Clear all to see the board."}
  </p>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {undo?<button type="button" disabled={busy} className="text-sm font-semibold text-link underline"
    onClick={()=>{const prior=undo;void move(prior.id,prior.status,true);}}>Undo last move</button>:null}
  <div role="region" aria-label="Project task board; scroll sideways to see more status columns" tabIndex={0}
    className="overflow-x-auto overscroll-x-contain pb-3 [mask-image:linear-gradient(to_right,black_0%,black_94%,transparent_100%)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><div className="flex min-w-max gap-3">
   {lanes.map(lane=><section key={lane.id} aria-label={lane.label}
    className="w-72 shrink-0 rounded-xl border border-border bg-surface-subtle p-3"
    onDragOver={e=>{if(editable.includes(lane.id as typeof editable[number]))e.preventDefault();}}
    onDrop={e=>drop(e,lane.id)}>
    <h2 className="flex justify-between font-semibold"><span>{lane.label}</span><span>{lane.tasks.length}</span></h2>
    <ul className="mt-3 space-y-2">{lane.tasks.map(task=>{
     const sprintRow=task.sprintId?bySprint.get(task.sprintId):null;
     const canMove=!readOnly&&!busy&&sprintRow?.status==="ACTIVE"&&
       editable.includes(task.status as typeof editable[number]);
     return <li key={task.id} draggable={canMove}
      onDragStart={e=>e.dataTransfer.setData("text/plain",task.id)}
      className="space-y-2 rounded-[var(--lms-control-radius)] border border-border bg-surface p-3 text-sm">
      <button type="button" onClick={()=>setSelected(task.id)}
        className="min-h-11 text-left font-semibold text-link underline">{task.title}</button>
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
      {canMove?<label className="block text-xs font-semibold">Move task
       <Select data-slot="select" value={task.status} disabled={busy} onChange={e=>void move(task.id,e.target.value)}
        className="mt-1 min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-2">
        {editable.map(x=><option key={x} value={x}>{x.replaceAll("_"," ")}</option>)}
       </Select></label>:null}
      {!readOnly&&["TODO","IN_PROGRESS","BLOCKED"].includes(task.status)?
        <MentorTaskDeleteControl projectId={projectId} taskId={task.id}
          title={task.title} updatedAt={task.updatedAt}/>:null}
      {!readOnly?<ProjectTaskAssigneeControl projectId={projectId} taskId={task.id} taskTitle={task.title}
       assigneeMembershipId={task.assigneeMembershipId}
       updatedAt={new Date(task.updatedAt).toISOString()} learners={learnerChoices}/>:null}
      <details className="rounded-[var(--lms-control-radius)] border border-border p-2">
       <summary className="cursor-pointer font-semibold text-link">Task details</summary>
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
            rel="noreferrer noopener" className="ml-2 inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Open submission link</a>:null}
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
      </details>
     </li>;
    })}
    {!lane.tasks.length?<li className="py-4 text-center text-xs text-muted-foreground">No tasks</li>:null}
    </ul>
   </section>)}
  </div></div>
  {matching.length>visible.length?<button type="button"
    className="min-h-11 rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link"
    onClick={()=>setVisibleLimit(limit=>limit+150)}>Show 150 more</button>:null}
  {selected&&tasks.find(task=>task.id===selected)?<MentorBoardTaskDetailDialog
    projectId={projectId} task={tasks.find(task=>task.id===selected)!}
    sprintTitle={sprints.find(s=>s.id===tasks.find(task=>task.id===selected)?.sprintId)?.title??null}
    members={members} submissions={taskSubmissions} activity={taskActivity}
    readOnly={readOnly} onClose={()=>setSelected(null)}/>:null}
 </section>;
}
