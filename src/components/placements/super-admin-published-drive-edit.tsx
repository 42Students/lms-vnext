"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Button} from "@/components/ui/button";
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
 const {pending,run}=useGuardedAction();
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  const data=new FormData(event.currentTarget);
  await run(async()=>{
   setError("");
   try{
    await apiFetch("/api/admin/placements/jobs/"+encodeURIComponent(job.id)+"/edit-published",{
     method:"PATCH",headers:{"content-type":"application/json"},
     body:JSON.stringify({confirmed:true,expectedUpdatedAt:job.updatedAt,
      reason:String(data.get("reason")??"").trim(),title:String(data.get("title")??"").trim(),
      description:String(data.get("description")??"").trim(),
      locations:String(data.get("locations")??"").split(",").map(s=>s.trim()).filter(Boolean),
      applicationDeadline:driveDeadlineIstToIso(String(data.get("deadline")??"")),
      openings:nullableNumber(data.get("openings")),
      minimumAnnualCtcInr:nullableNumber(data.get("minimumAnnualCtcInr")),
      maximumAnnualCtcInr:nullableNumber(data.get("maximumAnnualCtcInr")),
     }),
    });
    setOpen(false);router.refresh();
   }catch(e){
    const fallback=e instanceof Error?e.message:"Unable to edit this drive. Refresh and retry.";
    setError(superAdminPublishedDriveEditFeedback(e instanceof FriendlyFetchError?e.code:null,fallback));
   }
  });
 }
 const cls="min-h-11 w-full min-[768px]:min-h-9";
 return <section className="space-y-3 border-b border-border pb-5">
  <h2 className="font-semibold">Edit published drive</h2>
  <p className="text-xs text-body">Edits apply to future applicants. Existing applications and offer decisions remain unchanged.</p>
  {!open?<Button type="button" variant="secondary" onClick={()=>setOpen(true)}>
   Edit published drive</Button>:
   <form className="grid gap-3 md:grid-cols-2" onSubmit={e=>void save(e)}>
    <label className="grid gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Title<Input name="title" required minLength={3} maxLength={100}
     defaultValue={job.title} className={cls}/></label>
    <label className="grid gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Application deadline (IST)<Input type="datetime-local" required
     name="deadline" defaultValue={istLocal(job.applicationDeadline)} className={cls}/></label>
    <label className="grid gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] md:col-span-2">Description<Textarea name="description"
     maxLength={15000} defaultValue={job.description} rows={4} className={cls}/></label>
    <label className="grid gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] md:col-span-2">Locations (comma-separated)<Input name="locations"
     defaultValue={job.locations.join(", ")} className={cls}/></label>
    <label className="grid gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Openings<Input name="openings" type="number" min={1}
     defaultValue={job.openings??""} className={cls}/></label>
    <label className="grid gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Minimum annual CTC (INR)<Input name="minimumAnnualCtcInr"
     type="number" min={0} defaultValue={job.minCtc??""} className={cls}/></label>
    <label className="grid gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Maximum annual CTC (INR)<Input name="maximumAnnualCtcInr"
     type="number" min={0} defaultValue={job.maxCtc??""} className={cls}/></label>
    <label className="grid gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] md:col-span-2">Reason for edit
     <Textarea name="reason" required minLength={10} maxLength={1000} rows={2} className={cls}/></label>
    {error?<p role="alert" className="text-sm text-error md:col-span-2">{error}</p>:null}
    <div className="flex flex-wrap gap-3 md:col-span-2">
     <Button type="submit" disabled={pending}>
      {pending?"Saving…":"Review and save published changes"}</Button>
     <Button type="button" variant="secondary" disabled={pending} onClick={()=>setOpen(false)}>Cancel</Button>
    </div>
   </form>}
 </section>;
}
