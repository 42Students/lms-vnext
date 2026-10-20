import { FilterBar } from "@/components/ui/filter-bar";
import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import Link from "next/link";
import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {PageBackLink} from "@/components/ui/page-back-link";
import {Disclosure} from "@/components/ui/disclosure";
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
  <PageHeader eyebrow="Super Admin · Module Access" title="Student module-rule history"
   description={"Recent authorized module override and lock changes for "+(result.learnerName||"this learner")+". Changes are shown 40 at a time, newest first. The optional module filter is applied to the scoped audit query."}
   actions={<PageBackLink href={"/admin/features/"+encodeURIComponent(collegeId)+"/students/"+encodeURIComponent(membershipId)} label="Student module access"/>}/>
  <FilterBar title="Filters"><form method="get" className="flex min-w-0 flex-wrap items-end gap-[var(--lms-space-2)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] max-[767px]:[&_label]:w-full">
   <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Module
    <Select name="module" defaultValue={cursor.data.module} className="min-h-11 min-[768px]:min-h-9">
     <option value="all">All modules</option><option value="projects">Projects</option><option value="electives">Electives</option>
    </Select>
   </label>
   <Disclosure title="More history filters" defaultOpen={Boolean(cursor.data.actorName||cursor.data.from||cursor.data.to)}
     className="min-w-0 w-full sm:w-auto" contentClassName="grid min-w-0 gap-3 pb-2 pt-2 sm:grid-cols-2">
   <label className="grid min-w-48 flex-1 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Actor name
    <Input name="actorName" maxLength={100} defaultValue={cursor.data.actorName}
     className="min-h-11 min-[768px]:min-h-9"/>
   </label>
   <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">From (India day)
    <Input type="date" name="from" defaultValue={cursor.data.from} className="min-h-11 min-[768px]:min-h-9"/>
   </label>
   <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">To (India day)
    <Input type="date" name="to" defaultValue={cursor.data.to} className="min-h-11 min-[768px]:min-h-9"/>
   </label>
   </Disclosure>
   <Button type="submit" className="min-h-11 w-full justify-center sm:w-auto min-[768px]:min-h-9">Filter history</Button>
   <Link href={studentRuleHistoryHref(collegeId,membershipId,null)} className="inline-flex min-h-11 items-center text-primary-text hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] underline-offset-4">Clear</Link>
  </form></FilterBar>
  <div className="flex min-w-0 flex-col items-stretch gap-1 sm:items-end">
  <Link href={studentRuleHistoryExportHref(collegeId,membershipId,
   cursor.data.beforeOccurredAt&&cursor.data.beforeId?{beforeOccurredAt:new Date(cursor.data.beforeOccurredAt),beforeId:cursor.data.beforeId}:null,
   cursor.data.module,cursor.data.actorName,cursor.data.from,cursor.data.to)}
   className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] sm:w-auto md:min-h-9">Export this history page (CSV)</Link>
  <p className="max-w-prose text-xs text-muted-foreground">Export contains at most 40 authorized changes from this page, not an unrestricted audit archive.</p>
  </div>
  {result.items.length===0?<p className="border-b border-border py-6 text-sm text-body">No module override changes have been recorded for this membership.</p>:
   <ol className="min-w-0 divide-y divide-border border-y border-border">{result.items.map(item=><li key={item.id} className="min-w-0 py-4">
    <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="min-w-0 break-words text-base font-semibold text-foreground">{item.module}</h2>
      <p className="shrink-0 text-xs text-muted-foreground">{item.occurredAt.toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})}</p>
    </div>
    <p className="mt-2 break-words text-sm text-body">{item.change}</p>
    <p className="mt-2 break-words text-xs text-muted-foreground">{item.actorName}</p>
   </li>)}</ol>}
  {result.nextCursor?<Link href={studentRuleHistoryHref(collegeId,membershipId,result.nextCursor,cursor.data.module,cursor.data.actorName,cursor.data.from,cursor.data.to)} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] sm:w-auto md:min-h-9">Older changes →</Link>:null}
  <Link href={"/admin/audit?collegeId="+encodeURIComponent(collegeId)+"&subjectType=MEMBERSHIP&subjectId="+encodeURIComponent(membershipId)}
   className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary min-[768px]:min-h-9 hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)]">Open scoped Activity Log →</Link>
 </div>;
}
