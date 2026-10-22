"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Textarea } from "@/components/ui/textarea";
import {Button} from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";

export function TpoTrustToggle({
  relationshipId, companyName, isTrusted,
}: { relationshipId: string; companyName: string; isTrusted: boolean; }) {
  const router=useRouter();
  const reasonHelpId=useId();
  const [pending,setPending]=useState(false);
  const lock=useRef(false);
  const [success,setSuccess]=useState("");
  const [review,setReview]=useState(false);
  const [reason,setReason]=useState("");
  const [error,setError]=useState<string|null>(null);
  const nextTrusted=!isTrusted;
  const valid=reason.trim().length>=8&&reason.trim().length<=500;

  async function submit(){
    if(pending||lock.current||!valid)return;
    lock.current=true;
    setPending(true);setError(null);setSuccess("");
    try{
      const response=await fetch("/api/placements/tpo/settings/company-trust",{
        method:"POST",credentials:"same-origin",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({relationshipId,expectedTrusted:isTrusted,
          nextTrusted,reason:reason.trim(),confirmed:true}),
      });
      if(!response.ok){
        if(response.status===409)throw Error("Company trust was changed elsewhere. Refresh to review.");
        throw Error("Could not update trust. The original state was preserved.");
      }
      const receipt:unknown=await response.json().catch(()=>null);
      const saved=receipt&&typeof receipt==="object"&&!Array.isArray(receipt)
        ?receipt as Record<string,unknown>:null;
      if(!saved||saved["relationshipId"]!==relationshipId||saved["isTrusted"]!==nextTrusted||
         typeof saved["changedAt"]!=="string")
        throw Error("Trust update could not be confirmed. Refresh to review.");
      setReview(false);setReason("");setSuccess(nextTrusted?"Company trust updated.":"Company trust removed.");router.refresh();
    }catch(caught){
      setError(caught instanceof Error?caught.message:"Company trust update failed.");
    }finally{lock.current=false;setPending(false);}
  }
  return <div className="min-w-0 space-y-2 sm:mt-2">
    <Button variant="secondary" type="button" disabled={pending} onClick={()=>{setError(null);setSuccess("");setReview(true);}}
      className="min-h-11 w-full sm:w-auto md:min-h-9">
      {pending?"Saving...":isTrusted?"Remove company trust":"Mark company trusted"}
    </Button>
    <ConfirmDialog open={review} onOpenChange={value=>{if(!pending)setReview(value);}}
      title={"Confirm "+(nextTrusted?"mark trusted":"remove trust")+" for "+companyName+"?"}
      description={"This changes only this college-company relationship, not recruiter-domain allowlisting or direct login permissions."}
      confirmLabel={nextTrusted?"Mark company trusted":"Remove company trust"}
      pending={pending} confirmDisabled={!valid} confirmVariant={nextTrusted?"primary":"danger"} onConfirm={()=>void submit()}>
      <label className="block min-w-0 space-y-2 text-[13px] font-semibold text-[var(--lms-neutral-400)]">
        {"Reason for "+(nextTrusted?"trusting ":"removing trust from ")+companyName+" (at least 8 characters):"}
        <Textarea autoFocus value={reason} onChange={event=>{setReason(event.target.value);setError(null);}}
          maxLength={500} rows={3} className="min-h-24 w-full" disabled={pending} aria-invalid={reason.length>0&&!valid}
          aria-describedby={reasonHelpId}/>
      </label>
      <p id={reasonHelpId} className="mt-2 flex min-w-0 flex-wrap items-center justify-between gap-2 text-xs text-body"><span>Enter a reason between 8 and 500 characters.</span><span className="tabular-nums">{reason.trim().length}/500</span></p>
      {error?<InlineNotice tone="error" message={error}/>:null}
    </ConfirmDialog>
    {error&&!review?<InlineNotice tone="error" message={error}/>:null}
    {success?<div role="status"><InlineNotice tone="success" message={success}/></div>:null}
  </div>;
}
