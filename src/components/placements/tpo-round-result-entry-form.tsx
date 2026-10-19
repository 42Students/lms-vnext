"use client";
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
 const cls="min-h-11 md:min-h-9 rounded-[9px] border border-border bg-surface px-3 py-2 text-foreground";
 return <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
  <label className="text-sm text-body">Outcome
   <select name="outcome" value={outcome} onChange={event=>setOutcome(event.target.value)} disabled={pending||saved} className={"mt-1 block w-full "+cls}>
    <option value="PASS">Pass</option><option value="FAIL">Fail</option>
    <option value="HOLD">Hold (requires rank)</option><option value="ABSENT">Absent</option>
   </select></label>
  {outcome==="HOLD"?<label className="text-sm text-body">Waitlist rank
   <input name="waitlistRank" type="number" min="1" max="100000" step="1" required disabled={pending||saved} className={"mt-1 block w-full "+cls}/>
  </label>:null}
  <label className="text-sm text-body sm:col-span-2">{outcome==="PASS"?"Internal result note":"Candidate-visible feedback"}
   <textarea name="note" rows={2} minLength={1} maxLength={1000} required className={"mt-1 block w-full "+cls}/>
  </label>
  {error?<p role="alert" className="text-sm text-foreground sm:col-span-2">{error}</p>:null}
  {saved?<p role="status" className="text-sm text-body sm:col-span-2">Result staged. Refresh to review the new version before another edit.</p>:null}
  <button type="submit" disabled={pending||saved} className="min-h-11 md:min-h-9 rounded-[9px] bg-primary px-4 font-[650] disabled:opacity-50 sm:col-span-2 text-primary-foreground">
   {pending?"Saving…":saved?"Result staged":"Confirm staged result"}</button>
  <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} pending={pending}
    title="Stage this round result?"
    description="This writes an audited version; applying results to progression is a separate action."
    confirmLabel="Confirm staged result" onConfirm={()=>void performStage()}/>
 </form>;
}
