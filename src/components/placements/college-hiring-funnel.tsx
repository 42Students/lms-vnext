import { Select } from "@/components/ui/select";
import Link from "next/link";
import {DataTable} from "@/components/ui/data-table";
import {collegeHiringAnalyticsHref} from "@/modules/placements/college-hiring-analytics-model";
import type {getCollegeHiringFunnel} from "@/modules/placements/college-hiring-funnel-service";

type Funnel=Awaited<ReturnType<typeof getCollegeHiringFunnel>>;
const order=["APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW","WAITLISTED",
 "OFFERED","HIRED","REJECTED","WITHDRAWN"] as const;
function label(key:string){return key.charAt(0)+key.slice(1).toLowerCase();}
export function CollegeHiringFunnel({data,selectedSeasonId,selectedJobId}:{
 data:Funnel;selectedSeasonId:string|null;selectedJobId:string|null;
}){
 const q=data.query;
 const raw=Object.fromEntries(Object.entries(q).filter(([,v])=>typeof v==="string")) as Record<string,string>;
 const exportQuery=new URLSearchParams(raw).toString();
 const total=Math.max(1,data.totalApplications);
 return <div className="space-y-6">
  <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <div><h2 className="font-semibold">Placement Analytics</h2>
     <p className="text-sm text-body">Track the hiring funnel, conversion and company performance for the selected college. Filters apply consistently to the headline metrics, funnel and company report below.</p>
    </div>
    <div className="flex gap-3 text-sm">
     <Link href={collegeHiringAnalyticsHref({...raw})} className="min-h-11 rounded border border-border px-4 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">Refresh</Link>
     <a href={"/api/college/placements/hiring-analytics/export"+(exportQuery?"?"+exportQuery:"")}
      className="min-h-11 rounded border border-border px-4 py-2 font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">Export CSV</a>
    </div>
   </div>
   <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
    <input type="hidden" name="seasonId" value={selectedSeasonId??""}/>
    <input type="hidden" name="jobId" value={selectedJobId??""}/>
    <label className="grid gap-1 text-sm">Department
     <Select name="departmentId" defaultValue={q.departmentId??""} className="min-h-11 rounded border border-border bg-surface px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] text-base sm:text-sm">
      <option value="">All departments</option>
      {data.filters.departments.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}
     </Select>
    </label>
    <label className="grid gap-1 text-sm">Program
     <Select name="programId" defaultValue={q.programId??""} className="min-h-11 rounded border border-border bg-surface px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] text-base sm:text-sm">
      <option value="">All programs</option>
      {data.filters.programs.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}
     </Select>
    </label>
    <label className="grid gap-1 text-sm">Batch
     <Select name="cohortId" defaultValue={q.cohortId??""} className="min-h-11 rounded border border-border bg-surface px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] text-base sm:text-sm">
      <option value="">All batches</option>
      {data.filters.cohorts.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}
     </Select>
    </label>
    <label className="grid gap-1 text-sm">Applied from
     <input type="date" name="from" defaultValue={q.from??""} className="min-h-11 rounded border border-border bg-surface px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] text-base sm:text-sm"/>
    </label>
    <label className="grid gap-1 text-sm">Applied to
     <input type="date" name="to" defaultValue={q.to??""} className="min-h-11 rounded border border-border bg-surface px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] text-base sm:text-sm"/>
    </label>
    <div className="flex gap-3 sm:col-span-2 lg:col-span-5">
     <button type="submit" className="min-h-11 rounded bg-primary px-4 font-semibold text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">Apply filters</button>
     <Link href={collegeHiringAnalyticsHref({seasonId:selectedSeasonId??undefined,jobId:selectedJobId??undefined})}
      className="inline-flex min-h-11 items-center rounded border border-border px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">Clear all</Link>
    </div>
   </form>
  </section>
  <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-label="Placement status metrics">
   {[["Total Applications",data.totalApplications],...order.map(stage=>[label(stage),data.totals[stage]??0] as const)]
    .map(([name,value])=><div key={name} className="rounded-xl border border-border bg-surface p-4">
      <p className="text-sm text-muted-foreground">{name}</p>
      <strong className="mt-1 block text-2xl tabular-nums">{value.toLocaleString("en-IN")}</strong>
    </div>)}
   <div className="rounded-xl border border-border bg-surface p-4">
    <p className="text-sm text-muted-foreground">Avg. time to shortlist</p>
    <strong className="mt-1 block text-xl">
      {data.averageHoursToShortlist==null?"No recorded transitions":
       data.averageHoursToShortlist.toFixed(1)+" hours"}
    </strong>
   </div>
  </section>
  <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
   <h2 className="text-lg font-semibold">Hiring Funnel</h2>
   {data.totalApplications===0?<div className="space-y-2">
    <p>No data for the selected filters</p>
    <Link href={collegeHiringAnalyticsHref({seasonId:selectedSeasonId??undefined,jobId:selectedJobId??undefined})}
     className="font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">Clear filters</Link>
   </div>:<div className="space-y-3">
    {order.map(stage=><div key={stage} className="grid grid-cols-[7rem_1fr_4rem] items-center gap-3 text-sm">
      <span>{label(stage)}</span>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
       <div className="h-full rounded-full bg-primary" style={{width:
        Math.min(100,100*(data.totals[stage]??0)/total)+"%"}}/>
      </div>
      <span className="text-right tabular-nums">{data.totals[stage]??0}</span>
    </div>)}
   </div>}
   <p className="text-xs text-muted-foreground">Counts show current pipeline stages, not cumulative conversion. A candidate can occupy only one current stage.</p>
  </section>
  <section className="min-w-0 space-y-4 rounded-xl border border-border bg-surface p-5">
   <h2 className="text-lg font-semibold">Company-wise Hiring Report</h2>
   <DataTable
    caption="Company-wise hiring report"
    rows={data.companyRows}
    getRowKey={row=>row.jobId}
    columns={[
     {key:"company",header:"Company",mobilePriority:"primary",cell:row=>row.company},
     {key:"job",header:"Job",mobilePriority:"secondary",cell:row=>row.job},
     {key:"total",header:"Total",mobilePriority:"secondary",cell:row=>row.total},
     ...order.map(stage=>({
       key:stage,header:label(stage),mobilePriority:"secondary" as const,
       cell:(row:(typeof data.companyRows)[number])=>row.byStage[stage]??0,
     })),
    ]}
    empty={<p role="status" className="text-body">No data for the selected filters</p>}
   />
   {data.companyRows.length>0?
    <section aria-label="Company-wise report totals" className="rounded-lg border border-border bg-surface-secondary p-4">
     <h3 className="font-semibold text-foreground">All drives · Totals</h3>
     <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-5">
      {[["Total",data.totalApplications] as const,...order.map(stage=>[label(stage),data.totals[stage]??0] as const)]
       .map(([name,value])=><div key={name} className="min-w-0">
        <dt className="text-body">{name}</dt>
        <dd className="font-semibold tabular-nums text-foreground">{value.toLocaleString("en-IN")}</dd>
       </div>)}
     </dl>
    </section>:null}
  </section>
 </div>;
}
