import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {notFound} from "next/navigation";
import {ErrorState} from "@/components/ui/error-state";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {PageBackLink} from "@/components/ui/page-back-link";
import {Disclosure} from "@/components/ui/disclosure";
import {listSuperAdminStudentRuleHistory} from "@/modules/module-access/admin-student-rule-history-service";
import {studentRuleHistoryCursorSchema,studentRuleHistoryHref,studentRuleHistoryExportHref} from "@/modules/module-access/admin-student-rule-history-model";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
import { formatDateTimeIst } from "@/lib/format-date";
export const dynamic="force-dynamic";
export default async function StudentModuleRuleHistory({params,searchParams}:{params:Promise<{collegeId:string;membershipId:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {collegeId,membershipId}=await params;
 const cursor=studentRuleHistoryCursorSchema.safeParse(await searchParams);
 if(!cursor.success)return <div className="min-w-0 space-y-4">
  <PageHeader eyebrow="Super Admin · Module Access" title="Student module-rule history"
    actions={<PageBackLink href={"/admin/features/"+encodeURIComponent(collegeId)+"/students/"+encodeURIComponent(membershipId)} label="Student module access"/>}/>
  <ErrorState title="Invalid history filters"
    description="Choose a valid module, actor, date range and pagination cursor. The membership history has not been loaded."
    action={<TextLink href={studentRuleHistoryHref(collegeId,membershipId,null)}
      className="inline-flex min-h-11 items-center md:min-h-9">Clear history filters</TextLink>}/>
 </div>;
 const result=await listSuperAdminStudentRuleHistory(await getCurrentRequestContext(),collegeId,membershipId,cursor.data);
 if(!result)notFound();
 return <div className="min-w-0 space-y-6">
  <PageHeader eyebrow="Super Admin · Module Access" title="Student module-rule history"
   description={"Recent authorized module override and lock changes for "+(result.learnerName||"this learner")+". Changes are shown 40 at a time, newest first. The optional module filter is applied to the scoped audit query."}
   actions={<PageBackLink href={"/admin/features/"+encodeURIComponent(collegeId)+"/students/"+encodeURIComponent(membershipId)} label="Student module access"/>}/>
  <form method="get" className="flex min-w-0 flex-wrap items-end gap-[var(--lms-space-2)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] max-md:[&_label]:w-full">
   <Label stack>Module
    <Select name="module" defaultValue={cursor.data.module} className="min-h-11 md:min-h-9">
     <option value="all">All modules</option><option value="projects">Projects</option><option value="electives">Electives</option>
    </Select>
   </Label>
   <Disclosure title="More history filters" defaultOpen={Boolean(cursor.data.actorName||cursor.data.from||cursor.data.to)}
     className="min-w-0 w-full sm:w-auto" contentClassName="grid min-w-0 gap-3 pb-2 pt-2 sm:grid-cols-2">
   <Label stack className="min-w-48 flex-1">Actor name
    <Input name="actorName" maxLength={100} defaultValue={cursor.data.actorName}
     className="min-h-11 md:min-h-9"/>
   </Label>
   <Label stack>From (India day)
    <Input type="date" name="from" defaultValue={cursor.data.from} className="min-h-11 md:min-h-9"/>
   </Label>
   <Label stack>To (India day)
    <Input type="date" name="to" defaultValue={cursor.data.to} className="min-h-11 md:min-h-9"/>
   </Label>
   </Disclosure>
   <Button type="submit" className="min-h-11 w-full justify-center sm:w-auto md:min-h-9">Filter history</Button>
   <TextLink href={studentRuleHistoryHref(collegeId,membershipId,null)} className="inline-flex min-h-11 items-center">Clear</TextLink>
  </form>
  <div className="flex min-w-0 flex-col items-stretch gap-1 sm:items-end">
  <ButtonLink variant="secondary" href={studentRuleHistoryExportHref(collegeId,membershipId,
   cursor.data.beforeOccurredAt&&cursor.data.beforeId?{beforeOccurredAt:new Date(cursor.data.beforeOccurredAt),beforeId:cursor.data.beforeId}:null,
   cursor.data.module,cursor.data.actorName,cursor.data.from,cursor.data.to)}
   className="w-full sm:w-auto">Export this history page (CSV)</ButtonLink>
  <p className="max-w-prose text-xs text-muted-foreground">Export contains at most 40 authorized changes from this page, not an unrestricted audit archive.</p>
  </div>
  {result.items.length===0?<p className="border-b border-border py-6 text-sm text-body">No module override changes have been recorded for this membership.</p>:
   <ol className="min-w-0 divide-y divide-border border-y border-border">{result.items.map(item=><li key={item.id} className="min-w-0 py-4">
    <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <Heading level={2} size="base" className="min-w-0 break-words text-foreground">{item.module}</Heading>
      <p className="shrink-0 text-xs text-muted-foreground">{formatDateTimeIst(item.occurredAt)}</p>
    </div>
    <p className="mt-2 break-words text-sm text-body">{item.change}</p>
    <p className="mt-2 break-words text-xs text-muted-foreground">{item.actorName}</p>
   </li>)}</ol>}
  {result.nextCursor?<ButtonLink variant="secondary" href={studentRuleHistoryHref(collegeId,membershipId,result.nextCursor,cursor.data.module,cursor.data.actorName,cursor.data.from,cursor.data.to)} className="w-full sm:w-auto">Older changes →</ButtonLink>:null}
  <TextLink href={"/admin/audit?collegeId="+encodeURIComponent(collegeId)+"&subjectType=MEMBERSHIP&subjectId="+encodeURIComponent(membershipId)}
   className="inline-flex min-h-11 items-center md:min-h-9">Open scoped Activity Log →</TextLink>
 </div>;
}
