"use client";
import { Textarea } from "@/components/ui/textarea";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {projectMutation} from "./project-api";
export function MentorDeliveryLockControl({projectId,submissionId,status,lockedAt,updatedAt}:{
 projectId:string;submissionId:string;status:string;lockedAt:Date|null;updatedAt:Date|string;
}){
 const router=useRouter(),[reason,setReason]=useState(""),[busy,setBusy]=useState(false),
 [error,setError]=useState(""),[open,setOpen]=useState(false);
 if(lockedAt||!["SUBMITTED","APPROVED"].includes(status))return null;
 async function lock(){
  if(!reason.trim()||busy)return;
  if(!window.confirm("Lock final delivery? Learners cannot revise a locked submission until it is reopened."))return;
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
  <button type="button" onClick={()=>setOpen(v=>!v)}
   className="min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Lock submission</button>
  {open?<div className="space-y-2">
    <label className="block text-sm font-semibold">Why are you locking this delivery?
     <Textarea required maxLength={4000} value={reason} onChange={e=>setReason(e.target.value)}
      className="mt-1 min-h-20 w-full rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3 py-2 text-[14px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"/></label>
    <button type="button" disabled={busy||!reason.trim()} onClick={()=>void lock()}
     className="min-h-9 rounded-[var(--lms-control-radius)] bg-primary px-3 text-sm font-semibold text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50">
      {busy?"Locking…":"Confirm lock"}</button>
   </div>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
 </section>;
}
