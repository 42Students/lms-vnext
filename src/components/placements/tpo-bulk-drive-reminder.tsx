"use client";
import { Button } from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useState,type MouseEvent} from "react";

/** TPO-drives-13/14: only acts on currently selected, visible drives. */
export function TpoBulkDriveReminder(){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");
 const [hadFailures,setHadFailures]=useState(false);
 const [confirmOpen,setConfirmOpen]=useState(false),[selectedIds,setSelectedIds]=useState<string[]>([]);
 function review(event:MouseEvent<HTMLButtonElement>){
  const form=event.currentTarget.form;
  if(!form||busy)return;
  const ids=[...new Set(new FormData(form).getAll("ids").filter((v):v is string=>typeof v==="string"))];
  if(!ids.length||ids.length>10){setError("Choose between 1 and 10 drives on this page.");return;}
  setError("");setMessage("");
  setSelectedIds(ids);
  setConfirmOpen(true);
 }
 async function remind(){
  if(busy||!selectedIds.length)return;
  setConfirmOpen(false);
  const ids=selectedIds;
  setBusy(true);setError("");setMessage("");setHadFailures(false);
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
  setHadFailures(failed>0);
  setMessage(sent+" learners reminded; "+skipped+" drives skipped; "+failed+" drives failed.");
  setBusy(false);
 }
 return <div className="flex min-w-0 flex-col gap-3">
  <div className="flex min-w-0 flex-col gap-2 border-b border-border pb-3 text-xs sm:flex-row sm:flex-wrap">
   <Button variant="secondary" type="button" disabled={busy} className="min-h-11 w-full font-[650] text-primary-text sm:w-auto md:min-h-9"
    onClick={event=>{event.currentTarget.form?.querySelectorAll<HTMLInputElement>('input[name="ids"]').forEach(input=>{input.checked=true;});}}>
    Select all visible drives
   </Button>
   <Button variant="secondary" type="button" disabled={busy} className="min-h-11 w-full font-[650] text-primary-text sm:w-auto md:min-h-9"
    onClick={event=>{event.currentTarget.form?.querySelectorAll<HTMLInputElement>('input[name="ids"]').forEach(input=>{input.checked=false;});}}>
    Clear selection
   </Button>
  </div>
  <p className="text-xs leading-5 text-muted-foreground">Choose between 1 and 10 drives on this page.</p>
  <Button variant="secondary" type="button" disabled={busy} onClick={review}
   className="min-h-11 w-full sm:w-auto md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-[650] text-primary-text disabled:opacity-50">
   {busy?"Checking selected drives…":"Remind non-applicants in selected drives"}
  </Button>
  {message?<InlineNotice tone={hadFailures?"error":"success"} message={message}/>:null}
  {error?<InlineNotice tone="error" message={error}/>:null}
  <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen}
   title="Send eligible non-applicant reminders?"
   description={"Preview and send one reminder per rolling 20-hour window for eligible students who have not applied to these "+selectedIds.length+" drives?"}
   confirmLabel="Preview and send" confirmVariant="primary" pending={busy}
   onConfirm={()=>void remind()}/>
 </div>;
}
