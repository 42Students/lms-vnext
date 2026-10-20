"use client";
import {useId,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Textarea} from "@/components/ui/textarea";
import {InlineNotice} from "@/components/ui/inline-notice";

type InterviewNextStatus="COMPLETED"|"NO_SHOW";
export function CollegeInterviewStatusActions({id,version,status}:{
 id:string;version:number;status:string;
}){
 const router=useRouter();
 const reasonId=useId();
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [messageTone,setMessageTone]=useState<"success"|"error">("success");
 const [next,setNext]=useState<InterviewNextStatus|null>(null);
 const [reason,setReason]=useState("");
 const [reasonError,setReasonError]=useState("");
 const title=next?"Mark this interview as "+(next==="NO_SHOW"?"No Show":"Completed")+"?":"";
 const reasonLabel=next?"Reason for interview "+next.toLowerCase().replaceAll("_"," ")+":":"";
 function close(){
  if(busy)return;
  setNext(null);setReason("");setReasonError("");
 }
 async function update(){
  if(!next||busy||status!=="SCHEDULED")return;
  const trimmed=reason.trim();
  if(trimmed.length<3){
   setReasonError("Enter a reason of at least 3 characters.");
   document.getElementById(reasonId)?.focus();
   return;
  }
  setBusy(true);setMessage("");setReasonError("");
  try{
   const res=await fetch("/api/college/placements/interviews/"+encodeURIComponent(id)+"/status",{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({status:next,expectedVersion:version,reason:trimmed}),
   });
   if(!res.ok)throw Error(res.status===409?"Interview changed. Refresh before retrying.":"Unable to update interview status.");
   setMessageTone("success");
   setMessage(next==="NO_SHOW"?"Marked No Show.":"Marked Completed.");
   setNext(null);setReason("");router.refresh();
  }catch(e){
   setMessageTone("error");
   setMessage(e instanceof Error?e.message:"Update failed.");
  }finally{setBusy(false);}
 }
 if(status!=="SCHEDULED")return <span className="text-xs text-muted-foreground">No status action</span>;
 return <div className="grid min-w-0 grid-cols-1 gap-2 sm:flex sm:flex-wrap">
  <Button variant="secondary" size="sm" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={busy} onClick={()=>{setMessage("");setNext("COMPLETED");}}>
   Mark as Completed
  </Button>
  <Button variant="secondary" size="sm" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={busy} onClick={()=>{setMessage("");setNext("NO_SHOW");}}>
   No Show
  </Button>
  <ConfirmDialog open={next!==null} onOpenChange={open=>{if(!open)close();}}
   title={title}
   confirmLabel="Confirm" cancelLabel="Cancel" pending={busy}
   confirmVariant={next==="NO_SHOW"?"danger":"primary"}
   confirmDisabled={reason.trim().length<3}
   onConfirm={()=>{void update();}}>
   <label htmlFor={reasonId} className="block text-sm font-semibold text-body">{reasonLabel}</label>
   <Textarea id={reasonId} name="reason" value={reason} required minLength={3} rows={3}
    maxLength={2000} error={Boolean(reasonError)} aria-describedby={reasonError?reasonId+"-error":undefined}
    onBlur={()=>{if(reason.length>0&&reason.trim().length<3)setReasonError("Enter a reason of at least 3 characters.");}}
    onChange={event=>{setReason(event.target.value);if(reasonError)setReasonError("");}}
    className="mt-2" />
   {reasonError?<p id={reasonId+"-error"} role="alert" className="mt-2 text-sm text-error">{reasonError}</p>:null}
  </ConfirmDialog>
  {message?<div className="min-w-0 sm:w-full"><InlineNotice tone={messageTone} message={message}/></div>:null}
 </div>;
}
