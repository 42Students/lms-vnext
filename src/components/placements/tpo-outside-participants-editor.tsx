"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {outsideDriveResultLabel} from "@/modules/placements/recorded-outside-participation-model";
const outcomes=["PARTICIPATED","PASSED","FAILED","SELECTED","HIRED"] as const;
type Result=typeof outcomes[number];
export function TpoOutsideParticipantsEditor({recordId,available,choices,participants}:{
 recordId:string;available:boolean;
 choices:readonly {id:string;name:string|null}[];
 participants:readonly {id:string;membershipId:string;name:string|null;result:string;notes:string|null}[];
}){
 const router=useRouter();
 const {run,pending}=useGuardedAction({timeoutMs:30000});
 const [membershipId,setMembershipId]=useState("");
 const [result,setResult]=useState<Result>("PARTICIPATED");
 const [message,setMessage]=useState("");
 async function save(id:string,outcome:Result){
  if(!available||pending)return;
  setMessage("");
  try{
   await run(()=>apiFetch("/api/placements/tpo/outside-drives/"+encodeURIComponent(recordId)+"/participants",{
    method:"POST",headers:{"content-type":"application/json"},credentials:"same-origin",
    body:JSON.stringify({membershipId:id,result:outcome}),
   }));
   setMembershipId("");
   setMessage("Historical participation recorded. No application or offer was created.");
   router.refresh();
  }catch{
   setMessage("The record could not be saved. Your existing evidence has not changed.");
  }
 }
 if(!available)return <p role="status" className="text-sm text-body">
  External drive participant evidence is not available until its database migration is registered. Existing outside-drive records are preserved.
 </p>;
 return <section className="space-y-4">
  <div className="flex flex-wrap items-end gap-3">
   <label className="grid gap-1 text-sm font-semibold">Learner from this college
    <select value={membershipId} onChange={e=>setMembershipId(e.target.value)}
      className="min-h-11 rounded-[9px] border border-border bg-surface px-3">
     <option value="">Select learner</option>
     {choices.map(choice=><option value={choice.id} key={choice.id}>{choice.name??"Unnamed learner"}</option>)}
    </select>
   </label>
   <label className="grid gap-1 text-sm font-semibold">Outside result
    <select value={result} onChange={e=>setResult(e.target.value as Result)}
      className="min-h-11 rounded-[9px] border border-border bg-surface px-3">
     {outcomes.map(code=><option key={code} value={code}>{outsideDriveResultLabel(code)}</option>)}
    </select>
   </label>
   <button disabled={!membershipId||pending} type="button" onClick={()=>void save(membershipId,result)}
    className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold disabled:opacity-50">
    Record participation
   </button>
  </div>
  {message?<p role="status" className="text-sm text-body">{message}</p>:null}
  {participants.length?<ul className="space-y-2">
   {participants.map(person=><li key={person.id} className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3">
    <span className="min-w-0 flex-1 text-sm">{person.name??"Unnamed learner"} · {outsideDriveResultLabel(person.result)}</span>
    <label className="text-xs">Change recorded result
     <select defaultValue={person.result} disabled={pending}
      onChange={e=>void save(person.membershipId,e.target.value as Result)}
      className="ml-2 min-h-10 rounded-[9px] border border-border bg-surface px-2 text-sm">
      {outcomes.map(code=><option key={code} value={code}>{outsideDriveResultLabel(code)}</option>)}
     </select>
    </label>
   </li>)}
  </ul>:<p className="text-sm text-muted-foreground">No participating learners recorded yet.</p>}
  <p className="text-xs text-muted-foreground">These are external historical outcomes only. No learner application, interview invitation, in-app offer or reminder is created.</p>
 </section>;
}
