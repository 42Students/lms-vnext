import { EmptyState } from "@/components/ui/empty-state";
import { Banner } from "@/components/ui/banner";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
import {redirect} from "next/navigation";
import {AuthorizationError} from "@/modules/permissions/policy";
import {PageHeader} from "@/components/ui/page-header";
import {Pagination} from "@/components/ui/pagination";
import {StatusBadge} from "@/components/ui/status-badge";
import {IndependentAuditFindingsBoard} from "@/components/tracker/independent-audit-findings-board";
import {Tabs} from "@/components/ui/tabs";
import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
import {ErrorState} from "@/components/ui/error-state";
import {TrackerAdminNav} from "@/components/tracker/tracker-admin-nav";
import {IndependentFindingsSyncControl} from "@/components/tracker/independent-findings-sync-control";
import {independentAuditImporterReady} from "@/modules/bug-tracker/independent-audit-inbox-importer";
import {independentAuditGithubConfigured} from "@/modules/bug-tracker/independent-audit-github-client";
import {AuditFindingFilterMemory} from "@/components/tracker/audit-finding-filter-memory";
import {FINDING_STATUSES,FINDING_SEVERITIES,FINDING_KINDS,parseIndependentFindingFilters,independentFindingHref} from "@/modules/bug-tracker/independent-audit-findings-model";
import {independentAuditFindingsReady,listIndependentAuditFindings,readIndependentFindingSyncState} from "@/modules/bug-tracker/independent-audit-findings-service";
import {IndependentFindingSyncAction} from "@/components/tracker/independent-finding-sync-action";
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
 const header=<><AuditFindingFilterMemory/><PageHeader title="Audit findings"
  description="Independent findings imported from the audit repository, not user bug reports."/><TrackerAdminNav/></>;
 if(!parsed)return <div className="min-w-0 space-y-4">{header}
  <ErrorState title="Invalid audit findings filters." description="Independent findings imported from the audit repository, not user bug reports."
   action={<Link href="/tracker/audit-findings?view=OPEN"
    className="inline-flex min-h-11 items-center md:min-h-9 font-semibold text-link underline">Reset filters</Link>}/>
 </div>;
 if(!independentAuditFindingsReady())return <div className="min-w-0 space-y-4">{header}
  <Banner tone="warning">
   Audit findings are temporarily unavailable. Please contact your platform administrator to complete setup.
   Bug reports are not substituted for independent audit findings.
  </Banner></div>;
 // The board and historical import health are separate dependencies.
 // Never hide verified findings because importer diagnostics timed out.
 const [findingsResult,syncResult]=await Promise.allSettled([
  listIndependentAuditFindings(ctx,parsed),readIndependentFindingSyncState(ctx),
 ] as const);
 if(findingsResult.status==="rejected"){
  if(findingsResult.reason instanceof AuthorizationError)throw findingsResult.reason;
  return <div className="min-w-0 space-y-4">{header}
   <Banner tone="error">Couldn&apos;t load findings. The last verified data has not been modified.</Banner>
   <ErrorState title="Couldn\u0027t load findings."
    description="Retry the same authorized search and filter set. No synchronization was attempted."
    action={<Link href={independentFindingHref(parsed)} className="font-semibold text-link underline underline-offset-4">Retry audit findings</Link>} />
  </div>;
 }
 const data=findingsResult.value;
 const sync=syncResult.status==="fulfilled"?syncResult.value:null;
 const importerReady=independentAuditImporterReady()&&independentAuditGithubConfigured();
 // Persisted importer errors are untrusted: redact obvious credentials and
 // request tokens, and truncate. Do not print raw sync/provider payloads.
 const lastImportError=sync?.lastError
  ?.replace(/(bearer|token|password|api[_-]?key)\s*[:=]\s*\S+/gi,"[redacted]")
  .replace(/https?:\/\/[^\s]+/gi,"[redacted URL]")
  .replace(/[\x00-\x1f\x7f]/g," ").slice(0,320)??null;

 const refusedColumns:DataTableColumn<NonNullable<typeof sync>["refusedFiles"][number]>[]=[
  {key:"path",header:"File",mobilePriority:"primary",cell:item=>
    <span className="block min-w-0 break-all font-mono text-xs">{item.path||"Unknown file"}</span>},
  {key:"result",header:"Result",mobilePriority:"secondary",cell:item=>
    <StatusBadge tone={item.result==="REFUSED"?"warning":"error"}>{item.result}</StatusBadge>},
  {key:"reason",header:"Why",mobilePriority:"secondary",cell:item=>
    <span className="break-words">{item.reason||"Reason not recorded"}</span>},
  {key:"checked",header:"Checked",mobilePriority:"secondary",cell:item=>
    item.checkedAt?new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",
     dateStyle:"medium",timeStyle:"short"}).format(item.checkedAt)+" IST":"Not given"},
 ];
 return <div className="min-w-0 space-y-5">{header}
  <div className="space-y-2 border-b border-[var(--lms-canvas-border)] pb-3 text-sm">
   <p className="text-body">Source: <span className="font-semibold">{sync?.source??"42Students/lms-findings"}</span>
    {" · "}Last verified sync: {sync?.lastSyncedAt ?
      new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",
        timeZone:"Asia/Kolkata"}).format(sync.lastSyncedAt)+" IST" : "not recorded"}
    {" · "}Result: {sync?.lastResult??"NOT CONFIGURED"}.
   </p>
   <p className="text-xs text-muted-foreground">The shared legacy tracker password was retired. This page requires an active unscoped Super Admin session and platform permission.</p>
   <IndependentFindingsSyncControl ready={importerReady}/>
   {!importerReady?<Banner tone="warning">
    Sync now requires verified repository credentials and a durable import ledger.
    The shared legacy manager password no longer grants access.
   </Banner>:null}
   {syncResult.status==="rejected" ? <Banner tone="warning">
    Import history could not be refreshed. Findings remain available.
    {" "}<Link href={independentFindingHref(parsed)} className="font-semibold underline underline-offset-4">Retry import status</Link>
   </Banner> : null}
   {sync?.lastResult==="FAILED" ? <Banner tone="warning">
    The last recorded repository import failed. {lastImportError??"Check importer credentials and logs."} No sync was started here.
   </Banner> : null}
   {lastImportError&&sync?.lastResult!=="FAILED"?<Banner tone="warning">
    Last import error: {lastImportError}
   </Banner>:null}
   {sync?.lastResult==="PARTIAL" ? <Banner tone="warning">
    The last import was partial. Review the recorded refused files below; an import success count must not include refused files.
   </Banner> : null}
  </div>
  <Tabs renderPanel={false} ariaLabel="Finding views" value={parsed.view}
   items={([
     {value:"OPEN",label:"Open"},
     {value:"RELEASE",label:"Release blockers"},
     {value:"ALL",label:"All"},
   ] as const).map(item=>({...item,
    href:independentFindingHref({...parsed,view:item.value,page:1})}))}/>
  <NeedsDoingChips label="Open findings by severity"
   items={FINDING_SEVERITIES.map(severity=>({
    key:severity,label:severity[0]+severity.slice(1).toLowerCase()+" open",
    count:data.severityOpenCounts[severity]??0,
    href:independentFindingHref({...parsed,view:"OPEN",severities:[severity],page:1}),
   }))}/>
  <NeedsDoingChips label="Finding status"
   items={FINDING_STATUSES.filter(status=>(data.statusCounts[status]??0)>0).map(status=>({
    key:status,label:status.replaceAll("_"," "),
    count:data.statusCounts[status]??0,
    href:independentFindingHref({...parsed,view:"ALL",statuses:[status],page:1}),
   }))}/>
  <form data-audit-findings-filters="true" role="search" aria-label="tracker audit findings filters" method="get" className="grid min-w-0 items-end gap-3 border-b border-[var(--lms-canvas-border)] pb-4 md:grid-cols-[minmax(0,1fr)_auto]">
   <Input type="hidden" name="view" value={parsed.view}/>
   <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search
    <Input name="q" defaultValue={parsed.q} maxLength={120} placeholder="Search title, summary, id, file"/></label>
   <div className="flex min-w-0 items-center gap-3 max-[767px]:[&>button]:flex-1">
    <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">Per page
     <Select name="size" defaultValue={String(parsed.size??50)} aria-label="Findings per page" className="min-h-11 md:min-h-9">
      {[25,50,100,200].map(size=><option key={size} value={size}>{size}</option>)}
     </Select></label>
    <Button type="submit" variant="primary" className="min-h-11 md:min-h-9">Search</Button>
    <Link href="/tracker/audit-findings?view=OPEN" className="inline-flex min-h-11 items-center font-semibold text-link md:min-h-9">Clear</Link>
   </div>
   <details open={Boolean(parsed.area || parsed.statuses.length || parsed.severities.length || parsed.kinds.length)}
    className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-2 md:col-span-2 lg:col-span-3">
    <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text md:min-h-9">More filters</summary>
    <div className="mt-2 grid min-w-0 gap-3 md:grid-cols-2 lg:grid-cols-3">
   <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Area (multiple)
    <Select name="area" multiple size={4} defaultValue={parsed.area.split(",").filter(Boolean)} aria-label="Filter findings by areas">
     {[
      "login","course","lesson-content","quiz","assignment","attendance","classroom",
      "notifications","calendar","projects","placements-tpo","recruiter",
      "student-placements","college-admin","super-admin","groups-electives",
      "people-accounts","reports","tracker","mobile","platform","security","other",
     ].map(area=><option key={area} value={area}>{area}</option>)}
    </Select></label>
   <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Status (multiple)
    <Select name="status" multiple size={4} defaultValue={parsed.statuses}>
     {FINDING_STATUSES.map(v=><option key={v} value={v}>{v.replaceAll("_"," ")}</option>)}
    </Select></label>
   <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Severity (multiple)
    <Select name="severity" multiple size={4} defaultValue={parsed.severities}>
     {FINDING_SEVERITIES.map(v=><option key={v} value={v}>{v}</option>)}
    </Select></label>
   <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Kind (multiple)
    <Select name="kind" multiple size={4} defaultValue={parsed.kinds}>
     {FINDING_KINDS.map(v=><option key={v} value={v}>{v}</option>)}
    </Select></label>
    </div>
   </details>
  </form>
  <p role="status" className="text-sm text-body leading-[1.6]">
   {data.total.toLocaleString("en-IN")} finding{data.total===1?"":"s"} · page {data.page} of {data.pages}
  </p>
  <IndependentAuditFindingsBoard rows={data.items} view={parsed.view}/>
  <Pagination label="Audit findings pages" page={data.page} pageCount={data.pages} hrefForPage={page=>independentFindingHref(parsed,page)}/>
  <details aria-label="Findings import status" className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-3 text-sm">
   <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-[var(--lms-heading)] md:min-h-9">Findings import status</summary>
   <p role="status" className="mt-1 text-body">
    {sync?.lastResult==="SUCCESS"?"Last sync succeeded.":
      sync?.lastResult==="FAILED"?"The last sync failed. Existing imported findings remain available.":
      sync?.lastResult==="PARTIAL"?"The last sync was partial; review refused files.":
      "Sync isn't set up on this server."}
   </p>
   {sync?.lastSyncedAt?<p className="mt-1 text-body">Last recorded sync: {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(sync.lastSyncedAt)} IST · {sync.importedCount} imported · {sync.refusedCount} refused.</p>:
    <p role="status" className="mt-1 text-body">No verified import has been recorded. Independent findings already stored here remain available; automatic GitHub sync is not configured.</p>}
   <p className="mt-1 text-xs text-muted-foreground">Sync is an explicit, authorized POST requiring an active unscoped Super Admin, same-origin access, repository credentials and a verified import ledger. Viewing this page never triggers a sync.</p>
   {sync?.refusedCount ? <section aria-label="Files the importer refused or flagged" className="mt-4 space-y-2">
    <h3 className="font-semibold">Files the importer refused or flagged ({sync.refusedCount})</h3>
    <DataTable columns={refusedColumns} rows={sync.refusedFiles}
     getRowKey={item=>item.path+" · "+item.reason} caption="Files the importer refused or flagged"
     empty={<EmptyState title="No import details" description="Review importer logs for the remaining details."/>}/>
    {sync.refusedCount>sync.refusedFiles.length?<p role="status" className="text-xs text-muted-foreground">
     Showing the first {sync.refusedFiles.length} of {sync.refusedCount} refused files. Review importer logs for the remaining details.
    </p>:null}
   </section>:null}
  </details>
 </div>;
}
