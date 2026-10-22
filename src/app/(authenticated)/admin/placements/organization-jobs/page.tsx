import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {searchOrganizationPlacementJobs} from "@/modules/placements/organization-job-search-service";
import {PageHeader} from "@/components/ui/page-header";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
import {EmptyState} from "@/components/ui/empty-state";
import {ErrorState} from "@/components/ui/error-state";
import {StatusBadge} from "@/components/ui/status-badge";

const hrefBase="/admin/placements/organization-jobs";
type Row=Awaited<ReturnType<typeof searchOrganizationPlacementJobs>>["rows"][number];
function first(value:string|string[]|undefined){
 return typeof value==="string"?value:"";
}
function localDate(value:Date|null){
 return value?new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",day:"2-digit",month:"short",year:"numeric",
 }).format(value):"Not set";
}
const actionClass="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)]";

export default async function SuperAdminOrganizationJobsPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const raw=await searchParams;
 const context=await getCurrentRequestContext();
 const organizationId=first(raw.organizationId);
 const scoped=Boolean(context.adminScope?.organizationId||context.adminScope?.collegeId);
 const params={
  organizationId, q:first(raw.q),status:first(raw.status)||"ALL",
  sort:first(raw.sort)||"NEWEST",page:first(raw.page)||"1",
 };
 const searchHref=(page:number)=>{
  const q=new URLSearchParams();
  if(params.organizationId)q.set("organizationId",params.organizationId);
  if(params.q)q.set("q",params.q);
  if(params.status!=="ALL")q.set("status",params.status);
  if(params.sort!=="NEWEST")q.set("sort",params.sort);
  q.set("page",String(page));
  return hrefBase+"?"+q.toString();
 };
 let result:Awaited<ReturnType<typeof searchOrganizationPlacementJobs>>|null=null;
 let loadError=false;
 if(scoped||organizationId){
  try{
   result=await searchOrganizationPlacementJobs(context,{
    q:params.q,status:params.status,sort:params.sort,page:params.page,
    ...(organizationId?{organizationId}:{}),pageSize:50,
   });
  }catch{loadError=true;}
 }
 const columns:DataTableColumn<Row>[]=[
  {key:"job",header:"Job",mobilePriority:"primary",cell:row=><div className="min-w-0 space-y-1">
    <p className="font-semibold text-[var(--lms-heading)]">{row.title}</p>
    <p className="text-xs text-muted-foreground">{row.companyName} · {row.jobType??row.employmentType}</p>
    <p className="text-xs text-muted-foreground">{row.roleOptions.filter(role=>role.status==="ACTIVE").map(role=>role.title).join(", ")||"No active roles"}</p>
   </div>},
  {key:"college",header:"College",cell:row=><span className="break-all text-xs">{row.collegeId}</span>},
  {key:"status",header:"Status",cell:row=><StatusBadge tone={row.status==="PUBLISHED"?"success":"neutral"}>{row.status}</StatusBadge>},
  {key:"location",header:"Location",cell:row=><span>{row.locations.join(", ")||"Not specified"}</span>},
  {key:"posted",header:"Posted",cell:row=><span>{localDate(row.postedAt)}</span>},
  {key:"deadline",header:"Deadline",cell:row=><span>{localDate(row.applicationDeadline)}</span>},
 ];
 return <section className="min-w-0 space-y-[var(--lms-space-4)]">
  <PageHeader title="Job search" description="Search placement drives within one authorized organization." />
  <Link href="/admin/placements" className={actionClass}>← Back to Placements</Link>
  <form method="get" action={hrefBase}
   className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] bg-surface pb-[var(--lms-space-4)] md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
   <label className="grid min-w-0 gap-1 text-sm font-semibold">
    Search jobs and companies
    <Input name="q" type="search" maxLength={120} defaultValue={params.q} placeholder="Job title or company" />
   </label>
   <label className="grid min-w-0 gap-1 text-sm font-semibold">
    Status
    <Select name="status" defaultValue={params.status}>
     {["ALL","DRAFT","PUBLISHED","CLOSED","CANCELLED","ARCHIVED"].map(status=>
      <option key={status} value={status}>{status==="ALL"?"All statuses":status}</option>)}
    </Select>
   </label>
   <label className="grid min-w-0 gap-1 text-sm font-semibold">
    Sort by
    <Select name="sort" defaultValue={params.sort}>
     <option value="NEWEST">Newest</option>
     <option value="OLDEST">Oldest</option>
     <option value="TITLE">Title</option>
    </Select>
   </label>
   <div className="flex items-end"><Button type="submit" className="min-h-11 w-full">Search</Button></div>
   {!scoped?<label className="grid min-w-0 gap-1 text-sm font-semibold md:col-span-4">
    Organization ID (required for platform-wide administrators)
    <Input name="organizationId" defaultValue={organizationId} placeholder="Select an active organization UUID" />
   </label>:null}
  </form>
  {!scoped&&!organizationId?<EmptyState title="Select an organization"
   description="Enter an authorized organization ID to search its placement jobs. Search never combines unrelated organizations."/>:null}
  {loadError?<ErrorState title="Couldn't load jobs"
   description="Check your selected organization and search filters. No jobs from another organization are shown."
   action={<Link className={actionClass} href={hrefBase}>Clear filters</Link>}/>:null}
  {result?<div className="space-y-3">
   <p role="status" className="text-sm text-muted-foreground">
    {result.totalMatching} matching jobs · Page {result.page} of {result.totalPages}
   </p>
   <DataTable caption="Organization placement jobs" columns={columns}
    rows={result.rows} getRowKey={row=>row.id}
    empty={<EmptyState title="No matching jobs" description="Try another search term or status."/>}/>
   {result.totalPages>1?<nav aria-label="Job search pages"
    className="flex flex-wrap items-center justify-between gap-3 text-sm">
    <span>Page {result.page} of {result.totalPages}</span>
    <div className="flex gap-2">
     {result.page>1?<Link className={actionClass} href={searchHref(result.page-1)}>Previous</Link>:null}
     {result.page<result.totalPages?<Link className={actionClass} href={searchHref(result.page+1)}>Next</Link>:null}
    </div>
   </nav>:null}
  </div>:null}
 </section>;
}
