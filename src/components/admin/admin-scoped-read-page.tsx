import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import Link from "next/link";
import type { ReactNode } from "react";
import {AdminScopedCsvControl} from "@/components/admin/admin-scoped-csv-control";
import {AdminScopedLiveSearch} from "@/components/admin/admin-scoped-live-search";
import {superAdminScopedCsvHref} from "@/modules/admin-ui/super-admin-scoped-csv-model";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { PageBackLink } from "@/components/ui/page-back-link";
import { StatusBadge } from "@/components/ui/status-badge";
import { getCurrentRequestContext } from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import { readAdminQuery, superAdminReadHref, type SuperAdminReadResult, type SuperAdminReadRow } from "@/modules/admin-ui/super-admin-read-directory-model";
export async function AdminScopedReadPage({title,path,description,statuses,searchParams,loader,exportPath,exportFilename,renderRowActions,renderBulkActions,peopleFilters,classOptions,applicationFilters,headingMode="page",backHref,headerActions,intro,compactReadLayout=false}:{
 title:string;path:string;description:string;headingMode?:"page"|"section";backHref?:string;headerActions?:ReactNode;intro?:ReactNode;compactReadLayout?:boolean;
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
 const heading=(eyebrow:string,detail?:string,exportAction?:ReactNode)=>headingMode==="section"
  ? <div><h2 className="m-0 font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">{title}</h2>
     {detail?<p className="mt-1 text-sm text-body leading-[22px]">{detail}</p>:null}</div>
  : compactReadLayout
    ? <div className="min-w-0 space-y-2">
       {backHref?<PageBackLink href={backHref} label="Placement overview" />:null}
       <PageHeader title={title}/>
       <p className="max-w-3xl text-sm text-body leading-[22px]">{detail ?? eyebrow}</p>
      </div>
    : <PageHeader title={title} description={detail ?? eyebrow}
       actions={backHref||exportAction||headerActions?<>{headerActions}{backHref?<PageBackLink href={backHref} label="Placement overview" />:null}{exportAction}</>:undefined}/>;
 const parsed=readAdminQuery(await searchParams);
 if(!parsed.success || !statuses.includes(parsed.data.status))
 return <div className="min-w-0 space-y-5">{heading("Super Admin")}
  <ErrorState title="Invalid directory filters" description="Check the search, status or page."
   action={<Link href={path} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Clear filters</Link>}/></div>;
 const context=await getCurrentRequestContext();
 if(!isSuperAdmin(context))return <div className="min-w-0 space-y-5">
  {heading("Super Admin")}
  <ErrorState title="Directory access denied"
   description="Your account cannot access Super Admin directory records."
   action={<Link href="/dashboard" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Back to dashboard</Link>}/>
 </div>;
 if(!context.adminScope?.collegeId)return <div className="min-w-0 space-y-5">
  {heading("Super Admin")}
  <EmptyState title="Select a college to continue" description={"Choose a college in the header above to see its "+(title==="Faculty"?"faculty":title==="Students"?"students":title==="Faculty Assignment"?"faculty assignments":"people directory")+"."}/>
 </div>;
 const directory=await loader(parsed.data)
  .then(value=>({ok:true as const,value}))
  .catch(()=>({ok:false as const}));
 if(!directory.ok)return <div className="min-w-0 space-y-5">
  {heading("Super Admin")}
  <ErrorState title="Directory unavailable"
   description="The selected college's directory could not be loaded. Your filters have not changed."
   action={<Link href={superAdminReadHref(path,parsed.data)}
    className="inline-flex min-h-11 items-center font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Retry loading directory</Link>}/>
 </div>;
 const data=directory.value;
 // Explicit legacy headings restore navigable columns while the authorized
 // server directory continues to own filtering, identity and pagination.
 const detailValue=(row:SuperAdminReadRow,label:string)=>
  row.details.find(detail=>detail.startsWith(label+": "))?.slice(label.length+2)??"—";
 const actionCell=(row:SuperAdminReadRow)=><div className="flex min-w-0 flex-col items-start gap-2">
  {renderRowActions?.(row)}
  {row.href?<Link href={row.href} className="inline-flex min-h-9 items-center font-semibold text-primary-text underline">Open details →</Link>:null}
  {row.secondaryHref?<Link href={row.secondaryHref} className="inline-flex min-h-9 items-center font-semibold text-primary-text underline">{row.secondaryLabel??"Manage →"}</Link>:null}
 </div>;
 const studentColumns:DataTableColumn<SuperAdminReadRow>[]=[
  {key:"name",header:"Name",mobilePriority:"primary",cell:row=><strong className="break-words">{row.title}</strong>},
  {key:"roll",header:"Roll No.",mobilePriority:"secondary",cell:row=>detailValue(row,"Roll number")},
  {key:"mobile",header:"Mobile",mobilePriority:"secondary",cell:row=>detailValue(row,"Mobile")},
  {key:"email",header:"Email",mobilePriority:"secondary",cell:row=>detailValue(row,"Email")},
  {key:"class",header:"Class",mobilePriority:"secondary",cell:row=>detailValue(row,"Class")},
  {key:"gender",header:"Gender",mobilePriority:"secondary",cell:row=>detailValue(row,"Gender")},
  {key:"status",header:"Status",mobilePriority:"secondary",cell:row=><StatusBadge tone={row.status==="ACTIVE"?"success":"neutral"}>{row.status}</StatusBadge>},
  {key:"actions",header:"Actions",mobilePriority:"action",cell:actionCell},
 ];
 const assignmentColumns:DataTableColumn<SuperAdminReadRow>[]=[
  {key:"faculty",header:"Faculty",mobilePriority:"primary",cell:row=><strong className="break-words">{row.title}</strong>},
  {key:"course",header:"Course",mobilePriority:"secondary",cell:row=>row.subtitle},
  {key:"class",header:"Class",mobilePriority:"secondary",cell:row=>detailValue(row,"Class")},
  {key:"semester",header:"Semester",mobilePriority:"secondary",cell:row=>detailValue(row,"Semester")},
  {key:"year",header:"Year",mobilePriority:"secondary",cell:row=>detailValue(row,"Year")},
  {key:"role",header:"Role",mobilePriority:"secondary",cell:row=>detailValue(row,"Teaching role")},
  {key:"active",header:"Active",mobilePriority:"secondary",cell:row=><StatusBadge tone={row.status==="ACTIVE"?"success":"neutral"}>{row.status==="ACTIVE"?"Yes":"No"}</StatusBadge>},
  {key:"actions",header:"Actions",mobilePriority:"action",cell:actionCell},
 ];
 const scopedColumns=peopleFilters?.kind==="LEARNER"?studentColumns:
  title==="Faculty Assignments"?assignmentColumns:null;
 const summaries=peopleFilters?await Promise.allSettled([
  loader({...parsed.data,status:"ALL",page:1}),
  loader({...parsed.data,status:"ACTIVE",page:1}),
  loader({...parsed.data,status:"SUSPENDED",page:1}),
 ]):null;
 const peopleSummary=summaries&&summaries[0].status==="fulfilled"&&
  summaries[1].status==="fulfilled"&&summaries[2].status==="fulfilled"
  ?[summaries[0].value,summaries[1].value,summaries[2].value]:null;
 const refreshAction=(
  <form method="get" action={path} aria-label="Refresh directory" className="w-full print:hidden md:w-auto">
    {data.query.q ? <Input type="hidden" name="q" value={data.query.q} /> : null}
    <Input type="hidden" name="status" value={data.query.status} />
    {data.query.jobId ? <Input type="hidden" name="jobId" value={data.query.jobId} /> : null}
    {data.query.pipelineStage!=="ALL"?<Input type="hidden" name="pipelineStage" value={data.query.pipelineStage}/>:null}
    {data.query.channel!=="ALL"?<Input type="hidden" name="channel" value={data.query.channel}/>:null}
    {data.query.source!=="ALL"?<Input type="hidden" name="source" value={data.query.source}/>:null}
    {(["departmentId","programId","cohortId","sectionId","employmentType"] as const).map(key=>data.query[key]?<Input key={key} type="hidden" name={key} value={data.query[key]}/>:null)}
    <Input type="hidden" name="page" value={String(data.query.page)} />
    <Input type="hidden" name="pageSize" value={String(data.query.pageSize)} />
    <Button type="submit" variant="secondary" className="min-h-11 w-full md:min-h-9 md:w-auto">Refresh</Button>
  </form>
 );
 return <div className="min-w-0 space-y-[var(--lms-space-4)] md:space-y-[var(--lms-space-6)]">
  {heading(peopleFilters?"People":"Super Admin · Read-only",description,
    <>{exportPath&&exportFilename?<AdminScopedCsvControl href={superAdminScopedCsvHref(exportPath,data.query)} filename={exportFilename}/>:null}{refreshAction}</>)}
  {intro}
  {peopleFilters&&!peopleSummary?<p role="status" className="border-l-2 border-warning bg-warning-subtle px-4 py-3 text-sm text-body leading-[22px]">
   Directory totals are temporarily unavailable. The filtered records below remain visible.
  </p>:null}
  {peopleSummary?<section aria-label={title+" overview"} className="grid divide-y divide-border border-y border-border md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
   {[
    {label:peopleFilters?.kind==="FACULTY"?"Faculty":"Students",value:peopleSummary[0].total},
    {label:"Active",value:peopleSummary[1].total},
    {label:"Suspended",value:peopleSummary[2].total},
    {label:"Visible now",value:data.total},
   ].map(stat=><article key={stat.label} className="p-4">
    <p className="text-xs font-semibold text-muted-foreground leading-[20px]">{stat.label}</p>
    <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{stat.value}</p>
   </article>)}
  </section>:null}
  {applicationFilters?<p role="status" className="text-sm text-muted-foreground leading-[22px]">Filters apply within your selected college. {data.total.toLocaleString("en-IN")} matching applications; showing page {data.query.page}.</p>:null}
  {renderBulkActions?renderBulkActions(data.items):null}
  {headingMode==="section"&&exportPath&&exportFilename?<AdminScopedCsvControl href={superAdminScopedCsvHref(exportPath,data.query)} filename={exportFilename}/>:null}
  {headingMode==="section"?refreshAction:null}
  <form method="get" className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] border-y border-[var(--lms-canvas-border)] py-[var(--lms-space-4)] sm:grid-cols-2 lg:grid-cols-3 print:hidden">
   {!applicationFilters&&data.query.jobId ? <Input type="hidden" name="jobId" value={data.query.jobId} /> : null}
   <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search
    <AdminScopedLiveSearch initial={data.query.q} path={path}/>
   </label>
   <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Status
    <Select name="status" defaultValue={data.query.status}
     className="min-h-11 w-full md:min-h-9">
     {statuses.map(status=><option key={status} value={status}>{status}</option>)}
    </Select>
   </label>
   <Button type="submit" variant="primary" className="min-h-11 w-full self-end sm:col-span-2 lg:col-span-1 lg:min-h-9 lg:w-auto">Filter</Button>
   {applicationFilters?<details className="min-w-0 sm:col-span-2 lg:col-span-3" open={Boolean(data.query.jobId||data.query.departmentId||data.query.programId||data.query.cohortId||data.query.source!=="ALL"||data.query.channel!=="ALL"||data.query.pipelineStage!=="ALL")}>
    <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] lg:min-h-9">Filters</summary>
    <div className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-3)] pt-[var(--lms-space-2)] sm:grid-cols-2 xl:grid-cols-3">
    {(["jobId","departmentId","programId","cohortId"] as const).map(key=>{
      const rows=key==="jobId"?applicationFilters.jobs:key==="departmentId"?applicationFilters.departments:key==="programId"?applicationFilters.programs:applicationFilters.batches;
      const label=key==="jobId"?"Job":key==="departmentId"?"Department":key==="programId"?"Program":"Batch";
      return <label key={key} className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">{label}
        <Select name={key} defaultValue={data.query[key]??""} className="w-full">
          <option value="">All {label.toLowerCase()}s</option>{rows.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
        </Select>
      </label>;
    })}
    <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Source
      <Select name="source" defaultValue={data.query.source} className="w-full">
        <option value="ALL">All sources</option><option value="INTERNAL">Internal</option><option value="EXTERNAL">External</option>
      </Select>
    </label>
    <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Channel
      <Select name="channel" defaultValue={data.query.channel} className="w-full">
        <option value="ALL">All sources</option><option value="INTERNAL">Internal</option><option value="EXTERNAL">External</option>
      </Select>
    </label>
    <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Hiring stage
     <Select name="pipelineStage" defaultValue={data.query.pipelineStage} className="w-full">
       {["ALL","APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW","WAITLISTED","OFFERED","HIRED","REJECTED"].map(stage=><option value={stage} key={stage}>{stage==="ALL"?"All hiring stages":stage}</option>)}
     </Select>
    </label>
    </div>
   </details>:null}
   {peopleFilters ? <details className="min-w-0 sm:col-span-2 lg:col-span-3" open={Boolean(data.query.departmentId||data.query.programId||data.query.cohortId||data.query.sectionId||data.query.employmentType)}>
    <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] lg:min-h-9">Filters</summary>
    <div className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-3)] pt-[var(--lms-space-2)] sm:grid-cols-2 xl:grid-cols-3">
    <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Department
     <Select name="departmentId" defaultValue={data.query.departmentId??""} className="w-full">
      <option value="">All departments</option>{peopleFilters.departments.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
     </Select>
    </label>
    {peopleFilters.kind==="FACULTY"?<label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Faculty type
      <Input name="employmentType" defaultValue={data.query.employmentType??""} placeholder="Professor, Mentor…" maxLength={128}
       className="min-h-11 w-full md:min-h-9"/>
     </label>:<>
      {(["programId","cohortId","sectionId"] as const).map((key)=>{
        const values=key==="programId"?peopleFilters.programs:key==="cohortId"?peopleFilters.batches:peopleFilters.classes;
        const label=key==="programId"?"Program":key==="cohortId"?"Batch":"Class";
        return <label key={key} className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">{label}
         <Select name={key} defaultValue={data.query[key]??""} className="w-full">
          <option value="">All {label.toLowerCase()}s</option>{values.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
         </Select>
        </label>;
      })}
     </>}
    </div>
   </details>:null}
   {classOptions?<label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Class
     <Select name="sectionId" defaultValue={data.query.sectionId??""}
      className="min-h-11 w-full md:min-h-9">
      <option value="">All classes</option>
      {classOptions.map(cls=><option key={cls.id} value={cls.id}>{cls.name}</option>)}
     </Select></label>:null}
   {compactReadLayout?null:<label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Rows per page
    <Select name="pageSize" defaultValue={data.query.pageSize}
     className="min-h-11 w-full md:min-h-9">
     {[10,25,50,100].map(size=><option value={size} key={size}>{size}</option>)}
    </Select>
   </label>}

   {compactReadLayout?<details className="order-4 min-w-0 sm:col-span-2 lg:col-span-3">
     <summary className="inline-flex min-h-11 cursor-pointer items-center text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Rows per page</summary>
     <div className="max-w-[200px] pb-1">
       <Select name="pageSize" aria-label="Rows per page" defaultValue={data.query.pageSize} className="min-h-11 w-full md:min-h-9">
         {[10,25,50,100].map(size=><option value={size} key={size}>{size}</option>)}
       </Select>
     </div>
   </details>:null}
  </form>

  {applicationFilters?<p role="status" className="text-sm text-body leading-[22px]">
    {data.query.jobId||data.query.departmentId||data.query.programId||data.query.cohortId||data.query.channel!=="ALL"||data.query.pipelineStage!=="ALL"
    ? "Active filters: "+[
       data.query.jobId?"Job":null,data.query.departmentId?"Department":null,
       data.query.programId?"Program":null,data.query.cohortId?"Batch":null,
       data.query.channel!=="ALL"?data.query.channel:null,
       data.query.pipelineStage!=="ALL"?data.query.pipelineStage:null,
      ].filter(Boolean).join(" · ")
    : "Showing all application sources and stages for the selected college."}
  </p>:null}
  {compactReadLayout?
    <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <p role="status" aria-live="polite" className="min-w-0 self-center text-xs text-muted-foreground md:self-start md:pt-2 leading-[20px]">{data.total.toLocaleString("en-IN")} matching records · page {data.query.page} of {data.totalPages} · {data.query.pageSize} per page</p>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start md:justify-end">
        {data.items.length>0&&(data.query.q||data.query.status!=="ALL"||data.query.page!==1||data.query.pageSize!==25)?
         <Link href={path+(data.query.jobId?"?jobId="+encodeURIComponent(data.query.jobId):"")} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Clear search</Link>:null}
        {refreshAction}
        {exportPath&&exportFilename?<AdminScopedCsvControl href={superAdminScopedCsvHref(exportPath,data.query)} filename={exportFilename}/>:null}
      </div>
    </div>
   :<p role="status" aria-live="polite" className="text-xs text-muted-foreground leading-[20px]">{data.total.toLocaleString("en-IN")} matching records · page {data.query.page} of {data.totalPages} · {data.query.pageSize} per page</p>}
  {compactReadLayout?<>
  {data.items.length?<div className="min-w-0 divide-y divide-border border-y border-border">
   {data.items.map(row=><article key={row.id} className="min-w-0 py-4">
    <div className="grid min-w-0 gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-6">
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
          <h2 className="m-0 min-w-0 break-words font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">{row.title}</h2>
          <StatusBadge tone={row.status==="ACTIVE"?"success":"neutral"}>{row.status}</StatusBadge>
        </div>
        <p className="mt-1 break-words text-sm text-body leading-[22px]">{row.subtitle}</p>
        <div className="mt-2 flex min-w-0 flex-wrap gap-x-4 gap-y-1">
          {row.details.map((value,index)=><p key={index} className="break-words text-xs text-muted-foreground leading-[20px]">{value}</p>)}
        </div>
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 md:justify-end">
        {renderRowActions?<div className="print:hidden">{renderRowActions(row)}</div>:null}
        {row.href?<Link href={row.href} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Open details →</Link>:null}
        {row.secondaryHref?<Link href={row.secondaryHref} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">{row.secondaryLabel??"Manage →"}</Link>:null}
      </div>
    </div>
   </article>)}
  </div>:<EmptyState title="No matching records" description="No persisted data matches the selected college and filters."
    action={<Link href={path+(data.query.jobId?"?jobId="+encodeURIComponent(data.query.jobId):"")}
      className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Clear search</Link>}/>}
  </> : scopedColumns?<>
    <DataTable columns={scopedColumns} rows={data.items} getRowKey={row=>row.id}
      caption={title} empty={<EmptyState title="No matching records" description="No persisted records match the selected college and filters."/>}/>
    <Link href={path+(data.query.jobId?"?jobId="+encodeURIComponent(data.query.jobId):"")}
      className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">Clear search</Link>
  </> : <>
  {data.items.length?<div className="min-w-0 divide-y divide-border border-y border-border">
   {data.items.map(row=><article key={row.id} className="min-w-0 space-y-[var(--lms-space-2)] py-[var(--lms-space-4)] first:pt-0">
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
     <h2 className="m-0 min-w-0 break-words font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">{row.title}</h2>
     <StatusBadge tone={row.status==="ACTIVE"?"success":"neutral"}>{row.status}</StatusBadge>
    </div>
    <p className="break-words text-sm text-body leading-[22px]">{row.subtitle}</p>
    {row.details.map((value,index)=><p key={index} className="break-words text-xs text-muted-foreground leading-[20px]">{value}</p>)}
    {renderRowActions?<div className="border-t border-border pt-3 print:hidden">{renderRowActions(row)}</div>:null}
    {row.href?<Link href={row.href} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Open details →</Link>:null}
    {row.secondaryHref?<Link href={row.secondaryHref} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">{row.secondaryLabel??"Manage →"}</Link>:null}
   </article>)}
  </div>:<EmptyState title="No matching records" description="No persisted data matches the selected college and filters."/>}
  <Link href={path+(data.query.jobId?"?jobId="+encodeURIComponent(data.query.jobId):"")}
    className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Clear search</Link>
  </>}
  <div className="min-w-0 border-t border-border pt-[var(--lms-space-3)]"><Pagination label={title+" pages"} page={data.query.page} pageCount={data.totalPages} hrefForPage={page=>superAdminReadHref(path,{...data.query,page})}/></div>
 </div>;
}
