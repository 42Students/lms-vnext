"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useToast} from "@/components/ui/toast";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {superAdminPublishedDriveEditFeedback} from "@/modules/placements/super-admin-published-drive-edit-feedback";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {driveDeadlineIstToIso} from "@/modules/placements/tpo-drive-deadline-ist";
import {beginDriveMutation,endDriveMutation} from "@/modules/placements/drive-mutation-client-lock";
type Job={id:string;title:string;description:string;locations:string[];
 applicationDeadline:string|null;openings:number|null;minCtc:number|null;maxCtc:number|null;updatedAt:string;
 jobTypeLabel:string;employmentType:"FULL_TIME"|"INTERNSHIP"|"CONTRACT";
 workMode:"ONSITE"|"HYBRID"|"REMOTE";responsibilities:string;
 targeting:{programs:number;cohorts:number;sections:number}|null};
function istLocal(value:string|null){
 if(!value)return "";
 return new Intl.DateTimeFormat("sv-SE",{
  timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  hour:"2-digit",minute:"2-digit",hourCycle:"h23",
 }).format(new Date(value)).replace(" ","T");
}
function nullableNumber(value:FormDataEntryValue|null){
 const s=String(value??"").trim();
 return s===""?null:Number(s);
}
export function SuperAdminPublishedDriveEdit({job,jobTypes,sourceReady=true}:{
 job:Job;jobTypes:readonly {label:string}[];sourceReady?:boolean;
}){
 const router=useRouter(),[open,setOpen]=useState(false),[error,setError]=useState("");
 const {showToast}=useToast();
 const [staleConflict,setStaleConflict]=useState(false);
 const [dirty,setDirty]=useState(false);
 const [confirmLeave,setConfirmLeave]=useState(false);
 const [leaveHref,setLeaveHref]=useState<string|null>(null);
 const {pending,run}=useGuardedAction();
 const formRef=useRef<HTMLFormElement>(null);
 const [confirmSave,setConfirmSave]=useState(false);
 useEffect(()=>{
  if(!open||!dirty)return;
  const beforeUnload=(event:BeforeUnloadEvent)=>{
   event.preventDefault();
   event.returnValue="";
  };
  const interceptInternalLink=(event:MouseEvent)=>{
   if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey)return;
   const source=event.target;
   if(!(source instanceof Element))return;
   const anchor=source.closest("a[href]");
   if(!anchor||anchor.hasAttribute("download")||anchor.getAttribute("target")==="_blank")return;
   const href=anchor.getAttribute("href");
   if(!href||!href.startsWith("/")||href.startsWith("//"))return;
   event.preventDefault();
   setLeaveHref(href);
   setConfirmLeave(true);
  };
  window.addEventListener("beforeunload",beforeUnload);
  document.addEventListener("click",interceptInternalLink,true);
  return ()=>{
   window.removeEventListener("beforeunload",beforeUnload);
   document.removeEventListener("click",interceptInternalLink,true);
  };
 },[open,dirty]);
 function closeEditor(){
  if(dirty){setLeaveHref(null);setConfirmLeave(true);}
  else setOpen(false);
 }
 function reviewSave(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(pending||!sourceReady){setError("Saved job details could not be verified. Reload before editing.");return;}
  const data=new FormData(event.currentTarget);
  const description=String(data.get("description")??"").trim();
  if(!description.replace(/<[^>]*>/g,"").trim()){
   setError("Please enter job description.");return;
  }
  const min=nullableNumber(data.get("minimumAnnualCtcInr"));
  const max=nullableNumber(data.get("maximumAnnualCtcInr"));
  if(min!==null&&max!==null&&max<min){
   setError("Maximum CTC must be at least the minimum.");return;
  }
  setError("");
  setConfirmSave(true);
 }
 async function save(){
  if(!formRef.current||pending||!sourceReady)return;
  const data=new FormData(formRef.current);
  const description=String(data.get("description")??"").trim();
  if(!description.replace(/<[^>]*>/g,"").trim()){
   setError("Please enter job description.");return;
  }
  const enteredDeadline=String(data.get("deadline")??"");
  const applicationDeadline=enteredDeadline===istLocal(job.applicationDeadline)
   ? job.applicationDeadline : driveDeadlineIstToIso(enteredDeadline);
  setConfirmSave(false);
  if(!beginDriveMutation(job.id)){
   setError("Another action is changing this drive. Retry after it finishes.");return;
  }
  try{await run(async()=>{
   setError("");
   try{
    await apiFetch("/api/admin/placements/jobs/"+encodeURIComponent(job.id)+"/edit-published",{
     method:"PATCH",headers:{"content-type":"application/json"},
     body:JSON.stringify({confirmed:true,expectedUpdatedAt:job.updatedAt,
      reason:String(data.get("reason")??"").trim(),title:String(data.get("title")??"").trim(),
      description,
      responsibilities:String(data.get("responsibilities")??"").trim(),
      jobTypeLabel:String(data.get("jobTypeLabel")??"").trim(),
      employmentType:String(data.get("employmentType")??""),
      workMode:String(data.get("workMode")??""),
      locations:String(data.get("locations")??"").split(",").map(s=>s.trim()).filter(Boolean),
      applicationDeadline,
      openings:nullableNumber(data.get("openings")),
      minimumAnnualCtcInr:nullableNumber(data.get("minimumAnnualCtcInr")),
      maximumAnnualCtcInr:nullableNumber(data.get("maximumAnnualCtcInr")),
     }),
    });
    setDirty(false);setOpen(false);
    showToast({tone:"success",title:"Job updated"});
    router.refresh();
   }catch(e){
    const fallback=e instanceof Error?e.message:"Unable to edit this drive. Refresh and retry.";
    if(e instanceof FriendlyFetchError && (e.code==="PLACEMENT_JOB_STALE" || e.status===409)){
     setStaleConflict(true);
     setError("");
    }else{
     setError(superAdminPublishedDriveEditFeedback(e instanceof FriendlyFetchError?e.code:null,fallback));
    }
   }
  });}finally{endDriveMutation(job.id);}
 }
 const cls="min-h-11 w-full min-[768px]:min-h-9";
 return <section className="min-w-0 space-y-[var(--lms-space-3)] border-b border-border pb-[var(--lms-space-4)]">
  <h2 className="font-semibold">Edit published drive</h2>
  <p className="text-xs text-body">Edits apply to future applicants. Existing applications and offer decisions remain unchanged.</p>
  {!sourceReady?<p role="alert" className="text-sm text-error">Saved job options or eligibility details could not be loaded. Reload settings before editing; no partial changes can be saved.</p>:null}
  {!open?<Button type="button" variant="secondary" disabled={!sourceReady} onClick={()=>{setDirty(false);setOpen(true);}}>
   Edit published drive</Button>:
   <form ref={formRef} className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-3)] sm:grid-cols-2" onChange={()=>setDirty(true)} onSubmit={reviewSave}>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Title<Input name="title" required minLength={3} maxLength={100}
     defaultValue={job.title} className={cls}/></label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Application deadline (IST)<Input type="datetime-local" required
     name="deadline" defaultValue={istLocal(job.applicationDeadline)} className={cls}/></label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] sm:col-span-2">Description<Textarea name="description" required
     maxLength={15000} defaultValue={job.description} rows={4} className={cls}/></label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] sm:col-span-2">Responsibilities
     <Textarea name="responsibilities" maxLength={15000} rows={3} defaultValue={job.responsibilities} className={cls}/></label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Job Type
     <Select name="jobTypeLabel" required defaultValue={job.jobTypeLabel} className={cls}>
      {jobTypes.map(type=><option key={type.label} value={type.label}>{type.label}</option>)}
      {job.jobTypeLabel&&!jobTypes.some(type=>type.label===job.jobTypeLabel)?
       <option value={job.jobTypeLabel}>{job.jobTypeLabel} (historic)</option>:null}
     </Select></label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Employment type
     <Select name="employmentType" required defaultValue={job.employmentType} className={cls}>
      <option value="FULL_TIME">Full-time</option><option value="INTERNSHIP">Internship</option>
      <option value="CONTRACT">Contract</option>
     </Select></label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Work mode
     <Select name="workMode" required defaultValue={job.workMode} className={cls}>
      <option value="ONSITE">Onsite</option><option value="HYBRID">Hybrid</option>
      <option value="REMOTE">Remote</option>
     </Select></label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] sm:col-span-2">Locations (comma-separated)<Input name="locations"
     defaultValue={job.locations.join(", ")} className={cls}/></label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Openings<Input name="openings" type="number" min={1}
     defaultValue={job.openings??""} className={cls}/></label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Minimum annual CTC (INR)<Input name="minimumAnnualCtcInr"
     type="number" min={0} defaultValue={job.minCtc??""} className={cls}/></label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Maximum annual CTC (INR)<Input name="maximumAnnualCtcInr"
     type="number" min={0} defaultValue={job.maxCtc??""} className={cls}/></label>
    <div className="sm:col-span-2 border-y border-border py-3 text-sm">
     <p className="font-semibold">Target Audience · Department / Program / Batch / Class</p>
     <p className="mt-1 text-body">Published eligibility targeting is locked to protect existing applicant policy and historical evaluations. Duplicate this drive as a draft to change the dependent academic audience; blank restrictions mean all eligible students within the selected college.</p>
     {job.targeting?<p className="mt-1 text-muted-foreground">Saved restrictions: {job.targeting.programs} programs · {job.targeting.cohorts} batches · {job.targeting.sections} classes.</p>:<p role="alert" className="text-error">Eligibility policy could not be verified.</p>}
    </div>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] sm:col-span-2">Reason for edit
     <Textarea name="reason" required minLength={10} maxLength={1000} rows={2} className={cls}/></label>
    {error?<p role="alert" className="text-sm text-error sm:col-span-2">{error}</p>:null}
    <div className="flex min-w-0 flex-col gap-[var(--lms-space-2)] sm:flex-row sm:flex-wrap sm:items-center sm:col-span-2">
     <Button type="submit" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={pending||!sourceReady}>
      {pending?"Saving…":"Review and save published changes"}</Button>
     <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={pending} onClick={closeEditor}>Cancel</Button>
    </div>
   </form>}
   <ConfirmDialog open={confirmSave} onOpenChange={setConfirmSave}
    title="Save published drive changes?"
    description="Review the edited fields and the mandatory reason. These changes are audited; existing applicant and offer decisions will not be rewritten."
    confirmLabel="Save published changes" cancelLabel="Keep editing" pending={pending}
    onConfirm={()=>void save()}/>
   <ConfirmDialog open={confirmLeave} onOpenChange={setConfirmLeave}
    title="Discard unsaved changes?" description="Your changes to this drive have not been saved."
    confirmLabel="Discard changes" cancelLabel="Keep editing"
    onConfirm={()=>{
     const destination=leaveHref;
     setConfirmLeave(false);setLeaveHref(null);setDirty(false);setOpen(false);
     if(destination)router.push(destination);
    }}/>
   <ConfirmDialog open={staleConflict} onOpenChange={setStaleConflict}
    title="This drive changed since you loaded it"
    description="Reload the current drive details before saving, or dismiss to review your unsaved changes."
    confirmLabel="Reload" cancelLabel="Dismiss" confirmVariant="primary"
    onConfirm={()=>{
     setStaleConflict(false);setConfirmLeave(false);setLeaveHref(null);
     setDirty(false);setOpen(false);setError("");
     router.refresh();
    }}/>
 </section>;
}
