import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
import { AuthorizationError } from "@/modules/permissions/policy";
import { listPlacementOperationsJobPage } from "@/modules/placements/tpo-operations-service";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { SuperAdminDriveDirectoryFilters } from "@/components/placements/super-admin-drive-directory-filters";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { SuperAdminBulkDriveActions,SuperAdminDriveRowStatusAction } from "@/components/placements/super-admin-bulk-drive-actions";
import { SuperAdminDriveArchive } from "@/components/placements/super-admin-drive-archive";
import { SuperAdminDriveDuplicate } from "@/components/placements/super-admin-drive-duplicate";
import { SuperAdminDriveDeadline } from "@/components/placements/super-admin-drive-deadline";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { adminDriveDirectoryHref, adminDriveDirectoryQuerySchema, adminDriveStatus, adminDriveIstDate } from "@/modules/placements/admin-drive-directory-model";

export default async function SuperAdminDrivesPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const ctx=await getCurrentRequestContext(), raw=await searchParams;
 if(!ctx.adminScope?.collegeId)return <div className="min-w-0 space-y-4">
  <PageHeader title="Jobs Management (LMS)"/>
  <div role="alert" className="rounded-md border border-[#ffe58f] bg-[#fffbe6] p-4 text-sm text-[#874d00]">
    <strong className="block">Select a College to manage Jobs</strong>
    <span className="mt-1 block">Jobs are treated as college-scoped in Superadmin. Use the header Organization/College selector.</span>
  </div>
 </div>;
 requireSuperAdminSelectedCollege(ctx,"placements.manage");
 // Parse the whole query: dropping unknown keys would quietly accept
 // forged college/scope selectors and contradictory link parameters.
 const parsed=adminDriveDirectoryQuerySchema.safeParse(raw);
 if(!parsed.success)return <div className="min-w-0 space-y-4">
  <PageHeader title="Jobs Management (LMS)"/>
  <ErrorState title="Invalid drive filters" description="Choose valid filters and page number."
   action={<Link href="/admin/placements/drives" className="inline-flex items-center min-h-11 md:min-h-9 font-[650] text-link underline hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] underline-offset-4 w-full md:w-auto justify-center rounded-[var(--lms-control-radius)] px-4">Clear filters</Link>}/>
 </div>;
 // Keep an unavailable college reporting backend from crashing the entire
 // Super Admin drive directory; preserve the validated filter on Retry.
 const loaded=await listPlacementOperationsJobPage(ctx,ctx.adminScope.collegeId,parsed.data)
  .then(value=>({ok:true as const,value}))
  .catch(error=>({ok:false as const,denied:error instanceof AuthorizationError}));
 if(!loaded.ok)return <div className="min-w-0 space-y-4">
  <PageHeader title="Jobs Management (LMS)"/>
  <ErrorState
   title={loaded.denied?"Drive access denied":"Drives unavailable"}
   description={loaded.denied
    ?"Your account cannot manage drives in this college."
    :"Failed to load jobs. Please try again. Your selected college and filters are preserved; no unverified or stale drive rows are displayed."}
   action={<Link href={loaded.denied?"/dashboard":adminDriveDirectoryHref(parsed.data)}
    className="inline-flex items-center min-h-11 md:min-h-9 font-[650] text-link underline hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] underline-offset-4 w-full md:w-auto justify-center rounded-[var(--lms-control-radius)] px-4">
    {loaded.denied?"Back to dashboard":"Retry loading drives"}
   </Link>}
  />
 </div>;
 const data=loaded.value;
 const hasFilters=Boolean(parsed.data.q)||parsed.data.status!=="ALL";
 const href=(page:number)=>adminDriveDirectoryHref({...parsed.data,page});
 const today=new Date();
 const columns:DataTableColumn<(typeof data.items)[number]>[]=[
  {key:"job",header:"Job Title",mobileLabel:"Job Title",mobilePriority:"primary",
   cell:row=><div className="grid min-w-0 gap-1">
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <StatusBadge tone={row.job.status==="PUBLISHED"?"success":row.job.status==="DRAFT"?"info":"neutral"}>{adminDriveStatus(row.job,today)}</StatusBadge>
      <strong className="break-words text-[var(--lms-heading)]">{row.job.title}</strong>
    </div>
    <span className="text-xs text-body">{row.company.name}</span>
   </div>},
  {key:"company",header:"Company",mobileLabel:"Company",mobilePriority:"secondary",
   cell:row=><span className="break-words">{row.company.name}</span>},
  {key:"status",header:"Status",mobilePriority:"secondary",cell:row=>
    <StatusBadge tone={row.job.status==="PUBLISHED"?"success":row.job.status==="DRAFT"?"info":"neutral"}>{adminDriveStatus(row.job,today)}</StatusBadge>},
  {key:"type",header:"Type",mobilePriority:"secondary",cell:row=>{
    const type=row.job.jobTypeLabel?.trim()||(
      row.job.employmentType==="FULL_TIME"?"Full-time":
      row.job.employmentType==="INTERNSHIP"?"Internship":"Contract");
    return <span className="inline-flex rounded-[4px] border border-[#d9d9d9] bg-[#fafafa] px-2 py-0.5 text-xs font-medium text-[#595959]">{type}</span>;
   }},
  {key:"location",header:"Location",mobilePriority:"secondary",cell:row=>row.job.locations.join(", ")||"Not specified"},
  {key:"deadline",header:"Deadline",mobilePriority:"secondary",cell:row=>{
    const expired=Boolean(row.job.applicationDeadline&&row.job.applicationDeadline.getTime()<=today.getTime());
    return <span className={"inline-flex items-center gap-1 "+(expired?"text-[#fa8c16]":"text-body")}>
      <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6M17 2v6M3 10h18"/>
      </svg>
      <span className={expired?"line-through":""}>{adminDriveIstDate(row.job.applicationDeadline)}</span>
    </span>;
   }},
  {key:"posted",header:"Posted",mobilePriority:"secondary",
   cell:row=><span title={row.job.publishedAt?"Date published":"Draft: date created"}>
    {adminDriveIstDate(row.job.publishedAt??row.job.createdAt)}</span>},
  {key:"applicants",header:"Applicants",mobilePriority:"secondary",
   cell:row=><span title="All application records for this drive"
     className="tabular-nums">{row.metrics.applicants}</span>},
  {key:"actions",header:"Actions",mobilePriority:"action",
   cell:row=>{
    const base="/admin/placements/jobs/"+encodeURIComponent(row.job.id);
    const linkClass="inline-flex min-h-9 items-center font-semibold text-link underline underline-offset-4 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]";
    return <div className="flex min-w-0 flex-col items-start gap-2">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <Link href={base} className={linkClass}>Open drive</Link>
        <Link href={base+"/applications"} className={linkClass}>View applications</Link>
        <Link href={base+"/settings"} className={linkClass}>Edit drive</Link>
        <SuperAdminDriveRowStatusAction jobId={row.job.id} title={row.job.title} status={row.job.status}/>
      </div>
      <details className="min-w-0 w-full border-t border-border pt-2 text-sm">
        <summary className="inline-flex min-h-9 cursor-pointer items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          More actions · duplicate, deadline
        </summary>
        <div className="min-w-0 space-y-3 pt-3">
          <SuperAdminDriveDuplicate jobId={row.job.id} title={row.job.title}/>
          {row.job.status==="PUBLISHED"?<SuperAdminDriveDeadline
            jobId={row.job.id} deadline={row.job.applicationDeadline?.toISOString()??null}/>:null}
          <div aria-label="Delete drive"><SuperAdminDriveArchive jobId={row.job.id} title={row.job.title}/></div>
        </div>
      </details>
    </div>;
   }},
 ];
 return <div className="min-w-0 space-y-4 md:space-y-6">
  <PageHeader title="Jobs Management (LMS)"
   description="Review and manage job postings for the selected college."
   actions={<div className="flex min-w-0 flex-col items-stretch gap-[var(--lms-space-2)] sm:flex-row sm:items-center sm:justify-end">
    <PageBackLink href="/admin/placements" label="Placement overview" />
    <Link href="/admin/placements/retention" className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-[650] text-link md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Retention report</Link>
    <Link href="/admin/placements/student-lookup" className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-[650] text-link md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Look up a student&apos;s placement status →</Link>
    <Link href="/admin/placements/new"
     className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] px-4 text-sm font-[650] text-[var(--lms-on-primary)] md:min-h-9 hover:border-[var(--lms-button-primary-hover)] hover:bg-[var(--lms-button-primary-hover)] active:border-[var(--lms-button-primary-hover)] active:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Create Job</Link>
   </div>} />
  <section aria-label="Jobs Management list" className="min-w-0 space-y-3">
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
      <h2 className="m-0 text-base font-semibold text-[var(--lms-heading)]">Active drives</h2>
      <Link href="/admin/placements/drives"
        className="inline-flex min-h-9 items-center text-sm font-medium text-link underline underline-offset-4">
        All drives
      </Link>
    </div>
    <SuperAdminDriveDirectoryFilters q={parsed.data.q} status={parsed.data.status}
      pageSize={parsed.data.pageSize}/>
  </section>
  <SuperAdminBulkDriveActions drives={data.items.map(row=>({id:row.job.id,title:row.job.title,status:row.job.status,companyName:row.company.name}))} />
  <p role="status" className="text-sm text-muted-foreground">
    {data.total===0?"No drives":((data.page-1)*data.pageSize+1)+"–"+Math.min(data.total,data.page*data.pageSize)+
      " of "+data.total.toLocaleString("en-IN")} drives · {data.pageSize} per page · Page {data.page} of {data.totalPages}
    {parsed.data.q?" · Search: "+parsed.data.q:""}
  </p>
  <DataTable columns={columns} rows={data.items} getRowKey={row=>row.job.id}
    mobileMode="cards" caption="Jobs table" empty={hasFilters?
      <EmptyState title="No jobs match your filters" description="Try a different search or clear the selected filters."
        action={<Link href="/admin/placements/drives" className="inline-flex min-h-11 items-center rounded-md border border-border px-3 font-semibold text-link underline">Clear filters</Link>}/>:
      <EmptyState title="No jobs yet" description="Create your first job posting to start accepting applications."
        action={<Link href="/admin/placements/new" className="inline-flex min-h-11 items-center rounded-md bg-[var(--lms-button-primary)] px-4 font-semibold text-white">Create Job</Link>}/>
    }/>
  <div className="min-w-0 border-t border-border pt-[var(--lms-space-3)]"><Pagination page={data.page} pageCount={data.totalPages} hrefForPage={href} label="Drive list pages"/></div>

 </div>;
}
