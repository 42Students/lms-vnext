import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getPlacementTpoOperations } from "@/modules/placements/tpo-operations-service";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { SuperAdminBulkDriveActions } from "@/components/placements/super-admin-bulk-drive-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { adminDriveDirectoryHref, adminDriveDirectoryQuerySchema, adminDriveStatus, filterAdminDriveDirectory, adminDriveIstDate } from "@/modules/placements/admin-drive-directory-model";

export default async function SuperAdminDrivesPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const ctx=await getCurrentRequestContext(), raw=await searchParams;
 if(!ctx.adminScope?.collegeId)return <div className="min-w-0 space-y-4">
  <PageHeader eyebrow="Super Admin · Placements" title="All drives"/>
  <EmptyState title="Choose a college" description="Select a college in the Super Admin scope selector to manage its drives."/>
 </div>;
 requireSuperAdminSelectedCollege(ctx,"placements.manage");
 // Parse the whole query: dropping unknown keys would quietly accept
 // forged college/scope selectors and contradictory link parameters.
 const parsed=adminDriveDirectoryQuerySchema.safeParse(raw);
 if(!parsed.success)return <div className="min-w-0 space-y-4">
  <PageHeader eyebrow="Super Admin · Placements" title="All drives"/>
  <ErrorState title="Invalid drive filters" description="Choose valid filters and page number."
   action={<Link href="/admin/placements/drives" className="text-primary-text">Clear filters</Link>}/>
 </div>;
 // Keep an unavailable college reporting backend from crashing the entire
 // Super Admin drive directory; preserve the validated filter on Retry.
 const loaded=await getPlacementTpoOperations(ctx,ctx.adminScope.collegeId)
  .then(value=>({ok:true as const,value}))
  .catch(error=>({ok:false as const,denied:error instanceof AuthorizationError}));
 if(!loaded.ok)return <div className="min-w-0 space-y-4">
  <PageHeader eyebrow="Super Admin · Placements" title="All drives"/>
  <ErrorState
   title={loaded.denied?"Drive access denied":"Drives unavailable"}
   description={loaded.denied
    ?"Your account cannot manage drives in this college."
    :"This college's drives could not be loaded. Your filters were preserved."}
   action={<Link href={loaded.denied?"/dashboard":adminDriveDirectoryHref(parsed.data)}
    className="font-semibold text-primary-text underline">
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
    <p className="mt-1 text-xs text-body">{row.company.name} · {adminDriveStatus(row.job,today)}</p></>},
  {key:"type",header:"Type",mobilePriority:"secondary",cell:row=>row.job.employmentType.replaceAll("_"," ")},
  {key:"location",header:"Location",mobilePriority:"secondary",cell:row=>row.job.locations.join(", ")||"Not specified"},
  {key:"deadline",header:"Deadline",mobilePriority:"secondary",cell:row=>row.job.applicationDeadline?
   <span className={row.job.applicationDeadline<today?"line-through text-muted-foreground":""}>
    {adminDriveIstDate(row.job.applicationDeadline)}</span>:"—"},
  {key:"posted",header:"Posted",mobilePriority:"secondary",cell:row=>adminDriveIstDate(row.job.publishedAt)},
  {key:"applicants",header:"Applicants",mobilePriority:"secondary",
   cell:row=><span className="tabular-nums">{row.metrics.submittedApplications}</span>},
  {key:"actions",header:"Actions",mobilePriority:"action",
   cell:row=><Link href={"/admin/placements/jobs/"+encodeURIComponent(row.job.id)}
    className="inline-flex min-h-11 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
    Open drive →</Link>},
 ];
 return <div className="min-w-0 space-y-5">
  <PageHeader eyebrow="Super Admin · Placements" title="All drives"
   description="Review and open every persisted non-archived drive in the selected college." />
  <div className="flex flex-wrap gap-3">
   <Link href="/admin/placements" className="text-sm font-semibold text-primary-text">← Placement overview</Link>
   <Link href="/admin/placements/student-lookup" className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text">Look up a student&apos;s placement status →</Link>
    <Link href="/admin/placements/new" className="text-sm font-semibold text-primary-text">Create drive →</Link>
  </div>
  <form action="/admin/placements/drives" method="get"
   className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
   <label className="grid min-w-44 flex-1 gap-1 text-sm font-semibold text-body">Search by drive or company
    <Input type="search" maxLength={100} name="q" defaultValue={parsed.data.q}
     className="w-full"/>
   </label>
   <label className="grid gap-1 text-sm font-semibold text-body">Status
    <Select name="status" defaultValue={parsed.data.status}
     className="w-full">
     <option value="ALL">All</option><option value="DRAFT">Draft</option>
     <option value="ACTIVE">Active</option><option value="CLOSED">Closed</option>
    </Select>
   </label>
   <label className="grid gap-1 text-sm font-semibold text-body">Rows per page
    <Select name="pageSize" defaultValue={parsed.data.pageSize}
     className="w-full">
     {[10,20,50,100].map(n=><option key={n} value={n}>{n}</option>)}
    </Select>
   </label>
   <Button type="submit" >Filter</Button>
   <Link href="/admin/placements/drives" className="min-h-11 inline-flex items-center text-primary-text">Clear all</Link>
  </form>
  <SuperAdminBulkDriveActions drives={data.items.map(row=>({id:row.job.id,title:row.job.title,status:row.job.status,companyName:row.company.name}))} />
  <p role="status" className="text-sm text-muted-foreground">{data.total} matching drives · Page {data.page} of {data.totalPages}</p>
  <DataTable columns={columns} rows={data.items} getRowKey={row=>row.job.id}
    caption="All drives" empty={<EmptyState title="No drives found" description="No drives match these filters."/>}/>
  <Pagination page={data.page} pageCount={data.totalPages} hrefForPage={href} label="Drive list pages"/>

 </div>;
}
