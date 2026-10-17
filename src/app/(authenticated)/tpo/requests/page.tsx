import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { TpoRequestDecisionControl } from "@/components/placements/tpo-request-decision-control";
import {TpoSequentialRequestReview} from "@/components/placements/tpo-sequential-request-review";
import { hasMembershipRole } from "@/modules/identity/context";
import {tpoRequestsExportHref} from "@/modules/placements/tpo-requests-page-csv-model";
import {GLOBAL_TPO_REQUEST_TYPES,TPO_REQUEST_STATUSES,tpoRequestStatusCounts,tpoRequestAgeLabel,tpoRequestContextLink,tpoNextRoundCue,parseGlobalTpoRequestFilters,globalTpoRequestFirstPageHref,tpoRequestClearAdvancedHref} from "@/modules/placements/tpo-global-requests-model";
import { getTpoGlobalRequestsInbox } from "@/modules/placements/tpo-global-requests-service";
import {tpoRequestAttentionOnPage} from "@/modules/placements/tpo-request-attention-model";

export const dynamic = "force-dynamic";
type Params = { age?:string|string[]; sort?:string|string[]; requestType?:string|string[]; status?: string | string[]; search?: string | string[]; page?: string | string[]; pageSize?: string | string[] };
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function href(input: { status: string; age:string; sort:string; requestType:string; search: string; page: number; pageSize: number }) {
  const p = new URLSearchParams();
  p.set("status", input.status);if(input.age!=="ALL")p.set("age",input.age);p.set("sort",input.sort);if(input.requestType!=="ALL")p.set("requestType",input.requestType); if (input.search) p.set("search", input.search);
  p.set("page", String(input.page)); p.set("pageSize", String(input.pageSize));
  return "/tpo/requests?" + p.toString();
}
export default async function GlobalTpoRequestsPage({searchParams}:{searchParams:Promise<Params>}) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }
  const raw = await searchParams;
  const parsed=parseGlobalTpoRequestFilters({
    status:first(raw.status),age:first(raw.age),sort:first(raw.sort),
    requestType:first(raw.requestType),search:first(raw.search),
    page:first(raw.page),pageSize:first(raw.pageSize),
  });
  if(!parsed.success)return <main className="space-y-5">
    <PageHeader eyebrow="TPO · Operations" title="Requests"
      description="College-wide learner placement requests."/>
    <section role="alert" className="rounded-xl border border-border bg-surface p-6">
      <h2 className="font-semibold text-foreground">Invalid request filters</h2>
      <p className="mt-2 text-sm text-body">Check the request status, kind, age, sorting and page values. No request data was loaded.</p>
      <Link href="/tpo/requests" className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary-text underline">
        Clear invalid filters
      </Link>
    </section>
  </main>;
  const data = await getTpoGlobalRequestsInbox(context, parsed.data);
  const statusCounts=tpoRequestStatusCounts(data.summary);
  const asOf=new Date();
  const attention=tpoRequestAttentionOnPage(data.requests,asOf);
  return <main className="min-w-0 space-y-5">
    <PageHeader eyebrow="TPO · Operations" title="Requests" description="College-wide learner placement requests. Decisions update recorded applications, rounds or offers only through the existing verified action." />
    <nav aria-label="Request statuses" className="flex flex-wrap gap-2">
      {TPO_REQUEST_STATUSES.map(status=>
        <Link key={status} href={href({...data.query,status,page:1})} aria-current={data.query.status===status?"page":undefined}
          className="inline-flex min-h-11 items-center rounded-md border border-border px-3 text-sm text-primary-text">{status.toLowerCase().replaceAll("_"," ")} · {statusCounts[status]}</Link>)}
    </nav>
    <form method="get" action="/tpo/requests" className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4">
      <input type="hidden" name="status" value={data.query.status}/>
      <label className="text-sm">Request kind<select name="requestType" defaultValue={data.query.requestType} className="mt-1 block min-h-11 rounded border border-border bg-surface px-3">{GLOBAL_TPO_REQUEST_TYPES.map(type=><option key={type} value={type}>{type==="ALL"?"All request kinds":type.replaceAll("_"," ").toLowerCase()}</option>)}</select></label>
      <label className="min-w-0 flex-1 text-sm">Search student, job or company
        <input name="search" defaultValue={data.query.search} type="search" maxLength={150} className="mt-1 block min-h-11 w-full rounded border border-border bg-surface px-3" />
      </label>
      <label className="text-sm">Page size
        <select name="pageSize" defaultValue={String(data.query.pageSize)} className="mt-1 block min-h-11 rounded border border-border bg-surface px-3">
          <option value="25">25</option><option value="50">50</option><option value="100">100</option>
        </select>
      </label>
      <label className="text-sm">Age<select name="age" defaultValue={data.query.age} className="mt-1 block min-h-11 rounded border border-border bg-surface px-3"><option value="ALL">Any age</option><option value="OLDER_THAN_1_DAY">Older than 24 hours</option><option value="OLDER_THAN_2_DAYS">Older than 2 days</option><option value="OLDER_THAN_7_DAYS">Older than 7 days</option><option value="OLDER_THAN_30_DAYS">Older than 30 days</option></select></label>
      <label className="text-sm">Order<select name="sort" defaultValue={data.query.sort} className="mt-1 block min-h-11 rounded border border-border bg-surface px-3"><option value="URGENCY_FIRST">Urgent first</option><option value="NEWEST_FIRST">Newest first</option><option value="OLDEST_FIRST">Oldest first</option></select></label>
      <button type="submit" className="min-h-11 rounded bg-primary px-4 text-on-primary">Apply</button>
      <Link href={tpoRequestClearAdvancedHref(data.query.status)} className="inline-flex min-h-11 items-center text-primary-text underline">Clear search and age filters</Link>
    </form>
    <section aria-label="Needs doing first" className="space-y-3 rounded-xl border border-border bg-surface p-4">
     <h2 className="font-semibold">Needs doing first</h2>
     <p className="text-sm">{data.summary.pending?data.summary.pending+" waiting for you.":"Nothing is waiting for you."}</p>
     <div className="flex flex-wrap gap-3 text-sm">
      <span className="rounded border border-border px-3 py-2">Urgent · {attention.urgent}</span>
      <Link href={href({...data.query,status:"PENDING",age:"OLDER_THAN_2_DAYS",page:1})}
       aria-current={data.query.age==="OLDER_THAN_2_DAYS"?"page":undefined}
       className="rounded border border-border px-3 py-2 font-semibold text-primary-text">Waiting more than 2 days · {attention.waitingOverTwoDays}</Link>
      <span className="rounded border border-border px-3 py-2">May need proof review · {attention.proofUnconfirmed}</span>
     </div>
     <p className="text-xs text-muted-foreground">Attention category numbers cover this visible request page only. Proof hints are text-based and are not verified attachment counts.</p>
    </section>
    {data.query.status==="PENDING"?<TpoSequentialRequestReview
      requests={data.requests.filter(row=>row.status==="PENDING").map(row=>({
        id:row.id,studentName:row.studentName,requestType:row.requestType,
        reason:row.reason,jobTitle:row.jobTitle,companyName:row.companyName,
        expectedUpdatedAt:row.updatedAt.toISOString(),
      }))}/>:null}
    <Link href={tpoRequestsExportHref(data.query)} className="inline-flex min-h-11 items-center rounded border border-border px-4 text-primary-text">Export filtered requests CSV</Link>
    <p className="text-sm text-body">Showing {data.requests.length} of {data.total} matching {data.query.status.toLowerCase()} requests. {data.summary.pending} pending across this college.</p>
    {data.requests.length===0?<section role="status" className="rounded-lg border border-border p-5">
      {data.total>0?"This page is past the available request results.":"No requests match the current filters."}
      <Link href={data.total>0?globalTpoRequestFirstPageHref(data.query):tpoRequestClearAdvancedHref(data.query.status)}
       className="ml-3 inline-flex min-h-11 items-center text-primary-text underline">
       {data.total>0?"First matching page":"Reset filters"}
      </Link>
    </section>:<ul className="space-y-3">{data.requests.map(request=>
      <li key={request.id} className="min-w-0 rounded-lg border border-border bg-surface p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-semibold">{request.studentName} · {request.requestType.replaceAll("_"," ")}</h2>
            <p className="mt-1 text-sm text-body">{request.companyName} · {request.jobTitle}</p>
            <p className="mt-1 text-xs text-muted-foreground">Student number: {request.rollNumber??"Not recorded"}</p>
            {request.nextRoundAt?<p className="mt-1 text-sm text-body">{tpoNextRoundCue(request,asOf)}</p>:null}
            {request.urgent?<strong className="mt-2 inline-flex rounded border border-danger px-2 py-1 text-xs text-error">Urgent</strong>:null}
            <p className="mt-1 text-xs text-muted-foreground"><time dateTime={request.requestedAt.toISOString()}>{request.requestedAt.toLocaleString("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"})} IST</time> · {tpoRequestAgeLabel(request.requestedAt,asOf)}</p>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm">{request.reason}</p>
            {request.decidedAt?<dl className="mt-2 grid gap-1 text-sm">
             <div><dt className="inline font-semibold">Decided by: </dt><dd className="inline">{request.decidedBy??"Authorized placement team"}</dd></div>
             <div><dt className="inline font-semibold">Decided on: </dt><dd className="inline">{request.decidedAt.toLocaleString("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"})} IST</dd></div>
             <div><dt className="inline font-semibold">Why: </dt><dd className="inline">{request.decisionNote||"No additional decision note recorded"}</dd></div>
            </dl>:null}
            <Link href={tpoRequestContextLink(request).href} className="mt-2 inline-flex min-h-10 items-center text-primary-text underline">{tpoRequestContextLink(request).label}</Link>
          </div>
          {request.status==="PENDING"?<TpoRequestDecisionControl requestId={request.id} expectedUpdatedAt={request.updatedAt.toISOString()} requestType={request.requestType}/>:<span className="text-sm text-body">{request.status}</span>}
        </div>
      </li>)}</ul>}
    <nav aria-label="Request pages" className="flex flex-wrap gap-3">
      {data.page>1?<Link href={href({...data.query,page:data.page-1})} className="inline-flex min-h-11 items-center rounded border border-border px-4 text-primary-text">Previous</Link>:null}
      {data.page<data.totalPages?<Link href={href({...data.query,page:data.page+1})} className="inline-flex min-h-11 items-center rounded border border-border px-4 text-primary-text">Next</Link>:null}
    </nav>
    <p className="text-xs text-muted-foreground">CSV exports matching authorized requests across pages (up to 5,000), includes their recorded reasons and decisions, and neutralizes spreadsheet formulas. If the export is truncated, narrow the filters.</p>
    <p className="text-xs text-muted-foreground">Pending actions require explicit confirmation. The learner receives an in-app notice when a request is approved or rejected; no email is sent from this inbox.</p>
  </main>;
}
