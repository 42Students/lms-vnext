"use client";
import {useState} from "react";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
export function SuperAdminBatchGraduateAction({cohortId,name}:{cohortId:string;name:string}){
 const router=useRouter();
 const [open,setOpen]=useState(false);
 const {pending,run}=useGuardedAction({timeoutMs:30000});
 const [error,setError]=useState(""),[success,setSuccess]=useState("");
 async function submit(){
  setError("");
  try{
   await run(async () => {
   const response=await fetch("/api/college/batches/"+encodeURIComponent(cohortId)+"/graduate",{
    method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify({confirm:true}),
   });
   if(!response.ok){
    const result:unknown=await response.json().catch(()=>null);
    const code=result && typeof result==="object" && "error" in result ? result.error : null;
    if(code==="BATCH_NOT_READY_TO_GRADUATE")throw new Error("This batch has not reached its final semester. Refresh and try again.");
    if(code==="BATCH_GRADUATION_STALE")throw new Error("This batch changed while you were working. Refresh and try again.");
    throw new Error("Could not mark this batch graduated. Refresh and try again.");
   }
   setOpen(false);setSuccess("Batch marked graduated.");router.refresh();
   });
  }catch(cause){setError(cause instanceof Error?cause.message:"Could not graduate this batch. Try again.");}
 }
 return <div className="space-y-2">
  <button type="button" disabled={pending} onClick={()=>{setError("");setOpen(true);}}
   className="min-h-11 rounded-md border border-border bg-surface px-4 font-semibold text-primary-text focus-visible:ring-2 focus-visible:ring-primary">Mark graduated</button>
  {success?<p role="status" className="text-sm text-body">{success}</p>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  <ConfirmDialog open={open} onOpenChange={setOpen} title={"Mark "+name+" graduated?"}
   description="This completes the batch lifecycle. Historical enrollment records are retained."
   confirmLabel="Mark graduated" pending={pending} onConfirm={()=>void submit()}>
    <p className="text-sm text-body">Confirm that this batch has completed its final semester.</p>
  </ConfirmDialog>
 </div>;
}
