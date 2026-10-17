import Link from "next/link";
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
     <Link href={collegeHiringAnalyticsHref({...raw})} className="min-h-10 rounded border border-border px-4 py-2">Refresh</Link>
     <a href={"/api/college/placements/hiring-analytics/export"+(exportQuery?"?"+exportQuery:"")}
      className="min-h-10 rounded border border-border px-4 py-2 font-semibold text-primary-text">Export CSV</a>
    </div>
   </div>
   <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
    <input type="hidden" name="seasonId" value={selectedSeasonId??""}/>
    <input type="hidden" name="jobId" value={selectedJobId??""}/>
    <label className="grid gap-1 text-sm">Department
     <select name="departmentId" defaultValue={q.departmentId??""} className="min-h-10 rounded border border-border bg-surface px-2">
      <option value="">All departments</option>
      {data.filters.departments.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}
     </select>
    </label>
    <label className="grid gap-1 text-sm">Program
     <select name="programId" defaultValue={q.programId??""} className="min-h-10 rounded border border-border bg-surface px-2">
      <option value="">All programs</option>
      {data.filters.programs.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}
     </select>
    </label>
    <label className="grid gap-1 text-sm">Batch
     <select name="cohortId" defaultValue={q.cohortId??""} className="min-h-10 rounded border border-border bg-surface px-2">
      <option value="">All batches</option>
      {data.filters.cohorts.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}
     </select>
    </label>
    <label className="grid gap-1 text-sm">Applied from
     <input type="date" name="from" defaultValue={q.from??""} className="min-h-10 rounded border border-border bg-surface px-2"/>
    </label>
    <label className="grid gap-1 text-sm">Applied to
     <input type="date" name="to" defaultValue={q.to??""} className="min-h-10 rounded border border-border bg-surface px-2"/>
    </label>
    <div className="flex gap-3 sm:col-span-2 lg:col-span-5">
     <button type="submit" className="min-h-10 rounded bg-primary px-4 font-semibold text-on-primary">Apply filters</button>
     <Link href={collegeHiringAnalyticsHref({seasonId:selectedSeasonId??undefined,jobId:selectedJobId??undefined})}
      className="inline-flex min-h-10 items-center rounded border border-border px-4 text-sm">Clear all</Link>
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
     className="font-semibold text-primary-text underline">Clear filters</Link>
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
  <section className="overflow-x-auto rounded-xl border border-border bg-surface p-5">
   <h2 className="mb-4 text-lg font-semibold">Company-wise Hiring Report</h2>
   {data.companyRows.length?<table className="w-full min-w-[72rem] text-left text-sm">
    <thead><tr className="border-b border-border bg-muted"><th className="p-2">Company</th><th className="p-2">Job</th>
     <th className="p-2">Total</th>{order.map(s=><th key={s} className="p-2">{label(s)}</th>)}</tr></thead>
    <tbody>{data.companyRows.map(row=><tr key={row.jobId} className="border-b border-border">
     <td className="p-2">{row.company}</td><td className="p-2">{row.job}</td>
     <td className="p-2 tabular-nums">{row.total}</td>
     {order.map(stage=><td key={stage} className="p-2 tabular-nums">{row.byStage[stage]??0}</td>)}
    </tr>)}
    <tr className="font-semibold"><td className="p-2">Total</td><td className="p-2">All drives</td>
     <td className="p-2 tabular-nums">{data.totalApplications}</td>
     {order.map(s=><td key={s} className="p-2 tabular-nums">{data.totals[s]??0}</td>)}</tr></tbody>
   </table>:<p className="text-body">No data for the selected filters</p>}
  </section>
 </div>;
}
