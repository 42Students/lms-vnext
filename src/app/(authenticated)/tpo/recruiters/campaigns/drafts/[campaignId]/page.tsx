import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {getTpoCampaignDraft,tpoCampaignDraftStorageReady} from "@/modules/messaging/tpo-campaign-draft-service";
import {CAMPAIGN_DRAFT_UNAVAILABLE,CAMPAIGN_DELIVERY_UNAVAILABLE} from "@/modules/messaging/tpo-campaign-draft-model";
export const dynamic="force-dynamic";
export default async function TpoCampaignDraftDetail({params}:{params:Promise<{campaignId:string}>}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const ready=await tpoCampaignDraftStorageReady();
 const {campaignId}=await params;
 const draft=ready?await getTpoCampaignDraft(context,campaignId):null;
 if(ready&&!draft)notFound();
 return <main className="space-y-5">
  <Link href="/tpo/recruiters/campaigns" className="text-sm text-primary-text underline">
   ← Campaign history
  </Link>
  {!ready?<p role="alert" className="rounded-md border border-border bg-surface p-5">{CAMPAIGN_DRAFT_UNAVAILABLE}</p>:
   draft?<article className="space-y-4 rounded-xl border border-border bg-surface p-5">
    <h1 className="text-xl font-semibold text-foreground">{draft.title}</h1>
    <p className="text-sm text-body">{draft.status} · {draft.total_recipients} potential recipients · {draft.segment.replaceAll("_"," ")}</p>
    <section><h2 className="text-sm font-semibold text-muted-foreground">Subject</h2>
     <p className="mt-1 break-words text-foreground">{draft.subject}</p></section>
    <section><h2 className="text-sm font-semibold text-muted-foreground">Message</h2>
     <p className="mt-1 whitespace-pre-wrap break-words text-foreground">{draft.body}</p></section>
    <p className="text-xs text-muted-foreground">Template: {draft.template_key}</p>
    <p role="status" className="text-sm text-body">{CAMPAIGN_DELIVERY_UNAVAILABLE}</p>
   </article>:null}
 </main>;
}
