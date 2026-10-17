"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
type Deadline={id:string;updatedAt:string;applicationDeadline:string|null};
export function TpoDriveDeadlineForm({job}:{job:Deadline}){
 const router=useRouter();const [pending,setPending]=useState(false);const [error,setError]=useState<string|null>(null);
 const initial=job.applicationDeadline?new Date(job.applicationDeadline).toLocaleString("sv-SE",{timeZone:"Asia/Kolkata"}).replace(" ","T").slice(0,16):"";
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(pending)return;
  const values=new FormData(event.currentTarget);
  const dateText=String(values.get("newDeadline")??"");
  const parsed=new Date(dateText+"+05:30");
  if(!Number.isFinite(parsed.getTime())){setError("Enter a valid IST deadline.");return;}
  if(parsed.getTime()<=Date.now()){
    setError("Set the deadline to a future IST date and time.");return;
  }
  if(job.applicationDeadline&&parsed.getTime()<=new Date(job.applicationDeadline).getTime()){
    setError("The new deadline must be later than the current deadline.");return;
  }
  if(!window.confirm(job.applicationDeadline?
  "Extend the published application deadline? Applicants will have more time, and this action is audited.":
  "Set the published application deadline? Students will see when applications close, and this action is audited."))return;
  setPending(true);setError(null);
  try{
   const response=await fetch("/api/placements/tpo/jobs/"+job.id+"/extend-deadline",{
    method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
    body:JSON.stringify({confirmed:true,expectedUpdatedAt:job.updatedAt,
      reason:String(values.get("reason")??""),newDeadlineIso:parsed.toISOString()}),
   });
   if(!response.ok){const body=await response.json().catch(()=>null) as {error?:string}|null;
    throw Error(body?.error??"Deadline changed; refresh and retry.");}
   router.push("/tpo/placements/jobs/"+job.id);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Deadline extension failed");}finally{setPending(false);}
 }
 return <form onSubmit={event=>void submit(event)}
  className="space-y-4 rounded-xl border border-border bg-surface p-5">
   {job.applicationDeadline?<p className="text-sm text-body">Current deadline: {
    new Date(job.applicationDeadline).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST</p>:null}
   <label className="block text-sm font-semibold text-body">New application deadline (IST)
    <input required type="datetime-local" name="newDeadline" defaultValue={initial}
     className="mt-2 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground"/></label>
   <label className="block text-sm font-semibold text-body">Reason (immutable audit)
    <textarea required name="reason" minLength={10} maxLength={1000} rows={3}
     className="mt-2 min-h-20 w-full rounded-md border border-border bg-surface p-3 text-foreground"/></label>
   <p className="text-xs text-body">{job.applicationDeadline?
    "New deadline must be later than the current deadline and in the future.":
    "First deadline must be in the future."} Expiry is validated again under the database lock.</p>
   {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
   <button disabled={pending} type="submit" className="min-h-11 rounded-md bg-primary px-5 font-semibold text-on-primary disabled:opacity-50">
    {pending?"Saving…":job.applicationDeadline?"Review and extend deadline":"Review and set deadline"}</button>
  </form>;
}
