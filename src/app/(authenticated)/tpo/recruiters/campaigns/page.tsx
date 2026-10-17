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

type PageProps = {searchParams:Promise<{page?:string|string[];purpose?:string|string[]}>};
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}
export default async function CampaignHistory({searchParams}:PageProps){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const params=await searchParams;
 const query=messagingHistoryQuerySchema.safeParse({page:first(params.page),purpose:first(params.purpose)});
 if(!query.success)return <main className="space-y-4"><PageHeader eyebrow="Engage" title="Emails"/><p role="alert">Invalid history filters. <Link href="/tpo/recruiters/campaigns">Reset filters</Link></p></main>;
 const result=await listTpoMessagingHistory(context,query.data);
 const drafts=await listTpoCampaignDrafts(context);
 const deliveryReady=await tpoCampaignDispatchReady();
 return <main className="space-y-6">
  <PageHeader eyebrow="Engage" title="Emails"
   description="Persisted email/SMS batch receipts for your college. Provider acceptance does not prove recipient delivery."/>
  <nav aria-label="Engage views" className="flex flex-wrap gap-2">
   {([["table","Table"],["board","Board"],["companies","Companies"],["campaigns","Emails"]] as const)
     .map(([value,label])=><Link key={value} href={"/tpo/recruiters?view="+value}
       aria-current={value==="campaigns"?"page":undefined}
       className={value==="campaigns"
         ?"inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary"
         :"inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-body"}>
       {label}
     </Link>)}
  </nav>
  <p className="text-sm text-body">
   To send one, select recruiters in the table and choose Act, then Send an email.
  </p>
  <form method="get" action="/tpo/recruiters/campaigns" className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-3">
   <label className="text-sm">Purpose
    <input name="purpose" maxLength={120} defaultValue={first(params.purpose)??""}
     placeholder="Filter by purpose" className="mt-1 block min-h-10 rounded border border-border px-3"/>
   </label>
   <button type="submit" className="min-h-10 rounded border border-border px-3 text-sm">Apply</button>
   <Link href="/tpo/recruiters/campaigns" className="text-sm text-primary-text underline">Clear</Link>
  </form>
  <nav aria-label="Campaign history actions" className="flex flex-wrap gap-3">
   <Link href="/tpo/recruiters/campaigns/new"
    className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">
    New email campaign
   </Link>
   <Link href="/tpo/recruiters" className="inline-flex min-h-11 items-center text-sm text-primary-text">Back to Engage</Link>
   <Link href={"/api/placements/tpo/campaigns/history/export"+(first(params.purpose)?"?purpose="+encodeURIComponent(first(params.purpose)!):"")}
     className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm text-primary-text">Export filtered history as CSV</Link>
  </nav>
  <section aria-label="Email campaigns" className="space-y-3">
   <h2 className="text-lg font-semibold text-foreground">Email campaigns</h2>
   {!drafts.ready?<p role="alert" className="rounded-md border border-border bg-surface p-4 text-sm text-body">
     {CAMPAIGN_DRAFT_UNAVAILABLE}
    </p>:drafts.rows.length===0?
    <p role="status" className="text-sm text-body">No email campaigns yet.</p>:
    <ul className="grid gap-3 sm:grid-cols-2">
     {drafts.rows.map(item=><li key={item.campaign_id}
      className="rounded-md border border-border bg-surface p-4">
      <Link className="font-semibold text-primary-text underline"
       href={"/tpo/recruiters/campaigns/drafts/"+encodeURIComponent(item.campaign_id)}>
       {item.title}
      </Link>
      <p className="mt-1 text-sm font-medium text-foreground">Subject: {item.subject}</p>
      <p className="mt-1 text-xs text-muted-foreground">
       {item.sender_name} · {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(new Date(item.created_at))} IST
      </p>
      <p className="mt-2 text-sm text-body">
       {item.status} · {item.total_recipients} selected · {item.sent} sent · {item.skipped} skipped · {item.failed} failed
      </p>
      <p className="mt-1 text-xs text-muted-foreground">Segment: {item.segment.replaceAll("_"," ")}</p>
     </li>)}
    </ul>}
   {!deliveryReady?<p role="alert" className="rounded-lg border border-border bg-surface p-3 text-sm text-body"><strong>Campaign email is not set up yet, so nothing can be sent. Ask 42 to switch it on.</strong> {CAMPAIGN_DELIVERY_UNAVAILABLE}</p>:null}
  </section>
  <h2 className="text-lg font-semibold text-foreground">Delivery batch receipts</h2>
  <p role="status" className="text-sm text-body">{result.total} recorded batches · Page {result.page} of {result.pages}</p>
  {result.rows.length ? <ol className="grid gap-3 sm:grid-cols-2">
    {result.rows.map(row=><li key={row.id} className="min-w-0 rounded-xl border border-border bg-surface p-4">
      <h2 className="break-words font-semibold text-foreground">
       <Link href={"/tpo/recruiters/campaigns/"+encodeURIComponent(row.id)}
        className="text-primary-text underline-offset-2 hover:underline">{row.purpose}</Link>
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">{new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(row.createdAt)} IST · {row.status}</p>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm text-body">
        <div><dt>Total</dt><dd>{row.total}</dd></div>
        <div><dt>Sent</dt><dd>{row.acceptedByProvider}</dd></div>
        <div><dt>Failed</dt><dd>{row.failed}</dd></div>
        <div><dt>Skipped</dt><dd>{row.suppressed}</dd></div>
      </dl>
    </li>)}
  </ol>:<p className="rounded-xl border border-border bg-surface p-5 text-sm text-body">No emails sent from Engage yet.</p>}
  <nav className="flex flex-wrap gap-3" aria-label="Campaign history pagination">
    {result.page>1?<Link href={"/tpo/recruiters/campaigns?page="+(result.page-1)+(first(params.purpose)?"&purpose="+encodeURIComponent(first(params.purpose)!):"")} className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-primary-text">Previous</Link>:null}
    {result.page<result.pages?<Link href={"/tpo/recruiters/campaigns?page="+(result.page+1)+(first(params.purpose)?"&purpose="+encodeURIComponent(first(params.purpose)!):"")} className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-primary-text">Next</Link>:null}
  </nav>
 </main>;
}
