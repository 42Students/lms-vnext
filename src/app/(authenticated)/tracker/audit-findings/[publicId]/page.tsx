import Link from "next/link";
import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {StatusBadge} from "@/components/ui/status-badge";
import {getIndependentAuditFinding} from "@/modules/bug-tracker/independent-audit-findings-service";
export async function generateMetadata({params}:{params:Promise<{publicId:string}>}){
 const {publicId}=await params;
 return {title:publicId+" · 42 Tracker"};
}
export default async function IndependentFindingDetailPage({params}:{params:Promise<{publicId:string}>}){
 const {publicId}=await params;
 const finding=await getIndependentAuditFinding(await getCurrentRequestContext(),publicId);
 if(!finding)notFound();
 const details=[
  ["Summary",finding.summary],["Steps",finding.steps],["Expected",finding.expected],
  ["Actual",finding.actual],["Evidence",finding.evidence],["Suggested fix",finding.suggestedFix],
 ];
 return <div className="min-w-0 space-y-5">
  <Link href="/tracker/audit-findings" className="font-semibold text-primary-text">← Back to audit findings</Link>
  <PageHeader title={finding.title} description={finding.externalId+" · "+finding.area+" · "+finding.kind}/>
  <div className="flex flex-wrap gap-2"><StatusBadge>{finding.severity}</StatusBadge><StatusBadge>{finding.status}</StatusBadge>
   <StatusBadge>{finding.assignee??"Unassigned"}</StatusBadge></div>
  {details.map(([label,value])=><section key={label} className="rounded-xl border border-border bg-surface p-4">
   <h2 className="font-semibold">{label}</h2><p className="mt-2 whitespace-pre-wrap break-words text-sm text-body">{value??"Not recorded"}</p>
  </section>)}
  <section className="rounded-xl border border-border bg-surface p-4">
   <h2 className="font-semibold">Source and affected code</h2>
   <p className="text-sm text-body">Repository: {finding.sourceRepo} · Source: {finding.sourcePath??"Not recorded"}</p>
   {([["Paths",finding.paths],["Pages",finding.pages],["Endpoints",finding.endpoints]] as const).map(([label,values])=>
    <div key={label} className="mt-3"><h3 className="text-sm font-semibold">{label}</h3>
     <ul className="list-disc pl-5 text-sm">{values.map(value=><li key={value} className="break-all">{value}</li>)}</ul></div>)}
  </section>
  <section className="rounded-xl border border-border bg-surface p-4">
   <h2 className="font-semibold">Fix commits</h2>
   <ul className="mt-2 space-y-2">{finding.fixCommits.map(commit=><li key={commit.repo+":"+commit.sha}
    className="break-all text-sm text-body">{commit.repo} · {commit.sha}</li>)}</ul>
  </section>
 </div>;
}
