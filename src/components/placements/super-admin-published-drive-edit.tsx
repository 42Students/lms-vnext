"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Button} from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useToast} from "@/components/ui/toast";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {superAdminPublishedDriveEditFeedback} from "@/modules/placements/super-admin-published-drive-edit-feedback";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {driveDeadlineIstToIso} from "@/modules/placements/tpo-drive-deadline-ist";
type Job={id:string;title:string;description:string;locations:string[];
 applicationDeadline:string|null;openings:number|null;minCtc:number|null;maxCtc:number|null;updatedAt:string};
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
export function SuperAdminPublishedDriveEdit({job}:{job:Job}){
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
  if(pending)return;
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
  if(!formRef.current||pending)return;
  const data=new FormData(formRef.current);
  const description=String(data.get("description")??"").trim();
  if(!description.replace(/<[^>]*>/g,"").trim()){
   setError("Please enter job description.");return;
  }
  const enteredDeadline=String(data.get("deadline")??"");
  const applicationDeadline=enteredDeadline===istLocal(job.applicationDeadline)
   ? job.applicationDeadline : driveDeadlineIstToIso(enteredDeadline);
  setConfirmSave(false);
  await run(async()=>{
   setError("");
   try{
    await apiFetch("/api/admin/placements/jobs/"+encodeURIComponent(job.id)+"/edit-published",{
     method:"PATCH",headers:{"content-type":"application/json"},
     body:JSON.stringify({confirmed:true,expectedUpdatedAt:job.updatedAt,
      reason:String(data.get("reason")??"").trim(),title:String(data.get("title")??"").trim(),
      description,
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
  });
 }
 const cls="min-h-11 w-full min-[768px]:min-h-9";
 return <section className="min-w-0 space-y-[var(--lms-space-3)] border-b border-border pb-[var(--lms-space-4)]">
  <h2 className="font-semibold">Edit published drive</h2>
  <p className="text-xs text-body">Edits apply to future applicants. Existing applications and offer decisions remain unchanged.</p>
  {!open?<Button type="button" variant="secondary" onClick={()=>{setDirty(false);setOpen(true);}}>
   Edit published drive</Button>:
   <form ref={formRef} className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-3)] sm:grid-cols-2" onChange={()=>setDirty(true)} onSubmit={reviewSave}>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Title<Input name="title" required minLength={3} maxLength={100}
     defaultValue={job.title} className={cls}/></label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Application deadline (IST)<Input type="datetime-local" required
     name="deadline" defaultValue={istLocal(job.applicationDeadline)} className={cls}/></label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] sm:col-span-2">Description<Textarea name="description" required
     maxLength={15000} defaultValue={job.description} rows={4} className={cls}/></label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] sm:col-span-2">Locations (comma-separated)<Input name="locations"
     defaultValue={job.locations.join(", ")} className={cls}/></label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Openings<Input name="openings" type="number" min={1}
     defaultValue={job.openings??""} className={cls}/></label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Minimum annual CTC (INR)<Input name="minimumAnnualCtcInr"
     type="number" min={0} defaultValue={job.minCtc??""} className={cls}/></label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Maximum annual CTC (INR)<Input name="maximumAnnualCtcInr"
     type="number" min={0} defaultValue={job.maxCtc??""} className={cls}/></label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] sm:col-span-2">Reason for edit
     <Textarea name="reason" required minLength={10} maxLength={1000} rows={2} className={cls}/></label>
    {error?<p role="alert" className="text-sm text-error sm:col-span-2">{error}</p>:null}
    <div className="flex min-w-0 flex-col gap-[var(--lms-space-2)] sm:flex-row sm:flex-wrap sm:items-center sm:col-span-2">
     <Button type="submit" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={pending}>
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
