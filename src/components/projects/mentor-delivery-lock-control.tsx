"use client";
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
 return <section className="mt-3 space-y-2 rounded-lg border border-border p-3">
  <button type="button" onClick={()=>setOpen(v=>!v)}
   className="min-h-10 rounded border border-border px-3 text-sm font-semibold">Lock submission</button>
  {open?<div className="space-y-2">
    <label className="block text-sm font-semibold">Why are you locking this delivery?
     <textarea required maxLength={4000} value={reason} onChange={e=>setReason(e.target.value)}
      className="mt-1 min-h-20 w-full rounded border border-border bg-background p-2"/></label>
    <button type="button" disabled={busy||!reason.trim()} onClick={()=>void lock()}
     className="min-h-10 rounded bg-primary px-3 text-sm font-semibold text-primary-foreground">
      {busy?"Locking…":"Confirm lock"}</button>
   </div>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
 </section>;
}
