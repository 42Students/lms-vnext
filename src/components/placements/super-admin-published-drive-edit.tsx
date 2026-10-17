"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
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
   }catch(e){setError(e instanceof Error?e.message:"Unable to edit this drive. Refresh and retry.");}
  });
 }
 const cls="min-h-10 w-full rounded border border-border bg-surface p-2";
 return <section className="space-y-2 rounded-xl border border-border bg-surface p-5">
  <h2 className="font-semibold">Edit published drive</h2>
  <p className="text-xs text-body">Edits apply to future applicants. Existing applications and offer decisions remain unchanged.</p>
  {!open?<button type="button" onClick={()=>setOpen(true)}
   className="min-h-10 rounded border border-border px-4 font-semibold text-primary-text">
   Edit published drive</button>:
   <form className="grid gap-3 sm:grid-cols-2" onSubmit={e=>void save(e)}>
    <label className="grid gap-1 text-sm">Title<input name="title" required minLength={3} maxLength={100}
     defaultValue={job.title} className={cls}/></label>
    <label className="grid gap-1 text-sm">Application deadline (IST)<input type="datetime-local" required
     name="deadline" defaultValue={istLocal(job.applicationDeadline)} className={cls}/></label>
    <label className="grid gap-1 text-sm sm:col-span-2">Description<textarea name="description"
     maxLength={15000} defaultValue={job.description} rows={4} className={cls}/></label>
    <label className="grid gap-1 text-sm sm:col-span-2">Locations (comma-separated)<input name="locations"
     defaultValue={job.locations.join(", ")} className={cls}/></label>
    <label className="grid gap-1 text-sm">Openings<input name="openings" type="number" min={1}
     defaultValue={job.openings??""} className={cls}/></label>
    <label className="grid gap-1 text-sm">Minimum annual CTC (INR)<input name="minimumAnnualCtcInr"
     type="number" min={0} defaultValue={job.minCtc??""} className={cls}/></label>
    <label className="grid gap-1 text-sm">Maximum annual CTC (INR)<input name="maximumAnnualCtcInr"
     type="number" min={0} defaultValue={job.maxCtc??""} className={cls}/></label>
    <label className="grid gap-1 text-sm sm:col-span-2">Reason for edit
     <textarea name="reason" required minLength={10} maxLength={1000} rows={2} className={cls}/></label>
    {error?<p role="alert" className="text-sm text-error sm:col-span-2">{error}</p>:null}
    <div className="flex flex-wrap gap-3 sm:col-span-2">
     <button type="submit" disabled={pending}
      className="min-h-10 rounded bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
      {pending?"Saving…":"Review and save published changes"}</button>
     <button type="button" disabled={pending} onClick={()=>setOpen(false)}
      className="min-h-10 rounded border border-border px-4">Cancel</button>
    </div>
   </form>}
 </section>;
}
