import Link from "next/link";
import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {PageBackLink} from "@/components/ui/page-back-link";
import {StatusBadge} from "@/components/ui/status-badge";
import {getIndependentAuditFinding,listIndependentAuditFindingEvents,listIndependentAuditFindings} from "@/modules/bug-tracker/independent-audit-findings-service";
import {IndependentFindingActions} from "@/components/tracker/independent-finding-actions";
import {IndependentFindingCopyAction} from "@/components/tracker/independent-finding-copy-action";
import {TrackerAdminNav} from "@/components/tracker/tracker-admin-nav";
export async function generateMetadata({params}:{params:Promise<{publicId:string}>}){
 const {publicId}=await params;
 return {title:publicId+" · 42 Tracker"};
}
export default async function IndependentFindingDetailPage({params}:{params:Promise<{publicId:string}>}){
 const {publicId}=await params;
 const finding=await getIndependentAuditFinding(await getCurrentRequestContext(),publicId);
 if(!finding)notFound();
 const context=await getCurrentRequestContext();
 const [events,candidates]=await Promise.all([
  listIndependentAuditFindingEvents(context,finding.id),
  listIndependentAuditFindings(context,{q:"",view:"ALL",statuses:[],severities:[],kinds:[],area:"",page:1}),
 ]);
 const details=[
  ["Summary",finding.summary],["Steps",finding.steps],["Expected",finding.expected],
  ["Actual",finding.actual],["Evidence",finding.evidence],["Suggested fix",finding.suggestedFix],
 ];
 return <div className="min-w-0 space-y-5">
  <PageHeader title={finding.title} description={finding.externalId+" · "+finding.area+" · "+finding.kind}
   actions={<PageBackLink href="/tracker/audit-findings" label="Back to audit findings"/>}/>
  <TrackerAdminNav/>
  <div className="flex flex-wrap gap-2"><StatusBadge tone={finding.severity==="CRITICAL"?"error":finding.severity==="HIGH"?"warning":"neutral"}>{finding.severity}</StatusBadge><StatusBadge tone={finding.status==="VERIFIED"||finding.status==="RELEASED_PROD"?"success":finding.status==="NEW"||finding.status==="NEEDS_INFO"?"warning":"info"}>{finding.status}</StatusBadge>
   <StatusBadge>{finding.assignee??"Unassigned"}</StatusBadge></div>
  {details.slice(0,1).map(([label,value])=><section key={label} className="min-w-0 border-b border-border pb-4">
   <h2 className="font-semibold text-[var(--lms-heading)]">{label}</h2><p className="mt-2 max-w-3xl whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-[22px] text-body">{value??"Not recorded"}</p>
  </section>)}
  <IndependentFindingActions externalId={finding.externalId} version={finding.version} status={finding.status} severity={finding.severity} currentAssignee={finding.assignee}
   candidates={candidates.items.filter(item=>item.id!==finding.id).map(item=>({id:item.id,externalId:item.externalId,title:item.title}))}/>
  <details className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-4">
    <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text md:min-h-9">More finding details</summary>
    <div className="min-w-0 space-y-4 pt-3">
  {details.slice(1).map(([label,value])=><section key={label} className="min-w-0 border-b border-border pb-4">
   <h2 className="font-semibold text-[var(--lms-heading)]">{label}</h2><p className="mt-2 whitespace-pre-wrap break-words text-sm text-body leading-[22px]">{value??"Not recorded"}</p>
  </section>)}
    </div>
  </details>
  <section aria-labelledby="section-source-and-affected-code" className="border-b border-border pb-4">
   <h2 id="section-source-and-affected-code" className="font-semibold text-[var(--lms-heading)]">Source and affected code</h2>
   <p className="max-w-3xl break-all text-sm text-body leading-[22px]">Repository: {finding.sourceRepo} · Source: {finding.sourcePath??"Not recorded"}</p>
   {([["Paths",finding.paths],["Pages",finding.pages],["Endpoints",finding.endpoints]] as const).map(([label,values])=>
    <div key={label} className="mt-3"><h3 className="text-sm font-semibold text-[var(--lms-heading)]">{label}</h3>
     <ul className="list-disc pl-5 text-sm">{values.map(value=><li key={value} className="break-all [overflow-wrap:anywhere]">{value}</li>)}</ul></div>)}
  </section>
  <details className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-4">
    <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text md:min-h-9">Related tools</summary>
    <div className="flex min-w-0 flex-wrap items-center gap-4 pt-3">
  <Link href={"/tracker/audit-findings?q="+encodeURIComponent(finding.title.slice(0,100))}
   className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Looks similar</Link>
  <IndependentFindingCopyAction finding={{
   id:finding.externalId,title:finding.title,summary:finding.summary,steps:finding.steps,
   expected:finding.expected,actual:finding.actual,sourceRepo:finding.sourceRepo,
   sourcePath:finding.sourcePath,severity:finding.severity,status:finding.status,
  }}/>

    </div>
  </details>
  <details aria-labelledby="section-audit-event-history" className="border-b border-[var(--lms-canvas-border)] pb-4">
   <summary id="section-audit-event-history" className="flex min-h-11 cursor-pointer items-center font-semibold text-foreground md:min-h-9">Audit event history</summary>
   {events.length?<ol aria-label="audit findings entries" className="mt-3 divide-y divide-border border-y border-border text-sm">{events.map(event=><li key={event.id} className="py-3">
    {event.action} · {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(event.createdAt)}
    {event.note?<p className="mt-1 whitespace-pre-wrap break-words">{event.note}</p>:null}
   </li>)}</ol>:<p role="status" className="mt-3 border-y border-border py-5 text-sm text-muted-foreground leading-[22px]">No audit events recorded.</p>}
  </details>
  <details aria-labelledby="section-fix-commits" className="border-b border-[var(--lms-canvas-border)] pb-4">
   <summary id="section-fix-commits" className="flex min-h-11 cursor-pointer items-center font-semibold text-foreground md:min-h-9">Fix commits</summary>
   {finding.fixCommits.length?<ul className="mt-2 divide-y divide-border border-y border-border">{finding.fixCommits.map(commit=><li key={commit.repo+":"+commit.sha}
    className="break-all py-3 text-sm text-body">{commit.repo} · {commit.sha}</li>)}</ul>:<p role="status" className="mt-2 border-y border-border py-5 text-sm text-muted-foreground leading-[22px]">No fix commits recorded.</p>}
  </details>
 </div>;
}
