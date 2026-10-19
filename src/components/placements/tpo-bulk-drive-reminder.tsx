"use client";
import {useState,type MouseEvent} from "react";

/** TPO-drives-13/14: only acts on currently selected, visible drives. */
export function TpoBulkDriveReminder(){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");
 async function remind(event:MouseEvent<HTMLButtonElement>){
  const form=event.currentTarget.form;
  if(!form||busy)return;
  const ids=[...new Set(new FormData(form).getAll("ids").filter((v):v is string=>typeof v==="string"))];
  if(!ids.length||ids.length>10){setError("Choose between 1 and 10 drives on this page.");return;}
  if(!window.confirm("Preview and send one daily reminder for eligible students who have not applied to these "+ids.length+" drives?"))return;
  setBusy(true);setError("");setMessage("");
  let sent=0,skipped=0,failed=0;
  for(const id of ids){
   try{
    const href="/api/placements/tpo/jobs/"+encodeURIComponent(id)+"/remind-not-applied";
    const previewResponse=await fetch(href,{credentials:"same-origin",cache:"no-store"});
    const preview=await previewResponse.json() as {allowed?:boolean;alreadySent?:boolean;count?:number;previewToken?:string;error?:string};
    if(!previewResponse.ok)throw Error(preview.error??"Could not preview reminder");
    if(!preview.allowed||preview.alreadySent||!preview.count||!preview.previewToken){skipped++;continue;}
    const sentResponse=await fetch(href,{method:"POST",credentials:"same-origin",
     headers:{"Content-Type":"application/json"},body:JSON.stringify({
      action:"REMIND",confirmed:true,expectedPreviewToken:preview.previewToken,
     })});
    const outcome=await sentResponse.json() as {reminded?:number;alreadySent?:boolean;error?:string};
    if(!sentResponse.ok)throw Error(outcome.error??"Reminder failed");
    sent+=outcome.reminded??0;
    if(outcome.alreadySent)skipped++;
   }catch{failed++;}
  }
  setMessage(sent+" learners reminded; "+skipped+" drives skipped; "+failed+" drives failed.");
  setBusy(false);
 }
 return <div className="flex flex-col gap-1">
  <div className="flex flex-wrap gap-3 text-xs">
   <button type="button" disabled={busy} className="font-semibold text-primary-text"
    onClick={event=>{event.currentTarget.form?.querySelectorAll<HTMLInputElement>('input[name="ids"]').forEach(input=>{input.checked=true;});}}>
    Select all visible drives
   </button>
   <button type="button" disabled={busy} className="font-semibold text-primary-text"
    onClick={event=>{event.currentTarget.form?.querySelectorAll<HTMLInputElement>('input[name="ids"]').forEach(input=>{input.checked=false;});}}>
    Clear selection
   </button>
  </div>
  <button type="button" disabled={busy} onClick={e=>void remind(e)}
   className="min-h-11 md:min-h-9 rounded-[9px] border border-border px-4 text-sm font-semibold text-primary-text disabled:opacity-50">
   {busy?"Checking selected drives…":"Remind non-applicants in selected drives"}
  </button>
  {message?<span role="status" className="text-xs text-body">{message}</span>:null}
  {error?<span role="alert" className="text-xs text-error">{error}</span>:null}
 </div>;
}
