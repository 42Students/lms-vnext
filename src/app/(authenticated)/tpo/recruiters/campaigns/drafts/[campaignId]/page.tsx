import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {getTpoCampaignDraft,listTpoCampaignRecipientStatuses,tpoCampaignDraftStorageReady} from "@/modules/messaging/tpo-campaign-draft-service";
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
 const recipients=draft?await listTpoCampaignRecipientStatuses(context,campaignId):null;
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
    {recipients?.ready?<section aria-label="Campaign recipient statuses" className="space-y-3">
     <h2 className="font-semibold">Recipients and delivery status</h2>
     <p className="text-xs text-muted-foreground">Names and recorded provider outcomes only. Sent means the email provider accepted the request, not that the recruiter read it.</p>
     {recipients.rows.length?<ul className="divide-y divide-border rounded-lg border border-border">
      {recipients.rows.map(row=><li key={row.id} className="flex min-w-0 flex-wrap items-center justify-between gap-3 p-3 text-sm">
       <Link href={"/tpo/recruiters/"+encodeURIComponent(row.leadId)}
        className="min-w-0 break-words font-semibold text-primary-text underline">{row.name}</Link>
       <span className="rounded border border-border px-2 py-1 text-xs">
        {({PENDING:"Not sent",QUEUED:"Queued · delivery not confirmed",SENT:"Provider accepted",FAILED:"Failed",
          SKIPPED_NO_EMAIL:"Skipped · no email",SKIPPED_UNSUBSCRIBED:"Skipped · opted out",
          UNSUBSCRIBED:"Unsubscribed"} as Record<string,string>)[row.status]??"Recorded"}
       </span>
      </li>)}
     </ul>:<p role="status" className="text-sm">No individual recipient results yet.</p>}
     {recipients.hasMore?<p role="status" className="text-xs">Showing the first 500 recipients.</p>:null}
    </section>:null}
   </article>:null}
 </main>;
}
