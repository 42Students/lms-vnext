"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Button} from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
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
  <form onSubmit={submit} className="min-w-0 max-w-2xl space-y-4 border-b border-border pb-5">
   {job.applicationDeadline?<p className="border-b border-border pb-3 text-sm font-semibold text-body">Current deadline: {
    new Date(job.applicationDeadline).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST</p>:null}
   <div className="grid min-w-0 gap-4 sm:grid-cols-2 sm:items-start">
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)]">New application deadline (IST)
     <Input required type="datetime-local" name="newDeadline" defaultValue={initial}
      className="min-h-11 w-full min-w-0 md:min-h-9"/></label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)]">Reason (immutable audit)
     <Textarea required name="reason" minLength={10} maxLength={1000} rows={3}
      className="min-h-24 w-full min-w-0"/></label>
   </div>
   <p className="max-w-xl text-xs leading-5 text-body">
    Extending the deadline notifies applicants who see this drive. Your explanation is kept in the permanent change history.
    {" "}{job.applicationDeadline?
    "New deadline must be later than the current deadline and in the future.":
    "First deadline must be in the future."} Expiry is validated again under the database lock.</p>
   {error?<InlineNotice tone="error" message={error}/>:null}
   <Button disabled={pending} type="submit" className="min-h-11 w-full px-5 sm:w-auto md:min-h-9">
    {pending?"Saving…":job.applicationDeadline?"Review and extend deadline":"Review and set deadline"}</Button>
  </form>
  <ConfirmDialog open={confirmOpen} onOpenChange={next=>{if(!pending)setConfirmOpen(next);}}
   title={job.applicationDeadline?"Extend application deadline?":"Set first application deadline?"}
   description="The new deadline will be visible to applicants after confirmation. Review the time in IST and your audit reason before saving."
   confirmVariant="primary" confirmLabel={job.applicationDeadline?"Extend deadline":"Set deadline"}
   pending={pending} onConfirm={()=>void confirm()}>
   {proposal?<dl className="min-w-0 space-y-2 text-sm">
    <div className="grid min-w-0 grid-cols-[auto_1fr] gap-3"><dt className="font-semibold">New deadline (IST)</dt><dd className="min-w-0 break-words">{new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(new Date(proposal.newDeadlineIso))} IST</dd></div>
    <div className="grid min-w-0 grid-cols-[auto_1fr] gap-3"><dt className="font-semibold">Reason</dt><dd className="min-w-0 break-words">{proposal.reason}</dd></div>
   </dl>:null}
  </ConfirmDialog>
 </>;
}
