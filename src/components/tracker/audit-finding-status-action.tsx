"use client";
import { Select } from "@/components/ui/select";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {BUG_STATUSES,type BugStatus} from "@/modules/bug-tracker/workflow";
import {auditFindingStatusPayload,canChangeAuditFindingStatus} from "@/modules/bug-tracker/audit-finding-status-action-model";
export function AuditFindingStatusAction({publicId,current,version}:{publicId:string;current:string;version:number}){
 const router=useRouter();
 const [status,setStatus]=useState<BugStatus>(current as BugStatus);
 const [pending,setPending]=useState(false);
 const [review,setReview]=useState(false);
 const [feedback,setFeedback]=useState("");
 async function submit(){
  setPending(true);setFeedback("");
  try{
   const response=await fetch("/api/tracker/issues/"+encodeURIComponent(publicId)+"/workflow",{
    method:"PATCH",headers:{"content-type":"application/json"},
    body:JSON.stringify(auditFindingStatusPayload(version,status)),
   });
   if(!response.ok){
    setFeedback(response.status===409?"The finding changed elsewhere. Reload before changing its status.":"Status change was not saved.");
    return;
   }
   setFeedback("Status saved; updating the board.");router.refresh();
  }catch{setFeedback("Connection failure. No status change was confirmed.");}
  finally{setPending(false);setReview(false);}
 }
 return <div className="flex flex-wrap items-end gap-2">
   <label className="grid gap-1 text-xs font-semibold text-body">Triage status
    <Select value={status} disabled={pending} onChange={e=>setStatus(e.target.value as BugStatus)}
    >
      {BUG_STATUSES.map(item=><option key={item} value={item}>{item}</option>)}
    </Select>
   </label>
   <Button size="sm" variant="secondary" disabled={!canChangeAuditFindingStatus(current,status,pending)} onClick={()=>setReview(true)}>Review status</Button>
   {feedback?<p role="status" className="w-full text-xs text-body">{feedback}</p>:null}
   <ConfirmDialog open={review} onOpenChange={setReview} pending={pending} confirmLabel="Apply audited status"
    confirmDisabled={!canChangeAuditFindingStatus(current,status,pending)}
    title="Confirm tracker finding status"
    description={"Change "+publicId+" from "+current+" to "+status+"? The server checks the current version and records the transition."}
    onConfirm={()=>{void submit();}}/>
  </div>;
}
