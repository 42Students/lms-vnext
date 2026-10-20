"use client";
import { useConfirmFlow } from "@/components/ui/use-confirm-flow";
import { Textarea } from "@/components/ui/textarea";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {projectMutation} from "./project-api";
import {Button} from "@/components/ui/button";
export function MentorDeliveryLockControl({projectId,submissionId,status,lockedAt,updatedAt}:{
 projectId:string;submissionId:string;status:string;lockedAt:Date|null;updatedAt:Date|string;
}){
 const router=useRouter(),[reason,setReason]=useState(""),[busy,setBusy]=useState(false),
 [error,setError]=useState(""),[open,setOpen]=useState(false);
 const {askConfirm,dialog}=useConfirmFlow();
 if(lockedAt||!["SUBMITTED","APPROVED"].includes(status))return null;
 async function lock(){
  if(!reason.trim()||busy)return;
  if(!(await askConfirm("Lock final delivery? Learners cannot revise a locked submission until it is reopened.")))return;
  setBusy(true);setError("");
  try{
   await projectMutation("/api/projects/"+encodeURIComponent(projectId)+"/submissions/"+
    encodeURIComponent(submissionId)+"/mentor-lock","POST",{
      reason:reason.trim(),expectedUpdatedAt:new Date(updatedAt).toISOString(),
    });
   setOpen(false);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Could not lock submission");}
  finally{setBusy(false);}
 }
 return <section className="mt-3 space-y-2 border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)]">
  <Button variant="secondary" type="button" className="min-h-11 md:min-h-9" aria-expanded={open} onClick={()=>setOpen(v=>!v)}
   >Lock submission</Button>
  {open?<div className="space-y-2">
    <label className="block text-sm font-semibold">Why are you locking this delivery?
     <Textarea required maxLength={4000} value={reason} onChange={e=>setReason(e.target.value)}
      className="mt-1 min-h-20 w-full rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3 py-2 text-[length:var(--lms-font-base)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"/></label>
    <Button type="button" className="min-h-11 md:min-h-9" disabled={busy||!reason.trim()} onClick={()=>void lock()}
     >
      {busy?"Locking…":"Confirm lock"}</Button>
   </div>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
   {dialog}
 </section>;
}
