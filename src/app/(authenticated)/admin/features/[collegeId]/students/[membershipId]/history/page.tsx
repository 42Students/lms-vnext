import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import Link from "next/link";
import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {listSuperAdminStudentRuleHistory} from "@/modules/module-access/admin-student-rule-history-service";
import {studentRuleHistoryCursorSchema,studentRuleHistoryHref,studentRuleHistoryExportHref} from "@/modules/module-access/admin-student-rule-history-model";
export const dynamic="force-dynamic";
export default async function StudentModuleRuleHistory({params,searchParams}:{params:Promise<{collegeId:string;membershipId:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {collegeId,membershipId}=await params;
 const cursor=studentRuleHistoryCursorSchema.safeParse(await searchParams);
 if(!cursor.success)notFound();
 const result=await listSuperAdminStudentRuleHistory(await getCurrentRequestContext(),collegeId,membershipId,cursor.data);
 if(!result)notFound();
 return <div className="min-w-0 space-y-6">
  <Link href={"/admin/features/"+encodeURIComponent(collegeId)+"/students/"+encodeURIComponent(membershipId)}
   className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">← Student overrides</Link>
  <PageHeader eyebrow="Super Admin · Module Access" title="Student module-rule history"
   description={"Recent authorized module override and lock changes for "+(result.learnerName||"this learner")+". Changes are shown 40 at a time, newest first. The optional module filter is applied to the scoped audit query."}/>
  <form method="get" className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
   <label className="grid gap-1 text-sm font-semibold text-body">Module
    <Select name="module" defaultValue={cursor.data.module} className="min-h-11 sm:min-h-9">
     <option value="all">All modules</option><option value="projects">Projects</option><option value="electives">Electives</option>
    </Select>
   </label>
   <label className="grid min-w-48 flex-1 gap-1 text-sm font-semibold text-body">Actor name
    <Input name="actorName" maxLength={100} defaultValue={cursor.data.actorName}
     className="min-h-11 sm:min-h-9"/>
   </label>
   <label className="grid gap-1 text-sm font-semibold text-body">From (India day)
    <Input type="date" name="from" defaultValue={cursor.data.from} className="min-h-11 sm:min-h-9"/>
   </label>
   <label className="grid gap-1 text-sm font-semibold text-body">To (India day)
    <Input type="date" name="to" defaultValue={cursor.data.to} className="min-h-11 sm:min-h-9"/>
   </label>
   <Button type="submit" className="min-h-11 sm:min-h-9">Filter history</Button>
   <Link href={studentRuleHistoryHref(collegeId,membershipId,null)} className="inline-flex min-h-11 items-center text-primary-text">Clear</Link>
  </form>
  <Link href={studentRuleHistoryExportHref(collegeId,membershipId,
   cursor.data.beforeOccurredAt&&cursor.data.beforeId?{beforeOccurredAt:new Date(cursor.data.beforeOccurredAt),beforeId:cursor.data.beforeId}:null,
   cursor.data.module,cursor.data.actorName,cursor.data.from,cursor.data.to)}
   className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle">Export this history page (CSV)</Link>
  <p className="text-xs text-muted-foreground">Export contains at most 40 authorized changes from this page, not an unrestricted audit archive.</p>
  {result.items.length===0?<p className="border-b border-border py-5 text-sm text-body">No module override changes have been recorded for this membership.</p>:
   <ol className="min-w-0 space-y-3">{result.items.map(item=><li key={item.id} className="border-b border-border py-4 last:border-b-0">
    <h2 className="font-semibold text-foreground">{item.module}</h2>
    <p className="mt-2 text-sm text-body">{item.change}</p>
    <p className="mt-2 text-xs text-muted-foreground">{item.actorName} · {item.occurredAt.toLocaleString("en-IN")}</p>
   </li>)}</ol>}
  {result.nextCursor?<Link href={studentRuleHistoryHref(collegeId,membershipId,result.nextCursor,cursor.data.module,cursor.data.actorName,cursor.data.from,cursor.data.to)} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle">Older changes →</Link>:null}
  <Link href={"/admin/audit?collegeId="+encodeURIComponent(collegeId)+"&subjectType=MEMBERSHIP&subjectId="+encodeURIComponent(membershipId)}
   className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Open scoped Activity Log →</Link>
 </div>;
}
