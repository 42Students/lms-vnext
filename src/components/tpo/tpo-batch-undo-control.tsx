"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {useGuardedAction} from "@/hooks/use-guarded-action";
export function TpoBatchUndoControl({batchId,actionId}:{batchId:string;actionId:string}){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const {run}=useGuardedAction({timeoutMs:35000});
 const [reviewed,setReviewed]=useState(false);
 async function undo(){
  if(busy||!reviewed)return;
  await run(async()=>{
   setBusy(true);setError("");
   try{
    await apiFetch("/api/placements/tpo/batches/"+encodeURIComponent(batchId)+"/undo",{
     method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
     body:JSON.stringify({actionId}),
    });
    setReviewed(false);
    router.refresh();
   }catch(e){setError(e instanceof Error?e.message:friendlyApiError({}));}
   finally{setBusy(false);}
  });
 }
 return <div className="space-y-2"><label className="flex items-start gap-2 text-sm text-body"><input type="checkbox" checked={reviewed} disabled={busy} onChange={event=>setReviewed(event.target.checked)} className="mt-1 h-4 w-4 accent-primary"/>I reviewed this exact decision. Undo is audited and will be rejected if another decision changed the same learners.</label><Button variant="secondary" type="button" className="min-h-9 px-3" disabled={busy||!reviewed}
  onClick={()=>void undo()}>{busy?"Undoing…":"Undo this action"}</Button>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}</div>;
}
