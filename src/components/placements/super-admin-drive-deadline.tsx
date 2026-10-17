"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
export function SuperAdminDriveDeadline({jobId,deadline}:{jobId:string;deadline:string|null}){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(busy)return;
  const values=new FormData(event.currentTarget),date=String(values.get("deadline")??"");
  const iso=new Date(date+"+05:30");
  if(!Number.isFinite(iso.getTime())||iso.getTime()<=Date.now()){
   setError("Choose a future deadline.");return;
  }
  if(deadline&&iso.getTime()<=new Date(deadline).getTime()){
   setError("The new deadline must be later than the existing deadline.");return;
  }
  if(!window.confirm("Extend the published application deadline? This affects when students can apply."))return;
  setBusy(true);setError("");
  try{
   const result=await fetch("/api/placements/college/jobs/"+encodeURIComponent(jobId)+"/extend-deadline",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({deadline:iso.toISOString(),confirmed:true}),
   });
   const data=await result.json().catch(()=>null);
   if(!result.ok)throw new Error(data?.error??"Deadline extension failed.");
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Deadline extension failed.");}
  finally{setBusy(false);}
 }
 return <form onSubmit={event=>void save(event)} className="space-y-3 rounded-xl border border-border bg-surface p-4">
  <h2 className="text-base font-semibold">Extend deadline</h2>
  <p className="text-sm text-body">Current deadline: {deadline?new Date(deadline).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})+" IST":"Not set"}</p>
  <label className="grid max-w-md gap-1 text-sm font-semibold">New application deadline (IST)
   <input name="deadline" type="datetime-local" required className="min-h-11 rounded-md border border-border bg-background px-3"/>
  </label>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  <button type="submit" disabled={busy} className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
   {busy?"Saving…":"Extend deadline"}</button>
 </form>;
}
