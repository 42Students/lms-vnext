"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
export function TpoInterviewRescheduleForm({round}:{
 round:{id:string;updatedAt:string;scheduledAt:string|null;mode:string|null;venue:string|null;meetingUrl:string|null}
}){
 const router=useRouter(),[pending,setPending]=useState(false),[error,setError]=useState<string|null>(null);
 const initial=round.scheduledAt?new Date(round.scheduledAt).toLocaleString("sv-SE",{timeZone:"Asia/Kolkata"}).replace(" ","T").slice(0,16):"";
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(pending)return;
  const form=new FormData(event.currentTarget);
  if(!window.confirm("Reschedule this interview? Venue occupancy and version will be checked before saving, and the change is audited."))return;
  setPending(true);setError(null);
  try{
   const response=await fetch("/api/placements/tpo/interviews/"+round.id+"/reschedule",{
    method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
    body:JSON.stringify({confirmed:true,expectedUpdatedAt:round.updatedAt,
     localDateTime:String(form.get("localDateTime")??""),
     mode:String(form.get("mode")??"ON_CAMPUS"),
     venue:String(form.get("venue")??"").trim()||undefined,
     meetingUrl:String(form.get("meetingUrl")??"").trim()||undefined,
     reason:String(form.get("reason")??"").trim()}),
   });
   if(!response.ok){const body=await response.json().catch(()=>null) as {error?:string}|null;
    throw Error(body?.error??"Interview changed or venue was occupied; refresh before retrying.");}
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Interview reschedule failed");}
  finally{setPending(false);}
 }
 const field="mt-1 min-h-11 w-full rounded-md border border-border bg-surface p-2 text-foreground";
 return <form onSubmit={event=>void submit(event)} className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
  <label className="text-sm text-body">New interview time (IST)
   <input required type="datetime-local" name="localDateTime" defaultValue={initial} className={field}/></label>
  <label className="text-sm text-body">Mode
   <select name="mode" defaultValue={round.mode??"ON_CAMPUS"} className={field}>
    <option value="ON_CAMPUS">On campus</option><option value="VIRTUAL">Virtual</option>
   </select></label>
  <label className="text-sm text-body">Venue (for on-campus)
   <input name="venue" defaultValue={round.venue??""} className={field} maxLength={500}/></label>
  <label className="text-sm text-body">Meeting URL (for virtual)
   <input name="meetingUrl" type="url" defaultValue={round.meetingUrl??""} className={field}/></label>
  <label className="text-sm text-body sm:col-span-2">Reason (audited)
   <textarea required name="reason" minLength={10} maxLength={1000} rows={2} className={field}/></label>
  {error?<p role="alert" className="text-sm text-error sm:col-span-2">{error}</p>:null}
  <button type="submit" disabled={pending} className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary disabled:opacity-50 sm:col-span-2">
    {pending?"Rescheduling…":"Confirm interview reschedule"}</button>
 </form>;
}
