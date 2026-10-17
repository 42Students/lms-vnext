import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getPlacementTpoOperations } from "@/modules/placements/tpo-operations-service";
import { PageHeader } from "@/components/ui/page-header";
import { SuperAdminBulkDriveActions } from "@/components/placements/super-admin-bulk-drive-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { adminDriveDirectoryHref, adminDriveDirectoryQuerySchema, adminDriveStatus, filterAdminDriveDirectory } from "@/modules/placements/admin-drive-directory-model";

export default async function SuperAdminDrivesPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const ctx=await getCurrentRequestContext(), raw=await searchParams;
 if(!ctx.adminScope?.collegeId)return <main className="space-y-4">
  <PageHeader eyebrow="Super Admin · Placements" title="All drives"/>
  <EmptyState title="Choose a college" description="Select a college in the Super Admin scope selector to manage its drives."/>
 </main>;
 const parsed=adminDriveDirectoryQuerySchema.safeParse({
  q:raw.q,status:raw.status,page:raw.page,pageSize:raw.pageSize,
 });
 if(!parsed.success)return <main className="space-y-4">
  <PageHeader eyebrow="Super Admin · Placements" title="All drives"/>
  <ErrorState title="Invalid drive filters" description="Choose valid filters and page number."
   action={<Link href="/admin/placements/drives" className="text-primary-text">Clear filters</Link>}/>
 </main>;
 const operations=await getPlacementTpoOperations(ctx,ctx.adminScope.collegeId);
 const rows=operations.jobs.map(row=>({job:row.job,company:row.job.company,metrics:row.metrics}));
 const data=filterAdminDriveDirectory(rows,parsed.data);
 const href=(page:number)=>adminDriveDirectoryHref({...parsed.data,page});
 const today=new Date();
 return <main className="space-y-5">
  <PageHeader eyebrow="Super Admin · Placements" title="All drives"
   description="Review and open every persisted non-archived drive in the selected college." />
  <div className="flex flex-wrap gap-3">
   <Link href="/admin/placements" className="text-sm font-semibold text-primary-text">← Placement overview</Link>
   <Link href="/admin/placements/student-lookup" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Look up a student&apos;s placement status →</Link>
    <Link href="/admin/placements/new" className="text-sm font-semibold text-primary-text">Create drive →</Link>
  </div>
  <form action="/admin/placements/drives" method="get"
   className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
   <label className="grid min-w-44 flex-1 gap-1 text-sm font-semibold text-body">Search by drive or company
    <input type="search" maxLength={100} name="q" defaultValue={parsed.data.q}
     className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
   </label>
   <label className="grid gap-1 text-sm font-semibold text-body">Status
    <select name="status" defaultValue={parsed.data.status}
     className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
     <option value="ALL">All</option><option value="DRAFT">Draft</option>
     <option value="ACTIVE">Active</option><option value="CLOSED">Closed</option>
    </select>
   </label>
   <label className="grid gap-1 text-sm font-semibold text-body">Rows per page
    <select name="pageSize" defaultValue={parsed.data.pageSize}
     className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
     {[10,20,50,100].map(n=><option key={n} value={n}>{n}</option>)}
    </select>
   </label>
   <button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-on-primary">Filter</button>
   <Link href="/admin/placements/drives" className="min-h-11 inline-flex items-center text-primary-text">Clear all</Link>
  </form>
  <SuperAdminBulkDriveActions drives={data.items.map(row=>({id:row.job.id,title:row.job.title,status:row.job.status,companyName:row.company.name}))} />
  <p role="status" className="text-sm text-muted-foreground">{data.total} matching drives · Page {data.page} of {data.totalPages}</p>
  {data.items.length===0?<EmptyState title="No drives found" description="No drives match these filters."/>:
   <div className="overflow-x-auto rounded-xl border border-border bg-surface">
    <table className="w-full min-w-[55rem] text-left text-sm">
     <thead><tr className="border-b border-border bg-muted">
      <th className="p-3">Job Title</th><th className="p-3">Type</th><th className="p-3">Location</th>
      <th className="p-3">Deadline</th><th className="p-3">Posted</th><th className="p-3">Applicants</th><th className="p-3">Actions</th>
     </tr></thead>
     <tbody>{data.items.map(row=><tr key={row.job.id} className="border-b border-border">
      <td className="p-3"><strong>{row.job.title}</strong>
       <p className="mt-1 text-xs">{row.company.name} · {adminDriveStatus(row.job,today)}</p></td>
      <td className="p-3">{row.job.employmentType.replaceAll("_"," ")}</td>
      <td className="p-3">{row.job.locations.join(", ")||"Not specified"}</td>
      <td className="p-3">{row.job.applicationDeadline?
       <span className={row.job.applicationDeadline<today?"line-through text-muted-foreground":""}>
        {row.job.applicationDeadline.toISOString().slice(0,10)}</span>:"—"}</td>
      <td className="p-3">{row.job.publishedAt?.toISOString().slice(0,10)??"—"}</td>
      <td className="p-3 tabular-nums">{row.metrics.submittedApplications}</td>
      <td className="p-3"><Link href={"/admin/placements/jobs/"+row.job.id}
       className="font-semibold text-primary-text">Open drive →</Link></td>
     </tr>)}</tbody>
    </table>
   </div>}
  <nav aria-label="Drive list pages" className="flex gap-4 text-sm">
   {data.page>1?<Link href={href(data.page-1)} className="font-semibold text-primary-text">Previous</Link>:null}
   {data.page<data.totalPages?<Link href={href(data.page+1)} className="font-semibold text-primary-text">Next</Link>:null}
  </nav>
 </main>;
}
