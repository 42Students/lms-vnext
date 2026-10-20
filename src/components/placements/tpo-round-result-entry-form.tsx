"use client";
import { Button } from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {useRef,useState,type FormEvent} from "react";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useRouter} from "next/navigation";
import {tpoRoundResultEntryFormSchema} from "@/modules/placements/tpo-round-result-entry-model";
export function TpoRoundResultEntryForm({roundId,applicationId,currentResultId}:{
 roundId:string;applicationId:string;currentResultId:string|null;
}){
 const router=useRouter(),[pending,setPending]=useState(false),[error,setError]=useState<string|null>(null);
 const [outcome,setOutcome]=useState("PASS"),[saved,setSaved]=useState(false);
 const [confirmOpen,setConfirmOpen]=useState(false);
 const [fieldIssue,setFieldIssue]=useState<"note"|"waitlistRank"|null>(null);
 const [review,setReview]=useState<{outcome:string;note:string;rank:string}|null>(null);
 const validatedPayload=useRef<ReturnType<typeof tpoRoundResultEntryFormSchema.parse>|null>(null);
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(pending||saved)return;
  const form=new FormData(event.currentTarget);
  const note=String(form.get("note")??"").trim();
  const rank=String(form.get("waitlistRank")??"").trim();
  const payload=tpoRoundResultEntryFormSchema.safeParse({applicationId,
   expectedCurrentResultId:currentResultId,outcome,note,waitlistRank:rank});
  if(!payload.success){
   const issue=payload.error.issues[0];
   setFieldIssue(issue?.path[0]==="note"?"note":issue?.path[0]==="waitlistRank"?"waitlistRank":null);
   setError(issue?.message??"Review the result fields.");return;
  }
  setFieldIssue(null);setError(null);
  setReview({outcome,note,rank});
  validatedPayload.current=payload.data;
  setConfirmOpen(true);
 }
 async function performStage(){
  if(pending||saved||!validatedPayload.current)return;
  setPending(true);setError(null);
  try{
   const response=await fetch("/api/placements/tpo/rounds/"+roundId+"/confirmed-results",{
    method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
    body:JSON.stringify(validatedPayload.current),
   });
   if(!response.ok)throw Error("Result changed; refresh and review it again.");
   setSaved(true);setConfirmOpen(false);router.refresh();
  }catch(caught){setConfirmOpen(false);setError(caught instanceof Error?caught.message:"Result staging failed");}
  finally{setPending(false);}
 }
 return (
  <form onSubmit={submit} aria-busy={pending}
    className="grid min-w-0 max-w-3xl gap-[var(--lms-space-4)] md:grid-cols-2">
   <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-5 text-body">
    Outcome
    <Select name="outcome" value={outcome} disabled={pending||saved}
      onChange={event=>{setOutcome(event.target.value);setError(null);setFieldIssue(null);}}>
     <option value="PASS">Pass</option><option value="FAIL">Fail</option>
     <option value="HOLD">Hold (requires rank)</option><option value="ABSENT">Absent</option>
    </Select>
   </label>
   {outcome==="HOLD"?(
    <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-5 text-body">
     Waitlist rank
     <Input name="waitlistRank" type="number" min="1" max="100000" step="1" required
       error={fieldIssue==="waitlistRank"} disabled={pending||saved}
       onChange={()=>{setFieldIssue(null);setError(null);}} />
    </label>
   ):null}
   <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-5 text-body md:col-span-2">
    {outcome==="PASS"?"Internal result note":"Candidate-visible feedback"}
    <Textarea name="note" rows={3} minLength={1} maxLength={1000} required
      error={fieldIssue==="note"} disabled={pending||saved}
      onChange={()=>{setFieldIssue(null);setError(null);}} />
    <span className="text-xs font-normal leading-5 text-muted-foreground">
     {outcome==="PASS"?"This note stays internal.":"This feedback is visible to the candidate."}
    </span>
   </label>
   {error?(
    <div className="min-w-0 md:col-span-2">
     <InlineNotice tone="error" message={error} />
    </div>
   ):null}
   {saved?(
    <div className="min-w-0 md:col-span-2">
     <InlineNotice tone="success" message="Result staged. Refresh to review the new version before another edit." />
    </div>
   ):null}
   <div className="flex min-w-0 flex-col border-t border-border pt-[var(--lms-space-4)] sm:flex-row sm:justify-end md:col-span-2">
    <Button variant="primary" type="submit" loading={pending}
      disabled={pending||saved} className="w-full sm:w-auto">
     {pending?"Saving…":saved?"Result staged":"Confirm staged result"}
    </Button>
   </div>
   <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} pending={pending}
     title="Stage this round result?"
     description="This writes an audited version; applying results to progression is a separate action."
     confirmLabel="Confirm staged result" onConfirm={()=>void performStage()}>
     {review?(
      <dl className="min-w-0 divide-y divide-border text-sm leading-5 text-body">
       <div className="flex min-w-0 justify-between gap-3 py-2">
        <dt className="shrink-0 font-semibold">Outcome</dt>
        <dd className="m-0 min-w-0 break-words text-right">{review.outcome}</dd>
       </div>
       {review.outcome==="HOLD"?(
        <div className="flex min-w-0 justify-between gap-3 py-2">
         <dt className="shrink-0 font-semibold">Waitlist rank</dt>
         <dd className="m-0 min-w-0 break-words text-right">{review.rank}</dd>
        </div>
       ):null}
       <div className="min-w-0 py-2">
        <dt className="font-semibold">{review.outcome==="PASS"?"Internal result note":"Candidate-visible feedback"}</dt>
        <dd className="m-0 mt-1 whitespace-pre-wrap break-words">{review.note}</dd>
       </div>
      </dl>
     ):null}
   </ConfirmDialog>
  </form>
 );
}
