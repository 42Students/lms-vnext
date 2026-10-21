"use client";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useConfirmFlow } from "@/components/ui/use-confirm-flow";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { useProjectEditorDiscardGuard } from "./project-editor-discard-guard";
import {useEffect,useState} from "react";
import {usePathname,useRouter} from "next/navigation";
import Link from "next/link";
export type SummaryProject={
 id:string;collegeId:string;title:string;summary:string|null;status:string;updatedAt:Date;
 progressPercent:number;phase:string|null;dueLabel:string|null;courseLabel:string|null;sectionId:string|null;
 blocker:string|null;nextAction:string|null;startDate:string|null;endDate:string|null;
 sprintLengthWeeks:number|null;estimationUnit:string|null;
};
type Choice={id:string;name:string;code:string};
const style="mt-1 w-full";
export function CollegeProjectSummaryEditorFull({project:p,taskProgress,estimatedTaskCount=0}:{
 project:SummaryProject;taskProgress?:{done:number;total:number};estimatedTaskCount?:number;
}){
 const router=useRouter();
 const pathname=usePathname();
 const {askConfirm,dialog}=useConfirmFlow();
 const {showToast}=useToast();
 const [open,setOpen]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [classes,setClasses]=useState<Choice[]>([]);
 const sourceForm={
  title:p.title,summary:p.summary??"",status:p.status,progressPercent:p.progressPercent,
  phase:p.phase??"",dueLabel:p.dueLabel??"",courseLabel:p.courseLabel??"",
  sectionId:p.sectionId??"",blocker:p.blocker??"",nextAction:p.nextAction??"",
  startDate:p.startDate??"",endDate:p.endDate??"",sprintLengthWeeks:p.sprintLengthWeeks?.toString()??"",
  estimationUnit:p.estimationUnit??"POINTS",
 };
 const [form,setForm]=useState(sourceForm);
 const dirty=JSON.stringify(form)!==JSON.stringify(sourceForm);
 const discard=useProjectEditorDiscardGuard(open,dirty,busy,()=>{
  setForm(sourceForm);setOpen(false);setError("");
 });
 const hasTaskData=(taskProgress?.total??0)>0;
 const legacyStatus=(()=>{
   if(form.status==="COMPLETED")return "COMPLETED";
   const stage=(form.phase??"").toUpperCase().replace(/\s+/g,"_");
   if(["READY","BLOCKED","IN_PROGRESS"].includes(stage))return stage;
   return form.status;
 })();
 const overviewHref=pathname.replace(/\/summary\/?$/,"/overview");
 const derivedProgress=hasTaskData?Math.round(100*(taskProgress?.done??0)/(taskProgress?.total??1)):null;
 const change=(key:keyof typeof form,value:string|number)=>setForm(v=>({...v,[key]:value}));
 useEffect(()=>{
  if(!open)return;
  const ctrl=new AbortController();
  void fetch("/api/projects/class-team-classes?collegeId="+encodeURIComponent(p.collegeId),{signal:ctrl.signal})
   .then(r=>r.ok?r.json():Promise.reject(Error("Class choices unavailable")))
   .then((data:{classes:Choice[]})=>{if(!ctrl.signal.aborted)setClasses(data.classes)})
   .catch(()=>{if(!ctrl.signal.aborted)setError("Class choices unavailable; retry to load.")});
  return ()=>ctrl.abort();
 },[open,p.collegeId]);
 async function save(){
  if(!form.title.trim()||busy)return;
  if(form.startDate&&form.endDate&&form.endDate<form.startDate){setError("End date must be on or after start date.");return;}
  if(!(await askConfirm("Save workspace summary changes?")))return;
  setBusy(true);setError("");
  try {
   const res=await fetch("/api/projects/"+encodeURIComponent(p.id),{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
     title:form.title.trim(),summary:form.summary.trim()||null,status:form.status,
     progressPercent:hasTaskData?p.progressPercent:form.progressPercent,phase:form.phase.trim()||null,
     dueLabel:form.dueLabel.trim()||null,courseLabel:form.courseLabel.trim()||null,
     sectionId:form.sectionId||null,blocker:form.blocker.trim()||null,
     nextAction:form.nextAction.trim()||null,startDate:form.startDate||null,endDate:form.endDate||null,
     sprintLengthWeeks:form.sprintLengthWeeks?Number(form.sprintLengthWeeks):null,
     estimationUnit:form.estimationUnit||null,expectedTitle:p.title,expectedSummary:p.summary,
     expectedStatus:p.status,expectedUpdatedAt:new Date(p.updatedAt).toISOString(),
    }),
   });
   if(!res.ok){const detail=await res.json().catch(()=>({error:"Save failed"}));
    throw new Error(detail.error||"Save failed");}
   showToast({tone:"success",title:"Workspace updated"});
   setOpen(false);router.refresh();
  }catch(e){
   setError(e instanceof Error?e.message:"Failed to update workspace");
   showToast({tone:"error",title:"Failed to update workspace"});
  }finally{setBusy(false);}
 }
 const field=(label:string,key:keyof typeof form,max:number)=><label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
  {label}<Input className={style} maxLength={max} value={form[key]} onChange={e=>change(key,e.target.value)}/>
 </label>;
 return <section className="border-b border-border pb-5">
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-body">Workspace settings</p>
      <h2 className="mt-1 text-lg font-semibold text-foreground">Basic info</h2>
    </div>
    <Button variant="secondary" type="button"
      aria-expanded={open} onClick={()=>open?discard.requestClose():setOpen(true)}>
      {open?"Close workspace settings":"Edit workspace summary"}</Button>
  </div>
  {open?<div className="mt-4 space-y-4">
   <div className="grid gap-3 md:grid-cols-2">
    {field("Workspace title","title",160)}
    <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Status<Select className={style}
     value={form.status} onChange={e=>change("status",e.target.value)}>
      {[p.status,...(p.status==="PLANNED"?["ACTIVE"]:p.status==="ACTIVE"?["COMPLETED"]:[])].map(v=>
       <option key={v} value={v}>{v}</option>)}
      <option value="ARCHIVED" disabled>Archived (use Archive action)</option>
    </Select></label>
    <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Progress %<Input className={style} type="number" min={0} max={100}
     disabled={hasTaskData} value={derivedProgress??form.progressPercent}
     onChange={e=>change("progressPercent",Number(e.target.value))}/>
     {hasTaskData?<span className="mt-1 block text-xs font-normal text-body">Progress is calculated from completed tasks and sprints while this workspace has execution work.</span>:null}
    </label>
    {field("Phase","phase",120)}{field("Due label","dueLabel",80)}{field("Course label","courseLabel",160)}
    <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Class<Select className={style} value={form.sectionId}
     onChange={e=>change("sectionId",e.target.value)}>
      <option value="">No class</option>
      {form.sectionId&&!classes.some(v=>v.id===form.sectionId)?<option value={form.sectionId}>Current class</option>:null}
      {classes.map(v=><option key={v.id} value={v.id}>{v.name} · {v.code}</option>)}
    </Select></label>
    {(["startDate","endDate"] as const).map(key=><label key={key} className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
     {key==="startDate"?"Start date":"End date"}
     <Input className={style} type="date" value={form[key]} onChange={e=>change(key,e.target.value)}/>
    </label>)}
    <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Sprint length (weeks)<Input className={style} type="number"
     min={1} max={12} value={form.sprintLengthWeeks} onChange={e=>change("sprintLengthWeeks",e.target.value)}/>
      <span className="mt-1 block text-xs font-normal text-body">Use 1 to 12 weeks per sprint.</span>
    </label>
    <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Estimation unit<Select className={style}
     value={form.estimationUnit} onChange={e=>change("estimationUnit",e.target.value)}>
      <option value="POINTS">Points</option><option value="HOURS">Hours</option>
      {p.estimationUnit==="TASKS"?<option value="TASKS" disabled>Tasks (existing)</option>:null}
    </Select>
      {estimatedTaskCount>0?<span className="mt-1 block text-xs font-normal text-warning-text">
        {estimatedTaskCount} task{estimatedTaskCount===1?" has":"s have"} estimates; changing units is blocked.
      </span>:null}
    </label>
   </div>
   {(["summary","blocker","nextAction"] as const).map(k=><label key={k} className="block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
    {k==="summary"?"Summary":k==="blocker"?"Blocker":"Next action"}
    <Textarea className={style+" min-h-24"} maxLength={4000} value={form[k]}
     onChange={e=>change(k,e.target.value)}/>
   </label>)}
   <p className="text-xs text-muted-foreground">
     Activating requires a Mentor; completing requires an approved final submission.
     Historical In progress, Ready and Blocked stages remain in the Phase field
     while vNext uses the Planned/Active lifecycle.
   </p>
   {dirty&&form.title.trim().length===0?<p role="alert" className="text-sm text-error">Title is required</p>:null}
   <Button type="button" disabled={busy} onClick={()=>void save()}
    >{busy?"Saving…":"Save changes"}</Button>
   <Button variant="secondary" type="button" disabled={busy} onClick={discard.requestClose}
    className="ml-2">Cancel</Button>
  </div>:null}
  {error?<Banner tone="error">{error}</Banner>:null}
  {dialog}
  <ConfirmDialog open={discard.discardOpen} onOpenChange={discard.setDiscardOpen}
    title="Discard unsaved changes?"
    description="Leave this workspace settings form without saving?"
    confirmLabel="Discard changes" pending={busy} onConfirm={discard.confirmDiscard} />
 </section>;
}
