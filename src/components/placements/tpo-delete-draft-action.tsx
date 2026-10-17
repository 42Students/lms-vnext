"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {useGuardedAction} from "@/hooks/use-guarded-action";
export function TpoDeleteDraftAction({jobId,updatedAt}:{jobId:string;updatedAt:string}){
 const router=useRouter(),{run}=useGuardedAction({timeoutMs:35000});
 const [reviewed,setReviewed]=useState(false),[pending,setPending]=useState(false);
 const [error,setError]=useState("");
 async function archive(){
  if(!reviewed||pending)return;
  await run(async()=>{
   setPending(true);setError("");
   try{
    await apiFetch("/api/placements/tpo/jobs/"+encodeURIComponent(jobId)+"/delete-draft",{
     method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
     body:JSON.stringify({confirmed:true,expectedUpdatedAt:updatedAt}),
    });
    router.push("/tpo/placements/jobs?status=ALL");
    router.refresh();
   }catch(cause){
    setError(cause instanceof FriendlyFetchError&&cause.status===409?
     "This draft has changed or already has applications. Refresh the drive and review it again.":
     cause instanceof Error?cause.message:friendlyApiError({}));
   }finally{setPending(false)}
  });
 }
 return <section className="space-y-2 rounded-md border border-border p-3" aria-label="Delete unpublished draft">
  <h3 className="font-semibold">Delete draft</h3>
  <p className="text-sm text-body">It was never published. You can archive this unused draft without removing historical records. A draft with applications cannot be deleted.</p>
  <label className="flex items-start gap-2 text-sm text-body"><input type="checkbox"
   checked={reviewed} disabled={pending} onChange={event=>setReviewed(event.target.checked)}
   className="mt-1 h-4 w-4 accent-primary"/>
   I reviewed this unpublished drive and understand it will leave the active list.
  </label>
  <button type="button" disabled={!reviewed||pending} onClick={()=>void archive()}
   className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold disabled:opacity-50">
   {pending?"Removing draft…":"Delete draft"}</button>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
 </section>;
}
