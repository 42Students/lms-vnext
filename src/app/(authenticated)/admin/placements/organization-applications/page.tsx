import Link from "next/link";
import {ZodError} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {PageBackLink} from "@/components/ui/page-back-link";
import {EmptyState} from "@/components/ui/empty-state";
import {ErrorState} from "@/components/ui/error-state";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {searchOrganizationPlacementApplications} from "@/modules/placements/organization-application-search-service";

export const dynamic="force-dynamic";
type Params=Record<string,string|string[]|undefined>;
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}
function listingUrl(params:{search:string;status:string;sort:string;pageSize:number},page:number){
 const values=new URLSearchParams({search:params["search"],status:params["status"],sort:params["sort"],
  pageSize:String(params["page"]Size),page:String(page)});
 return "/admin/placements/organization-applications?"+values.toString();
}
const statusOptions=["ALL","APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW",
 "WAITLISTED","OFFERED","REJECTED","HIRED","WITHDRAWN"] as const;
const fmt=new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"});

export default async function OrganizationApplicationsPage({searchParams}:{
 searchParams:Promise<Params>;
}){
 const ctx=await getCurrentRequestContext();
 if(!ctx.adminScope?.collegeId)return <div className="min-w-0 space-y-4">
  <PageHeader title="Organization applications" description="Choose a college scope before viewing private placement applications."/>
  <EmptyState title="Choose a college" description="Use the Super Admin college switcher to select an organization you are permitted to access."/>
 </div>;
 const params=await searchParams;
 let result:Awaited<ReturnType<typeof searchOrganizationPlacementApplications>>;
 try{
  result=await searchOrganizationPlacementApplications(ctx,{
   search:first(params["search"]),status:first(params["status"]),sort:first(params["sort"]),
   page:first(params["page"]),pageSize:first(params["page"]Size),
  });
 }catch(problem){
  if(!(problem instanceof ZodError))throw problem;
  return <div className="min-w-0 space-y-4">
   <PageHeader title="Organization applications"/>
   <ErrorState title="Invalid application search" description="Check the search, stage, sort order and page."
    action={<Link href="/admin/placements/organization-applications" className="font-semibold text-link underline">Clear filters</Link>}/>
  </div>;
 }
 const paged={search:result.search,status:result.status,sort:result.sort,pageSize:result.pageSize};
 return <div className="min-w-0 space-y-5">
  <PageHeader title="Organization applications"
   description="Live organization-scoped placement application search. Historical archived drives are included."
   actions={<PageBackLink href="/admin/placements" label="Placements"/>}/>
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
   <section className="min-w-0 border-b border-border pb-3">
    <p className="text-xs text-body">Total applications in this organization</p>
    <strong className="text-2xl tabular-nums">{result.totalApplications}</strong>
   </section>
   <section className="min-w-0 border-b border-border pb-3">
    <p className="text-xs text-body">Matches for current filters</p>
    <strong className="text-2xl tabular-nums">{result.totalMatching}</strong>
   </section>
  </div>
  <form method="get" className="grid min-w-0 grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
   <label className="grid gap-2 text-[13px] font-semibold">Search applications
    <Input name="search" maxLength={120} defaultValue={result.search}
     placeholder="Learner, drive, company, status"/>
   </label>
   <label className="grid gap-2 text-[13px] font-semibold">Status
    <Select name="status" defaultValue={result.status}>
     {statusOptions.map(status=><option key={status} value={status}>{status}</option>)}
    </Select>
   </label>
   <label className="grid gap-2 text-[13px] font-semibold">Sort by
    <Select name="sort" defaultValue={result.sort}>
     <option value="SCORE">Score then applied date</option>
     <option value="NEWEST">Newest applications</option>
     <option value="NAME">Learner name</option>
    </Select>
   </label>
   <Button type="submit" className="min-h-11 w-full md:min-h-9">Search</Button>
  </form>
  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
   <p className="text-body">Live database results · no cache refresh needed. Scores reflect the best applied round result, not retired legacy screening scores.</p>
   <Link href="/admin/placements/organization-applications"
    className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Clear filters</Link>
  </div>
  <section aria-label="Organization placement applications" className="space-y-3">
   {result.records.length?(
    <ul className="grid min-w-0 gap-3">
     {result.records.map(record=><li key={record.id} className="min-w-0 rounded-lg border border-border p-4">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
       <div className="min-w-0 space-y-1">
        <h2 className="break-words font-semibold">{record.learnerName}</h2>
        <p className="break-words text-sm">{record.companyName} · {record.jobTitle}</p>
       </div>
       <span className="text-sm font-semibold">{record.applicationStatus}</span>
      </div>
      <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm">
       <div><dt className="text-muted-foreground">Score</dt><dd className="tabular-nums">{record.score??"—"}</dd></div>
       <div><dt className="text-muted-foreground">Applied (IST)</dt><dd>{fmt.format(new Date(record.appliedAt))}</dd></div>
      </dl>
      <Link href={"/admin/placements/jobs/"+encodeURIComponent(record.jobId)+
       "/applications?applicationId="+encodeURIComponent(record.id)}
       className="mt-3 inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
       Application details
      </Link>
     </li>)}
    </ul>
   ):<EmptyState title="No matching placement applications" description="Try a different search, stage or sort order."/>}
  </section>
  <nav aria-label="Application search pages" className="flex flex-wrap items-center justify-between gap-3">
   <p className="text-sm text-body">Page {result.page} of {result.totalPages}</p>
   <div className="flex gap-3">
    {result.page>1?<Link href={listingUrl(paged,result.page-1)} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Previous</Link>:null}
    {result.page<result.totalPages?<Link href={listingUrl(paged,result.page+1)} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Next</Link>:null}
   </div>
  </nav>
 </div>;
}
