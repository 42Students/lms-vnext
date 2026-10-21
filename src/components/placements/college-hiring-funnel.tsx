"use client";
import { SummaryStrip } from "@/components/ui/summary-strip";
import { Input } from "@/components/ui/input";
import { StatTile } from "@/components/ui/stat-tile";
import { MetricBar } from "@/components/ui/metric-bar";
import reportStyles from "./report-bar-chart.module.css";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import {DataTable} from "@/components/ui/data-table";
import {collegeHiringAnalyticsHref} from "@/modules/placements/college-hiring-analytics-model";
import type {getCollegeHiringFunnel} from "@/modules/placements/college-hiring-funnel-service";
import {Button} from "@/components/ui/button";
import {useState} from "react";

type Funnel=Awaited<ReturnType<typeof getCollegeHiringFunnel>>;
const order=["APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW","WAITLISTED",
 "OFFERED","HIRED","REJECTED","WITHDRAWN"] as const;
function label(key:string){return key.charAt(0)+key.slice(1).toLowerCase();}
export function CollegeHiringFunnel({data,selectedSeasonId,selectedJobId}:{
 data:Funnel;selectedSeasonId:string|null;selectedJobId:string|null;
}){
 const q=data.query;
 const [department,setDepartment]=useState(q.departmentId??"");
 const [program,setProgram]=useState(
   q.programId && (!q.departmentId || data.filters.programs.some(row=>
     row.id===q.programId && row.departmentId===q.departmentId)) ? q.programId : ""
 );
 const permittedPrograms=data.filters.programs.filter(row=>
   !department || row.departmentId===department);
 const raw=Object.fromEntries(Object.entries(q).filter(([,v])=>typeof v==="string")) as Record<string,string>;
 const exportQuery=new URLSearchParams(raw).toString();
 const total=Math.max(1,data.totalApplications);
 const cumulative=data.cumulativeTotals;
 const comparisonStage:Partial<Record<(typeof order)[number],(typeof order)[number]>>={
  SHORTLISTED:"APPLIED",ASSESSMENT:"SHORTLISTED",INTERVIEW:"ASSESSMENT",
  OFFERED:"INTERVIEW",HIRED:"OFFERED",
 };
 return <div className="min-w-0 space-y-4">
  <section className="min-w-0 space-y-4 border-b border-border pb-4">
   <div className="flex min-w-0 flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-between">
    <div><h2 className="font-semibold">Placement Analytics</h2>
     <p className="text-sm text-body leading-[22px]">Track the hiring funnel, conversion and company performance for the selected college. Filters apply consistently to the headline metrics, funnel and company report below.</p>
    </div>
    <div className="flex min-w-0 flex-col items-stretch gap-2 text-sm print:hidden md:flex-row md:items-center">
     <Link href={collegeHiringAnalyticsHref({...raw})} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 py-2 focus-visible:outline-2 md:min-h-9 md:w-auto focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Refresh</Link>
     <a href={"/api/college/placements/hiring-analytics/export"+(exportQuery?"?"+exportQuery:"")}
      className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 py-2 font-semibold md:min-h-9 md:w-auto text-primary-text hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Export CSV</a>
    </div>
   </div>
   <details className="min-w-0 border-t border-border pt-2 print:hidden" open={Boolean(q.departmentId||q.programId||q.cohortId||q.from||q.to)||undefined}>
     <summary className="min-h-11 cursor-pointer py-2 font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Filters</summary>
     <form method="get" className="grid min-w-0 grid-cols-1 gap-3 pt-3 md:grid-cols-2 min-[992px]:grid-cols-5">
    <input type="hidden" name="seasonId" value={selectedSeasonId??""}/>
    <input type="hidden" name="jobId" value={selectedJobId??""}/>
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Department
     <Select name="departmentId" value={department} onChange={event=>{setDepartment(event.target.value);setProgram("");}} className="min-h-11 rounded-[var(--lms-field-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-form-bg)] px-[var(--lms-space-3)] text-[14px] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 sm:text-sm">
      <option value="">All departments</option>
      {data.filters.departments.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}
     </Select>
    </label>
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Program
     <Select name="programId" value={program} onChange={event=>setProgram(event.target.value)} className="min-h-11 rounded-[var(--lms-field-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-form-bg)] px-[var(--lms-space-3)] text-[14px] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 sm:text-sm">
      <option value="">All programs</option>
      {permittedPrograms.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}
     </Select>
    </label>
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Batch
     <Select name="cohortId" defaultValue={q.cohortId??""} className="min-h-11 rounded-[var(--lms-field-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-form-bg)] px-[var(--lms-space-3)] text-[14px] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 sm:text-sm">
      <option value="">All batches</option>
      {data.filters.cohorts.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}
     </Select>
    </label>
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Applied from
     <Input type="date" name="from" defaultValue={q.from??""} className="min-h-11 rounded-[var(--lms-field-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-form-bg)] px-[var(--lms-space-3)] text-[14px] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 sm:text-sm"/>
    </label>
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Applied to
     <Input type="date" name="to" defaultValue={q.to??""} className="min-h-11 rounded-[var(--lms-field-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-form-bg)] px-[var(--lms-space-3)] text-[14px] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 sm:text-sm"/>
    </label>
    <div className="flex min-w-0 flex-col items-stretch gap-2 md:col-span-2 md:flex-row md:items-center min-[992px]:col-span-5">
     <Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">Apply filters</Button>
     <Link href={collegeHiringAnalyticsHref({})}
      className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Clear all</Link>
    </div>
     </form>
   </details>
  </section>
  <section className="min-w-0 space-y-3 border-b border-border pb-3" aria-label="Placement status metrics">
    <h2 className="py-2 font-semibold text-foreground">Placement status metrics</h2>
    <section className="grid min-w-0 grid-cols-2 gap-3 pt-3 md:grid-cols-3 min-[992px]:grid-cols-5">
   {[[ "Total Applications",data.totalApplications] as const,...order.map(stage=>[label(stage),data.totals[stage]??0] as const)]
    .map(([name,value])=><StatTile key={name} label={name} value={value} />)}
   <StatTile label="Avg. time to shortlist"
    value={data.averageHoursToShortlist==null?"No recorded transitions":
      data.averageHoursToShortlist.toFixed(1)+" hours"} />
    </section>
    {data.totalApplications===0?<p role="status" className="text-sm text-body">No data for the selected filters</p>:null}
  </section>
  <section className="min-w-0 space-y-4 border-b border-border pb-4">
   <h2 className="text-lg font-semibold">Hiring Funnel · observed progress</h2>
   {data.totalApplications===0?<div className="space-y-2">
    <p>No data for the selected filters</p>
    <Link href={collegeHiringAnalyticsHref({})}
     className="font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] max-[767px]:inline-flex max-[767px]:min-h-11 max-[767px]:items-center">Clear filters</Link>
   </div>:<div className="space-y-3">
    {order.map(stage=><div key={stage} className={reportStyles.chartRow}>
      <div className="min-w-0 space-y-1">
        <strong className={reportStyles.label}>{label(stage)}</strong>
        <span className="inline-flex rounded border border-[var(--lms-primary)] bg-primary-subtle px-2 py-0.5 text-xs font-semibold tabular-nums text-primary-text" title="Ever observed in this stage, from the selected applications and recorded transition history">
          {stage==="APPLIED"?"100% of applied":comparisonStage[stage]&&
           (cumulative[comparisonStage[stage]!]??0)>0
            ?Math.round(100*(cumulative[stage]??0)/(cumulative[comparisonStage[stage]!]??1))+
              "% vs observed "+label(comparisonStage[stage]!)
            :Math.round(100*(cumulative[stage]??0)/total)+"% of applications"}
        </span>
      </div>
      <MetricBar label={label(stage)} size="default" className={reportStyles.track}
       value={cumulative[stage]??0} maximum={total} unit="applications" />
      <span className={reportStyles.value+" tabular-nums"}>{cumulative[stage]??0}</span>
    </div>)}
   </div>}
   <p className="text-xs text-muted-foreground leading-5">The status tiles above count one current stage per application. This chart counts an application once in each stage recorded in its current state or saved stage history. Missing imported transitions are not guessed; skipped stages and rejected/withdrawn paths may not form a continuous conversion chain.</p>
  </section>
  <section className="min-w-0 space-y-4 border-b border-border pb-4">
   <h2 className="text-lg font-semibold">Company-wise Hiring Report</h2>
   {data.totalApplications>0 && data.companyRows.length===0 ? (
     <div role="alert" className="flex flex-wrap items-center justify-between gap-2 border border-error/30 bg-error/5 px-3 py-2 text-sm">
       <span>Could not load the company-wise hiring report. The headline metrics may still be available.</span>
       <Link className="font-semibold text-primary-text underline" href={collegeHiringAnalyticsHref({...raw})}>Retry company report</Link>
     </div>
   ) : <DataTable
    caption="Company-wise Hiring Report"
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
    empty={<div className="space-y-2">
      <p role="status" className="text-body">No companies match these filters — try widening the date range or clearing filters</p>
      <Link href={collegeHiringAnalyticsHref({})} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Clear filters</Link>
    </div>}
   />}
   {data.companyRows.length>0?
    <details aria-label="Company-wise report totals" className="min-w-0 border-t border-border pt-2">
      <summary className="min-h-11 cursor-pointer py-2 font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">All drives · Totals</summary>
     <SummaryStrip label="Company-wise report totals"
      steps={[["Total",data.totalApplications] as const,
        ...order.map(stage=>[label(stage),data.totals[stage]??0] as const)]
        .map(([name,value])=>({label:name,value}))} />
    </details>:null}
  </section>
 </div>;
}
