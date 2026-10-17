"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
export function CollegeDriveDeadlineAction({jobId,title,currentDeadline}:{
 jobId:string;title:string;currentDeadline:string|null;
}){
 const router=useRouter();
 const [open,setOpen]=useState(false);
 const [value,setValue]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [done,setDone]=useState("");
 const current=currentDeadline?new Intl.DateTimeFormat("en-IN",{
  dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
 }).format(new Date(currentDeadline))+" IST":"Not set";
 async function save(){
  if(!value||busy)return;
  const deadline=new Date(value+"+05:30");
  if(!Number.isFinite(deadline.getTime())){setError("Enter a valid date and time.");return;}
  if(!window.confirm("Extend deadline for "+title+"?"))return;
  setBusy(true);setError("");setDone("");
  try{
   const response=await fetch("/api/placements/college/jobs/"+encodeURIComponent(jobId)+"/extend-deadline",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({deadline:deadline.toISOString(),confirmed:true}),
   });
   const result=await response.json().catch(()=>null);
   if(!response.ok)throw Error(result?.error??"Could not extend deadline");
   setDone("Deadline extended to "+new Intl.DateTimeFormat("en-IN",{
    dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(new Date(result.deadline))+".");
   setOpen(false);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Could not extend deadline");}
  finally{setBusy(false);}
 }
 return <div className="inline-block">
  <button type="button" onClick={()=>{setOpen(true);setError("");}}
   className="min-h-10 rounded border border-border px-3 text-sm font-semibold text-primary-text">Extend deadline</button>
  {done?<p role="status" className="text-xs">{done}</p>:null}
  {open?<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
   <section role="dialog" aria-modal="true" aria-label={"Extend deadline — "+title}
    className="w-full max-w-lg space-y-4 rounded-xl bg-surface p-6 shadow-xl">
    <h2 className="text-lg font-semibold">Extend deadline — {title}</h2>
    <p className="text-sm">Current deadline: {current}</p>
    <label className="grid gap-1 text-sm">New application deadline (IST)
     <input type="datetime-local" value={value} onChange={e=>setValue(e.target.value)}
      className="min-h-11 rounded border border-border bg-surface px-3"/>
    </label>
    {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
    <div className="flex gap-3">
     <button type="button" disabled={busy||!value} onClick={()=>void save()}
      className="min-h-11 rounded bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
      {busy?"Extending…":"Extend"}</button>
     <button type="button" disabled={busy} onClick={()=>setOpen(false)}
      className="min-h-11 rounded border border-border px-4">Cancel</button>
    </div>
   </section>
  </div>:null}
 </div>;
}
