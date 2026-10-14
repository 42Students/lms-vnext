"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
export function TpoRoundResultEntryForm({roundId,applicationId,currentResultId}:{
 roundId:string;applicationId:string;currentResultId:string|null;
}){
 const router=useRouter(),[pending,setPending]=useState(false),[error,setError]=useState<string|null>(null);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(pending)return;
  const form=new FormData(event.currentTarget);
  const outcome=String(form.get("outcome")??"PASS");
  const note=String(form.get("note")??"").trim();
  const rank=String(form.get("waitlistRank")??"").trim();
  if(!window.confirm("Stage this round result? This writes an audited version; applying results to progression is a separate action."))return;
  setPending(true);setError(null);
  try{
   const response=await fetch("/api/placements/tpo/rounds/"+roundId+"/confirmed-results",{
    method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
    body:JSON.stringify({confirmed:true,expectedCurrentResultId:currentResultId,
     result:{applicationId,outcome,
      ...(outcome==="HOLD"?{waitlistRank:Number(rank)}:{}),
      ...(outcome==="PASS"?{internalComment:note}:{candidateMessage:note})}}),
   });
   if(!response.ok){const body=await response.json().catch(()=>null) as {error?:string}|null;
    throw Error(body?.error??"Result changed; refresh and review it again.");}
   router.refresh();
  }catch(caught){setError(caught instanceof Error?caught.message:"Result staging failed");}
  finally{setPending(false);}
 }
 const cls="min-h-10 rounded-md border border-border bg-surface px-3 py-2 text-foreground";
 return <form onSubmit={event=>void submit(event)} className="grid gap-3 sm:grid-cols-2">
  <label className="text-sm text-body">Outcome
   <select name="outcome" className={"mt-1 block w-full "+cls}>
    <option value="PASS">Pass</option><option value="FAIL">Fail</option>
    <option value="HOLD">Hold (requires rank)</option><option value="ABSENT">Absent</option>
   </select></label>
  <label className="text-sm text-body">Waitlist rank (only for HOLD)
   <input name="waitlistRank" type="number" min="1" max="100000" className={"mt-1 block w-full "+cls}/>
  </label>
  <label className="text-sm text-body sm:col-span-2">Result note (candidate-visible for non-pass)
   <textarea name="note" rows={2} minLength={1} maxLength={1000} required className={"mt-1 block w-full "+cls}/>
  </label>
  {error?<p role="alert" className="text-sm text-error sm:col-span-2">{error}</p>:null}
  <button type="submit" disabled={pending} className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary disabled:opacity-50 sm:col-span-2">
   {pending?"Saving…":"Confirm staged result"}</button>
 </form>;
}
