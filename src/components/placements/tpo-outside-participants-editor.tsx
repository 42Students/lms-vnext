"use client";
import { Button } from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";
import {InlineNotice} from "@/components/ui/inline-notice";
import { Select } from "@/components/ui/select";
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
 const [messageTone,setMessageTone]=useState<"success"|"error">("success");
 async function save(id:string,outcome:Result){
  if(!available||pending)return;
  setMessage("");
  try{
   await run(()=>apiFetch("/api/placements/tpo/outside-drives/"+encodeURIComponent(recordId)+"/participants",{
    method:"POST",headers:{"content-type":"application/json"},credentials:"same-origin",
    body:JSON.stringify({membershipId:id,result:outcome}),
   }));
   setMembershipId("");
   setMessageTone("success");
   setMessage("Historical participation recorded. No application or offer was created.");
   router.refresh();
  }catch{
   setMessageTone("error");
   setMessage("The record could not be saved. Your existing evidence has not changed.");
  }
 }
 if(!available)return <Alert tone="warning">External drive participant evidence is not available until its database migration is registered. Existing outside-drive records are preserved.</Alert>;
 return <section className="min-w-0 space-y-4">
  <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
   <label className="grid min-w-0 gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Learner from this college
    <Select value={membershipId} onChange={e=>setMembershipId(e.target.value)}
      className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3">
     <option value="">Select learner</option>
     {choices.map(choice=><option value={choice.id} key={choice.id}>{choice.name??"Unnamed learner"}</option>)}
    </Select>
   </label>
   <label className="grid min-w-0 gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Outside result
    <Select value={result} onChange={e=>setResult(e.target.value as Result)}
      className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3">
     {outcomes.map(code=><option key={code} value={code}>{outsideDriveResultLabel(code)}</option>)}
    </Select>
   </label>
   <Button variant="primary" disabled={!membershipId||pending} type="button" onClick={()=>void save(membershipId,result)}
    className="w-full min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] px-4 text-sm font-semibold disabled:opacity-50 sm:col-span-2 lg:col-span-1 lg:w-auto">
    Record participation
   </Button>
  </div>
  {message?<InlineNotice tone={messageTone} message={message}/>:null}
  {participants.length?<ul className="space-y-2">
   {participants.map(person=><li key={person.id} className="grid min-w-0 gap-2 border-b border-border py-3 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,auto)] sm:items-center">
    <span className="min-w-0 flex-1 text-sm">{person.name??"Unnamed learner"} · {outsideDriveResultLabel(person.result)}</span>
    <label className="grid min-w-0 gap-1 text-xs">Change recorded result
     <Select value={person.result} disabled={pending}
      onChange={e=>void save(person.membershipId,e.target.value as Result)}
      className="min-h-11 w-full md:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-2 text-sm">
      {outcomes.map(code=><option key={code} value={code}>{outsideDriveResultLabel(code)}</option>)}
     </Select>
    </label>
   </li>)}
  </ul>:<p className="text-sm text-muted-foreground">No participating learners recorded yet.</p>}
  <p className="text-xs text-muted-foreground">These are external historical outcomes only. No learner application, interview invitation, in-app offer or reminder is created.</p>
 </section>;
}
