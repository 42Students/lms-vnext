"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Button} from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import {useToast} from "@/components/ui/toast";

/** TPO-drives-26 / GR-04 / GR-35: cloning is an explicit, guarded draft mutation. */
export function TpoDriveCloneAction({jobId,label="Run it again"}:{jobId:string;label?:string}){
 const router=useRouter();
 const {showToast}=useToast();
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
   const message=reason instanceof Error?reason.message:"Could not clone this drive. Please retry.";
   setError(message);
   showToast({tone:"error",title:"Could not clone this drive",description:message});
   setOpen(false);
  }
 }
 return <>
  <div className="flex min-w-0 w-full flex-col gap-2 sm:w-auto">
   <Button variant="secondary" type="button" disabled={pending}
    className="min-h-11 w-full rounded-[var(--lms-control-radius)] px-4 sm:w-auto md:min-h-9 transition-[background-color] duration-[200ms] ease-[ease] hover:bg-[rgba(0,0,0,0.035)] active:bg-[rgba(0,0,0,0.06)] motion-reduce:transition-none"
    onClick={event=>{
      if(pending)return;
      const menu=event.currentTarget.closest("details");
      if(menu){menu.open=false;menu.querySelector("summary")?.focus();}
      setOpen(true);
    }}>
    {pending?"Creating draft…":label}
   </Button>
   {error?<InlineNotice tone="error" message={error}/>:null}
  </div>
  <ConfirmDialog open={open} onOpenChange={next=>{if(!pending)setOpen(next);}} title="Run this drive again as a new draft?"
   description="Dates, candidates, rounds, results, offers and external links are cleared. Package details and eligibility rules are copied; review old batches and passing years before publishing."
   confirmVariant="primary" confirmLabel="Create draft" pending={pending} onConfirm={()=>void clone()}/>
 </>;
}
