"use client";
import {useState} from "react";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Button} from "@/components/ui/button";
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
   const receipt:unknown=await response.json().catch(()=>null);
   const cohort=receipt&&typeof receipt==="object"&&!Array.isArray(receipt)
     ?(receipt as {cohort?:unknown}).cohort:null;
   if(!cohort||typeof cohort!=="object"||Array.isArray(cohort)||
      (cohort as Record<string,unknown>).id!==cohortId||
      (cohort as Record<string,unknown>).status!=="COMPLETED")
     throw new Error("Graduation could not be confirmed. Refresh before retrying.");
   // The server receipt is canonical; show final state only after confirmation.
   const record=cohort as Record<string,unknown>;
   if(record.id!==cohortId||record.status!=="COMPLETED")throw new Error("Graduation result changed. Refresh and inspect the batch.");
   setOpen(false);setSuccess("Marked "+name+" as graduated (Completed). Reactivation remains available through the batch lifecycle controls.");router.refresh();
   });
  }catch(cause){setError(cause instanceof Error?cause.message:"Could not graduate this batch. Try again.");}
 }
 return <div className="min-w-0 space-y-[var(--lms-space-2)] print:hidden">
  <Button type="button" variant="secondary" disabled={pending} onClick={()=>{setError("");setSuccess("");setOpen(true);}}
   className="min-h-11 w-full sm:w-auto md:min-h-9"><span aria-hidden="true" className="mr-2">✓</span>Mark graduated</Button>
  {success?<p role="status" aria-live="polite" className="max-w-prose text-sm text-success-text">{success}</p>:null}
  {error&&!open?<p role="alert" className="max-w-prose break-words text-sm text-error">{error}</p>:null}
  <ConfirmDialog open={open} onOpenChange={setOpen} title={"Mark "+name+" graduated?"}
   description="This completes the batch lifecycle. Historical enrollment records are retained. If the batch needs reactivation, an administrator can review its archived lifecycle and restore it after verifying academic dependencies."
   confirmLabel="Mark graduated" confirmVariant="danger" pending={pending} onConfirm={()=>void submit()}>
    <p className="max-w-prose text-sm leading-5 text-body">Confirm that this batch has completed its final semester.</p>
    {error?<p role="alert" className="mt-[var(--lms-space-3)] break-words border-l-2 border-error bg-error-subtle p-[var(--lms-space-3)] text-sm text-error">{error}</p>:null}
  </ConfirmDialog>
 </div>;
}
