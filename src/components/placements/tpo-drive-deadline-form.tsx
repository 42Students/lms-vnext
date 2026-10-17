"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {driveDeadlineIstToIso} from "@/modules/placements/tpo-drive-deadline-ist";
type Deadline={id:string;updatedAt:string;applicationDeadline:string|null};

/** TPO-drives-15, TPO-drives-45: first deadlines work and every failure is recoverable. */
export function TpoDriveDeadlineForm({job}:{job:Deadline}){
 const router=useRouter();
 const {pending,run}=useGuardedAction({timeoutMs:30000});
 const [error,setError]=useState<string|null>(null);
 const [proposal,setProposal]=useState<{newDeadlineIso:string;reason:string}|null>(null);
 const [confirmOpen,setConfirmOpen]=useState(false);
 const initial=job.applicationDeadline
  ?new Date(job.applicationDeadline).toLocaleString("sv-SE",{timeZone:"Asia/Kolkata"}).replace(" ","T").slice(0,16)
  :"";
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(pending)return;
  const values=new FormData(event.currentTarget);
  setError(null);
  try{
   const newDeadlineIso=driveDeadlineIstToIso(String(values.get("newDeadline")??""));
   const proposedTime=Date.parse(newDeadlineIso);
   if(proposedTime<=Date.now()){
    setError("Set the deadline to a future IST date and time.");return;
   }
   if(job.applicationDeadline&&proposedTime<=Date.parse(job.applicationDeadline)){
    setError("The new deadline must be later than the current deadline.");return;
   }
   const reason=String(values.get("reason")??"").trim();
   if(reason.length<10){setError("Explain the deadline change in at least 10 characters.");return;}
   setProposal({newDeadlineIso,reason});
   setConfirmOpen(true);
  }catch(error){
   setError(error instanceof Error?error.message:"Enter a valid IST deadline.");
  }
 }
 async function confirm(){
  if(!proposal||pending)return;
  try{
   await run(async()=>{
    await apiFetch("/api/placements/tpo/jobs/"+encodeURIComponent(job.id)+"/extend-deadline",{
     method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
     body:JSON.stringify({confirmed:true,expectedUpdatedAt:job.updatedAt,
      reason:proposal.reason,newDeadlineIso:proposal.newDeadlineIso}),
    });
    setConfirmOpen(false);
    router.push("/tpo/placements/jobs/"+encodeURIComponent(job.id));router.refresh();
   });
  }catch(error){
   setError(error instanceof Error?error.message:"Could not save the deadline. Please retry.");
   setConfirmOpen(false);
  }
 }
 return <>
  <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-surface p-5">
   {job.applicationDeadline?<p className="text-sm text-body">Current deadline: {
    new Date(job.applicationDeadline).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST</p>:null}
   <label className="block text-sm font-semibold text-body">New application deadline (IST)
    <input required type="datetime-local" name="newDeadline" defaultValue={initial}
     className="mt-2 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground"/></label>
   <label className="block text-sm font-semibold text-body">Reason (immutable audit)
    <textarea required name="reason" minLength={10} maxLength={1000} rows={3}
     className="mt-2 min-h-20 w-full rounded-md border border-border bg-surface p-3 text-foreground"/></label>
   <p className="text-xs text-body">{job.applicationDeadline?
    "New deadline must be later than the current deadline and in the future.":
    "First deadline must be in the future."} Expiry is validated again under the database lock.</p>
   {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
   <button disabled={pending} type="submit" className="min-h-11 rounded-md bg-primary px-5 font-semibold text-on-primary disabled:opacity-50">
    {pending?"Saving…":job.applicationDeadline?"Review and extend deadline":"Review and set deadline"}</button>
  </form>
  <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen}
   title={job.applicationDeadline?"Extend application deadline?":"Set first application deadline?"}
   description="The new IST deadline will be visible to applicants. This change is audited."
   confirmVariant="primary" confirmLabel={job.applicationDeadline?"Extend deadline":"Set deadline"}
   pending={pending} onConfirm={()=>void confirm()}/>
 </>;
}
