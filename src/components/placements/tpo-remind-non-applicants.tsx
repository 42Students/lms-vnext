"use client";
import {useState} from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import {InlineNotice} from "@/components/ui/inline-notice";
import {parseTpoReminderPreview,tpoReminderReceiptMessage,type TpoReminderPreview} from "@/modules/placements/tpo-reminder-result-model";

export function TpoRemindNonApplicants({jobId}:{jobId:string}){
 const [open,setOpen]=useState(false);const [preview,setPreview]=useState<TpoReminderPreview|null>(null);
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 const [outcome,setOutcome]=useState("");const [confirmed,setConfirmed]=useState(false);
 const href="/api/placements/tpo/jobs/"+encodeURIComponent(jobId)+"/remind-not-applied";
 async function previewReminder(){
  setBusy(true);setError("");setOutcome("");setConfirmed(false);
  try{const response=await fetch(href,{credentials:"same-origin",cache:"no-store"});
   const payload:unknown=await response.json();
   if(!response.ok)throw Error("Could not preview reminders");
   const data=parseTpoReminderPreview(payload);
   if(!data)throw Error("Reminder preview could not be verified. Retry.");
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
   const payload:unknown=await response.json();
   if(!response.ok)throw Error("Reminder could not be sent");
   const summary=tpoReminderReceiptMessage(payload,preview.count);
   if(!summary)throw Error("Reminder result could not be verified. Refresh the preview.");
   setOutcome(summary);
   setOpen(false);setPreview(null);
  }catch(e){setError(e instanceof Error?e.message:"Reminder failed. Refresh the preview.");}
  finally{setBusy(false);}
 }
 return <div className="flex min-w-0 flex-col gap-1 sm:items-start">
  <Button variant="secondary" type="button" loading={busy&&!open} disabled={busy} className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={()=>void previewReminder()}>
   {busy?"Checking…":"Remind students who haven't applied"}</Button>
  {outcome?<InlineNotice tone="success" message={outcome}/>:null}
  {error&&!open?<InlineNotice tone="error" message={error}/>:null}
  {preview?<Dialog open={open} onOpenChange={next=>{if(!busy)setOpen(next);}} dismissible={!busy}
    title="Remind students who haven't applied" className="max-w-xl"
    footer={<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button className="min-h-11 w-full sm:w-auto md:min-h-9" variant="secondary" type="button" disabled={busy} onClick={()=>{setOpen(false);setError("");}}>Cancel</Button>
      <Button className="min-h-11 w-full sm:w-auto md:min-h-9" variant="primary" loading={busy}
        disabled={!confirmed||busy||!preview.allowed||preview.alreadySent||!preview.count}
        onClick={()=>void send()}>{busy?"Sending…":"Remind "+preview.count+" students"}</Button>
    </div>}>
   <div className="min-w-0 space-y-4 break-words">
    <p className="text-sm text-body">{preview.count} eligible registered students have not applied to this drive.
     These students will receive an in-app notification linking to the drive. Reminders are allowed once per drive each day before the deadline.</p>
    {preview.alreadySent?<InlineNotice tone="info" message={"Students were already reminded today ("+preview.day+")."}/>:null}
    {!preview.allowed?<InlineNotice tone="error" message={preview.reason??"Reminder unavailable."}/>:null}
    <label className="flex min-h-11 min-w-0 items-start gap-3 break-words text-sm text-body">
     <Checkbox className="mt-1" checked={confirmed} disabled={busy||!preview.allowed||preview.alreadySent||!preview.count} onChange={e=>setConfirmed(e.target.checked)}/>
     I reviewed the affected count and want to remind these students.</label>
    {error?<InlineNotice tone="error" message={error}/>:null}

   </div>
  </Dialog>:null}
 </div>;
}
