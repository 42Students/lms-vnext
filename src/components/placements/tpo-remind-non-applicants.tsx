"use client";
import {useState} from "react";
import { Button } from "@/components/ui/button";
type Preview={count:number;day:string;alreadySent:boolean;allowed:boolean;reason:string|null;previewToken:string|null};
export function TpoRemindNonApplicants({jobId}:{jobId:string}){
 const [open,setOpen]=useState(false);const [preview,setPreview]=useState<Preview|null>(null);
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 const [outcome,setOutcome]=useState("");const [confirmed,setConfirmed]=useState(false);
 const href="/api/placements/tpo/jobs/"+encodeURIComponent(jobId)+"/remind-not-applied";
 async function previewReminder(){
  setBusy(true);setError("");setOutcome("");setConfirmed(false);
  try{const response=await fetch(href,{credentials:"same-origin",cache:"no-store"});
   const data=await response.json() as Preview&{error?:string};
   if(!response.ok)throw Error(data.error??"Could not preview reminders");
   setPreview(data);setOpen(true);
  }catch(e){setError(e instanceof Error?e.message:"Preview failed");}
  finally{setBusy(false);}
 }
 async function send(){
  if(!preview?.previewToken||!confirmed||busy)return;
  setBusy(true);setError("");
  try{const response=await fetch(href,{method:"POST",credentials:"same-origin",
   headers:{"content-type":"application/json"},body:JSON.stringify({
    action:"REMIND",confirmed:true,expectedPreviewToken:preview.previewToken,
   })});
   const data=await response.json() as {error?:string;reminded?:number;alreadySent?:boolean;reason?:string|null};
   if(!response.ok)throw Error(data.error??"Reminder could not be sent");
   setOutcome(data.alreadySent?"Already reminded today":
    data.reminded+" eligible registered students were reminded in-app.");
   setOpen(false);setPreview(null);
  }catch(e){setError(e instanceof Error?e.message:"Reminder failed. Refresh the preview.");}
  finally{setBusy(false);}
 }
 return <div className="inline-flex flex-col gap-1">
  <Button variant="secondary" type="button" disabled={busy} onClick={()=>void previewReminder()}>
   {busy?"Checking…":"Remind students who haven't applied"}</Button>
  {outcome?<span role="status" className="text-xs text-body">{outcome}</span>:null}
  {error&&!open?<span role="alert" className="text-xs text-error">{error}</span>:null}
  {open&&preview?<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
   <div role="dialog" aria-modal="true" aria-label="Review not-applied reminder"
    className="w-full max-w-xl space-y-4 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-6 shadow-xl">
    <h2 className="text-lg font-semibold">Remind students who haven&apos;t applied</h2>
    <p className="text-sm text-body">{preview.count} eligible registered students have not applied to this drive.
     These students will receive an in-app notification linking to the drive. Reminders are allowed once per drive each day before the deadline.</p>
    {preview.alreadySent?<p role="status" className="text-sm">Students were already reminded today ({preview.day}).</p>:null}
    {!preview.allowed?<p role="alert" className="text-sm text-error">{preview.reason}</p>:null}
    <label className="flex items-center gap-3 text-sm">
     <input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>
     I reviewed the affected count and want to remind these students.</label>
    {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
    <div className="flex flex-wrap gap-3">
     <button type="button" disabled={!confirmed||busy||!preview.allowed||preview.alreadySent||!preview.count}
      onClick={()=>void send()} className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] bg-primary px-4 font-[650] disabled:opacity-50 text-primary-foreground">
      {busy?"Sending…":"Remind "+preview.count+" students"}</button>
     <button type="button" disabled={busy} onClick={()=>{setOpen(false);setError("");}}
      className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-4">Cancel</button>
    </div>
   </div>
  </div>:null}
 </div>;
}
