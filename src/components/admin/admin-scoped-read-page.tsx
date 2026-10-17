import Link from "next/link";
import type { ReactNode } from "react";
import {AdminScopedCsvControl} from "@/components/admin/admin-scoped-csv-control";
import {AdminScopedLiveSearch} from "@/components/admin/admin-scoped-live-search";
import {superAdminScopedCsvHref} from "@/modules/admin-ui/super-admin-scoped-csv-model";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getCurrentRequestContext } from "@/auth/request-context";
import { readAdminQuery, superAdminReadHref, type SuperAdminReadResult, type SuperAdminReadRow } from "@/modules/admin-ui/super-admin-read-directory-model";
export async function AdminScopedReadPage({title,path,description,statuses,searchParams,loader,exportPath,exportFilename,renderRowActions,renderBulkActions,peopleFilters,classOptions,applicationFilters}:{
 title:string;path:string;description:string;
 statuses:readonly string[];
 searchParams:Promise<Record<string,string|string[]|undefined>>;
 loader:(raw:unknown)=>Promise<SuperAdminReadResult>;
 exportPath?:string;exportFilename?:string;renderRowActions?:(row:SuperAdminReadRow)=>ReactNode;
 renderBulkActions?:(rows:readonly SuperAdminReadRow[])=>ReactNode;
 classOptions?:readonly {id:string;name:string}[];
 applicationFilters?:{jobs:readonly {id:string;name:string}[];departments:readonly {id:string;name:string}[];programs:readonly {id:string;name:string}[];batches:readonly {id:string;name:string}[]};
 peopleFilters?:{kind:"FACULTY"|"LEARNER";departments:readonly {id:string;name:string}[];programs:readonly {id:string;name:string}[];batches:readonly {id:string;name:string}[];classes:readonly {id:string;name:string}[]};
}) {
 const parsed=readAdminQuery(await searchParams);
 if(!parsed.success || !statuses.includes(parsed.data.status))
 return <div className="space-y-5"><PageHeader eyebrow="Super Admin" title={title}/>
  <ErrorState title="Invalid directory filters" description="Check the search, status or page."
   action={<Link href={path} className="font-semibold text-primary-text">Clear filters</Link>}/></div>;
 const context=await getCurrentRequestContext();
 if(!context.adminScope?.collegeId)return <div className="space-y-5">
  <PageHeader eyebrow="Super Admin" title={title}/>
  <EmptyState title="Select a college to continue" description={"Choose a college in the header above to see its "+(title==="Faculty"?"faculty":title==="Students"?"students":title==="Faculty Assignment"?"faculty assignments":"people directory")+"."}/>
 </div>;
 const data=await loader(parsed.data);
 return <div className="min-w-0 space-y-5">
  <PageHeader eyebrow="Super Admin · Read-only" title={title} description={description}/>
  {applicationFilters?<p role="status" className="text-sm text-muted-foreground">Filters apply within your selected college. {data.total} matching applications; showing page {data.query.page}.</p>:null}
  {renderBulkActions?renderBulkActions(data.items):null}
  {exportPath&&exportFilename?<AdminScopedCsvControl href={superAdminScopedCsvHref(exportPath,data.query)} filename={exportFilename}/>:null}
  <form method="get" className="grid min-w-0 gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
   {!applicationFilters&&data.query.jobId ? <input type="hidden" name="jobId" value={data.query.jobId} /> : null}
   <label className="grid min-w-0 gap-1 text-sm font-semibold text-body">Search
    <AdminScopedLiveSearch initial={data.query.q} path={path}/>
   </label>
   <label className="grid gap-1 text-sm font-semibold text-body">Status
    <select name="status" defaultValue={data.query.status}
     className="min-h-11 min-w-0 rounded-md border border-border bg-surface px-3 text-foreground">
     {statuses.map(status=><option key={status} value={status}>{status}</option>)}
    </select>
   </label>
   {applicationFilters?<>
    {(["jobId","departmentId","programId","cohortId"] as const).map(key=>{
      const rows=key==="jobId"?applicationFilters.jobs:key==="departmentId"?applicationFilters.departments:key==="programId"?applicationFilters.programs:applicationFilters.batches;
      const label=key==="jobId"?"Job":key==="departmentId"?"Department":key==="programId"?"Program":"Batch";
      return <label key={key} className="grid gap-1 text-sm font-semibold text-body">{label}
        <select name={key} defaultValue={data.query[key]??""} className="min-h-11 min-w-0 rounded-md border border-border bg-surface px-3 text-foreground">
          <option value="">All {label.toLowerCase()}s</option>{rows.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>;
    })}
    <label className="grid gap-1 text-sm font-semibold text-body">Source
      <select name="source" defaultValue={data.query.source} className="min-h-11 min-w-0 rounded-md border border-border bg-surface px-3 text-foreground">
        <option value="ALL">All sources</option><option value="INTERNAL">Internal</option><option value="EXTERNAL">External</option>
      </select>
    </label>
    <label className="grid gap-1 text-sm font-semibold text-body">Source
      <select name="channel" defaultValue={data.query.channel} className="min-h-11 min-w-0 rounded-md border border-border bg-surface px-3 text-foreground">
        <option value="ALL">All sources</option><option value="INTERNAL">Internal</option><option value="EXTERNAL">External</option>
      </select>
    </label>
    <label className="grid gap-1 text-sm font-semibold text-body">Source
     <select name="source" defaultValue={data.query.source} className="min-h-11 min-w-0 rounded-md border border-border bg-surface px-3 text-foreground">
       {["ALL","INTERNAL","EXTERNAL"].map(s=><option value={s} key={s}>{s==="ALL"?"All sources":s}</option>)}
     </select>
    </label>
    <label className="grid gap-1 text-sm font-semibold text-body">Hiring stage
     <select name="pipelineStage" defaultValue={data.query.pipelineStage} className="min-h-11 min-w-0 rounded-md border border-border bg-surface px-3 text-foreground">
       {["ALL","APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW","WAITLISTED","OFFERED","HIRED","REJECTED"].map(stage=><option value={stage} key={stage}>{stage==="ALL"?"All hiring stages":stage}</option>)}
     </select>
    </label>
   </>:null}
   {peopleFilters ? <>
    <label className="grid gap-1 text-sm font-semibold text-body">Department
     <select name="departmentId" defaultValue={data.query.departmentId??""} className="min-h-11 min-w-0 rounded-md border border-border bg-surface px-3 text-foreground">
      <option value="">All departments</option>{peopleFilters.departments.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
     </select>
    </label>
    {peopleFilters.kind==="FACULTY"?<label className="grid gap-1 text-sm font-semibold text-body">Faculty type
      <input name="employmentType" defaultValue={data.query.employmentType??""} placeholder="Professor, Mentor…" maxLength={128}
       className="min-h-11 min-w-0 rounded-md border border-border bg-surface px-3 text-foreground"/>
     </label>:<>
      {(["programId","cohortId","sectionId"] as const).map((key)=>{
        const values=key==="programId"?peopleFilters.programs:key==="cohortId"?peopleFilters.batches:peopleFilters.classes;
        const label=key==="programId"?"Program":key==="cohortId"?"Batch":"Class";
        return <label key={key} className="grid gap-1 text-sm font-semibold text-body">{label}
         <select name={key} defaultValue={data.query[key]??""} className="min-h-11 min-w-0 rounded-md border border-border bg-surface px-3 text-foreground">
          <option value="">All {label.toLowerCase()}s</option>{values.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
         </select>
        </label>;
      })}
     </>}
   </>:null}
   {classOptions?<label className="grid gap-1 text-sm font-semibold text-body">Class
     <select name="sectionId" defaultValue={data.query.sectionId??""}
      className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
      <option value="">All classes</option>
      {classOptions.map(cls=><option key={cls.id} value={cls.id}>{cls.name}</option>)}
     </select></label>:null}
   <label className="grid gap-1 text-sm font-semibold text-body">Rows per page
    <select name="pageSize" defaultValue={data.query.pageSize}
     className="min-h-11 min-w-0 rounded-md border border-border bg-surface px-3 text-foreground">
     {[10,25,50,100].map(size=><option value={size} key={size}>{size}</option>)}
    </select>
   </label>
   <button type="submit" className="min-h-11 self-end rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Filter</button>
  </form>
  <form method="get" action={path} aria-label="Refresh directory">
    {data.query.q ? <input type="hidden" name="q" value={data.query.q} /> : null}
    <input type="hidden" name="status" value={data.query.status} />
    {!applicationFilters&&data.query.jobId ? <input type="hidden" name="jobId" value={data.query.jobId} /> : null}
    {data.query.pipelineStage!=="ALL"?<input type="hidden" name="pipelineStage" value={data.query.pipelineStage}/>:null}
    {data.query.source!=="ALL"?<input type="hidden" name="source" value={data.query.source}/>:null}
    {data.query.channel!=="ALL"?<input type="hidden" name="channel" value={data.query.channel}/>:null}
    {data.query.source!=="ALL"?<input type="hidden" name="source" value={data.query.source}/>:null}
    {(["departmentId","programId","cohortId","sectionId","employmentType"] as const).map(key=>data.query[key]?<input key={key} type="hidden" name={key} value={data.query[key]}/>:null)}
    <input type="hidden" name="page" value={String(data.query.page)} />
    <input type="hidden" name="pageSize" value={String(data.query.pageSize)} />
    <button type="submit" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Refresh</button>
  </form>
  {applicationFilters?<p role="status" className="text-sm text-body">
    {data.query.jobId||data.query.departmentId||data.query.programId||data.query.cohortId||data.query.channel!=="ALL"||data.query.pipelineStage!=="ALL"
    ? "Active filters: "+[
       data.query.jobId?"Job":null,data.query.departmentId?"Department":null,
       data.query.programId?"Program":null,data.query.cohortId?"Batch":null,
       data.query.channel!=="ALL"?data.query.channel:null,
       data.query.pipelineStage!=="ALL"?data.query.pipelineStage:null,
      ].filter(Boolean).join(" · ")
    : "Showing all application sources and stages for the selected college."}
  </p>:null}
  <p role="status" aria-live="polite" className="text-xs text-muted-foreground">{data.total} matching records · page {data.query.page} of {data.totalPages} · {data.query.pageSize} per page</p>
  {data.items.length?<div className="grid min-w-0 gap-3 md:grid-cols-2">
   {data.items.map(row=><article key={row.id} className="min-w-0 space-y-2 rounded-xl border border-border bg-surface p-4">
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
     <h2 className="m-0 min-w-0 break-words text-base font-semibold text-foreground">{row.title}</h2>
     <StatusBadge tone={row.status==="ACTIVE"?"success":"neutral"}>{row.status}</StatusBadge>
    </div>
    <p className="break-words text-sm text-body">{row.subtitle}</p>
    {row.details.map((value,index)=><p key={index} className="break-words text-xs text-muted-foreground">{value}</p>)}
    {renderRowActions?<div className="border-t border-border pt-3">{renderRowActions(row)}</div>:null}
    {row.href?<Link href={row.href} className="inline-flex min-h-10 items-center font-semibold text-primary-text">Open details →</Link>:null}
    {row.secondaryHref?<Link href={row.secondaryHref} className="inline-flex min-h-10 items-center font-semibold text-primary-text underline">{row.secondaryLabel??"Manage →"}</Link>:null}
   </article>)}
  </div>:<EmptyState title="No matching records" description="No persisted data matches the selected college and filters."/>}
  <Link href={path+(data.query.jobId?"?jobId="+encodeURIComponent(data.query.jobId):"")}
    className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text">Clear search</Link>
  <nav aria-label={title+" pages"} className="flex flex-wrap items-center justify-between gap-3 text-sm">
   <span className="text-muted-foreground">Page {data.query.page} of {data.totalPages}</span>
   <div className="flex flex-wrap gap-3">
    {data.query.page>1?<Link href={superAdminReadHref(path,{...data.query,page:data.query.page-1})} className="font-semibold text-primary-text">Previous</Link>:null}
    {data.query.page<data.totalPages?<Link href={superAdminReadHref(path,{...data.query,page:data.query.page+1})} className="font-semibold text-primary-text">Next</Link>:null}
   </div>
  </nav>
 </div>;
}
