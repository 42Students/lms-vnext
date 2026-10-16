import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {getTpoCampaignDraft,tpoCampaignDraftStorageReady} from "@/modules/messaging/tpo-campaign-draft-service";
import {CAMPAIGN_DRAFT_UNAVAILABLE} from "@/modules/messaging/tpo-campaign-draft-model";
import {tpoCampaignDispatchReady} from "@/modules/messaging/tpo-campaign-dispatch-service";
import {TpoCampaignSendControl} from "@/components/tpo/tpo-campaign-send-control";
export const dynamic="force-dynamic";
export default async function TpoCampaignDraftDetail({params}:{params:Promise<{campaignId:string}>}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const ready=await tpoCampaignDraftStorageReady();
 const {campaignId}=await params;
 const draft=ready?await getTpoCampaignDraft(context,campaignId):null;
 const deliveryReady=ready?await tpoCampaignDispatchReady():false;
 if(ready&&!draft)notFound();
 return <main className="space-y-5">
  <Link href="/tpo/recruiters/campaigns" className="text-sm text-primary-text underline">
   ← Campaign history
  </Link>
  {!ready?<p role="alert" className="rounded-md border border-border bg-surface p-5">{CAMPAIGN_DRAFT_UNAVAILABLE}</p>:
   draft?<article className="space-y-4 rounded-xl border border-border bg-surface p-5">
    <h1 className="text-xl font-semibold text-foreground">{draft.title}</h1>
    <p className="text-sm text-body">{draft.sender_name} · {draft.status} · {draft.total_recipients} potential recipients · {draft.segment.replaceAll("_"," ")}</p>
    <dl className="grid grid-cols-3 gap-3 text-sm">
      <div><dt>Provider accepted</dt><dd className="font-semibold">{draft.sent}</dd></div>
      <div><dt>Failed</dt><dd className="font-semibold">{draft.failed}</dd></div>
      <div><dt>Skipped</dt><dd className="font-semibold">{draft.skipped+Object.values(draft.suppressed_counts).reduce((a,b)=>a+b,0)}</dd></div>
    </dl>
    <p className="text-xs text-muted-foreground">Provider acceptance is not proof of delivery.</p>
    <section><h2 className="text-sm font-semibold text-muted-foreground">Subject</h2>
     <p className="mt-1 break-words text-foreground">{draft.subject}</p></section>
    <section><h2 className="text-sm font-semibold text-muted-foreground">Message</h2>
     <p className="mt-1 whitespace-pre-wrap break-words text-foreground">{draft.body}</p></section>
    <p className="text-xs text-muted-foreground">Template: {draft.template_key}</p>
    <TpoCampaignSendControl campaignId={campaignId} ready={deliveryReady}
      recipients={draft.total_recipients} status={draft.status}/>
   </article>:null}
 </main>;
}
