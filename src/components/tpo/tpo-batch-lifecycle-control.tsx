"use client";
import {Checkbox} from "@/components/ui/checkbox";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {useGuardedAction} from "@/hooks/use-guarded-action";
type State={invitedAt:string|null;finishedAt:string|null;expectedVersion:string};
export function TpoBatchLifecycleControl({batchId,state}:{batchId:string;state:State|null}){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [reviewed,setReviewed]=useState(false),[success,setSuccess]=useState("");
 const {run}=useGuardedAction({timeoutMs:35000});
 const current=state??{invitedAt:null,finishedAt:null,expectedVersion:"none"};
 const expectedVersion=current.expectedVersion;
 const action=current.finishedAt?"REOPEN" as const:"FINISH" as const;
 const disabled=busy||!reviewed;
 async function submit(){
  if(disabled)return;
  await run(async()=>{
  setBusy(true);setError("");setSuccess("");
  try{
   const outcome=await apiFetch<{changed:boolean}>("/api/placements/tpo/batches/"+encodeURIComponent(batchId)+"/lifecycle",{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action,expectedVersion:expectedVersion}),
   });
   setReviewed(false);
   setSuccess(outcome.changed?(action==="FINISH"?"Batch finished":"Batch reopened"):"Nothing changed.");
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:friendlyApiError({}));}finally{setBusy(false);}
  });
 }
 return <div className="min-w-0 space-y-2">
  <p className="text-sm text-body">{action==="FINISH"?
   "It leaves the working set: hidden from Placement eligibility by default and left out of counts. Its students can&apos;t apply on their own; you can still add them to a drive.":
   "It comes back into the working set and its eligible students can use placements again."}</p>
  <label className="flex items-start gap-2 text-sm text-body">
   <Checkbox checked={reviewed} disabled={busy}
    onChange={event=>setReviewed(event.target.checked)}
    className="mt-1 h-4 w-4 accent-primary"/>
   I reviewed the batch and understand this change will be audited.
  </label>
  <button type="button" disabled={disabled} onClick={()=>void submit()}
   className="min-h-9 rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold disabled:opacity-50">
   {busy?"Updating…":action==="FINISH"?"Mark finished":"Reopen batch"}
  </button>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {success?<p role="status" className="text-sm text-success">{success}</p>:null}
 </div>;
}
