"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {Button} from "@/components/ui/button";
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
 return <section className="space-y-2 rounded-[var(--lms-control-radius)] border border-border p-3" aria-label="Delete unpublished draft">
  <h3 className="font-semibold">Delete this draft?</h3>
  <p className="text-sm text-body">It was never published, so no student has seen it. It is removed from your drives.</p>
  <label className="flex items-start gap-2 text-sm text-body"><input type="checkbox"
   checked={reviewed} disabled={pending} onChange={event=>setReviewed(event.target.checked)}
   className="mt-1 h-4 w-4 accent-primary"/>
   I reviewed this unpublished drive and understand it will leave the active list.
  </label>
  <Button variant="secondary" type="button" disabled={!reviewed||pending} onClick={()=>void archive()}
   >
   {pending?"Removing draft…":"Delete draft"}</Button>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
 </section>;
}
