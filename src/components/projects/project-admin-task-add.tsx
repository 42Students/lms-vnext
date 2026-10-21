"use client";

import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {useToast} from "@/components/ui/toast";
import {mentorEstimateLabel,mentorEstimateOptions} from "@/modules/projects/mentor-estimation-unit-model";
import {projectMutation} from "./project-api";
import {useProjectEditorDiscardGuard} from "./project-editor-discard-guard";

type Sprint={id:string;title:string;status:string;releaseStatus:string};
export function ProjectAdminTaskAdd({
 projectId,tasksToken,sprints,estimationUnit,
}:{
 projectId:string;tasksToken:string;sprints:readonly Sprint[];
 estimationUnit?:string|null;
}){
 const router=useRouter(),{showToast}=useToast();
 const saving=useRef(false);
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false);
 const [key,setKey]=useState(""),[title,setTitle]=useState("");
 const [sprintId,setSprintId]=useState("");
 const [priority,setPriority]=useState<"LOW"|"MEDIUM"|"HIGH"|"CRITICAL">("MEDIUM");
 const [estimate,setEstimate]=useState("");
 const [taskType,setTaskType]=useState("");
 const [dueLabel,setDueLabel]=useState("");
 const [description,setDescription]=useState("");
 const [acceptance,setAcceptance]=useState("");
 const [approach,setApproach]=useState("");
 const dirty=Boolean(key||title||sprintId||estimate||taskType||dueLabel||
  description||acceptance||approach||priority!=="MEDIUM");
 const guard=useProjectEditorDiscardGuard(open,dirty,busy,reset);
 const eligible=sprints.filter(s=>["PLANNED","ACTIVE"].includes(s.status)&&
  s.releaseStatus!=="SHIPPED");
 const generatedKey=title.normalize("NFKD").toLowerCase()
  .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,100)||"task";
 const valid=title.trim().length>0&&title.trim().length<=200&&key.length<=120&&
  dueLabel.length<=160&&description.length<=4000&&acceptance.length<=4000&&
  approach.length<=4000&&!((sprintId&&!eligible.some(s=>s.id===sprintId)))&&
  (estimate===""||(
   Number.isInteger(Number(estimate))&&Number(estimate)>=0&&Number(estimate)<=1000));
 function reset(){
  setOpen(false);setTitle("");setKey("");setSprintId("");setPriority("MEDIUM");
  setEstimate("");setTaskType("");setDueLabel("");setDescription("");
  setAcceptance("");setApproach("");
 }
 async function save(){
  if(saving.current||busy||!valid)return;
  saving.current=true;setBusy(true);
  try{
   await projectMutation("/api/projects/"+encodeURIComponent(projectId)+"/tasks/plan/new",
    "POST",{
     expectedTasksToken:tasksToken,sprintId:sprintId||null,
     key:key.trim(),title:title.trim(),priority,estimatePoints:estimate?Number(estimate):null,
     taskType:taskType||null,dueLabel:dueLabel.trim()||null,
     description:description.trim()||null,acceptanceCriteria:acceptance.trim()||null,
     approach:approach.trim()||null,
    });
   showToast({tone:"success",title:"Task added."});
   reset();router.refresh();
  }catch(error){
   showToast({tone:"error",title:"Task was not created",
    description:error instanceof Error?error.message:
     "The task plan may have changed. Reload and try again."});
  }finally{saving.current=false;setBusy(false);}
 }
 return <section aria-label="Add task to plan" className="space-y-3">
  <Button type="button" variant="secondary" size="sm" aria-expanded={open}
   onClick={()=>{if(open)guard.requestClose();else setOpen(true);}}>
   {open?"Close new task":"Add task"}
  </Button>
  {open?<div className="min-w-0 space-y-3 border-y border-border py-4">
   <div>
    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-body">Work breakdown</p>
    <h4 className="mt-1 text-base font-semibold text-foreground">Add task</h4>
    <p className="text-sm text-body">
     Assign this item to a sprint or leave it in the backlog. Status, assignee and
     learner submissions are not changed here.
    </p>
   </div>
   <fieldset disabled={busy} className="grid min-w-0 gap-3 md:grid-cols-2">
    <label className="text-xs font-semibold text-body">Key (optional)
     <Input className="mt-1" maxLength={120} value={key}
      placeholder="Auto-generated from title if left blank"
      onChange={event=>setKey(event.target.value)}/>
     <span className="mt-1 block text-xs font-normal text-muted-foreground">
      {key.trim()?"Your chosen key":"Will be saved as "+generatedKey}
     </span>
    </label>
    <label className="text-xs font-semibold text-body">Priority
     <Select className="mt-1" value={priority}
      onChange={event=>setPriority(event.target.value as typeof priority)}>
      <option value="LOW">Low</option><option value="MEDIUM">Medium</option>
      <option value="HIGH">High</option><option value="CRITICAL">Critical</option>
     </Select>
    </label>
    <label className="text-xs font-semibold text-body md:col-span-2">Title
     <Input className="mt-1" required maxLength={200}
      placeholder="e.g. Draft submission checklist" value={title}
      aria-invalid={open&&!title.trim()}
      onChange={event=>setTitle(event.target.value)}/>
     {!title.trim()?<span className="mt-1 block text-xs font-normal text-error">
      Title is required
     </span>:null}
    </label>
    <label className="text-xs font-semibold text-body">Sprint
     <Select className="mt-1" value={sprintId}
      onChange={event=>setSprintId(event.target.value)}>
      <option value="">Backlog (no sprint)</option>
      {eligible.map(s=><option key={s.id} value={s.id}>{s.title} ({s.status})</option>)}
     </Select>
    </label>
    <label className="text-xs font-semibold text-body">Estimate
     <Select className="mt-1" value={estimate}
      onChange={event=>setEstimate(event.target.value)}>
      <option value="">Not estimated</option>
      {mentorEstimateOptions(estimationUnit).map(points=><option key={points}
       value={String(points)}>{mentorEstimateLabel(points,estimationUnit)}</option>)}
     </Select>
    </label>
    <label className="text-xs font-semibold text-body">Type
     <Select className="mt-1" value={taskType}
      onChange={event=>setTaskType(event.target.value)}>
      <option value="">Not specified</option><option value="STORY">Story</option>
      <option value="BUG">Bug</option><option value="CHORE">Chore</option>
      <option value="SPIKE">Spike</option>
     </Select>
    </label>
    <label className="text-xs font-semibold text-body">Due (optional)
     <Input className="mt-1" maxLength={160} value={dueLabel}
      placeholder="e.g. Week 2" onChange={event=>setDueLabel(event.target.value)}/>
    </label>
    {([
     ["description","Description",description,setDescription],
     ["acceptance","Done when (optional)",acceptance,setAcceptance],
     ["approach","Approach (optional)",approach,setApproach],
    ] as const).map(([field,label,value,setter])=><label key={field}
     className="text-xs font-semibold text-body md:col-span-2">
     {label}
     <Textarea className="mt-1" maxLength={4000} rows={3} value={value}
      placeholder={field==="acceptance"?"Acceptance criteria — what does done look like?":undefined}
      onChange={event=>setter(event.target.value)}/>
    </label>)}
   </fieldset>
   <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
    <p className="text-xs text-body">Assignee, status and submission state are not changed here.</p>
    <div className="flex gap-2">
     <Button type="button" variant="secondary" disabled={busy}
      onClick={guard.requestClose}>Cancel</Button>
     <Button type="button" loading={busy} disabled={busy||!valid}
      onClick={()=>void save()}>Save task</Button>
    </div>
   </div>
  </div>:null}
  <ConfirmDialog open={guard.discardOpen}
   onOpenChange={guard.setDiscardOpen} title="Discard task changes?"
   description="You have unsaved changes. Leave without saving them?"
   confirmLabel="Discard changes" pending={busy} onConfirm={guard.confirmDiscard}/>
 </section>;
}
