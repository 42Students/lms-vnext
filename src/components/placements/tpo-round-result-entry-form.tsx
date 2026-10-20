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
 const validatedPayload=useRef<ReturnType<typeof tpoRoundResultEntryFormSchema.parse>|null>(null);
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(pending||saved)return;
  const form=new FormData(event.currentTarget);
  const note=String(form.get("note")??"").trim();
  const rank=String(form.get("waitlistRank")??"").trim();
  const payload=tpoRoundResultEntryFormSchema.safeParse({applicationId,
   expectedCurrentResultId:currentResultId,outcome,note,waitlistRank:rank});
  if(!payload.success){setError(payload.error.issues[0]?.message??"Review the result fields.");return;}
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
 const cls="min-h-11 max-[767px]:min-h-11 md:min-h-9";
 return <form onSubmit={submit} className="grid gap-3 min-[768px]:grid-cols-2">
  <label className="text-sm text-body">Outcome
   <Select name="outcome" value={outcome} onChange={event=>setOutcome(event.target.value)} disabled={pending||saved} className={"mt-1 block w-full "+cls}>
    <option value="PASS">Pass</option><option value="FAIL">Fail</option>
    <option value="HOLD">Hold (requires rank)</option><option value="ABSENT">Absent</option>
   </Select></label>
  {outcome==="HOLD"?<label className="text-sm text-body">Waitlist rank
   <Input name="waitlistRank" type="number" min="1" max="100000" step="1" required disabled={pending||saved} className={"mt-1 block w-full "+cls}/>
  </label>:null}
  <label className="text-sm text-body min-[768px]:col-span-2">{outcome==="PASS"?"Internal result note":"Candidate-visible feedback"}
   <Textarea name="note" rows={2} minLength={1} maxLength={1000} required className={"mt-1 block w-full "+cls}/>
  </label>
  {error?<div className="min-w-0 min-[768px]:col-span-2"><InlineNotice tone="error" message={error}/></div>:null}
  {saved?<div className="min-w-0 min-[768px]:col-span-2"><InlineNotice tone="success" message="Result staged. Refresh to review the new version before another edit."/></div>:null}
  <Button variant="primary" type="submit" disabled={pending||saved} className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] bg-primary px-4 font-[650] disabled:opacity-50 min-[768px]:col-span-2 text-primary-foreground">
   {pending?"Saving…":saved?"Result staged":"Confirm staged result"}</Button>
  <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} pending={pending}
    title="Stage this round result?"
    description="This writes an audited version; applying results to progression is a separate action."
    confirmLabel="Confirm staged result" onConfirm={()=>void performStage()}/>
 </form>;
}
