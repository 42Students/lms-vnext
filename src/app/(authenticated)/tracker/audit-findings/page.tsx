import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
import {redirect} from "next/navigation";
import {PageHeader} from "@/components/ui/page-header";
import {StatusBadge} from "@/components/ui/status-badge";
import {TrackerAdminNav} from "@/components/tracker/tracker-admin-nav";
import {AuditFindingFilterMemory} from "@/components/tracker/audit-finding-filter-memory";
import {FINDING_STATUSES,FINDING_SEVERITIES,FINDING_KINDS,parseIndependentFindingFilters,independentFindingHref} from "@/modules/bug-tracker/independent-audit-findings-model";
import {independentAuditFindingsReady,listIndependentAuditFindings,readIndependentFindingSyncState} from "@/modules/bug-tracker/independent-audit-findings-service";
export const dynamic="force-dynamic";
export const metadata={title:"Audit findings · 42 Tracker"};
export default async function IndependentFindingsPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const ctx=await getCurrentRequestContext();
 if(!isSuperAdmin(ctx) || ctx.user.platformStatus !== "ACTIVE")redirect("/dashboard");
 if(ctx.adminScope?.collegeId||ctx.adminScope?.organizationId)redirect("/dashboard");
 requirePermission(ctx,"admin-scope.select");
 const parsed=parseIndependentFindingFilters(await searchParams);
 const header=<><AuditFindingFilterMemory/><PageHeader eyebrow="42 Tracker · Super Admin" title="Audit findings"
  description="Independent findings imported from the audit repository, not user bug reports."/><TrackerAdminNav/></>;
 if(!parsed)return <div className="space-y-5">{header}<p role="alert">Invalid audit findings filters.</p>
  <Link href="/tracker/audit-findings?view=OPEN" className="font-semibold text-primary-text">Reset filters</Link></div>;
 if(!independentAuditFindingsReady())return <div className="space-y-5">{header}
  <p role="status" className="rounded-xl border border-border bg-surface p-5">
   Audit findings are unavailable until registered migration 0133 is verified and DB10_AUDIT_FINDINGS_READY=DB10_VERIFIED.
   Bug reports are not substituted for independent audit findings.
  </p></div>;
 const [data,sync]=await Promise.all([listIndependentAuditFindings(ctx,parsed),readIndependentFindingSyncState(ctx)]);
 const selectClass="min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground";
 return <div className="min-w-0 space-y-5">{header}
  <section aria-label="Findings import status" className="rounded-xl border border-border bg-surface p-4 text-sm">
   <h2 className="font-semibold">Findings import status</h2>
   {sync?.lastSyncedAt?<p className="mt-1 text-body">Last recorded sync: {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(sync.lastSyncedAt)} IST · {sync.importedCount} imported · {sync.refusedCount} refused.</p>:
    <p role="status" className="mt-1 text-body">No verified import has been recorded. Independent findings already stored here remain available; automatic GitHub sync is not configured.</p>}
   <p className="mt-1 text-xs text-muted-foreground">A manual sync is unavailable until the findings repository is accessible and import credentials are verified. No sync was performed by opening this page.</p>
  </section>
  <nav aria-label="Finding views" className="flex flex-wrap gap-2">
   {(["OPEN","RELEASE","ALL"] as const).map(value=><Link key={value} aria-current={parsed.view===value?"page":undefined}
     href={independentFindingHref({...parsed,view:value,page:1})}
     className="inline-flex min-h-10 items-center rounded border border-border bg-surface px-4 font-semibold text-primary-text">
      {value==="OPEN"?"Open":value==="RELEASE"?"Release (critical & high)":"All"}
    </Link>)}
  </nav>
  <form method="get" className="grid min-w-0 gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-3">
   <input type="hidden" name="view" value={parsed.view}/>
   <label className="text-sm font-semibold">Search
    <input name="q" defaultValue={parsed.q} maxLength={120} className={selectClass} placeholder="ID, title or summary"/></label>
   <label className="text-sm font-semibold">Area
    <input name="area" defaultValue={parsed.area} maxLength={80} className={selectClass} placeholder="All areas"/></label>
   <label className="text-sm font-semibold">Status (multiple)
    <select name="status" multiple size={4} defaultValue={parsed.statuses} className={selectClass}>
     {FINDING_STATUSES.map(v=><option key={v} value={v}>{v.replaceAll("_"," ")}</option>)}
    </select></label>
   <label className="text-sm font-semibold">Severity (multiple)
    <select name="severity" multiple size={4} defaultValue={parsed.severities} className={selectClass}>
     {FINDING_SEVERITIES.map(v=><option key={v} value={v}>{v}</option>)}
    </select></label>
   <label className="text-sm font-semibold">Kind (multiple)
    <select name="kind" multiple size={4} defaultValue={parsed.kinds} className={selectClass}>
     {FINDING_KINDS.map(v=><option key={v} value={v}>{v}</option>)}
    </select></label>
   <div className="flex items-end gap-3">
    <button type="submit" className="min-h-11 rounded bg-primary px-4 font-semibold text-on-primary">Apply filters</button>
    <Link href="/tracker/audit-findings?view=OPEN" className="min-h-11 inline-flex items-center font-semibold text-primary-text">Clear</Link>
   </div>
  </form>
  <p role="status" className="text-sm text-body">
   {data.total} matching independent findings · page {data.page} of {data.pages} · 50 per page.
  </p>
  {data.items.length?<div className="overflow-x-auto rounded-xl border border-border bg-surface">
   <table className="min-w-[48rem] w-full text-left text-sm">
    <thead><tr className="border-b border-border">{["Finding","Area / Kind","Severity","Status","Assigned","Reported"].map(col=><th key={col} scope="col" className="p-3">{col}</th>)}</tr></thead>
    <tbody>{data.items.map(item=><tr key={item.id} className="border-b border-border">
     <td className="p-3"><Link href={"/tracker/audit-findings/"+encodeURIComponent(item.externalId)}
       className="font-semibold text-primary-text underline">{item.externalId}</Link>
      <p className="mt-1 max-w-md break-words">{item.title}</p></td>
     <td className="p-3">{item.area} · {item.kind}</td>
     <td className="p-3"><StatusBadge>{item.severity}</StatusBadge></td>
     <td className="p-3"><StatusBadge>{item.status.replaceAll("_"," ")}</StatusBadge></td>
     <td className="p-3">{item.assignee??"Unassigned"}</td>
     <td className="p-3">{item.foundBy??"Unknown"} · {item.foundAt?new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium"}).format(item.foundAt):"Date not recorded"}</td>
    </tr>)}</tbody>
   </table>
  </div>:<p role="status" className="rounded-xl border border-border p-5">No independent audit findings match these filters.</p>}
  <nav aria-label="Audit findings pages" className="flex justify-between gap-4">
   {data.page>1?<Link href={independentFindingHref(parsed,data.page-1)} className="font-semibold text-primary-text">Previous</Link>:<span/>}
   {data.page<data.pages?<Link href={independentFindingHref(parsed,data.page+1)} className="font-semibold text-primary-text">Next</Link>:null}
  </nav>
 </div>;
}
