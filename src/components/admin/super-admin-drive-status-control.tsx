"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Alert} from "@/components/ui/alert";
import {StatusBadge} from "@/components/ui/status-badge";
import {useToast} from "@/components/ui/toast";

/** Only use the currently authorized status route. Reopen is not a
 * Super Admin capability until the selected-college mutation supports it. */
export function SuperAdminDriveStatusControl({jobId,status}:{
 jobId:string;status:"DRAFT"|"PUBLISHED"|"CLOSED"|"ARCHIVED"|"CANCELLED";
}){
 const router=useRouter();
 const {showToast}=useToast();
 const [confirm,setConfirm]=useState(false);
 const [pending,setPending]=useState(false);
 const [error,setError]=useState("");
 async function closeDrive(){
  if(pending||status!=="PUBLISHED")return;
  setPending(true);setError("");
  try{
   const response=await fetch("/api/placements/jobs/"+encodeURIComponent(jobId)+"/status",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({action:"CLOSE"}),
   });
   const result:unknown=await response.json().catch(()=>null);
   if(!response.ok){
    const detail=result&&typeof result==="object"&&"error" in result?String(result.error):"Could not close drive";
    throw Error("Failed to update drive status ("+detail+"). Review pending selections, then retry.");
   }
   setConfirm(false);
   showToast({tone:"success",title:"Drive closed",description:"New applications stopped. Offers and recorded history follow the authorized close workflow."});
   router.refresh();
  }catch(caught){
   const message=caught instanceof Error?caught.message:"Failed to update drive status";
   setError(message);
   showToast({tone:"error",title:"Failed to update drive status",description:message});
  }finally{setPending(false);}
 }
 return <section aria-label="Drive status" className="min-w-0 space-y-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
  <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
   <h2 className="text-lg font-semibold text-[var(--lms-heading)]">Drive status</h2>
   <StatusBadge tone={status==="PUBLISHED"?"success":status==="DRAFT"?"warning":"neutral"}>{status}</StatusBadge>
  </div>
  {status==="PUBLISHED"?<Button type="button" variant="danger" disabled={pending} onClick={()=>{setError("");setConfirm(true);}}>
   Close drive</Button>:status==="CLOSED"?<Alert tone="info">
   This drive is closed. Reopening from Super Admin settings requires a separately authorized college-scoped lifecycle action; no older offers are automatically restored.
  </Alert>:status==="DRAFT"?<p className="text-sm text-body">Complete the draft and its eligibility checks before publishing through the drive workspace.</p>:
   <p className="text-sm text-muted-foreground">This drive is not open for applications.</p>}
  {error?<Alert tone="error" role="alert">{error}</Alert>:null}
  <ConfirmDialog open={confirm} onOpenChange={next=>{if(!pending)setConfirm(next);}}
   title="Close this drive?" description="Closing stops new applications. Pending selections and issued offers may be affected."
   confirmLabel="Yes, close drive" cancelLabel="No" confirmVariant="danger"
   pending={pending} onConfirm={()=>void closeDrive()}/>
 </section>;
}
