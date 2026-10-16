"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  TPO_REJECTION_REASONS,
  TPO_REQUEST_DECISION_COPY,
  tpoRequestApprovalCopy,
} from "@/modules/placements/tpo-request-decision-model";

type Action="APPROVE"|"REJECT";

export function TpoRequestDecisionControl({ requestId, expectedUpdatedAt, requestType }: {
  requestId: string; expectedUpdatedAt: string; requestType: string;
}) {
  const router=useRouter();
  const [action,setAction]=useState<Action|null>(null);
  const [reasonChoice,setReasonChoice]=useState("");
  const [note,setNote]=useState("");
  const [pending,setPending]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [success,setSuccess]=useState<string|null>(null);
  const approval=tpoRequestApprovalCopy(requestType);
  function open(next:Action){
    if(pending)return;
    setAction(next);setReasonChoice("");setNote("");setError(null);setSuccess(null);
  }
  const rejectionNote=reasonChoice==="Other"?note.trim():reasonChoice;
  const finalNote=action==="REJECT"?rejectionNote:note.trim();
  const valid=action==="APPROVE"||(action==="REJECT"&&rejectionNote.length>=3);
  async function decide(){
    if(pending||!action||!valid)return;
    setPending(true);setError(null);
    try {
      const response=await fetch("/api/placements/tpo/requests/"+encodeURIComponent(requestId)+"/decision",{
        method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
        body:JSON.stringify({confirmed:true,action,note:finalNote,expectedUpdatedAt}),
      });
      const data=await response.json().catch(()=>({})) as {error?:string};
      if(!response.ok)throw new Error(
        data.error==="PLACEMENT_REQUEST_INVALID_STATE"?
         "This request has changed. Refresh before retrying.":
        data.error==="PLACEMENT_REQUEST_EFFECT_INVALID"?
         "This request cannot be approved in its current application, round or offer state.":
        data.error==="PLACEMENT_REQUEST_TARGET_MISMATCH"?
         "The request no longer matches its application. Refresh before retrying.":
        TPO_REQUEST_DECISION_COPY.error);
      setSuccess(action==="APPROVE"?TPO_REQUEST_DECISION_COPY.approved:TPO_REQUEST_DECISION_COPY.rejected);
      setAction(null);
      router.refresh();
    }catch(cause){
      setError(cause instanceof Error?cause.message:TPO_REQUEST_DECISION_COPY.error);
    }finally{setPending(false);}
  }
  return <div className="flex flex-col gap-2 text-sm">
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={pending} onClick={()=>open("APPROVE")}
        className="min-h-10 rounded-md border border-border px-3 font-semibold text-foreground disabled:opacity-50">Approve</button>
      <button type="button" disabled={pending} onClick={()=>open("REJECT")}
        className="min-h-10 rounded-md border border-border px-3 font-semibold text-foreground disabled:opacity-50">Reject</button>
    </div>
    {success?<p role="status" className="max-w-xs text-body">{success}</p>:null}
    {error&&!action?<p role="alert" className="max-w-xs text-error">{error}</p>:null}
    {action?<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <section role="dialog" aria-modal="true" aria-label={action==="REJECT"?TPO_REQUEST_DECISION_COPY.rejectTitle:approval.title}
        onKeyDown={event=>{if(event.key==="Escape"&&!pending)setAction(null);}}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-surface p-5 shadow-lg">
        <h3 className="text-lg font-semibold text-foreground">
          {action==="REJECT"?TPO_REQUEST_DECISION_COPY.rejectTitle:approval.title}
        </h3>
        <p className="mt-2 text-sm text-body">
          {action==="REJECT"?TPO_REQUEST_DECISION_COPY.rejectHelp:approval.help}
        </p>
        {action==="REJECT"?<fieldset className="mt-4">
          <legend className="font-semibold text-foreground">Reason (the student sees it)</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {TPO_REJECTION_REASONS.map(choice=>
              <label key={choice} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md border border-border px-3">
                <input type="radio" name={"reject-reason-"+requestId} value={choice}
                  checked={reasonChoice===choice} disabled={pending}
                  onChange={()=>{setReasonChoice(choice);setError(null);}}/>
                {choice}
              </label>)}
          </div>
          {reasonChoice==="Other"?<label className="mt-3 block text-sm">
            Or write what needs to change
            <textarea value={note} maxLength={2000} rows={3} disabled={pending}
              onChange={event=>{setNote(event.target.value);setError(null);}}
              className="mt-1 block w-full rounded-md border border-border bg-surface p-2 text-foreground"/>
          </label>:null}
        </fieldset>:<label className="mt-4 block text-sm font-semibold">
          Approval note (optional)
          <textarea value={note} maxLength={2000} rows={3} disabled={pending}
            onChange={event=>setNote(event.target.value)}
            className="mt-1 block w-full rounded-md border border-border bg-surface p-2 font-normal text-foreground"/>
        </label>}
        {action==="REJECT"&&!valid?<p className="mt-2 text-xs text-body" role="status">
          Pick a reason, or enter at least 3 characters for Other.
        </p>:null}
        {error?<p role="alert" className="mt-3 text-sm text-error">{error}</p>:null}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" disabled={pending} onClick={()=>{setAction(null);setError(null);}}
            className="min-h-11 rounded-md border border-border px-4 font-semibold">Cancel</button>
          <button type="button" disabled={pending||!valid} onClick={()=>void decide()}
            className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
            {pending?(action==="APPROVE"?TPO_REQUEST_DECISION_COPY.approving:TPO_REQUEST_DECISION_COPY.rejecting):
              action==="APPROVE"?"Approve":"Reject"}
          </button>
        </div>
      </section>
    </div>:null}
  </div>;
}
