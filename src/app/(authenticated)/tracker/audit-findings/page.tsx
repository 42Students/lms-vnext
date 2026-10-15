import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { isSuperAdmin } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { listBugTrackerIssuesForAdmin } from "@/modules/bug-tracker/admin-service";
import { trackerAdminRuntimeEnabled } from "@/modules/bug-tracker/readiness";
import { BUG_STATUSES } from "@/modules/bug-tracker/workflow";
import { BUG_SEVERITIES } from "@/modules/bug-tracker/admin-validation";
import { auditFindingsQuerySchema, trackerAuditFindingsInput } from "@/modules/bug-tracker/audit-findings-board-model";

type Params=Record<string,string|string[]|undefined>;
const one=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;
export default async function AuditFindingsBoard({searchParams}:{searchParams:Promise<Params>}) {
 const ctx=await getCurrentRequestContext();
 if(!isSuperAdmin(ctx))redirect("/dashboard");
 requirePermission(ctx,"admin-scope.select",{
  organizationId:ctx.adminScope?.organizationId,
  collegeId:ctx.adminScope?.collegeId,
 });
 const params=await searchParams;
 const parsed=auditFindingsQuerySchema.safeParse({
  q:one(params.q),status:one(params.status),severity:one(params.severity),
  beforeCreatedAt:one(params.beforeCreatedAt),beforeId:one(params.beforeId),
 });
 const header=<PageHeader eyebrow="42 Tracker · Super Admin" title="Audit Findings"
 description="Review recorded tracker findings in the selected administrative scope. This view is read-only and is not a replacement for independent security audit evidence."/>;
 if(!parsed.success) return <div className="space-y-5">{header}
  <div role="alert" className="rounded-xl border border-border p-5"><p>Invalid audit findings filters or pagination cursor.</p>
   <Link href="/tracker/audit-findings" className="font-semibold text-primary-text">Reset filters</Link></div></div>;
 if(!trackerAdminRuntimeEnabled())return <div className="space-y-5">{header}
  <div role="status" className="rounded-xl border border-border bg-surface p-5">Audit findings data is unavailable until the tracker database migration is verified. No zero-count or success state is inferred.</div></div>;
 const query=parsed.data;
 const data=await listBugTrackerIssuesForAdmin(ctx,trackerAuditFindingsInput(query));
 const next=data.nextCursor?new URLSearchParams({
  ...(query.q?{q:query.q}:{}),
  ...(query.status!=="ALL"?{status:query.status}:{}),
  ...(query.severity!=="ALL"?{severity:query.severity}:{}),
  beforeCreatedAt:data.nextCursor.beforeCreatedAt.toISOString(),
  beforeId:data.nextCursor.beforeId,
 }):null;
 return <div className="min-w-0 space-y-5">{header}
  <form method="get" className="grid min-w-0 gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-3">
   <label className="min-w-0 text-sm">Find issue
    <input name="q" defaultValue={query.q} maxLength={120} className="mt-1 min-h-11 w-full min-w-0 rounded-md border border-border bg-surface px-3" placeholder="ID or description"/></label>
   <label className="min-w-0 text-sm">Status
    <select name="status" defaultValue={query.status} className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3">
    <option value="ALL">All</option>{BUG_STATUSES.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
   <label className="min-w-0 text-sm">Severity
    <select name="severity" defaultValue={query.severity} className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3">
    <option value="ALL">All</option>{BUG_SEVERITIES.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
   <div className="flex flex-wrap gap-2 sm:col-span-3">
    <button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Apply</button>
    <Link href="/tracker/audit-findings" className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm">Clear</Link>
   </div>
  </form>
  {data.items.length===0?<p role="status" className="rounded-xl border border-border p-5">No recorded tracker findings match these filters.</p>:
  <section className="grid min-w-0 gap-3" aria-label="Audit findings">
   {data.items.map(item=><article key={item.id} className="min-w-0 rounded-xl border border-border bg-surface p-4">
    <div className="flex flex-wrap gap-2"><StatusBadge>{item.status}</StatusBadge><StatusBadge>{item.severity}</StatusBadge></div>
    <h2 className="mt-2 break-words font-semibold"><Link href={`/tracker/issues/${encodeURIComponent(item.publicId)}`} className="text-primary-text">{item.publicId} · {item.issueType}</Link></h2>
    <p className="mt-2 break-words text-sm text-body">{item.description}</p>
    <p className="mt-2 break-words text-xs text-muted-foreground">{item.page} · {item.createdAt.toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})}</p>
   </article>)}
  </section>}
  {next?<Link href={`/tracker/audit-findings?${next.toString()}`} className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold">Older findings →</Link>:null}
 </div>;
}
