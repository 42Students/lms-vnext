import { PageHeader } from "@/components/ui/page-header";
import { Banner } from "@/components/ui/banner";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatTile } from "@/components/ui/stat-tile";
import tpoTileStyles from "@/components/placements/legacy-tpo-report-stats.module.css";
import Link from "next/link";
import {Pagination} from "@/components/ui/pagination";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {getTpoCampaignDraft,listTpoCampaignRecipientStatuses,tpoCampaignDraftStorageReady} from "@/modules/messaging/tpo-campaign-draft-service";
import {CAMPAIGN_DRAFT_UNAVAILABLE} from "@/modules/messaging/tpo-campaign-draft-model";
import {tpoCampaignDispatchReady} from "@/modules/messaging/tpo-campaign-dispatch-service";
import {TpoCampaignSendControl} from "@/components/tpo/tpo-campaign-send-control";
/** The persisted provider receipt state determines the old LMS status-pill tone. */
function receiptTone(status:string):"neutral"|"info"|"success"|"warning"|"error" {
 if(status==="SENT")return "success";
 if(status==="FAILED")return "error";
 if(status==="QUEUED")return "info";
 if(status.startsWith("SKIPPED_")||status==="UNSUBSCRIBED")return "warning";
 return "neutral";
}
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
  <PageHeader title={draft?.title??"Campaign draft"}
    description={draft?draft.sender_name+" · "+draft.status+" · "+draft.total_recipients+" potential recipients · "+draft.segment.replaceAll("_"," "):undefined}
    actions={<Link href="/tpo/recruiters/campaigns"
      className="inline-flex min-h-11 min-[768px]:min-h-9 min-w-0 items-center text-sm font-semibold text-[var(--lms-link-text)] underline underline-offset-4 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
      ← Campaign history
    </Link>}/>
  {!ready?<Banner tone="warning">{CAMPAIGN_DRAFT_UNAVAILABLE}</Banner>:
   draft?<article className="min-w-0 space-y-4">
    <section aria-label="Campaign delivery summary" className="grid gap-3 min-[768px]:grid-cols-3">
      <StatTile label="Provider accepted" value={draft.sent} className={tpoTileStyles.tile} />
      <StatTile label="Failed" value={draft.failed} className={tpoTileStyles.tile} />
      <StatTile label="Skipped" value={draft.skipped+Object.values(draft.suppressed_counts).reduce((a,b)=>a+b,0)} className={tpoTileStyles.tile} />
    </section>
    <p className="text-xs text-muted-foreground">Provider acceptance is not proof of delivery.</p>
    <section className="border-b border-[var(--lms-canvas-border)] pb-4">
     <h2 className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Subject</h2>
     <p className="mt-2 break-words text-[14px] leading-[1.6] text-[var(--lms-body-text)]">{draft.subject}</p>
    </section>
    <section className="border-b border-[var(--lms-canvas-border)] pb-4">
     <h2 className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Message</h2>
     <p className="mt-2 whitespace-pre-wrap break-words text-[14px] leading-[1.6] text-[var(--lms-body-text)]">{draft.body}</p>
    </section>
    <p className="text-xs text-muted-foreground">Template: {draft.template_key}</p>
    <TpoCampaignSendControl campaignId={campaignId} ready={deliveryReady}
      recipients={draft.total_recipients} status={draft.status}/>
    {recipients?.ready?<section aria-label="Campaign recipient statuses" className="space-y-3">
     <h2 className="font-semibold text-[18px] leading-[1.4] text-[var(--lms-heading)]">Recipients and delivery status</h2>
     <p className="text-xs text-muted-foreground">Names and recorded provider outcomes only. Sent means the email provider accepted the request, not that the recruiter read it.</p>
     {recipients.rows.length?<ul className="min-w-0 divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">
      {recipients.rows.slice((page-1)*25,page*25).map(row=><li key={row.id} className="flex min-w-0 flex-wrap items-center justify-between gap-3 py-[10px] text-sm">
       <Link href={"/tpo/recruiters/"+encodeURIComponent(row.leadId)}
        className="inline-flex min-h-11 min-[768px]:min-h-9 min-w-0 items-center break-words font-semibold text-[var(--lms-link-text)] underline underline-offset-4 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">{row.name}</Link>
       <StatusBadge tone={receiptTone(row.status)}>
        {({PENDING:"Not sent",QUEUED:"Queued · delivery not confirmed",SENT:"Provider accepted",FAILED:"Failed",
          SKIPPED_NO_EMAIL:"Skipped · no email",SKIPPED_UNSUBSCRIBED:"Skipped · opted out",
          UNSUBSCRIBED:"Unsubscribed"} as Record<string,string>)[row.status]??"Recorded"}
       </StatusBadge>
      </li>)}
     </ul>:<EmptyState title="No individual recipient results yet."/>}
     <Pagination page={page} pageCount={totalPages}
       hrefForPage={next=>"/tpo/recruiters/campaigns/drafts/"+encodeURIComponent(campaignId)+"?page="+next}
       label="Campaign recipient pages"/>
     {recipients.hasMore?<p role="status" className="text-xs">Showing the first 500 recipients.</p>:null}
    </section>:null}
   </article>:null}
 </div>;
}
