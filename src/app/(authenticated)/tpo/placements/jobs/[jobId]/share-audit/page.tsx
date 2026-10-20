import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { Tabs } from "@/components/ui/tabs";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {listTpoCompanyShareAudit} from "@/modules/placements/company-share/manage-service";
import {tpoCompanyAuditKindSchema,tpoCompanyAuditHref,tpoCompanyAuditExportHref} from "@/modules/placements/company-share/audit-kind-model";
import {companyShareAuditPageHref} from "@/modules/placements/company-share/audit-page-model";
import {parseCompanyShareAuditQuery} from "@/modules/placements/company-share/audit-query-model";
export const dynamic="force-dynamic";
export default async function TpoCompanyShareAuditPage({params,searchParams}:{
 params:Promise<{jobId:string}>;
 searchParams:Promise<{kind?:string|string[];page?:string|string[]}>;
}){
 const context=await getCurrentRequestContext();
 if(!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const {jobId}=await params;
 const search=await searchParams;
 const rawKind=Array.isArray(search.kind)?search.kind[0]:search.kind;
 const rawPage=Array.isArray(search.page)?search.page[0]:search.page;
 const parsed=parseCompanyShareAuditQuery({kind:rawKind,page:rawPage});
 const back="/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/share-preview";
 if(!parsed.success)return <div className="min-w-0 space-y-3">
  <PageHeader title="Invalid share-audit filters" />
  <Alert tone="error">Choose a valid event kind and page number. No access history was loaded.</Alert>
  <Link href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/share-audit"} className="inline-flex min-h-11 items-center text-[var(--lms-teal-deep)] underline md:min-h-9">Clear filters</Link>
 </div>;
 const {kind,page:auditPage}=parsed.data;
 const result=await listTpoCompanyShareAudit(context,jobId,kind,auditPage);
 return <div className="min-w-0 space-y-5">
  <Link href={back} className="inline-flex min-h-11 items-center text-[13px] font-semibold text-[var(--lms-link-text)] underline min-[768px]:min-h-9">
   Back to company-share preview
  </Link>
  <PageHeader title="Company-share access history" />
  <Tabs ariaLabel="Company-share event filters" value={kind} renderPanel={false}
   items={tpoCompanyAuditKindSchema.options.map(option=>({
    value:option,
    label:option==="ALL"?"All events":option==="VIEW"?"Page views":option==="LOCKED"?"Locked shares":"CSV downloads",
    href:tpoCompanyAuditHref(jobId,option),
   }))}/>
  {result.ready?<a href={tpoCompanyAuditExportHref(jobId,kind)}
    className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary min-[768px]:min-h-9">
    Export access history CSV
  </a>:null}
  {!result.ready?<Alert tone="warning">
   Access history is unavailable until the share-audit migration is registered.
  </Alert>:<DataTable caption="Company-share access history"
    rows={result.entries.map((entry,index)=>({...entry,rowKey:String(index)}))}
    getRowKey={entry=>entry.rowKey}
    empty={<EmptyState title="No share-page views or CSV downloads match this event filter for this drive." />}
    columns={[
      {key:"prefix",header:"Link prefix",mobilePriority:"primary",cell:entry=><span className="font-mono break-all">{entry.sharePrefix}</span>},
      {key:"action",header:"Action",mobilePriority:"secondary",cell:entry=>entry.kind},
      {key:"when",header:"UTC timestamp",mobilePriority:"secondary",cell:entry=>entry.at},
    ]}/>}
  {result.ready?<nav aria-label="Access history pages" className="flex min-w-0 flex-wrap items-center gap-3 text-[13px]">
   <span>{result.total} events · Page {result.page} of {result.totalPages}, 25 per page</span>
   {result.page>1?<Link href={companyShareAuditPageHref(jobId,kind,result.page-1)}
    className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-teal-deep)] underline md:min-h-9">Previous</Link>:null}
   {result.limited?<Link href={companyShareAuditPageHref(jobId,kind,result.page+1)}
    className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-link-text)] underline min-[768px]:min-h-9">Next</Link>:null}
  </nav>:null}
 </div>;
}
