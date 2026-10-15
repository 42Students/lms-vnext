import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { TpoRequestDecisionControl } from "@/components/placements/tpo-request-decision-control";
import { hasMembershipRole } from "@/modules/identity/context";
import {GLOBAL_TPO_REQUEST_TYPES} from "@/modules/placements/tpo-global-requests-model";
import { getTpoGlobalRequestsInbox } from "@/modules/placements/tpo-global-requests-service";

export const dynamic = "force-dynamic";
type Params = { requestType?:string|string[]; status?: string | string[]; search?: string | string[]; page?: string | string[]; pageSize?: string | string[] };
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function href(input: { status: string; requestType:string; search: string; page: number; pageSize: number }) {
  const p = new URLSearchParams();
  p.set("status", input.status);if(input.requestType!=="ALL")p.set("requestType",input.requestType); if (input.search) p.set("search", input.search);
  p.set("page", String(input.page)); p.set("pageSize", String(input.pageSize));
  return "/tpo/requests?" + p.toString();
}
export default async function GlobalTpoRequestsPage({searchParams}:{searchParams:Promise<Params>}) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }
  const raw = await searchParams;
  const data = await getTpoGlobalRequestsInbox(context, {
    status:first(raw.status),requestType:first(raw.requestType), search:first(raw.search), page:first(raw.page), pageSize:first(raw.pageSize),
  });
  return <main className="min-w-0 space-y-5">
    <PageHeader eyebrow="TPO · Operations" title="Requests" description="College-wide learner placement requests. Decisions update recorded applications, rounds or offers only through the existing verified action." />
    <nav aria-label="Request statuses" className="flex flex-wrap gap-2">
      {(["PENDING","APPROVED","REJECTED","CANCELLED"] as const).map(status=>
        <Link key={status} href={href({...data.query,status,page:1})} aria-current={data.query.status===status?"page":undefined}
          className="inline-flex min-h-11 items-center rounded-md border border-border px-3 text-sm text-primary-text">{status.toLowerCase().replaceAll("_"," ")}</Link>)}
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
      <button type="submit" className="min-h-11 rounded bg-primary px-4 text-on-primary">Apply</button>
    </form>
    <p className="text-sm text-body">Showing {data.requests.length} of {data.total} matching {data.query.status.toLowerCase()} requests. {data.summary.pending} pending across this college.</p>
    {data.requests.length===0?<section role="status" className="rounded-lg border border-border p-5">
      {data.total>0?"No requests on this page.":"No requests match the current filters."}
      <Link href="/tpo/requests" className="ml-3 text-primary-text underline">Reset</Link>
    </section>:<ul className="space-y-3">{data.requests.map(request=>
      <li key={request.id} className="min-w-0 rounded-lg border border-border bg-surface p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-semibold">{request.studentName} · {request.requestType.replaceAll("_"," ")}</h2>
            <p className="mt-1 text-sm text-body">{request.companyName} · {request.jobTitle}</p>
            <p className="mt-1 text-xs text-muted-foreground"><time dateTime={request.requestedAt.toISOString()}>{request.requestedAt.toLocaleString("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"})} IST</time></p>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm">{request.reason}</p>
            {request.decisionNote?<p className="mt-2 whitespace-pre-wrap break-words text-sm">Decision note: {request.decisionNote}</p>:null}
            <Link href={"/tpo/placements/jobs/"+encodeURIComponent(request.jobId)} className="mt-2 inline-flex min-h-10 items-center text-primary-text underline">Open drive</Link>
          </div>
          {request.status==="PENDING"?<TpoRequestDecisionControl requestId={request.id} expectedUpdatedAt={request.updatedAt.toISOString()} requestType={request.requestType}/>:<span className="text-sm text-body">{request.status}</span>}
        </div>
      </li>)}</ul>}
    <nav aria-label="Request pages" className="flex flex-wrap gap-3">
      {data.page>1?<Link href={href({...data.query,page:data.page-1})} className="inline-flex min-h-11 items-center rounded border border-border px-4 text-primary-text">Previous</Link>:null}
      {data.page<data.totalPages?<Link href={href({...data.query,page:data.page+1})} className="inline-flex min-h-11 items-center rounded border border-border px-4 text-primary-text">Next</Link>:null}
    </nav>
    <p className="text-xs text-muted-foreground">Pending actions require explicit confirmation. No external messages are sent from this inbox.</p>
  </main>;
}
