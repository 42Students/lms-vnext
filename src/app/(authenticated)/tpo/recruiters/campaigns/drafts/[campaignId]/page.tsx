import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import {Pagination} from "@/components/ui/pagination";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {getTpoCampaignDraft,listTpoCampaignRecipientStatuses,tpoCampaignDraftStorageReady} from "@/modules/messaging/tpo-campaign-draft-service";
import {CAMPAIGN_DRAFT_UNAVAILABLE} from "@/modules/messaging/tpo-campaign-draft-model";
import {tpoCampaignDispatchReady} from "@/modules/messaging/tpo-campaign-dispatch-service";
import {TpoCampaignSendControl} from "@/components/tpo/tpo-campaign-send-control";
export const dynamic="force-dynamic";
export default async function TpoCampaignDraftDetail({params,searchParams}:{
 params:Promise<{campaignId:string}>;searchParams?:Promise<{page?:string|string[]}>;
}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const ready=await tpoCampaignDraftStorageReady();
 const {campaignId}=await params;
 const draft=ready?await getTpoCampaignDraft(context,campaignId):null;
 const deliveryReady=ready?await tpoCampaignDispatchReady():false;
 const recipients=draft?await listTpoCampaignRecipientStatuses(context,campaignId):null;
 const raw=searchParams?await searchParams:{};
 const rawPage=Array.isArray(raw.page)?raw.page[0]:raw.page;
 const totalPages=Math.max(1,Math.ceil((recipients?.rows.length??0)/25));
 const requestedPage=Number(rawPage??"1");
 const page=Number.isSafeInteger(requestedPage)?Math.max(1,Math.min(totalPages,requestedPage)):1;
 if(ready&&!draft)notFound();
 return <div className="min-w-0 space-y-5">
  <Link href="/tpo/recruiters/campaigns" className="inline-flex min-h-11 sm:min-h-9 items-center text-sm text-link underline">
   ← Campaign history
  </Link>
  {!ready?<p role="alert" className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-[var(--lms-space-5)]">{CAMPAIGN_DRAFT_UNAVAILABLE}</p>:
   draft?<article className="space-y-4 border-t border-border pt-5">
    <PageHeader title={draft.title}
      description={draft.sender_name+" · "+draft.status+" · "+draft.total_recipients+" potential recipients · "+draft.segment.replaceAll("_"," ")} />
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
     {recipients.rows.length?<ul className="divide-y divide-border rounded-[var(--lms-control-radius)] border border-border">
      {recipients.rows.slice((page-1)*25,page*25).map(row=><li key={row.id} className="flex min-w-0 flex-wrap items-center justify-between gap-3 p-3 text-sm">
       <Link href={"/tpo/recruiters/"+encodeURIComponent(row.leadId)}
        className="inline-flex min-h-11 sm:min-h-9 min-w-0 items-center break-words font-semibold text-link underline">{row.name}</Link>
       <span className="rounded-[var(--lms-control-radius)] border border-border px-2 py-1 text-xs">
        {({PENDING:"Not sent",QUEUED:"Queued · delivery not confirmed",SENT:"Provider accepted",FAILED:"Failed",
          SKIPPED_NO_EMAIL:"Skipped · no email",SKIPPED_UNSUBSCRIBED:"Skipped · opted out",
          UNSUBSCRIBED:"Unsubscribed"} as Record<string,string>)[row.status]??"Recorded"}
       </span>
      </li>)}
     </ul>:<p role="status" className="text-sm">No individual recipient results yet.</p>}
     <Pagination page={page} pageCount={totalPages}
       hrefForPage={next=>"/tpo/recruiters/campaigns/drafts/"+encodeURIComponent(campaignId)+"?page="+next}
       label="Campaign recipient pages"/>
     {recipients.hasMore?<p role="status" className="text-xs">Showing the first 500 recipients.</p>:null}
    </section>:null}
   </article>:null}
 </div>;
}
