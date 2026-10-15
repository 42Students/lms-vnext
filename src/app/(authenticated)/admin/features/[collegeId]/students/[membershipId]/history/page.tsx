import Link from "next/link";
import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {listSuperAdminStudentRuleHistory} from "@/modules/module-access/admin-student-rule-history-service";
export const dynamic="force-dynamic";
export default async function StudentModuleRuleHistory({params}:{params:Promise<{collegeId:string;membershipId:string}>}){
 const {collegeId,membershipId}=await params;
 const result=await listSuperAdminStudentRuleHistory(await getCurrentRequestContext(),collegeId,membershipId);
 if(!result)notFound();
 return <div className="space-y-6">
  <Link href={"/admin/features/"+encodeURIComponent(collegeId)+"/students/"+encodeURIComponent(membershipId)}
   className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">← Student overrides</Link>
  <PageHeader eyebrow="Super Admin · Module Access" title="Student module-rule history"
   description={"Recent authorized module override and lock changes for "+(result.learnerName||"this learner")+". Only the 40 latest matching audit records are displayed."}/>
  {result.items.length===0?<p className="rounded-xl border border-border bg-surface p-5 text-sm text-body">No module override changes have been recorded for this membership.</p>:
   <ol className="space-y-3">{result.items.map(item=><li key={item.id} className="rounded-xl border border-border bg-surface p-4">
    <h2 className="font-semibold text-foreground">{item.module}</h2>
    <p className="mt-2 text-sm text-body">{item.change}</p>
    <p className="mt-2 text-xs text-muted-foreground">{item.actorName} · {item.occurredAt.toLocaleString("en-IN")}</p>
   </li>)}</ol>}
  {result.hasOlder?<p role="status" className="text-xs text-muted-foreground">Only the 40 most recent matching events are shown; use the scoped Activity Log for older history.</p>:null}
  <Link href={"/admin/audit?collegeId="+encodeURIComponent(collegeId)+"&subjectType=MEMBERSHIP&subjectId="+encodeURIComponent(membershipId)}
   className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Open scoped Activity Log →</Link>
 </div>;
}
