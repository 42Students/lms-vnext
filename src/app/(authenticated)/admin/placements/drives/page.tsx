import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getPlacementTpoOperations } from "@/modules/placements/tpo-operations-service";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { SuperAdminBulkDriveActions } from "@/components/placements/super-admin-bulk-drive-actions";
import { SuperAdminDriveArchive } from "@/components/placements/super-admin-drive-archive";
import { SuperAdminDriveDuplicate } from "@/components/placements/super-admin-drive-duplicate";
import { SuperAdminDriveDeadline } from "@/components/placements/super-admin-drive-deadline";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { adminDriveDirectoryHref, adminDriveDirectoryQuerySchema, adminDriveStatus, filterAdminDriveDirectory, adminDriveIstDate } from "@/modules/placements/admin-drive-directory-model";

export default async function SuperAdminDrivesPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const ctx=await getCurrentRequestContext(), raw=await searchParams;
 if(!ctx.adminScope?.collegeId)return <div className="min-w-0 space-y-4">
  <PageHeader title="Drives"/>
  <EmptyState title="Choose a college" description="Select a college in the Super Admin scope selector to manage its drives."/>
 </div>;
 requireSuperAdminSelectedCollege(ctx,"placements.manage");
 // Parse the whole query: dropping unknown keys would quietly accept
 // forged college/scope selectors and contradictory link parameters.
 const parsed=adminDriveDirectoryQuerySchema.safeParse(raw);
 if(!parsed.success)return <div className="min-w-0 space-y-4">
  <PageHeader title="Drives"/>
  <ErrorState title="Invalid drive filters" description="Choose valid filters and page number."
   action={<Link href="/admin/placements/drives" className="inline-flex items-center min-h-11 md:min-h-9 font-[650] text-link underline hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] underline-offset-4 w-full md:w-auto justify-center rounded-[var(--lms-control-radius)] px-4">Clear filters</Link>}/>
 </div>;
 // Keep an unavailable college reporting backend from crashing the entire
 // Super Admin drive directory; preserve the validated filter on Retry.
 const loaded=await getPlacementTpoOperations(ctx,ctx.adminScope.collegeId)
  .then(value=>({ok:true as const,value}))
  .catch(error=>({ok:false as const,denied:error instanceof AuthorizationError}));
 if(!loaded.ok)return <div className="min-w-0 space-y-4">
  <PageHeader title="Drives"/>
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
 const operations=loaded.value;
 const rows=operations.jobs.map(row=>({job:row.job,company:row.job.company,metrics:row.metrics}));
 const data=filterAdminDriveDirectory(rows,parsed.data);
 const href=(page:number)=>adminDriveDirectoryHref({...parsed.data,page});
 const today=new Date();
 const columns:DataTableColumn<(typeof data.items)[number]>[]=[
  {key:"job",header:"Job Title",mobileLabel:"Job Title",mobilePriority:"primary",
   cell:row=><><strong className="break-words">{row.job.title}</strong>
    <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2"><span className="text-xs text-body">{row.company.name}</span><StatusBadge tone={row.job.status==="PUBLISHED"?"success":row.job.status==="DRAFT"?"info":"neutral"}>{adminDriveStatus(row.job,today)}</StatusBadge></div></>},
  {key:"type",header:"Type",mobilePriority:"secondary",cell:row=>row.job.employmentType.replaceAll("_"," ")},
  {key:"location",header:"Location",mobilePriority:"secondary",cell:row=>row.job.locations.join(", ")||"Not specified"},
  {key:"deadline",header:"Deadline",mobilePriority:"secondary",cell:row=>row.job.applicationDeadline?
   <span className={row.job.applicationDeadline<today?"line-through text-muted-foreground":""}>
    {adminDriveIstDate(row.job.applicationDeadline)}</span>:"—"},
  {key:"posted",header:"Posted",mobilePriority:"secondary",cell:row=>adminDriveIstDate(row.job.publishedAt)},
  {key:"applicants",header:"Submitted",mobilePriority:"secondary",
   cell:row=><span title="Submitted applications only; this is not a count of all applicant statuses."
     className="tabular-nums">{row.metrics.submittedApplications}</span>},
  {key:"actions",header:"Actions",mobilePriority:"action",
   cell:row=>{
    const base="/admin/placements/jobs/"+encodeURIComponent(row.job.id);
    const linkClass="inline-flex min-h-9 items-center font-semibold text-link underline underline-offset-4 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]";
    return <div className="flex min-w-0 flex-col items-start gap-2">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <Link href={base} className={linkClass}>Open drive</Link>
        <Link href={base+"/applications"} className={linkClass}>View applications</Link>
        <Link href={base+"/settings"} className={linkClass}>Edit / status</Link>
      </div>
      <details className="min-w-0 w-full border-t border-border pt-2 text-sm">
        <summary className="inline-flex min-h-9 cursor-pointer items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          More actions · duplicate, deadline, delete
        </summary>
        <div className="min-w-0 space-y-3 pt-3">
          <SuperAdminDriveDuplicate jobId={row.job.id} title={row.job.title}/>
          {row.job.status==="PUBLISHED"?<SuperAdminDriveDeadline
            jobId={row.job.id} deadline={row.job.applicationDeadline?.toISOString()??null}/>:null}
          <SuperAdminDriveArchive jobId={row.job.id} title={row.job.title}/>
        </div>
      </details>
    </div>;
   }},
 ];
 return <div className="min-w-0 space-y-4 md:space-y-6">
  <PageHeader title="Drives"
   description="Review and open every persisted non-archived drive in the selected college."
   actions={<div className="flex min-w-0 flex-col items-stretch gap-[var(--lms-space-2)] sm:flex-row sm:items-center sm:justify-end">
    <PageBackLink href="/admin/placements" label="Placement overview" />
    <Link href="/admin/placements/retention" className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-[650] text-link md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Retention report</Link>
    <Link href="/admin/placements/student-lookup" className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-[650] text-link md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Look up a student&apos;s placement status →</Link>
    <Link href="/admin/placements/new"
     className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] px-4 text-sm font-[650] text-[var(--lms-on-primary)] md:min-h-9 hover:border-[var(--lms-button-primary-hover)] hover:bg-[var(--lms-button-primary-hover)] active:border-[var(--lms-button-primary-hover)] active:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Create drive →</Link>
   </div>} />
  <form action="/admin/placements/drives" method="get" aria-label="Filter placement drives"
   className="grid min-w-0 grid-cols-1 items-end gap-[8px] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,13rem)_minmax(0,13rem)_auto_auto]">
   <label className="grid w-full min-w-0 flex-1 gap-[var(--lms-space-2)] md:w-auto md:min-w-44 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search by drive or company
    <Input type="search" maxLength={100} name="q" defaultValue={parsed.data.q}
     className="min-h-11 w-full md:min-h-9"/>
   </label>
   <label className="grid w-full min-w-0 flex-1 gap-[var(--lms-space-2)] md:w-auto md:min-w-36 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Status
    <Select name="status" defaultValue={parsed.data.status}
     className="min-h-11 w-full md:min-h-9">
     <option value="ALL">All</option><option value="DRAFT">Draft</option>
     <option value="ACTIVE">Active</option><option value="CLOSED">Closed</option>
    </Select>
   </label>
   <label className="grid w-full min-w-0 flex-1 gap-[var(--lms-space-2)] md:w-auto md:min-w-36 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Rows per page
    <Select name="pageSize" defaultValue={parsed.data.pageSize}
     className="min-h-11 w-full md:min-h-9">
     {[10,20,50,100].map(n=><option key={n} value={n}>{n}</option>)}
    </Select>
   </label>
   <Button type="submit" className="min-h-11 w-full sm:col-span-2 lg:col-span-1 lg:min-h-9 lg:w-auto">Filter</Button>
   <Link href="/admin/placements/drives" className="inline-flex min-h-11 items-center text-link underline md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] underline-offset-4">Clear all</Link>
  </form>
  <SuperAdminBulkDriveActions drives={data.items.map(row=>({id:row.job.id,title:row.job.title,status:row.job.status,companyName:row.company.name}))} />
  <p role="status" className="text-sm text-muted-foreground">{data.total.toLocaleString("en-IN")} matching drives · Page {data.page} of {data.totalPages}</p>
  <DataTable columns={columns} rows={data.items} getRowKey={row=>row.job.id}
    caption="All drives" empty={<EmptyState title="No drives found" description="No drives match these filters."/>}/>
  <div className="min-w-0 border-t border-border pt-[var(--lms-space-3)]"><Pagination page={data.page} pageCount={data.totalPages} hrefForPage={href} label="Drive list pages"/></div>

 </div>;
}
