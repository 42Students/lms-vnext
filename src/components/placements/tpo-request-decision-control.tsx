"use client";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {useState} from "react";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {useRouter} from "next/navigation";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {useToast} from "@/components/ui/toast";

import {tpoRequestNeedsConfirmation} from "@/modules/placements/tpo-request-decision-copy";

const rejectionReasons=[
  "Not eligible","Proof missing or unclear","Deadline has passed",
  "Policy does not allow it","Duplicate request","Other",
] as const;

function impact(requestType:string){
  if(requestType==="APPLICATION_WITHDRAWAL")
    return "Approval may withdraw the learner's application. The decision is saved in their request history.";
  if(requestType==="ROUND_RESCHEDULE")
    return "Approval may record a different schedule for this learner's round.";
  if(requestType==="OFFER_EXTENSION")
    return "Approval may change the learner's recorded offer response deadline.";
  return "Approval may change the learner's recorded placement status.";
}
export function TpoRequestDecisionControl({requestId,expectedUpdatedAt,requestType,onSuccess}:{
  requestId:string;expectedUpdatedAt:string;requestType:string;onSuccess?:()=>void;
}){
  const router=useRouter();
  const {showToast}=useToast();
  const [mode,setMode]=useState<"APPROVE"|"REJECT"|null>(null);
  const [pending,setPending]=useState(false);
  const {run:runGuarded,pending:guardedPending}=useGuardedAction();
  const [reason,setReason]=useState<string>("");
  const [note,setNote]=useState("");
  const [error,setError]=useState<string|null>(null);
  function open(next:"APPROVE"|"REJECT"){
    if(pending||guardedPending)return;
    if(next==="APPROVE"&&!tpoRequestNeedsConfirmation(requestType)){
      void runGuarded(()=>decideWith("APPROVE",""));
      return;
    }
    setMode(next);setReason("");setNote("");setError(null);
  }
  const decisionNote=mode==="REJECT"?(reason==="Other"?note.trim():reason):note.trim();
  const valid=mode==="APPROVE" || (mode==="REJECT"&&decisionNote.length>=3&&decisionNote.length<=2000);
  async function decideWith(action:"APPROVE"|"REJECT",decisionText:string){
    if(pending)return;
    setPending(true);setError(null);
    try{
      await apiFetch("/api/placements/tpo/requests/"+encodeURIComponent(requestId)+"/decision",{
        method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
        body:JSON.stringify({confirmed:true,action,note:decisionText||null,expectedUpdatedAt}),
      });
      showToast({tone:"success",title:action==="APPROVE"
        ?"Approved. The student has been told."
        :"Rejected. The student has been told, with your reason."});
      setMode(null);setReason("");setNote("");onSuccess?.();router.refresh();
    }catch(e){
      setError(e instanceof FriendlyFetchError && requestType==="APPLICATION_WITHDRAWAL"&&
        e.code==="PLACEMENT_REQUEST_EFFECT_INVALID"
        ?"This student is placed: reverse the acceptance on the Offers tab first, then approve."
        :e instanceof Error?e.message:"Could not record the decision. Please try again.");
    }
    finally{setPending(false);}
  }
  function decide(){if(!mode||!valid||guardedPending)return;void runGuarded(()=>decideWith(mode,decisionNote));}
  return <div className="flex flex-col gap-2 text-sm">
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={pending||guardedPending} onClick={()=>open("APPROVE")}
        className="min-h-10 rounded-md border border-border px-3 font-semibold text-foreground disabled:opacity-50">Approve</button>
      <button type="button" disabled={pending||guardedPending} onClick={()=>open("REJECT")}
        className="min-h-10 rounded-md border border-border px-3 font-semibold text-foreground disabled:opacity-50">Reject</button>
    </div>
    {!mode&&error?<p role="alert" className="text-error">{error}</p>:null}
    <Dialog open={mode!==null} onOpenChange={value=>{if(!value&&!pending)setMode(null);}}
      title={mode==="APPROVE"?"Approve this request?":"Reject this request"}
      description={mode==="APPROVE"?impact(requestType):
        "The learner's current application, round or offer remains unchanged when this request is rejected."}
      footer={<>
        <Button variant="secondary" disabled={pending||guardedPending} onClick={()=>setMode(null)}>Cancel</Button>
        <Button disabled={pending||guardedPending||!valid} onClick={decide}>
          {pending?"Saving…":mode==="APPROVE"?"Approve request":"Reject request"}
        </Button>
      </>}>
      {mode==="REJECT"?<div className="space-y-3">
        <p className="text-sm font-semibold">Reason for rejection</p>
        <div role="group" aria-label="Rejection reasons" className="flex flex-wrap gap-2">
          {rejectionReasons.map(choice=><button key={choice} type="button" disabled={pending||guardedPending}
            aria-pressed={reason===choice} onClick={()=>{setReason(choice);setError(null);}}
            className={reason===choice?"min-h-10 rounded border border-primary bg-primary-subtle px-3 text-sm font-semibold text-primary-text":
              "min-h-10 rounded border border-border px-3 text-sm text-body"}>{choice}</button>)}
        </div>
        {reason==="Other"?<label className="block text-sm font-semibold">Explain the rejection
          <textarea value={note} onChange={e=>setNote(e.target.value)} minLength={3} maxLength={2000}
            disabled={pending||guardedPending} rows={3} className="mt-2 w-full rounded border border-border bg-surface p-3 text-sm"/>
        </label>:null}
        {!valid&&reason?"Enter a rejection reason of at least 3 characters.":null}
      </div>:mode==="APPROVE"?<label className="block text-sm font-semibold">Approval note (optional)
        <textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={2000}
          disabled={pending||guardedPending} rows={3} className="mt-2 w-full rounded border border-border bg-surface p-3 text-sm"/>
      </label>:null}
      {error?<p role="alert" className="mt-3 text-sm text-error">{error}</p>:null}
    </Dialog>
  </div>;
}
