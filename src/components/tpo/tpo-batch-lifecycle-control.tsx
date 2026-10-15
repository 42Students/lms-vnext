"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
type State={invitedAt:string|null;finishedAt:string|null;expectedVersion:string};
export function TpoBatchLifecycleControl({batchId,state}:{batchId:string;state:State|null}){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState("");
 if(!state)return <p role="status" className="text-sm text-muted-foreground">Create and invite this batch before finishing it.</p>;
 const action=state.finishedAt?"REOPEN" as const:"FINISH" as const;
 const disabled=busy||(action==="FINISH"&&!state.invitedAt);
 async function submit(){
  if(disabled)return;
  if(!window.confirm(action==="FINISH"?
   "Mark this placement batch finished? Self-apply will close for this batch.":"Reopen this placement batch for participation?"))return;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/placements/tpo/batches/"+batchId+"/lifecycle",{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action,expectedVersion:state.expectedVersion}),
   });
   const data=await response.json() as {error?:string};
   if(!response.ok)throw Error(response.status===409?"Batch changed. Refresh before taking this action.":data.error??"Unable to change batch state.");
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to confirm action.");}finally{setBusy(false);}
 }
 return <div className="min-w-0 space-y-2">
  <button type="button" disabled={disabled} onClick={()=>void submit()}
   className="min-h-11 rounded border border-border px-4 text-sm font-semibold disabled:opacity-50">
   {busy?"Updating…":action==="FINISH"?"Mark finished":"Reopen batch"}
  </button>
  {action==="FINISH"&&!state.invitedAt?<p className="text-sm text-muted-foreground">Invite the batch before marking it finished.</p>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
 </div>;
}
