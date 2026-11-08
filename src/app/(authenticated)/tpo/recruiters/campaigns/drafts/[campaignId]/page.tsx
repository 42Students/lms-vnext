import { PageHeader } from "@/components/ui/page-header";
import { Banner } from "@/components/ui/banner";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatTile } from "@/components/ui/stat-tile";
import tpoTileStyles from "@/components/placements/legacy-tpo-report-stats.module.css";
import {Pagination} from "@/components/ui/pagination";
import {Disclosure} from "@/components/ui/disclosure";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {getTpoCampaignDraft,listTpoCampaignRecipientStatuses,tpoCampaignDraftStorageReady,listTpoCampaignDrafts} from "@/modules/messaging/tpo-campaign-draft-service";
import {CAMPAIGN_DRAFT_UNAVAILABLE} from "@/modules/messaging/tpo-campaign-draft-model";
import {tpoCampaignDispatchReady} from "@/modules/messaging/tpo-campaign-dispatch-service";
import {TpoCampaignSendControl} from "@/components/tpo/tpo-campaign-send-control";
import {TpoCampaignPrototypeSidebar} from "@/components/tpo/tpo-campaign-prototype-sidebar";
import {TpoCampaignSentStory} from "@/components/tpo/tpo-campaign-sent-story";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";
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
 const raw=searchParams?await searchParams:{};
 if(Array.isArray(raw.page) || (raw.page!==undefined && !/^[1-9][0-9]{0,5}$/.test(raw.page))) {
  return <div className="min-w-0 space-y-4">
   <PageHeader title="Campaign recipients" />
   <ErrorState title="Invalid recipient page"
    description="Choose one positive page number. No campaign recipient records were loaded from this link."
    action={<TextLink href="/tpo/recruiters/campaigns" className="inline-flex min-h-11 items-center md:min-h-9">Back to campaign history</TextLink>} />
  </div>;
 }
 const ready=await tpoCampaignDraftStorageReady();
 const {campaignId}=await params;
 const draft=ready?await getTpoCampaignDraft(context,campaignId):null;
 const deliveryReady=ready?await tpoCampaignDispatchReady():false;
 const [recipients,campaigns]=await Promise.all([
  draft?listTpoCampaignRecipientStatuses(context,campaignId):Promise.resolve(null),
  ready?listTpoCampaignDrafts(context).catch(()=>null):Promise.resolve(null),
 ]);
 const rawPage=raw.page;
 const totalPages=Math.max(1,Math.ceil((recipients?.rows.length??0)/25));
 const requestedPage=Number(rawPage??"1");
 const page=Number.isSafeInteger(requestedPage)?Math.max(1,Math.min(totalPages,requestedPage)):1;
 if(ready&&!draft)notFound();
 return <div className="min-w-0 space-y-4">
  <PageHeader title={draft?.title??"Campaign draft"}
    {...(draft?{description:draft.sender_name+" · "+draft.status+" · "+draft.total_recipients+" potential recipients · "+draft.segment.replaceAll("_"," ")}:{})}
    actions={<TextLink href="/tpo/recruiters/campaigns"
      className="inline-flex min-h-11 w-full min-w-0 items-center justify-center text-sm sm:w-auto md:min-h-9">
      ← Campaign history
    </TextLink>}/>
  <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(250px,320px)_minmax(0,1fr)]">
   <TpoCampaignPrototypeSidebar rows={campaigns?.rows??[]}
    ready={campaigns?.ready===true} actorUserId={context.user.id} activeId={campaignId}/>
  {!ready?<Banner tone="warning">{CAMPAIGN_DRAFT_UNAVAILABLE}</Banner>:
   draft?<article className="min-w-0 space-y-4">
    <TpoCampaignSentStory
     campaign={{
      status:draft.status,subject:draft.subject,body:draft.body,
      senderName:draft.sender_name,createdAt:draft.created_at,
      totalRecipients:draft.total_recipients,providerAccepted:draft.sent,
      failed:draft.failed,skipped:draft.skipped,
     }}
     recipients={recipients?.rows??[]}
     recipientsReady={recipients?.ready===true}
     hasMoreRecipients={recipients?.hasMore??false}
    />

    <section aria-label="Campaign delivery summary" className="grid gap-3 sm:grid-cols-3">
      <StatTile label="Provider accepted" value={draft.sent} {...(tpoTileStyles["tile"]===undefined?{}:{className:tpoTileStyles["tile"]})} />
      <StatTile label="Failed" value={draft.failed} {...(tpoTileStyles["tile"]===undefined?{}:{className:tpoTileStyles["tile"]})} />
      <StatTile label="Skipped" value={draft.skipped+Object.values(draft.suppressed_counts).reduce((a,b)=>a+b,0)} {...(tpoTileStyles["tile"]===undefined?{}:{className:tpoTileStyles["tile"]})} />
    </section>
    <p className="text-xs text-muted-foreground leading-5">Provider acceptance is not proof of delivery.</p>
    <TpoCampaignSendControl campaignId={campaignId} ready={deliveryReady}
      recipients={draft.total_recipients} status={draft.status}/>
    <section className="border-b border-[var(--lms-canvas-border)] pb-4">
     <Heading level={2} size="sm" className="leading-4 text-[var(--lms-neutral-400)]">Subject</Heading>
     <p className="mt-2 break-words text-[14px] leading-[1.6] text-[var(--lms-body-text)]">{draft.subject}</p>
    </section>
    <Disclosure title="Message" className="border-b border-[var(--lms-canvas-border)] pb-3">
     <div className="min-w-0 pt-2">
     <p className="mt-2 whitespace-pre-wrap break-words text-[14px] leading-[1.6] text-[var(--lms-body-text)]">{draft.body}</p>
     </div>
    </Disclosure>
    <p className="text-xs text-muted-foreground leading-5">Template: {draft.template_key}</p>

    {recipients?.ready?<section aria-label="Campaign recipient statuses" className="space-y-3">
     <Heading level={2} size="lg" className="leading-[1.4] text-[var(--lms-heading)]">Recipients and delivery status</Heading>
     <p className="text-xs text-muted-foreground leading-5">Names and recorded provider outcomes only. Sent means the email provider accepted the request, not that the recruiter read it.</p>
     {recipients.rows.length?<ul className="min-w-0 divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">
      {recipients.rows.slice((page-1)*25,page*25).map(row=><li key={row.id} className="flex min-w-0 flex-col items-start gap-2 py-[var(--lms-space-3)] text-sm sm:flex-row sm:items-center sm:justify-between">
       <TextLink href={"/tpo/recruiters/"+encodeURIComponent(row.leadId)}
        className="inline-flex min-h-11 md:min-h-9 min-w-0 items-center break-words">{row.name}</TextLink>
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
     {recipients.hasMore?<p role="status" className="text-xs leading-5">Showing the first 500 recipients.</p>:null}
    </section>:null}
   </article>:null}
  </div>
 </div>;
}
