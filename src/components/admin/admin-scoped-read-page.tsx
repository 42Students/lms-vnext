import Link from "next/link";
import {AdminScopedCsvControl} from "@/components/admin/admin-scoped-csv-control";
import {superAdminScopedCsvHref} from "@/modules/admin-ui/super-admin-scoped-csv-model";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getCurrentRequestContext } from "@/auth/request-context";
import { readAdminQuery, superAdminReadHref, type SuperAdminReadResult } from "@/modules/admin-ui/super-admin-read-directory-model";
export async function AdminScopedReadPage({title,path,description,statuses,searchParams,loader,exportPath,exportFilename}:{
 title:string;path:string;description:string;
 statuses:readonly string[];
 searchParams:Promise<Record<string,string|string[]|undefined>>;
 loader:(raw:unknown)=>Promise<SuperAdminReadResult>;
 exportPath?:string;exportFilename?:string;
}) {
 const parsed=readAdminQuery(await searchParams);
 if(!parsed.success || !statuses.includes(parsed.data.status))
 return <div className="space-y-5"><PageHeader eyebrow="Super Admin" title={title}/>
  <ErrorState title="Invalid directory filters" description="Check the search, status or page."
   action={<Link href={path} className="font-semibold text-primary-text">Clear filters</Link>}/></div>;
 const context=await getCurrentRequestContext();
 if(!context.adminScope?.collegeId)return <div className="space-y-5">
  <PageHeader eyebrow="Super Admin" title={title}/>
  <EmptyState title="Select a college" description="Choose an explicit college in the Super Admin scope selector. This read-only directory does not infer another college."/>
 </div>;
 const data=await loader(parsed.data);
 return <div className="min-w-0 space-y-5">
  <PageHeader eyebrow="Super Admin · Read-only" title={title} description={description}/>
  {exportPath&&exportFilename?<AdminScopedCsvControl href={superAdminScopedCsvHref(exportPath,data.query)} filename={exportFilename}/>:null}
  <form method="get" className="grid min-w-0 gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
   {data.query.jobId ? <input type="hidden" name="jobId" value={data.query.jobId} /> : null}
   <label className="grid min-w-0 gap-1 text-sm font-semibold text-body">Search
    <input type="search" name="q" maxLength={100} defaultValue={data.query.q}
     className="min-h-11 min-w-0 w-full rounded-md border border-border bg-surface px-3 text-foreground"/>
   </label>
   <label className="grid gap-1 text-sm font-semibold text-body">Status
    <select name="status" defaultValue={data.query.status}
     className="min-h-11 min-w-0 rounded-md border border-border bg-surface px-3 text-foreground">
     {statuses.map(status=><option key={status} value={status}>{status}</option>)}
    </select>
   </label>
   <button type="submit" className="min-h-11 self-end rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Filter</button>
  </form>
  <form method="get" action={path} aria-label="Refresh directory">
    {data.query.q ? <input type="hidden" name="q" value={data.query.q} /> : null}
    <input type="hidden" name="status" value={data.query.status} />
    {data.query.jobId ? <input type="hidden" name="jobId" value={data.query.jobId} /> : null}
    <input type="hidden" name="page" value={String(data.query.page)} />
    <button type="submit" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Refresh</button>
  </form>
  <p role="status" aria-live="polite" className="text-xs text-muted-foreground">{data.total} matching records · page {data.query.page} of {data.totalPages} · 25 per page</p>
  {data.items.length?<div className="grid min-w-0 gap-3 md:grid-cols-2">
   {data.items.map(row=><article key={row.id} className="min-w-0 space-y-2 rounded-xl border border-border bg-surface p-4">
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
     <h2 className="m-0 min-w-0 break-words text-base font-semibold text-foreground">{row.title}</h2>
     <StatusBadge tone={row.status==="ACTIVE"?"success":"neutral"}>{row.status}</StatusBadge>
    </div>
    <p className="break-words text-sm text-body">{row.subtitle}</p>
    {row.details.map((value,index)=><p key={index} className="break-words text-xs text-muted-foreground">{value}</p>)}
    {row.href?<Link href={row.href} className="inline-flex min-h-10 items-center font-semibold text-primary-text">Open details →</Link>:null}
   </article>)}
  </div>:<EmptyState title="No matching records" description="No persisted data matches the selected college and filters."/>}
  <nav aria-label={title+" pages"} className="flex flex-wrap items-center justify-between gap-3 text-sm">
   <span className="text-muted-foreground">Page {data.query.page} of {data.totalPages}</span>
   <div className="flex flex-wrap gap-3">
    {data.query.page>1?<Link href={superAdminReadHref(path,{...data.query,page:data.query.page-1})} className="font-semibold text-primary-text">Previous</Link>:null}
    {data.query.page<data.totalPages?<Link href={superAdminReadHref(path,{...data.query,page:data.query.page+1})} className="font-semibold text-primary-text">Next</Link>:null}
   </div>
  </nav>
 </div>;
}
