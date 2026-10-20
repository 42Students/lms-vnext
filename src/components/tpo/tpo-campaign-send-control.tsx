"use client";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { InlineNotice } from "@/components/ui/inline-notice";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {CAMPAIGN_DELIVERY_UNAVAILABLE} from "@/modules/messaging/tpo-campaign-draft-model";
export function TpoCampaignSendControl({campaignId,ready,recipients,status}:{
 campaignId:string;ready:boolean;recipients:number;status:string;
}){
 const router=useRouter();
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const [confirmOpen,setConfirmOpen]=useState(false);
 const [outcome,setOutcome]=useState<{sent:number;failed:number;skipped:number}|null>(null);
 async function sendCampaign(){
  if(busy||!ready||recipients===0)return;
    setBusy(true);setError("");setOutcome(null);
    try{
     const response=await fetch("/api/placements/tpo/campaigns/drafts/"+encodeURIComponent(campaignId)+"/send",{
      method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
     });
     const data=await response.json() as {error?:string;sent?:number;failed?:number;skipped?:number};
     if(!response.ok)throw new Error(response.status===503?
      "Campaign email is not set up yet, so nothing can be sent. Ask 42 to switch it on.":
      data.error==="ALREADY_STARTED"?"This campaign has already started. Refresh for receipts.":
      "The campaign could not be sent. Refresh before retrying.");
     setOutcome({sent:data.sent??0,failed:data.failed??0,skipped:data.skipped??0});
     router.refresh();
    }catch(e){setError(e instanceof Error?e.message:"The campaign could not be sent.");}
    finally{setBusy(false);setConfirmOpen(false);}

 }
 if(status!=="DRAFT")return <p className="text-sm text-body">
  This campaign is {status.toLowerCase()}. Provider acceptance does not prove inbox delivery.
 </p>;
 return <section className="min-w-0 space-y-3 border-t border-border pt-4" aria-label="Campaign send">
  <h2 className="font-semibold">Send this campaign</h2>
  {!ready?<Alert tone="warning">
   Campaign email is not set up yet, so nothing can be sent. Ask 42 to switch it on.
   {" "}{CAMPAIGN_DELIVERY_UNAVAILABLE}
  </Alert>:<p className="max-w-prose break-words text-sm leading-6 text-body">
   This sends one email to each currently eligible recipient, excluding opt-outs, bounced and Not now leads.
   The system rechecks every contact before attempting delivery.
  </p>}
  {ready&&recipients===0?<p role="status" className="text-sm text-muted-foreground">No eligible recipients are available for this campaign.</p>:null}
  <Button variant="primary" type="button" disabled={!ready||busy||recipients===0}
   className="min-h-11 w-full sm:w-auto md:min-h-9 rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] text-on-primary disabled:opacity-50"
   onClick={()=>setConfirmOpen(true)}>{busy?"Sending…":"Send campaign"}</Button>
  <ConfirmDialog open={confirmOpen} onOpenChange={next=>{if(!busy)setConfirmOpen(next);}} pending={busy}
    title={"Send to up to "+recipients+" selected recruiter emails?"}
    description="This cannot be undone." confirmLabel="Send campaign"
    onConfirm={()=>void sendCampaign()}/>
  {outcome?<InlineNotice tone={outcome.failed?"info":"success"} message={outcome.sent+" accepted by provider · "+outcome.failed+" failed · "+outcome.skipped+" skipped. Provider acceptance does not prove delivery."}/>:null}
  {error?<InlineNotice tone="error" message={error}/>:null}
 </section>;
}
