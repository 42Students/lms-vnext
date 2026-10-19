"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Textarea } from "@/components/ui/textarea";
import {Button} from "@/components/ui/button";

export function TpoTrustToggle({
  relationshipId, companyName, isTrusted,
}: { relationshipId: string; companyName: string; isTrusted: boolean; }) {
  const router=useRouter();
  const [pending,setPending]=useState(false);
  const [review,setReview]=useState(false);
  const [reason,setReason]=useState("");
  const [error,setError]=useState<string|null>(null);
  const nextTrusted=!isTrusted;
  const valid=reason.trim().length>=8&&reason.trim().length<=500;

  async function submit(){
    if(pending||!valid)return;
    setPending(true);setError(null);
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
      setReview(false);setReason("");router.refresh();
    }catch(caught){
      setError(caught instanceof Error?caught.message:"Company trust update failed.");
    }finally{setPending(false);}
  }
  return <div className="mt-2">
    <Button variant="secondary" type="button" disabled={pending} onClick={()=>{setError(null);setReview(true);}}
      >
      {pending?"Saving...":isTrusted?"Remove company trust":"Mark company trusted"}
    </Button>
    <ConfirmDialog open={review} onOpenChange={value=>{if(!pending)setReview(value);}}
      title={"Confirm "+(nextTrusted?"mark trusted":"remove trust")+" for "+companyName+"?"}
      description={"This changes only this college-company relationship, not recruiter-domain allowlisting or direct login permissions."}
      confirmLabel={nextTrusted?"Mark company trusted":"Remove company trust"}
      pending={pending} confirmDisabled={!valid} onConfirm={()=>void submit()}>
      <label className="block space-y-2 text-sm font-semibold text-foreground">
        {"Reason for "+(nextTrusted?"trusting ":"removing trust from ")+companyName+" (at least 8 characters):"}
        <Textarea autoFocus value={reason} onChange={event=>{setReason(event.target.value);setError(null);}}
          maxLength={500} disabled={pending} aria-invalid={reason.length>0&&!valid}
          aria-describedby="tpo-company-trust-reason-help"/>
      </label>
      <p id="tpo-company-trust-reason-help" className="mt-2 text-sm text-body">Enter a reason between 8 and 500 characters.</p>
      {error?<p role="alert" className="mt-2 text-sm text-foreground">{error}</p>:null}
    </ConfirmDialog>
    {error&&!review?<p role="alert" className="mt-2 text-sm text-foreground">{error}</p>:null}
  </div>;
}
