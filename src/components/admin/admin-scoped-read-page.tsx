import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import {isSuperAdmin} from "@/modules/identity/context";
import { readAdminQuery, superAdminReadHref, type SuperAdminReadResult, type SuperAdminReadRow } from "@/modules/admin-ui/super-admin-read-directory-model";
export async function AdminScopedReadPage({title,path,description,statuses,searchParams,loader,exportPath,exportFilename,renderRowActions,renderBulkActions,peopleFilters,classOptions,applicationFilters,headingMode="page"}:{
 title:string;path:string;description:string;headingMode?:"page"|"section";
 statuses:readonly string[];
 searchParams:Promise<Record<string,string|string[]|undefined>>;
 loader:(raw:unknown)=>Promise<SuperAdminReadResult>;
 exportPath?:string;exportFilename?:string;renderRowActions?:(row:SuperAdminReadRow)=>ReactNode;
 renderBulkActions?:(rows:readonly SuperAdminReadRow[])=>ReactNode;
 classOptions?:readonly {id:string;name:string}[];
 applicationFilters?:{jobs:readonly {id:string;name:string}[];departments:readonly {id:string;name:string}[];programs:readonly {id:string;name:string}[];batches:readonly {id:string;name:string}[]};
 peopleFilters?:{kind:"FACULTY"|"LEARNER";departments:readonly {id:string;name:string}[];programs:readonly {id:string;name:string}[];batches:readonly {id:string;name:string}[];classes:readonly {id:string;name:string}[]};
}) {
 // Student registration owns the page h1; the directory then has a section
 // heading. Other callers retain the original PageHeader by default.
 const heading=(eyebrow:string,detail?:string)=>headingMode==="section"
  ? <div><h2 className="m-0 text-lg font-semibold text-[var(--lms-heading)]">{title}</h2>
     {detail?<p className="mt-1 text-sm text-body">{detail}</p>:null}</div>
  : <PageHeader eyebrow={eyebrow} title={title} description={detail}/>;
 const parsed=readAdminQuery(await searchParams);
 if(!parsed.success || !statuses.includes(parsed.data.status))
 return <div className="space-y-5">{heading("Super Admin")}
  <ErrorState title="Invalid directory filters" description="Check the search, status or page."
   action={<Link href={path} className="font-semibold text-primary-text">Clear filters</Link>}/></div>;
 const context=await getCurrentRequestContext();
 if(!isSuperAdmin(context))return <div className="space-y-5">
  {heading("Super Admin")}
  <ErrorState title="Directory access denied"
   description="Your account cannot access Super Admin directory records."
   action={<Link href="/dashboard" className="font-semibold text-primary-text underline">Back to dashboard</Link>}/>
 </div>;
 if(!context.adminScope?.collegeId)return <div className="space-y-5">
  {heading("Super Admin")}
  <EmptyState title="Select a college to continue" description={"Choose a college in the header above to see its "+(title==="Faculty"?"faculty":title==="Students"?"students":title==="Faculty Assignment"?"faculty assignments":"people directory")+"."}/>
 </div>;
 const directory=await loader(parsed.data)
  .then(value=>({ok:true as const,value}))
  .catch(()=>({ok:false as const}));
 if(!directory.ok)return <div className="space-y-5">
  {heading("Super Admin")}
  <ErrorState title="Directory unavailable"
   description="The selected college's directory could not be loaded. Your filters have not changed."
   action={<Link href={superAdminReadHref(path,parsed.data)}
    className="font-semibold text-primary-text underline">Retry loading directory</Link>}/>
 </div>;
 const data=directory.value;
 const summaries=peopleFilters?await Promise.allSettled([
  loader({...parsed.data,status:"ALL",page:1}),
  loader({...parsed.data,status:"ACTIVE",page:1}),
  loader({...parsed.data,status:"SUSPENDED",page:1}),
 ]):null;
 const peopleSummary=summaries&&summaries[0].status==="fulfilled"&&
  summaries[1].status==="fulfilled"&&summaries[2].status==="fulfilled"
  ?[summaries[0].value,summaries[1].value,summaries[2].value]:null;
 return <div className="min-w-0 space-y-5">
  {heading(peopleFilters?"People":"Super Admin · Read-only",description)}
  {peopleFilters&&!peopleSummary?<p role="status" className="border-l-2 border-warning bg-warning-subtle px-4 py-3 text-sm text-body">
   Directory totals are temporarily unavailable. The filtered records below remain visible.
  </p>:null}
  {peopleSummary?<section aria-label={title+" overview"} className="grid divide-y divide-border border-y border-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
   {[
    {label:peopleFilters?.kind==="FACULTY"?"Faculty":"Students",value:peopleSummary[0].total},
    {label:"Active",value:peopleSummary[1].total},
    {label:"Suspended",value:peopleSummary[2].total},
    {label:"Visible now",value:data.items.length},
   ].map(stat=><article key={stat.label} className="p-4">
    <p className="text-xs font-semibold text-muted-foreground">{stat.label}</p>
    <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{stat.value}</p>
   </article>)}
  </section>:null}
  {applicationFilters?<p role="status" className="text-sm text-muted-foreground">Filters apply within your selected college. {data.total} matching applications; showing page {data.query.page}.</p>:null}
  {renderBulkActions?renderBulkActions(data.items):null}
  {exportPath&&exportFilename?<AdminScopedCsvControl href={superAdminScopedCsvHref(exportPath,data.query)} filename={exportFilename}/>:null}
  <form method="get" className="grid min-w-0 grid-cols-1 gap-3 border-b border-border pb-5 sm:grid-cols-2 lg:grid-cols-4">
   {!applicationFilters&&data.query.jobId ? <Input type="hidden" name="jobId" value={data.query.jobId} /> : null}
   <label className="grid min-w-0 gap-1 text-sm font-semibold text-body">Search
    <AdminScopedLiveSearch initial={data.query.q} path={path}/>
   </label>
   <label className="grid gap-1 text-sm font-semibold text-body">Status
    <Select name="status" defaultValue={data.query.status}
     className="w-full">
     {statuses.map(status=><option key={status} value={status}>{status}</option>)}
    </Select>
   </label>
   {applicationFilters?<>
    {(["jobId","departmentId","programId","cohortId"] as const).map(key=>{
      const rows=key==="jobId"?applicationFilters.jobs:key==="departmentId"?applicationFilters.departments:key==="programId"?applicationFilters.programs:applicationFilters.batches;
      const label=key==="jobId"?"Job":key==="departmentId"?"Department":key==="programId"?"Program":"Batch";
      return <label key={key} className="grid gap-1 text-sm font-semibold text-body">{label}
        <Select name={key} defaultValue={data.query[key]??""} className="w-full">
          <option value="">All {label.toLowerCase()}s</option>{rows.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
        </Select>
      </label>;
    })}
    <label className="grid gap-1 text-sm font-semibold text-body">Source
      <Select name="source" defaultValue={data.query.source} className="w-full">
        <option value="ALL">All sources</option><option value="INTERNAL">Internal</option><option value="EXTERNAL">External</option>
      </Select>
    </label>
    <label className="grid gap-1 text-sm font-semibold text-body">Channel
      <Select name="channel" defaultValue={data.query.channel} className="w-full">
        <option value="ALL">All sources</option><option value="INTERNAL">Internal</option><option value="EXTERNAL">External</option>
      </Select>
    </label>
    <label className="grid gap-1 text-sm font-semibold text-body">Hiring stage
     <Select name="pipelineStage" defaultValue={data.query.pipelineStage} className="w-full">
       {["ALL","APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW","WAITLISTED","OFFERED","HIRED","REJECTED"].map(stage=><option value={stage} key={stage}>{stage==="ALL"?"All hiring stages":stage}</option>)}
     </Select>
    </label>
   </>:null}
   {peopleFilters ? <>
    <label className="grid gap-1 text-sm font-semibold text-body">Department
     <Select name="departmentId" defaultValue={data.query.departmentId??""} className="w-full">
      <option value="">All departments</option>{peopleFilters.departments.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
     </Select>
    </label>
    {peopleFilters.kind==="FACULTY"?<label className="grid gap-1 text-sm font-semibold text-body">Faculty type
      <Input name="employmentType" defaultValue={data.query.employmentType??""} placeholder="Professor, Mentor…" maxLength={128}
       className="w-full"/>
     </label>:<>
      {(["programId","cohortId","sectionId"] as const).map((key)=>{
        const values=key==="programId"?peopleFilters.programs:key==="cohortId"?peopleFilters.batches:peopleFilters.classes;
        const label=key==="programId"?"Program":key==="cohortId"?"Batch":"Class";
        return <label key={key} className="grid gap-1 text-sm font-semibold text-body">{label}
         <Select name={key} defaultValue={data.query[key]??""} className="w-full">
          <option value="">All {label.toLowerCase()}s</option>{values.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
         </Select>
        </label>;
      })}
     </>}
   </>:null}
   {classOptions?<label className="grid gap-1 text-sm font-semibold text-body">Class
     <Select name="sectionId" defaultValue={data.query.sectionId??""}
      className="w-full">
      <option value="">All classes</option>
      {classOptions.map(cls=><option key={cls.id} value={cls.id}>{cls.name}</option>)}
     </Select></label>:null}
   <label className="grid gap-1 text-sm font-semibold text-body">Rows per page
    <Select name="pageSize" defaultValue={data.query.pageSize}
     className="w-full">
     {[10,25,50,100].map(size=><option value={size} key={size}>{size}</option>)}
    </Select>
   </label>
   <Button type="submit" variant="primary" className="self-end">Filter</Button>
  </form>
  <form method="get" action={path} aria-label="Refresh directory">
    {data.query.q ? <Input type="hidden" name="q" value={data.query.q} /> : null}
    <Input type="hidden" name="status" value={data.query.status} />
    {!applicationFilters&&data.query.jobId ? <Input type="hidden" name="jobId" value={data.query.jobId} /> : null}
    {data.query.pipelineStage!=="ALL"?<Input type="hidden" name="pipelineStage" value={data.query.pipelineStage}/>:null}
    {data.query.channel!=="ALL"?<Input type="hidden" name="channel" value={data.query.channel}/>:null}
    {data.query.source!=="ALL"?<Input type="hidden" name="source" value={data.query.source}/>:null}
    {(["departmentId","programId","cohortId","sectionId","employmentType"] as const).map(key=>data.query[key]?<Input key={key} type="hidden" name={key} value={data.query[key]}/>:null)}
    <Input type="hidden" name="page" value={String(data.query.page)} />
    <Input type="hidden" name="pageSize" value={String(data.query.pageSize)} />
    <Button type="submit" variant="secondary" className="self-end">Refresh</Button>
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
  {data.items.length?<div className="min-w-0 divide-y divide-border border-y border-border">
   {data.items.map(row=><article key={row.id} className="min-w-0 space-y-2 py-4">
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
     <h2 className="m-0 min-w-0 break-words text-base font-semibold text-foreground">{row.title}</h2>
     <StatusBadge tone={row.status==="ACTIVE"?"success":"neutral"}>{row.status}</StatusBadge>
    </div>
    <p className="break-words text-sm text-body">{row.subtitle}</p>
    {row.details.map((value,index)=><p key={index} className="break-words text-xs text-muted-foreground">{value}</p>)}
    {renderRowActions?<div className="border-t border-border pt-3">{renderRowActions(row)}</div>:null}
    {row.href?<Link href={row.href} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline sm:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">Open details →</Link>:null}
    {row.secondaryHref?<Link href={row.secondaryHref} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline sm:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">{row.secondaryLabel??"Manage →"}</Link>:null}
   </article>)}
  </div>:<EmptyState title="No matching records" description="No persisted data matches the selected college and filters."/>}
  <Link href={path+(data.query.jobId?"?jobId="+encodeURIComponent(data.query.jobId):"")}
    className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline sm:min-h-9">Clear search</Link>
  <nav aria-label={title+" pages"} className="flex flex-wrap items-center justify-between gap-3 text-sm">
   <span className="text-muted-foreground">Page {data.query.page} of {data.totalPages}</span>
   <div className="flex flex-wrap gap-3">
    {data.query.page>1?<Link href={superAdminReadHref(path,{...data.query,page:data.query.page-1})} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline sm:min-h-9">Previous</Link>:null}
    {data.query.page<data.totalPages?<Link href={superAdminReadHref(path,{...data.query,page:data.query.page+1})} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline sm:min-h-9">Next</Link>:null}
   </div>
  </nav>
 </div>;
}
