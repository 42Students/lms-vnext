"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export function TpoBatchUndoControl({batchId,actionId}:{batchId:string;actionId:string}){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function undo(){
  if(busy||!window.confirm("Undo this exact cohort decision? The server will reject an action if any later decision changed the cohort."))return;
  setBusy(true);setError("");
  try{
   const r=await fetch("/api/placements/tpo/batches/"+batchId+"/undo",{method:"POST",credentials:"same-origin",
    headers:{"Content-Type":"application/json"},body:JSON.stringify({actionId})});
   const data=await r.json() as {error?:string};
   if(!r.ok)throw new Error(r.status===409?"This action is stale. Refresh history before retrying.":data.error??"Undo failed.");
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Undo failed.");}finally{setBusy(false);}
 }
 return <div className="space-y-1"><button type="button" className="min-h-10 rounded border border-border px-3 text-sm disabled:opacity-50" disabled={busy}
  onClick={()=>void undo()}>{busy?"Undoing…":"Undo this action"}</button>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}</div>;
}
