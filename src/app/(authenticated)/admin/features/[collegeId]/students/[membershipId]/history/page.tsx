import Link from "next/link";
import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {listSuperAdminStudentRuleHistory} from "@/modules/module-access/admin-student-rule-history-service";
import {studentRuleHistoryCursorSchema,studentRuleHistoryHref} from "@/modules/module-access/admin-student-rule-history-model";
export const dynamic="force-dynamic";
export default async function StudentModuleRuleHistory({params,searchParams}:{params:Promise<{collegeId:string;membershipId:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {collegeId,membershipId}=await params;
 const cursor=studentRuleHistoryCursorSchema.safeParse(await searchParams);
 if(!cursor.success)notFound();
 const result=await listSuperAdminStudentRuleHistory(await getCurrentRequestContext(),collegeId,membershipId,cursor.data);
 if(!result)notFound();
 return <div className="space-y-6">
  <Link href={"/admin/features/"+encodeURIComponent(collegeId)+"/students/"+encodeURIComponent(membershipId)}
   className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">← Student overrides</Link>
  <PageHeader eyebrow="Super Admin · Module Access" title="Student module-rule history"
   description={"Recent authorized module override and lock changes for "+(result.learnerName||"this learner")+". Changes are shown 40 at a time, newest first."}/>
  {result.items.length===0?<p className="rounded-xl border border-border bg-surface p-5 text-sm text-body">No module override changes have been recorded for this membership.</p>:
   <ol className="space-y-3">{result.items.map(item=><li key={item.id} className="rounded-xl border border-border bg-surface p-4">
    <h2 className="font-semibold text-foreground">{item.module}</h2>
    <p className="mt-2 text-sm text-body">{item.change}</p>
    <p className="mt-2 text-xs text-muted-foreground">{item.actorName} · {item.occurredAt.toLocaleString("en-IN")}</p>
   </li>)}</ol>}
  {result.nextCursor?<Link href={studentRuleHistoryHref(collegeId,membershipId,result.nextCursor)} className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text">Older changes →</Link>:null}
  <Link href={"/admin/audit?collegeId="+encodeURIComponent(collegeId)+"&subjectType=MEMBERSHIP&subjectId="+encodeURIComponent(membershipId)}
   className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Open scoped Activity Log →</Link>
 </div>;
}
