import Link from "next/link";
import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
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
   actions={<Link href="/tracker/audit-findings" className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">← Back to audit findings</Link>}/>
  <TrackerAdminNav/>
  <div className="flex flex-wrap gap-2"><StatusBadge tone={finding.severity==="CRITICAL"?"error":finding.severity==="HIGH"?"warning":"neutral"}>{finding.severity}</StatusBadge><StatusBadge tone={finding.status==="VERIFIED"||finding.status==="RELEASED_PROD"?"success":finding.status==="NEW"||finding.status==="NEEDS_INFO"?"warning":"info"}>{finding.status}</StatusBadge>
   <StatusBadge>{finding.assignee??"Unassigned"}</StatusBadge></div>
  {details.map(([label,value])=><section key={label} className="border-b border-border pb-4">
   <h2 className="font-semibold">{label}</h2><p className="mt-2 whitespace-pre-wrap break-words text-sm text-body">{value??"Not recorded"}</p>
  </section>)}
  <section className="border-b border-border pb-4">
   <h2 className="font-semibold">Source and affected code</h2>
   <p className="text-sm text-body">Repository: {finding.sourceRepo} · Source: {finding.sourcePath??"Not recorded"}</p>
   {([["Paths",finding.paths],["Pages",finding.pages],["Endpoints",finding.endpoints]] as const).map(([label,values])=>
    <div key={label} className="mt-3"><h3 className="text-sm font-semibold">{label}</h3>
     <ul className="list-disc pl-5 text-sm">{values.map(value=><li key={value} className="break-all">{value}</li>)}</ul></div>)}
  </section>
  <Link href={"/tracker/audit-findings?q="+encodeURIComponent(finding.title.slice(0,100))}
   className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Looks similar</Link>
  <IndependentFindingCopyAction finding={{
   id:finding.externalId,title:finding.title,summary:finding.summary,steps:finding.steps,
   expected:finding.expected,actual:finding.actual,sourceRepo:finding.sourceRepo,
   sourcePath:finding.sourcePath,severity:finding.severity,status:finding.status,
  }}/>
  <IndependentFindingActions externalId={finding.externalId} version={finding.version} status={finding.status} severity={finding.severity}
   candidates={candidates.items.filter(item=>item.id!==finding.id).map(item=>({id:item.id,externalId:item.externalId,title:item.title}))}/>
  <section className="border-b border-border pb-4">
   <h2 className="font-semibold">Audit event history</h2>
   {events.length?<ol className="mt-3 divide-y divide-border border-y border-border text-sm">{events.map(event=><li key={event.id} className="py-3">
    {event.action} · {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(event.createdAt)}
    {event.note?<p className="mt-1 whitespace-pre-wrap break-words">{event.note}</p>:null}
   </li>)}</ol>:<p role="status" className="mt-3 border-y border-border py-5 text-sm text-muted-foreground">No audit events recorded.</p>}
  </section>
  <section className="border-b border-border pb-4">
   <h2 className="font-semibold">Fix commits</h2>
   {finding.fixCommits.length?<ul className="mt-2 divide-y divide-border border-y border-border">{finding.fixCommits.map(commit=><li key={commit.repo+":"+commit.sha}
    className="break-all py-3 text-sm text-body">{commit.repo} · {commit.sha}</li>)}</ul>:<p role="status" className="mt-2 border-y border-border py-5 text-sm text-muted-foreground">No fix commits recorded.</p>}
  </section>
 </div>;
}
