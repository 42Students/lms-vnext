import Link from "next/link";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
import {redirect} from "next/navigation";
import {PageHeader} from "@/components/ui/page-header";
import {StatusBadge} from "@/components/ui/status-badge";
import {Tabs} from "@/components/ui/tabs";
import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
import {ErrorState} from "@/components/ui/error-state";
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
 if(!parsed)return <div className="space-y-5">{header}
  <ErrorState title="Invalid audit findings filters." description="Independent findings imported from the audit repository, not user bug reports."
   action={<Link href="/tracker/audit-findings?view=OPEN"
    className="inline-flex min-h-9 items-center font-semibold text-primary-text underline">Reset filters</Link>}/>
 </div>;
 if(!independentAuditFindingsReady())return <div className="space-y-5">{header}
  <p role="status" className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5">
   Audit findings are temporarily unavailable. Please contact your platform administrator to complete setup.
   Bug reports are not substituted for independent audit findings.
  </p></div>;
 const [data,sync]=await Promise.all([listIndependentAuditFindings(ctx,parsed),readIndependentFindingSyncState(ctx)]);

 const refusedColumns:DataTableColumn<NonNullable<typeof sync>["refusedFiles"][number]>[]=[
  {key:"path",header:"Source file",mobilePriority:"primary",cell:item=>
    <span className="block min-w-0 break-all font-mono text-xs">{item.path||"Unknown file"}</span>},
  {key:"reason",header:"Refusal reason",mobilePriority:"secondary",cell:item=>
    <span className="break-words">{item.reason||"Reason not recorded"}</span>},
 ];
 const findingColumns:DataTableColumn<(typeof data.items)[number]>[]=[
  {key:"finding",header:"Finding",mobilePriority:"primary",cell:item=><div className="min-w-0">
    <Link href={"/tracker/audit-findings/"+encodeURIComponent(item.externalId)}
      className="inline-flex min-h-9 items-center break-all font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">{item.externalId}</Link>
    <p className="mt-1 max-w-md break-words text-body">{item.title}</p>
   </div>},
  {key:"area",header:"Area / Kind",mobilePriority:"secondary",cell:item=><span>{item.area} · {item.kind}</span>},
  {key:"severity",header:"Severity",mobilePriority:"secondary",cell:item=><StatusBadge tone={item.severity==="CRITICAL"?"error":item.severity==="HIGH"?"warning":"neutral"}>{item.severity}</StatusBadge>},
  {key:"status",header:"Status",mobilePriority:"secondary",cell:item=><StatusBadge tone={item.status==="VERIFIED"||item.status==="RELEASED_PROD"?"success":item.status==="NEW"||item.status==="NEEDS_INFO"?"warning":"info"}>{item.status.replaceAll("_"," ")}</StatusBadge>},
  {key:"assigned",header:"Assigned",mobilePriority:"secondary",cell:item=>item.assignee??"Unassigned"},
  {key:"reported",header:"Reported",mobilePriority:"secondary",cell:item=><span>{item.foundBy??"Unknown"} · {item.foundAt?new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium"}).format(item.foundAt):"Date not recorded"}</span>},
 ];
 return <div className="min-w-0 space-y-5">{header}
  <section aria-label="Findings import status" className="border-b border-border pb-4 text-sm">
   <h2 className="font-semibold">Findings import status</h2>
   <p role="status" className="mt-1 text-body">
    {sync?.lastResult==="SUCCESS"?"Last sync succeeded.":
      sync?.lastResult==="FAILED"?"The last sync failed. Existing imported findings remain available.":
      sync?.lastResult==="PARTIAL"?"The last sync was partial; review refused files.":
      "Sync isn't set up on this server."}
   </p>
   {sync?.lastSyncedAt?<p className="mt-1 text-body">Last recorded sync: {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(sync.lastSyncedAt)} IST · {sync.importedCount} imported · {sync.refusedCount} refused.</p>:
    <p role="status" className="mt-1 text-body">No verified import has been recorded. Independent findings already stored here remain available; automatic GitHub sync is not configured.</p>}
   <p className="mt-1 text-xs text-muted-foreground">A manual sync is unavailable until the findings repository is accessible and import credentials are verified. No sync was performed by opening this page.</p>
   {sync?.refusedCount ? <section aria-label="Files the importer refused or flagged" className="mt-4 space-y-2">
    <h3 className="font-semibold">Files the importer refused or flagged ({sync.refusedCount})</h3>
    <DataTable columns={refusedColumns} rows={sync.refusedFiles}
     getRowKey={item=>item.path+" · "+item.reason} caption="Files the importer refused or flagged"
     empty={<p role="status" className="text-sm text-body">Review importer logs for the remaining details.</p>}/>
    {sync.refusedCount>sync.refusedFiles.length?<p role="status" className="text-xs text-muted-foreground">
     Showing the first {sync.refusedFiles.length} of {sync.refusedCount} refused files. Review importer logs for the remaining details.
    </p>:null}
   </section>:null}
  </section>
  <Tabs renderPanel={false} ariaLabel="Finding views" value={parsed.view}
   items={([
     {value:"OPEN",label:"Open"},
     {value:"RELEASE",label:"Release (critical & high)"},
     {value:"ALL",label:"All"},
   ] as const).map(item=>({...item,
    href:independentFindingHref({...parsed,view:item.value,page:1})}))}/>
  <section aria-label="Finding status counts" className="flex flex-wrap items-center gap-2 text-sm">
   <p className="font-semibold">Critical open: {data.criticalOpen}</p>
   {FINDING_STATUSES.map(status=><Link key={status}
    href={independentFindingHref({...parsed,statuses:[status],page:1})}
    className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
    {status.replaceAll("_"," ")}: {data.statusCounts[status]??0}
   </Link>)}
  </section>
  <form method="get" className="grid min-w-0 gap-3 border-b border-border pb-5 sm:grid-cols-2 lg:grid-cols-3">
   <input type="hidden" name="view" value={parsed.view}/>
   <label className="text-sm font-semibold">Search
    <Input name="q" defaultValue={parsed.q} maxLength={120} placeholder="ID, title or summary"/></label>
   <label className="text-sm font-semibold">Area
    <Input name="area" defaultValue={parsed.area} maxLength={80} placeholder="All areas"/></label>
   <label className="text-sm font-semibold">Status (multiple)
    <Select name="status" multiple size={4} defaultValue={parsed.statuses}>
     {FINDING_STATUSES.map(v=><option key={v} value={v}>{v.replaceAll("_"," ")}</option>)}
    </Select></label>
   <label className="text-sm font-semibold">Severity (multiple)
    <Select name="severity" multiple size={4} defaultValue={parsed.severities}>
     {FINDING_SEVERITIES.map(v=><option key={v} value={v}>{v}</option>)}
    </Select></label>
   <label className="text-sm font-semibold">Kind (multiple)
    <Select name="kind" multiple size={4} defaultValue={parsed.kinds}>
     {FINDING_KINDS.map(v=><option key={v} value={v}>{v}</option>)}
    </Select></label>
   <div className="flex items-end gap-3">
    <Button type="submit" variant="primary">Apply filters</Button>
    <Link href="/tracker/audit-findings?view=OPEN" className="min-h-9 inline-flex items-center font-semibold text-primary-text">Clear</Link>
   </div>
  </form>
  <p role="status" className="text-sm text-body">
   {data.total} matching independent findings · page {data.page} of {data.pages} · 50 per page.
  </p>
  <DataTable columns={findingColumns} rows={data.items} getRowKey={item=>item.id}
   caption="Independent audit findings"
   empty={<p role="status" className="text-sm text-body">No independent audit findings match these filters.</p>}/>
  <nav aria-label="Audit findings pages" className="flex justify-between gap-4">
   {data.page>1?<Link href={independentFindingHref(parsed,data.page-1)} className="inline-flex min-h-9 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Previous</Link>:<span/>}
   {data.page<data.pages?<Link href={independentFindingHref(parsed,data.page+1)} className="inline-flex min-h-9 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Next</Link>:null}
  </nav>
 </div>;
}
