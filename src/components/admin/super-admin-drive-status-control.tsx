"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Alert} from "@/components/ui/alert";
import {StatusBadge} from "@/components/ui/status-badge";
import {useToast} from "@/components/ui/toast";

/** Close and reopen use the same selected-college lifecycle guard, with an
 * explicit confirmation for each status transition. No draft is published here. */
export function SuperAdminDriveStatusControl({jobId,status}:{
 jobId:string;status:string;
}){
 const router=useRouter();
 const {showToast}=useToast();
 const [confirm,setConfirm]=useState<"CLOSE"|"REOPEN"|null>(null);
 const [pending,setPending]=useState(false);
 const [error,setError]=useState("");
 async function changeStatus(action:"CLOSE"|"REOPEN"){
  if(pending||(action==="CLOSE"&&status!=="PUBLISHED")||
     (action==="REOPEN"&&status!=="CLOSED"))return;
  setPending(true);setError("");
  try{
   const response=await fetch("/api/placements/jobs/"+encodeURIComponent(jobId)+"/status",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify(action==="REOPEN"?{action:"REOPEN",confirmed:true}:{action:"CLOSE"}),
   });
   const result:unknown=await response.json().catch(()=>null);
   if(!response.ok){
    const detail=result&&typeof result==="object"&&"error" in result?String(result.error):
      action==="REOPEN"?"Could not reopen drive":"Could not close drive";
    throw Error("Drive status was not changed ("+detail+"). Review the current season and employer, then retry.");
   }
   setConfirm(null);
   showToast({tone:"success",title:action==="REOPEN"?"Drive reopened":"Drive closed",
     description:action==="REOPEN"?
       "Applications are open again; historical offers and decisions remain unchanged.":
       "New applications stopped. Existing offers and history were retained."});
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
  {status==="PUBLISHED"?<Button type="button" variant="danger" disabled={pending} onClick={()=>{setError("");setConfirm("CLOSE");}}>
   Close drive</Button>:status==="CLOSED"?<div className="space-y-2">
   <Alert tone="info">This drive is closed. You can reopen it only while its placement season and employer relationship are active. Earlier offers remain unchanged.</Alert>
   <Button type="button" variant="secondary" disabled={pending}
     onClick={()=>{setError("");setConfirm("REOPEN");}}>Open drive</Button>
  </div>:status==="DRAFT"?<p className="text-sm text-body">Complete the draft and its eligibility checks before publishing through the drive workspace.</p>:
   <p className="text-sm text-muted-foreground">This drive is not open for applications.</p>}
  {error?<Alert tone="error" role="alert">{error}</Alert>:null}
  <ConfirmDialog open={confirm!==null} onOpenChange={next=>{if(!pending&&!next)setConfirm(null);}}
   title={confirm==="REOPEN"?"Reopen this drive?":"Close this drive?"}
   description={confirm==="REOPEN"?
     "Reopening allows new applications again. Older offers and historical decisions are not restored.":
     "Closing stops new applications. Pending selections and issued offers may be affected."}
   confirmLabel={confirm==="REOPEN"?"Yes, reopen drive":"Yes, close drive"}
   cancelLabel="No" confirmVariant={confirm==="CLOSE"?"danger":"primary"}
   pending={pending} onConfirm={()=>{if(confirm)void changeStatus(confirm);}}/>
 </section>;
}
