"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {tpoRoundResultEntryFormSchema} from "@/modules/placements/tpo-round-result-entry-model";
export function TpoRoundResultEntryForm({roundId,applicationId,currentResultId}:{
 roundId:string;applicationId:string;currentResultId:string|null;
}){
 const router=useRouter(),[pending,setPending]=useState(false),[error,setError]=useState<string|null>(null);
 const [outcome,setOutcome]=useState("PASS"),[saved,setSaved]=useState(false);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(pending||saved)return;
  const form=new FormData(event.currentTarget);
  const note=String(form.get("note")??"").trim();
  const rank=String(form.get("waitlistRank")??"").trim();
  const payload=tpoRoundResultEntryFormSchema.safeParse({applicationId,
   expectedCurrentResultId:currentResultId,outcome,note,waitlistRank:rank});
  if(!payload.success){setError(payload.error.issues[0]?.message??"Review the result fields.");return;}
  if(!window.confirm("Stage this round result? This writes an audited version; applying results to progression is a separate action."))return;
  setPending(true);setError(null);
  try{
   const response=await fetch("/api/placements/tpo/rounds/"+roundId+"/confirmed-results",{
    method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
    body:JSON.stringify(payload.data),
   });
   if(!response.ok){const body=await response.json().catch(()=>null) as {error?:string}|null;
    throw Error(body?.error??"Result changed; refresh and review it again.");}
   setSaved(true);router.refresh();
  }catch(caught){setError(caught instanceof Error?caught.message:"Result staging failed");}
  finally{setPending(false);}
 }
 const cls="min-h-10 rounded-md border border-border bg-surface px-3 py-2 text-foreground";
 return <form onSubmit={event=>void submit(event)} className="grid gap-3 sm:grid-cols-2">
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
  {error?<p role="alert" className="text-sm text-error sm:col-span-2">{error}</p>:null}
  {saved?<p role="status" className="text-sm text-body sm:col-span-2">Result staged. Refresh to review the new version before another edit.</p>:null}
  <button type="submit" disabled={pending||saved} className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary disabled:opacity-50 sm:col-span-2">
   {pending?"Saving…":saved?"Result staged":"Confirm staged result"}</button>
 </form>;
}
