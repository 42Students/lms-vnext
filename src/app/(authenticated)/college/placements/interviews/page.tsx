import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import {redirect} from "next/navigation";
import {AuthorizationError} from "@/modules/permissions/policy";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";
import {Banner} from "@/components/ui/banner";
import {SummaryStrip} from "@/components/ui/summary-strip";
import {StatusBadge} from "@/components/ui/status-badge";
import {DataTable, type DataTableColumn} from "@/components/ui/data-table";
import {hasMembershipRole} from "@/modules/identity/context";
import {collegeInterviewFilters,listCollegeInterviewDirectory} from "@/modules/placements/college-interview-directory-service";
import {CollegeInterviewStatusActions} from "@/components/placements/college-interview-status-actions";
import {EmptyState} from "@/components/ui/empty-state";
import { Disclosure } from "@/components/ui/disclosure";
export const dynamic="force-dynamic";
type Params=Record<string,string|string[]|undefined>;
const first=(v:string|string[]|undefined)=>Array.isArray(v)?v[0]:v;
export default async function CollegeInterviewsPage({searchParams}:{searchParams:Promise<Params>}){
 const context=await getCurrentRequestContext();
 if(!context.membership)return <div className="min-w-0 space-y-4">
  <PageHeader title="Interviews"/><Banner tone="warning">Admin not assigned to a college. You must be assigned to a college to view interviews. Contact your administrator.</Banner>
 </div>;
 if(!hasMembershipRole(context,"COLLEGE_ADMIN"))redirect("/dashboard");
 const raw=await searchParams;
 const input={q:first(raw.q)??"",status:first(raw.status)??"ALL",
  mode:first(raw.mode)??"ALL",type:first(raw.type)??"ALL",
  companyId:first(raw.companyId)||undefined,departmentId:first(raw.departmentId)||undefined,
  sort:first(raw.sort)??"UPCOMING",page:first(raw.page)??"1"};
 const valid=collegeInterviewFilters.safeParse(input);
 if(!valid.success)return <div className="min-w-0 space-y-4"><PageHeader title="Interviews"/><ErrorState title="Invalid interview filters" description="Review the interview search and filters." action={<Link href="/college/placements/interviews" className="inline-flex min-h-11 items-center text-primary-text underline md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear filters</Link>}/></div>;
 const data=await listCollegeInterviewDirectory(context,valid.data).catch(error=>{
  if(error instanceof AuthorizationError)throw error;
  return null;
 });
 if(!data)return <div className="min-w-0 space-y-4"><PageHeader title="Interviews"/>
  <ErrorState title="Couldn&apos;t load interviews" description="The interview calendar could not be refreshed. Retry the same college view."
   action={<Link href="/college/placements/interviews" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Retry</Link>}/>
 </div>;
 const build=(page:number,format:"html"|"ics"|"csv"="html")=>{
  const query=new URLSearchParams({q:valid.data.q,status:valid.data.status,
   mode:valid.data.mode,type:valid.data.type,sort:valid.data.sort,page:String(page),
   ...(valid.data.companyId?{companyId:valid.data.companyId}:{}),
   ...(valid.data.departmentId?{departmentId:valid.data.departmentId}:{}),
  });
  const route=format==="ics"?"/api/college/placements/interviews/calendar":
   format==="csv"?"/api/college/placements/interviews/export":"/college/placements/interviews";
  return route+"?"+query;
 };
 const formatter=new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"});
 const applicantHref=(row:(typeof data.rows)[number])=>"/college/placements/jobs/"+encodeURIComponent(row.jobId)+"/applications?applicationId="+encodeURIComponent(row.applicationId);
 const singleIcsHref=(row:(typeof data.rows)[number])=>build(1,"ics")+"&interviewId="+encodeURIComponent(row.id);
 const hasActiveFilters=Boolean(valid.data.q||valid.data.status!=="ALL"||valid.data.mode!=="ALL"||valid.data.type!=="ALL"||valid.data.companyId||valid.data.departmentId);
 const columns:DataTableColumn<(typeof data.rows)[number]>[]=[
  {key:"job",header:"Job",mobilePriority:"primary",cell:row=><div className="min-w-0">
    <Link href={applicantHref(row)} className="break-words font-semibold text-primary-text hover:underline">{row.job}</Link>
    <span className="mt-1 block w-fit rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">{row.company}</span>
  </div>},
  {key:"candidate",header:"Candidate",mobilePriority:"secondary",cell:row=><div className="min-w-0">
    <strong className="block break-words">{row.student}</strong>
    <span className="block text-xs text-muted-foreground">{row.department??"—"}</span>
  </div>},
  {key:"type",header:"Type",cell:row=>row.kind==="GD"?"Group discussion":"Interview"},
  {key:"status",header:"Status",cell:row=><span>
    <StatusBadge tone={row.status==="COMPLETED"?"success":row.status==="SCHEDULED"?"info":row.status==="CANCELLED"?"error":"neutral"}>{row.status}</StatusBadge>
    {row.conflictKind?<span className="mt-1 block text-xs text-danger-text">⚠ Conflict: {row.conflictKind.toLowerCase()}</span>:null}
  </span>},
  {key:"start",header:"Date & Time",cell:row=>formatter.format(row.start)+" IST"},
  {key:"interviewer",header:"Interviewer",cell:row=>row.interviewerName??"—"},
  {key:"mode",header:"Mode",cell:row=><span>
    <span className="block">{row.mode==="VIRTUAL"?"▣ Online":"⌖ In-person"}</span>
    <span className="block max-w-[220px] break-all text-xs text-muted-foreground">{row.venue??"—"}</span>
  </span>},
  {key:"actions",header:"Actions",mobilePriority:"action",cell:row=><div className="min-w-0 space-y-2">
    <div className="flex min-w-0 flex-wrap items-center gap-3">
      <Link href={applicantHref(row)} aria-label={"View "+row.student+" for "+row.job}
        className="inline-flex min-h-9 items-center font-semibold text-primary-text underline">View</Link>
      <a href={singleIcsHref(row)} download={"interview-"+row.id+".ics"}
        aria-label={"Download interview calendar for "+row.student+" and "+row.job}
        className="inline-flex min-h-9 items-center font-semibold text-primary-text underline">ICS ↓</a>
    </div>
    <Disclosure title="Manage" className="min-w-0" contentClassName="py-2">
      <CollegeInterviewStatusActions id={row.id} version={row.version} status={row.status}/>
    </Disclosure>
  </div>},
 ];
 return <div className="min-w-0 space-y-[var(--lms-space-4)]">
  <PageHeader title="Interviews"
   description="Review the interview schedule, conflicts and candidate context without leaving the placements workspace." actions={<div className="flex flex-wrap gap-2">
     <Link href={build(valid.data.page)} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link md:min-h-9">Refresh</Link>
     <Link href="/college/placements/calendar" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link md:min-h-9">Calendar view</Link>
     <Disclosure title="Exports" className="w-full min-w-0 md:w-auto"><div className="flex min-w-0 flex-col items-stretch gap-2 py-2 sm:flex-row sm:items-center"><a href={build(1,"ics")} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-[650] text-[var(--lms-body-text)] md:min-h-9 md:w-auto hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Download .ics</a><a href={build(1,"csv")} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-[650] text-[var(--lms-body-text)] md:min-h-9 md:w-auto hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Export CSV</a></div></Disclosure></div>}/>
  <p className="text-xs text-muted-foreground" aria-label="Interview company scope">{valid.data.companyId?data.companies.find(item=>item.id===valid.data.companyId)?.name??"Selected company":"All companies"}</p>
  {!data.ready?<Banner tone="warning">
    Candidate interview appointment storage is not registered. No schedule or conflict counts are inferred from round-level placeholders.
   </Banner>:<>
   <SummaryStrip label="Interview summary" steps={[{label:"Scheduled",value:data.summary?.scheduled??0},{label:"Today",value:data.summary?.today??0},{label:"Companies",value:data.summary?.companies??0},{label:"Conflicts",value:data.summary?.conflicts??0}]}/>
   <form method="get" role="search" aria-label="Interview appointment filters" className="grid min-w-0 grid-cols-1 items-end gap-[8px] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] md:grid-cols-[minmax(0,2fr)_auto]">
    <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search student, company or role
     <Input type="search" name="q" defaultValue={valid.data.q} maxLength={100} />
    </label>
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
      <Button variant="primary" type="submit" className="min-h-11 w-full sm:w-auto md:min-h-9">Apply filters</Button>
      <Link href="/college/placements/interviews" className="inline-flex min-h-11 items-center justify-center text-link underline md:min-h-9 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear filters</Link>
    </div>
    <Disclosure title="Advanced filters"
      defaultOpen={Boolean(valid.data.companyId || valid.data.departmentId || valid.data.status!=="ALL" || valid.data.mode!=="ALL" || valid.data.type!=="ALL" || valid.data.sort!=="UPCOMING")}
      className="md:col-span-2">
      <div className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-3)] pt-[var(--lms-space-3)] md:grid-cols-2 lg:grid-cols-3">
    <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Company
     <Select name="companyId" defaultValue={valid.data.companyId??""} >
      <option value="">All companies</option>{data.companies.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
     </Select>
    </label>
    <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Department
     <Select name="departmentId" defaultValue={valid.data.departmentId??""} >
      <option value="">All departments</option>{data.departments.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
     </Select>
    </label>
    {([{name:"type",label:"Type",values:["ALL","INTERVIEW","GD"]},
      {name:"status",label:"Status",values:["ALL","SCHEDULED","COMPLETED","NO_SHOW","CANCELLED"]},
      {name:"mode",label:"Mode",values:["ALL","ON_CAMPUS","VIRTUAL"]}]
    ).map(filter=><label key={filter.name} className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">{filter.label}
     <Select name={filter.name} defaultValue={String(valid.data[filter.name as "type"|"status"|"mode"])}
      >
      {filter.values.map(value=><option key={value} value={value}>{value==="ALL"?"All":value.replaceAll("_"," ")}</option>)}
     </Select></label>)}
    <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Sort
     <Select name="sort" defaultValue={valid.data.sort} >
      <option value="UPCOMING">Date ↑ Earliest</option><option value="RECENT">Date ↓ Latest</option>
      <option value="STUDENT">Job title</option>
     </Select>
    </label>
      </div>
    </Disclosure>
   </form>
   <div className="flex min-w-0 flex-wrap items-center gap-3 border-y border-border py-3 text-sm">
    <p role="status">{data.total.toLocaleString("en-IN")} {data.total===1?"interview":"interviews"}
      {data.summary.companies>1?" · "+data.summary.companies+" companies":""}
      {data.summary.today>0?" · "+data.summary.today+" today":""}
    </p>
    {data.companies.length>2?<form action="/college/placements/interviews" method="get" className="inline-flex items-center gap-2">
      <label htmlFor="interview-company">Company:</label>
      <Select id="interview-company" name="companyId" defaultValue={valid.data.companyId??""} aria-label="Filter by company">
        <option value="">All companies</option>{data.companies.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}
      </Select><Button type="submit" variant="secondary">Apply</Button>
    </form>:null}
    <span className="inline-flex items-center gap-2">Sort by:
      <Select aria-label="Sort interviews" defaultValue={valid.data.sort} name="sort" form="interview-sort-form">
        <option value="UPCOMING">Date ↑ Earliest</option><option value="RECENT">Date ↓ Latest</option>
        <option value="STUDENT">Job title</option>
      </Select>
      <form method="get" id="interview-sort-form" action="/college/placements/interviews">
        <Button type="submit" variant="secondary">Sort</Button>
      </form>
    </span>
    <a href={build(1,"csv")} aria-disabled={data.rows.length===0}
      className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3 font-semibold text-primary-text hover:bg-primary-subtle">
      ↓ Export CSV
    </a>
    {data.summary.conflicts>0?<StatusBadge tone="error">{data.summary.conflicts} {data.summary.conflicts===1?"conflict":"conflicts"}</StatusBadge>:null}
    {hasActiveFilters?<Link href="/college/placements/interviews" className="inline-flex min-h-9 items-center text-primary-text underline">Clear filters</Link>:null}
   </div>
   {data.limited?<Banner tone="warning">Results and summary are capped at the first 5,000 records. Narrow filters for a complete view.</Banner>:null}
   {data.conflictsIncomplete?<Banner tone="warning">More than 10,000 overlapping bookings exist in this period. Conflict flags may be incomplete; narrow the time range before scheduling.</Banner>:null}
   <section aria-label="College interview appointments" className="space-y-3">
    <div className="space-y-3 md:hidden">
      {data.rows.map(row=><article key={row.id} className="space-y-3 rounded-[var(--lms-control-radius)] border border-border p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0"><strong className="block break-words">{row.job}</strong>
            <span className="mt-1 block text-xs text-muted-foreground">{row.company}</span></div>
          <Link href={applicantHref(row)} aria-label={"View "+row.student+" for "+row.job}
            className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">View</Link>
        </div>
        <p className="text-sm">{row.student} <span className="text-muted-foreground">· {row.department??"—"}</span></p>
        <p className="text-sm">{row.kind} · {row.status} · {formatter.format(row.start)} IST</p>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span>{row.mode==="VIRTUAL"?"▣ Online":"⌖ In-person"} · {row.venue??"—"}</span>
          <a href={singleIcsHref(row)} download={"interview-"+row.id+".ics"} className="min-h-11 shrink-0 font-semibold text-primary-text underline">ICS ↓</a>
        </div>
        <Disclosure title="Manage" className="border-t border-border pt-2">
          <CollegeInterviewStatusActions id={row.id} version={row.version} status={row.status}/>
        </Disclosure>
      </article>)}
      {!data.rows.length?<EmptyState title={hasActiveFilters?"No interviews match your filters.":"No interviews scheduled yet."}
        description={hasActiveFilters?"Try adjusting filters or schedule interviews from the Jobs module.":undefined}/>:null}
    </div>
    <div className="hidden md:block">
      <DataTable caption="College interview appointments" columns={columns}
        rows={data.rows} rowHref={applicantHref} getRowKey={row=>row.id}
        empty={<EmptyState title={hasActiveFilters?"No matching interviews":"No interviews scheduled yet."}
          description={hasActiveFilters?"No interviews match your filters. Try adjusting filters or schedule interviews from the Jobs module.":undefined}
          action={hasActiveFilters?<Link href="/college/placements/interviews" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Clear filters</Link>:undefined}/>} />
    </div>
   </section>
   <nav aria-label="Interview result pages" className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)] text-sm">
    {valid.data.page>1?<Link href={build(valid.data.page-1)} className="text-link underline min-h-11 md:min-h-9 inline-flex items-center hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Previous</Link>:null}
    <span>Page {valid.data.page} of {data.pageCount}</span>
    {valid.data.page<data.pageCount?<Link href={build(valid.data.page+1)} className="text-link underline min-h-11 md:min-h-9 inline-flex items-center hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Next</Link>:null}
   </nav>
  </>}
 </div>;
}
