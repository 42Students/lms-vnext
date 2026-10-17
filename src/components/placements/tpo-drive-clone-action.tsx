"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";

/** TPO-drives-26 / GR-04 / GR-35: cloning is an explicit, guarded draft mutation. */
export function TpoDriveCloneAction({jobId,label="Run it again"}:{jobId:string;label?:string}){
 const router=useRouter();
 const {pending,run}=useGuardedAction({timeoutMs:30000});
 const [open,setOpen]=useState(false);
 const [error,setError]=useState<string|null>(null);
 async function clone(){
  if(pending)return;
  try{
   setError(null);
   await run(async()=>{
    const copy=await apiFetch<{jobId?:string}>(
     "/api/placements/tpo/jobs/"+encodeURIComponent(jobId)+"/clone",{
       method:"POST",headers:{"content-type":"application/json"},credentials:"same-origin",
       body:JSON.stringify({confirmed:true}),
     });
    if(!copy.jobId)throw new Error("A draft may have been created. Check your drives before trying again.");
    setOpen(false);
    router.push("/tpo/placements/jobs/"+encodeURIComponent(copy.jobId));
    router.refresh();
   });
  }catch(reason){
   setError(reason instanceof Error?reason.message:"Could not clone this drive. Please retry.");
   setOpen(false);
  }
 }
 return <>
  <div className="inline-flex flex-col gap-1">
   <button type="button" disabled={pending} onClick={()=>setOpen(true)}
    className="min-h-10 rounded border border-border px-3 text-sm font-semibold text-primary-text disabled:opacity-50">
    {pending?"Creating draft…":label}
   </button>
   {error?<span role="alert" className="text-xs text-error">{error}</span>:null}
  </div>
  <ConfirmDialog open={open} onOpenChange={setOpen} title="Run this drive again as a new draft?"
   description="Dates, candidates, rounds, results, offers and external links are cleared. Package details and eligibility rules are copied; review old batches and passing years before publishing."
   confirmVariant="primary" confirmLabel="Create draft" pending={pending} onConfirm={()=>void clone()}/>
 </>;
}
