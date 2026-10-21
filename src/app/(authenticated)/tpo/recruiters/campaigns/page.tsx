import { Alert } from "@/components/ui/alert";
import { Tabs } from "@/components/ui/tabs";
import { Dropdown } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { listTpoMessagingHistory } from "@/modules/messaging/receipt-history-service";
import { messagingHistoryQuerySchema } from "@/modules/messaging/receipt-history-model";
import {listTpoCampaignDrafts} from "@/modules/messaging/tpo-campaign-draft-service";
import {tpoCampaignDispatchReady} from "@/modules/messaging/tpo-campaign-dispatch-service";
import {CAMPAIGN_DRAFT_UNAVAILABLE,CAMPAIGN_DELIVERY_UNAVAILABLE} from "@/modules/messaging/tpo-campaign-draft-model";
import {tpoCampaignHistoryTime,tpoCampaignHistoryStatus} from "@/modules/messaging/tpo-campaign-history-copy";
import {TPO_CAMPAIGN_RECIPIENT_CAP_COPY,TPO_CAMPAIGN_PROVIDER_DISABLED_COPY} from "@/modules/messaging/tpo-campaign-legacy-compat";

type PageProps = {searchParams:Promise<{page?:string|string[];purpose?:string|string[]}>};
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}
export default async function CampaignHistory({searchParams}:PageProps){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const params=await searchParams;
 const query=messagingHistoryQuerySchema.safeParse({page:first(params.page),purpose:first(params.purpose)});
 if(!query.success)return <div className="min-w-0 space-y-4"><PageHeader title="Emails"/><Alert tone="error">Invalid history filters. <Link href="/tpo/recruiters/campaigns">Reset filters</Link></Alert></div>;
 const result=await listTpoMessagingHistory(context,query.data);
 const drafts=await listTpoCampaignDrafts(context);
 const deliveryReady=await tpoCampaignDispatchReady();
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Emails"
   description="Persisted email/SMS batch receipts for your college. Provider acceptance does not prove recipient delivery."
   actions={<div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
     <Link href="/tpo/recruiters/campaigns/new" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] text-on-primary sm:w-auto md:min-h-9">New email campaign</Link>
     <Dropdown mobileSheet align="end" label="More campaign history actions" trigger="More ···"><nav aria-label="Campaign history actions" className="min-w-48 space-y-1">
       <Link href="/tpo/recruiters" className="block rounded-[var(--lms-control-radius)] px-3 py-2 text-sm text-link">Back to Engage</Link>
          <Link href={"/api/placements/tpo/campaigns/history/export"+(first(params.purpose)?"?purpose="+encodeURIComponent(first(params.purpose)!):"")}
     className="block rounded-[var(--lms-control-radius)] px-3 py-2 text-sm text-link">Export filtered history as CSV</Link>
     </nav></Dropdown>
   </div>} />
  <Tabs ariaLabel="Engage views" renderPanel={false} value="campaigns"
    items={([["table","Table"],["board","Board"],["companies","Companies"],["campaigns","Emails"]] as const)
      .map(([value,label])=>({value,label,href:"/tpo/recruiters?view="+value}))}/>
  <p className="text-sm text-body leading-[22px]">
   To send one, select recruiters in the table and choose Act, then Send an email.
  </p>
  <form role="search" aria-label="recruiters campaigns filters" method="get" action="/tpo/recruiters/campaigns" className="grid min-w-0 gap-3 border-b border-border pb-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
   <label className="min-w-0 text-[13px] text-[var(--lms-neutral-400)] font-semibold leading-4">Purpose
    <Input name="purpose" maxLength={120} defaultValue={first(params.purpose)??""}
     placeholder="Filter by purpose" className="mt-[6px] block min-h-11 min-[768px]:min-h-9 border border-border px-3"/>
   </label>
   <Button variant="secondary" type="submit" className="min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border px-3 text-sm sm:w-auto md:min-h-9">Apply</Button>
   <Link href="/tpo/recruiters/campaigns" className="inline-flex min-h-11 items-center justify-center text-sm text-link underline lms-inline-link md:min-h-9">Clear</Link>
  </form>

  <section aria-label="Email campaigns" className="space-y-3">
   <p className="text-sm text-body">{TPO_CAMPAIGN_RECIPIENT_CAP_COPY}</p>
   <h2 className="font-semibold text-[18px] leading-[1.4] text-[var(--lms-heading)]">Email campaigns</h2>
   {!drafts.ready?<p role="alert" className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-4 text-sm text-body leading-[22px]">
     {CAMPAIGN_DRAFT_UNAVAILABLE}
    </p>:drafts.rows.length===0?
    <p role="status" className="text-sm text-body leading-[22px]">No email campaigns yet.</p>:
    <ul className="grid min-w-0 gap-3 lg:grid-cols-2">
     {drafts.rows.map(item=><li key={item.campaign_id}
      className="border-b border-border py-4">
      <Link className="inline-flex min-h-11 min-w-0 items-center break-words font-semibold text-link underline lms-inline-link md:min-h-9"
       href={"/tpo/recruiters/campaigns/drafts/"+encodeURIComponent(item.campaign_id)}>
       {item.title}
      </Link>
      <p className="mt-1 text-sm font-medium text-foreground leading-[22px]">Subject: {item.subject}</p>
      <p className="mt-1 text-xs text-muted-foreground leading-5">
       {item.sender_name} · {tpoCampaignHistoryTime(new Date(item.created_at))} IST
      </p>
      <p className="mt-2 text-sm text-body leading-[22px]">
       {tpoCampaignHistoryStatus(item.status)} · {item.sent} sent{item.skipped>0?" · "+item.skipped+" skipped":""}{item.failed>0?" · "+item.failed+" failed":""}
      </p>
      <p className="mt-1 text-xs text-muted-foreground leading-5">Segment: {item.segment.replaceAll("_"," ")}</p>
     </li>)}
    </ul>}
   {!deliveryReady?<p role="alert" className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-3 text-sm text-body leading-[22px]"><strong>Campaign email is not set up yet, so nothing can be sent. Ask 42 to switch it on.</strong> {CAMPAIGN_DELIVERY_UNAVAILABLE} {TPO_CAMPAIGN_PROVIDER_DISABLED_COPY} <Link href="/tpo/recruiters/campaigns" className="font-semibold text-link underline">Check delivery readiness again</Link></p>:null}
  </section>
  <h2 className="font-semibold text-[18px] leading-[1.4] text-[var(--lms-heading)]">Delivery batch receipts</h2>
  <p role="status" className="text-sm text-body leading-[22px]">{result.total} recorded batches · Page {result.page} of {result.pages}</p>
  {result.rows.length ? <ol aria-label="recruiters campaigns entries" className="grid min-w-0 gap-3 lg:grid-cols-2">
    {result.rows.map(row=><li key={row.id} className="min-w-0 border-b border-border py-4">
      <h2 className="break-words font-semibold text-[18px] leading-[1.4] text-[var(--lms-heading)]">
       <Link href={"/tpo/recruiters/campaigns/"+encodeURIComponent(row.id)}
        className="inline-flex min-h-11 min-[768px]:min-h-9 items-center text-link underline-offset-2 hover:underline">{row.purpose}</Link>
      </h2>
      <p className="mt-1 text-xs text-muted-foreground leading-5">{tpoCampaignHistoryTime(row.createdAt)} IST · {row.status}</p>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm text-body">
        <div><dt>Total</dt><dd>{row.total}</dd></div>
        <div><dt>Sent</dt><dd>{row.acceptedByProvider}</dd></div>
        <div><dt>Failed</dt><dd>{row.failed}</dd></div>
        <div><dt>Skipped</dt><dd>{row.suppressed}</dd></div>
      </dl>
    </li>)}
  </ol>:<p className="border-y border-border bg-transparent py-[var(--lms-space-5)] text-sm text-body leading-[22px]">No emails sent from Engage yet.</p>}
  <nav className="flex flex-wrap gap-3" aria-label="Campaign history pagination">
    {result.page>1?<Link href={"/tpo/recruiters/campaigns?page="+(result.page-1)+(first(params.purpose)?"&purpose="+encodeURIComponent(first(params.purpose)!):"")} className="inline-flex min-h-11 min-[768px]:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-link lms-inline-link hover:bg-[rgba(38,186,199,0.07)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Previous</Link>:null}
    {result.page<result.pages?<Link href={"/tpo/recruiters/campaigns?page="+(result.page+1)+(first(params.purpose)?"&purpose="+encodeURIComponent(first(params.purpose)!):"")} className="inline-flex min-h-11 min-[768px]:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-link lms-inline-link hover:bg-[rgba(38,186,199,0.07)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Next</Link>:null}
  </nav>
 </div>;
}
