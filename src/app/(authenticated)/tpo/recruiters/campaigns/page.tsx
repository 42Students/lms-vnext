import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { listTpoMessagingHistory } from "@/modules/messaging/receipt-history-service";
import { messagingHistoryQuerySchema } from "@/modules/messaging/receipt-history-model";

type PageProps = {searchParams:Promise<{page?:string|string[];purpose?:string|string[]}>};
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}
export default async function CampaignHistory({searchParams}:PageProps){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const params=await searchParams;
 const query=messagingHistoryQuerySchema.safeParse({page:first(params.page),purpose:first(params.purpose)});
 if(!query.success)return <main className="space-y-4"><PageHeader eyebrow="Engage" title="Campaign history"/><p role="alert">Invalid history filters. <Link href="/tpo/recruiters/campaigns">Reset filters</Link></p></main>;
 const result=await listTpoMessagingHistory(context,query.data);
 return <main className="space-y-6">
  <PageHeader eyebrow="Engage" title="Campaign history"
   description="Persisted email/SMS batch receipts for your college. Provider acceptance does not prove recipient delivery."/>
  <nav aria-label="Campaign history actions" className="flex flex-wrap gap-3">
   <Link href="/tpo/recruiters" className="inline-flex min-h-11 items-center text-sm text-primary-text">Back to Engage</Link>
   <Link href={"/api/placements/tpo/campaigns/history/export?page="+result.page}
     className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm text-primary-text">Export this page as CSV</Link>
  </nav>
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
        <div><dt>Provider accepted</dt><dd>{row.acceptedByProvider}</dd></div>
        <div><dt>Failed</dt><dd>{row.failed}</dd></div>
        <div><dt>Suppressed</dt><dd>{row.suppressed}</dd></div>
      </dl>
    </li>)}
  </ol>:<p className="rounded-xl border border-border bg-surface p-5 text-sm text-body">No recorded batches for this college. This does not mean a campaign was delivered.</p>}
  <nav className="flex flex-wrap gap-3" aria-label="Campaign history pagination">
    {result.page>1?<Link href={"/tpo/recruiters/campaigns?page="+(result.page-1)} className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-primary-text">Previous</Link>:null}
    {result.page<result.pages?<Link href={"/tpo/recruiters/campaigns?page="+(result.page+1)} className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-primary-text">Next</Link>:null}
  </nav>
 </main>;
}
