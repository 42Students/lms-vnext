import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { isSuperAdmin } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { listBugTrackerIssuesForAdmin } from "@/modules/bug-tracker/admin-service";
import { trackerAdminRuntimeEnabled } from "@/modules/bug-tracker/readiness";
import {AuditFindingStatusAction} from "@/components/tracker/audit-finding-status-action";
import {AuditFindingFilterPersistence} from "@/components/tracker/audit-finding-filter-persistence";
import { BUG_STATUSES, BUG_RESOLUTIONS } from "@/modules/bug-tracker/workflow";
import { BUG_SEVERITIES, BUG_ENVIRONMENTS, BUG_ACCOUNT_ROLES } from "@/modules/bug-tracker/admin-validation";
import { parseAuditFindingsSearchParams, trackerAuditFindingsInput } from "@/modules/bug-tracker/audit-findings-board-model";

type Params=Record<string,string|string[]|undefined>;

export const metadata={title:"Audit findings · 42 Tracker"};
export default async function AuditFindingsBoard({searchParams}:{searchParams:Promise<Params>}) {
 const ctx=await getCurrentRequestContext();
 if(!isSuperAdmin(ctx) || ctx.user.platformStatus !== "ACTIVE")redirect("/dashboard");
 requirePermission(ctx,"admin-scope.select",{
  organizationId:ctx.adminScope?.organizationId,
  collegeId:ctx.adminScope?.collegeId,
 });
 const params=await searchParams;
 const query=parseAuditFindingsSearchParams(params);
 const header=<PageHeader eyebrow="42 Tracker · Super Admin" title="Audit findings"
 description="Review recorded tracker findings in the selected administrative scope. Status changes are audited and version-checked. This is not independent security-audit evidence."/>;
 if(!query) return <div className="space-y-5">{header}
  <div role="alert" className="rounded-xl border border-border p-5"><p>Invalid audit findings filters or pagination cursor.</p>
   <Link href="/tracker/audit-findings" className="font-semibold text-primary-text">Reset filters</Link></div></div>;
 if(!trackerAdminRuntimeEnabled())return <div className="space-y-5">{header}
  <div role="status" className="rounded-xl border border-border bg-surface p-5">Audit findings data is unavailable until the tracker database migration is verified. No zero-count or success state is inferred.</div></div>;
 const data=await listBugTrackerIssuesForAdmin(ctx,trackerAuditFindingsInput(query));
 const next=data.nextCursor?new URLSearchParams({
  ...(query.q?{q:query.q}:{}),
  ...(query.status!=="ALL"?{status:query.status}:{}),
  ...(query.severity!=="ALL"?{severity:query.severity}:{}),
  ...(query.accountRole!=="ALL"?{accountRole:query.accountRole}:{}),
  ...(query.resolution!=="ALL"?{resolution:query.resolution}:{}),
  ...(query.retestStatus!=="ALL"?{retestStatus:query.retestStatus}:{}),
  ...(query.productionVerified!=="ALL"?{productionVerified:query.productionVerified}:{}),
  ...(query.environment!=="ALL"?{environment:query.environment}:{}),
  ...(query.issueType?{issueType:query.issueType}:{}),
  ...(query.fromDate?{fromDate:query.fromDate}:{}),
  ...(query.toDate?{toDate:query.toDate}:{}),
  ...(query.sort!=="newest"?{sort:query.sort}:{}),
  beforeCreatedAt:data.nextCursor.beforeCreatedAt.toISOString(),
  beforeId:data.nextCursor.beforeId,
 }):null;
 return <div className="min-w-0 space-y-5">{header}
  <AuditFindingFilterPersistence search={new URLSearchParams(Object.entries(params).flatMap(([key,value])=>
   typeof value==="string"?[[key,value]]:Array.isArray(value)&&value[0]?[[key,value[0]]]:[])).toString()}/>
  <form method="get" className="grid min-w-0 gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-3">
   <label className="min-w-0 text-sm">Find issue
    <input name="q" defaultValue={query.q} maxLength={120} className="mt-1 min-h-11 w-full min-w-0 rounded-md border border-border bg-surface px-3" placeholder="ID or description"/></label>
   <label className="min-w-0 text-sm">Status
    <select name="status" defaultValue={query.status} className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3">
    <option value="ALL">All</option>{BUG_STATUSES.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
   <label className="min-w-0 text-sm">Severity
    <select name="severity" defaultValue={query.severity} className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3">
    <option value="ALL">All</option>{BUG_SEVERITIES.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
   <label className="min-w-0 text-sm">Reported account role
    <select name="accountRole" defaultValue={query.accountRole} className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3">
      <option value="ALL">All account roles</option>{BUG_ACCOUNT_ROLES.map(role=><option key={role} value={role}>{role}</option>)}
    </select>
   </label>
   <label className="min-w-0 text-sm">Resolution
    <select name="resolution" defaultValue={query.resolution} className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3">
      <option value="ALL">All resolutions</option><option value="UNRESOLVED">Unresolved / no resolution</option>
      {BUG_RESOLUTIONS.map(value=><option key={value} value={value}>{value}</option>)}
    </select>
   </label>
   <label className="min-w-0 text-sm">Retest
    <select name="retestStatus" defaultValue={query.retestStatus} className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3">
      <option value="ALL">All retest states</option><option value="NOT_RETESTED">Not retested</option><option value="PASS">Passed</option><option value="FAIL">Failed</option>
    </select>
   </label>
   <label className="min-w-0 text-sm">Production verification
    <select name="productionVerified" defaultValue={query.productionVerified} className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3">
      <option value="ALL">All verification states</option><option value="YES">Verified</option><option value="NO">Not verified</option>
    </select>
   </label>
   <label className="min-w-0 text-sm">Issue type (exact)
    <input name="issueType" defaultValue={query.issueType} maxLength={80} placeholder="Persisted issue type" className="mt-1 min-h-11 w-full min-w-0 rounded-md border border-border bg-surface px-3"/>
   </label>
   <label className="min-w-0 text-sm">Created from (IST)
    <input type="date" name="fromDate" defaultValue={query.fromDate ?? ""} className="mt-1 min-h-11 w-full min-w-0 rounded-md border border-border bg-surface px-3"/>
   </label>
   <label className="min-w-0 text-sm">Created through (IST)
    <input type="date" name="toDate" defaultValue={query.toDate ?? ""} min={query.fromDate} className="mt-1 min-h-11 w-full min-w-0 rounded-md border border-border bg-surface px-3"/>
   </label>
   <label className="min-w-0 text-sm">Environment
    <select name="environment" defaultValue={query.environment} className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3">
      <option value="ALL">All environments</option>{BUG_ENVIRONMENTS.map(value=><option key={value} value={value}>{value}</option>)}
    </select>
   </label>
   <label className="min-w-0 text-sm">Order
    <select name="sort" defaultValue={query.sort} className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3">
     <option value="newest">Newest first</option><option value="oldest">Oldest first</option>
    </select>
   </label>
   <div className="flex flex-wrap gap-2 sm:col-span-3">
    <button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Apply</button>
    <Link href="/tracker/audit-findings" className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm">Clear</Link>
   </div>
  </form>
  <Link href={"/api/tracker/audit-findings/export?"+new URLSearchParams({
   ...(query.q?{q:query.q}:{}),
   ...(query.status!=="ALL"?{status:query.status}:{}),
   ...(query.severity!=="ALL"?{severity:query.severity}:{}),
  ...(query.accountRole!=="ALL"?{accountRole:query.accountRole}:{}),
  ...(query.resolution!=="ALL"?{resolution:query.resolution}:{}),
  ...(query.retestStatus!=="ALL"?{retestStatus:query.retestStatus}:{}),
  ...(query.productionVerified!=="ALL"?{productionVerified:query.productionVerified}:{}),
   ...(query.environment!=="ALL"?{environment:query.environment}:{}),
  ...(query.issueType?{issueType:query.issueType}:{}),
  ...(query.fromDate?{fromDate:query.fromDate}:{}),
  ...(query.toDate?{toDate:query.toDate}:{}),
   ...(query.sort!=="newest"?{sort:query.sort}:{}),
   ...(query.beforeCreatedAt?{beforeCreatedAt:query.beforeCreatedAt}:{}),
   ...(query.beforeId?{beforeId:query.beforeId}:{}),
  }).toString()} className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text">
   Export this findings page (CSV)
  </Link>
  {data.items.length===0?<p role="status" className="rounded-xl border border-border p-5">No recorded tracker findings match these filters.</p>:
  <section className="grid min-w-0 gap-3" aria-label="Audit findings">
   {data.items.map(item=><article key={item.id} className="min-w-0 rounded-xl border border-border bg-surface p-4">
    <div className="flex flex-wrap gap-2"><StatusBadge>{item.status}</StatusBadge><StatusBadge>{item.severity}</StatusBadge></div>
    <h2 className="mt-2 break-words font-semibold"><Link href={`/tracker/audit-findings/${encodeURIComponent(item.publicId)}`} className="text-primary-text">{item.publicId} · {item.issueType}</Link></h2>
    <p className="mt-2 break-words text-sm text-body">{item.description}</p>
    <p className="mt-2 break-words text-xs text-muted-foreground">{item.page} · {item.createdAt.toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})}</p>
    <div className="mt-3"><AuditFindingStatusAction key={item.publicId+":"+item.version} publicId={item.publicId} current={item.status} version={item.version}/></div>
   </article>)}
  </section>}
  {next?<Link href={`/tracker/audit-findings?${next.toString()}`} className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold">{query.sort==="newest"?"Older findings →":"Newer findings →"}</Link>:null}
 </div>;
}
