import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
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
import {TpoCampaignPrototypeSidebar} from "@/components/tpo/tpo-campaign-prototype-sidebar";
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
 const result=await listTpoMessagingHistory(context,query.data).catch(()=>null);
 const drafts=await listTpoCampaignDrafts(context).catch(()=>null);
 const deliveryReady=await tpoCampaignDispatchReady().catch(()=>null);
 const recent=drafts?.ready===true?drafts.rows[0]:undefined;
 if(!result)return <div className="min-w-0 space-y-4">
   <PageHeader title="Emails" description="Email campaigns from Engage"/>
   <Alert tone="error"><strong>Could not load email history.</strong>
    <Link href="/tpo/recruiters/campaigns" className="ml-2 font-semibold text-link underline">Retry</Link>
   </Alert>
  </div>;
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Emails"
   description="Email campaigns from Engage. Sent counts mean provider acceptance, not confirmed delivery."
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
  <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(250px,320px)_minmax(0,1fr)]">
   <TpoCampaignPrototypeSidebar ready={drafts?.ready===true}
    rows={drafts?.rows??[]} actorUserId={context.user.id}/>
   <section aria-label="Email workspace overview" data-testid="tpo.campaigns.prototype-overview"
    className="min-w-0 rounded-xl border border-border bg-surface p-4 md:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
     <div><h2 className="text-lg font-semibold text-foreground">Emails</h2>
      <p className="mt-1 text-sm text-body">Pick a campaign on the left to read its subject, content, and verified sending outcomes.</p>
     </div>
     <Link href="/tpo/recruiters/campaigns/new"
      className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary md:min-h-9">New email</Link>
    </div>
    {recent?<div className="mt-6 space-y-3 border-t border-border pt-4">
     <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Most recent saved campaign</p>
     <h3 className="text-[20px] font-semibold text-foreground">{recent.title}</h3>
     <p className="text-sm text-body">Subject: {recent.subject}</p>
     <p className="text-sm text-body">{recent.total_recipients} eligible at draft time · {recent.sent} provider accepted · {recent.failed} failed · {recent.skipped} skipped</p>
     <p className="text-xs text-muted-foreground">A provider acceptance receipt does not confirm that an email was opened or received.</p>
     <Link href={"/tpo/recruiters/campaigns/drafts/"+encodeURIComponent(recent.campaign_id)}
      className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold text-link md:min-h-9">Open email</Link>
    </div>:<p role="status" className="mt-6 border-t border-border pt-4 text-sm text-body">
     {drafts?.ready===true?"No saved emails yet. Use New email to write and review a campaign.":"The saved campaign list is unavailable. No emails have been assumed missing."}
    </p>}
   </section>
  </div>
  <details className="rounded-xl border border-border bg-surface">
   <summary className="min-h-11 cursor-pointer px-4 py-3 text-sm font-semibold text-link">
    Advanced history, filters and provider receipt ledger
   </summary>
   <div className="min-w-0 space-y-4 border-t border-border p-4">
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

  <section aria-label="Email campaigns" className="space-y-3 rounded-[12px] border border-border bg-surface p-4 md:p-5">
   <p className="text-sm text-body">{TPO_CAMPAIGN_RECIPIENT_CAP_COPY}</p>
   <div className="flex flex-wrap items-center justify-between gap-2">
    <h2 className="font-semibold text-[18px] leading-[1.4] text-[var(--lms-heading)]">Emails sent from Engage</h2>
    <StatusBadge tone={deliveryReady===true?"success":deliveryReady===false?"warning":"neutral"}>
      {deliveryReady===true?"Email ready":deliveryReady===false?"Email unavailable":"Readiness unknown"}
    </StatusBadge>
   </div>
   {!drafts||!drafts.ready?<p role="alert" className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-4 text-sm text-body leading-[22px]">
     {drafts?CAMPAIGN_DRAFT_UNAVAILABLE:"Could not load campaign history."}
     <Link href="/tpo/recruiters/campaigns" className="ml-2 font-semibold text-link underline">Retry</Link>
    </p>:drafts.rows.length===0?
    <p role="status" className="text-sm text-body leading-[22px]">No emails sent from Engage yet. Create an email campaign to begin.</p>:
    <ul className="min-w-0 divide-y divide-border">
     {drafts.rows.map(item=><li key={item.campaign_id}
      className="min-w-0 py-3 first:pt-0 last:pb-0">
      <Link className="inline-flex min-h-11 min-w-0 items-center break-words font-semibold text-link underline lms-inline-link md:min-h-9"
       href={"/tpo/recruiters/campaigns/drafts/"+encodeURIComponent(item.campaign_id)}>
       {item.title}
      </Link>
      <p className="mt-1 text-sm font-medium text-foreground leading-[22px]">Subject: {item.subject}</p>
      <p className="mt-1 text-xs text-muted-foreground leading-5">
       {item.sender_name} · {tpoCampaignHistoryTime(new Date(item.created_at))} IST
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
       <StatusBadge tone={item.status==="SENT"?"success":item.status==="SENDING"?"info":"neutral"}>{tpoCampaignHistoryStatus(item.status)}</StatusBadge>
       <StatusBadge tone="success">{item.sent} sent</StatusBadge>
       {item.skipped>0?<StatusBadge tone="warning">{item.skipped} skipped</StatusBadge>:null}
       {item.failed>0?<StatusBadge tone="error">{item.failed} failed</StatusBadge>:null}
       <span className="text-muted-foreground">{item.sent+item.skipped+item.failed} recipient outcomes</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground leading-5">Segment: {item.segment.replaceAll("_"," ")}</p>
     </li>)}
    </ul>}
   {deliveryReady!==true?<p role="alert" className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-3 text-sm text-body leading-[22px]"><strong>Campaign email is not set up yet, so nothing can be sent. Ask 42 to switch it on.</strong> {CAMPAIGN_DELIVERY_UNAVAILABLE} {TPO_CAMPAIGN_PROVIDER_DISABLED_COPY} <Link href="/tpo/recruiters/campaigns" className="font-semibold text-link underline">Check delivery readiness again</Link></p>:null}
  </section>
  <h2 className="font-semibold text-[18px] leading-[1.4] text-[var(--lms-heading)]">Delivery batch receipts</h2>
  <p className="text-xs text-muted-foreground">Receipts below are an additional delivery ledger, separate from the campaign send history.</p>
  <p role="status" className="text-sm text-body leading-[22px]">{result.total} recorded batches · Page {result.page} of {result.pages}</p>
  {result.rows.length ? <ol aria-label="recruiters campaigns entries" className="min-w-0 divide-y divide-border rounded-[12px] border border-border bg-surface px-4">
    {result.rows.map(row=><li key={row.id} className="min-w-0 py-3">
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
   </div>
  </details>
 </div>;
}
