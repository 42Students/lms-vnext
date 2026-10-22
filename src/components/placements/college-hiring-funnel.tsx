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
import {useState,useTransition} from "react";
import {useRouter} from "next/navigation";

type Funnel=Awaited<ReturnType<typeof getCollegeHiringFunnel>>;
const order=["APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW","WAITLISTED",
 "OFFERED","HIRED","REJECTED","WITHDRAWN"] as const;
function label(key:string){return key.charAt(0)+key.slice(1).toLowerCase();}
export function CollegeHiringFunnel({data,selectedSeasonId,selectedJobId}:{
 data:Funnel;selectedSeasonId:string|null;selectedJobId:string|null;
}){
 const router=useRouter();
 const q=data.query;
 const [reportPage,setReportPage]=useState(1);
 const [showExtraStatuses,setShowExtraStatuses]=useState(false);
 const [pending,startRefresh]=useTransition();
 const [from,setFrom]=useState(q.from??"");
 const [to,setTo]=useState(q.to??"");
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
 const filtered=Boolean(q.departmentId||q.programId||q.cohortId||q.from||q.to||selectedJobId);
 const pageSize=10;
 const numberOfPages=Math.max(1,Math.ceil(data.companyRows.length/pageSize));
 const currentPage=Math.min(reportPage,numberOfPages);
 const reportRows=data.companyRows.slice((currentPage-1)*pageSize,currentPage*pageSize);
 const reportStages=showExtraStatuses?order:
  (["APPLIED","SHORTLISTED","INTERVIEW","OFFERED","HIRED"] as const);
 const clearRangeHref=collegeHiringAnalyticsHref({...raw,from:"",to:""});
 function refresh(){
  startRefresh(()=>router.refresh());
 }
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
     <Button type="button" variant="secondary" disabled={pending} onClick={refresh}
       aria-label="Refresh placement analytics" className="min-h-11 md:min-h-9">
       {pending?"Refreshing…":"Refresh"}
      </Button>
     <a href={"/api/college/placements/hiring-analytics/export"+(exportQuery?"?"+exportQuery:"")}
      aria-disabled={pending||data.companyReportUnavailable}
      tabIndex={pending||data.companyReportUnavailable?-1:undefined}
      className={"inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--lms-control-radius)] border border-border px-4 py-2 font-semibold text-primary-text md:min-h-9 md:w-auto "+(pending||data.companyReportUnavailable?"pointer-events-none opacity-50":"hover:bg-primary-subtle")}
       ><svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3v12m-5-5 5 5 5-5M4 18v3h16v-3"/></svg>Download CSV</a>
    </div>
   </div>
   {(q.from||q.to)?<div role="group" aria-label="Applied date range" className="flex flex-wrap items-center gap-2 text-sm">
      <span className="rounded-full border border-[#91caff] bg-[#e6f4ff] px-3 py-1 text-[#0958d9]">
        Applied: {q.from||"Any date"} – {q.to||"Today"}
      </span>
      <Link href={clearRangeHref} aria-label="Clear applied date range"
        className="inline-flex min-h-11 items-center gap-1 font-semibold text-link underline md:min-h-9">Clear date range <span aria-hidden="true">×</span></Link>
    </div>:null}
   <details className="min-w-0 border-t border-border pt-2 print:hidden" open={Boolean(q.departmentId||q.programId||q.cohortId||q.from||q.to||
      data.filters.errors.departments||data.filters.errors.programs||data.filters.errors.cohorts)||undefined}>
     <summary className="min-h-11 cursor-pointer py-2 font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Filters</summary>
     {(["departments","programs","cohorts"] as const).map(key=>data.filters.errors[key]?
      <p key={key} role="alert" className="mt-2 text-sm text-warning-text">
       {data.filters.errors[key]}{" "}
       <Link href={collegeHiringAnalyticsHref({seasonId:selectedSeasonId??undefined,jobId:selectedJobId??undefined,
         departmentId:q.departmentId,programId:q.programId,cohortId:q.cohortId,from:q.from,to:q.to})}
        className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Retry</Link>
      </p>:null)}
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
    <fieldset className="grid min-w-0 gap-3 sm:grid-cols-2 md:col-span-2 min-[992px]:col-span-2" aria-label="Applied date range">
     <legend className="sr-only">Applied between these dates</legend>
     <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Applied from
      <Input type="date" name="from" value={from} max={to||undefined} onChange={event=>setFrom(event.target.value)}
       aria-label="Applied from" className="min-h-11 rounded-[var(--lms-field-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-form-bg)] px-[var(--lms-space-3)] text-[14px] md:min-h-9"/>
     </label>
     <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Applied to
      <Input type="date" name="to" value={to} min={from||undefined} onChange={event=>setTo(event.target.value)}
       aria-label="Applied to" className="min-h-11 rounded-[var(--lms-field-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-form-bg)] px-[var(--lms-space-3)] text-[14px] md:min-h-9"/>
     </label>
    </fieldset>
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
   {data.averageHoursToShortlist!=null ? <StatTile label="Avg. time to shortlist"
    value={Math.round(data.averageHoursToShortlist)+" hrs"} /> : null}
    </section>
    {data.totalApplications===0?<p role="status" className="text-sm text-body">
       {filtered?"No data for the selected filters":"No placement applications have been recorded yet"}
     </p>:null}
  </section>
  <section className="min-w-0 space-y-4 border-b border-border pb-4">
   <h2 className="text-lg font-semibold">Hiring Funnel · observed progress</h2>
   {data.totalApplications===0?<div className="space-y-2">
    <p>{filtered?"No data for the selected filters":"No applications yet to show in the hiring funnel"}</p>
    <Link href={collegeHiringAnalyticsHref({})}
     className="font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] max-[767px]:inline-flex max-[767px]:min-h-11 max-[767px]:items-center">Clear filters</Link>
   </div>:<div className="space-y-3">
    {order.map(stage=><div key={stage} className={reportStyles["chartRow"]}>
      <div className="min-w-0 space-y-1">
        <strong className={reportStyles["label"]}>{label(stage)}</strong>
        <span className="inline-flex rounded border border-[var(--lms-primary)] bg-primary-subtle px-2 py-0.5 text-xs font-semibold tabular-nums text-primary-text" title="Ever observed in this stage, from the selected applications and recorded transition history">
          {stage==="APPLIED"?"100% of applied":comparisonStage[stage]&&
           (cumulative[comparisonStage[stage]!]??0)>0
            ?Math.round(100*(cumulative[stage]??0)/(cumulative[comparisonStage[stage]!]??1))+
              "% of "+label(comparisonStage[stage]!)
            :Math.round(100*(cumulative[stage]??0)/total)+"% of applications"}
        </span>
      </div>
      <MetricBar label={label(stage)} size="default" {...(reportStyles["track"] !== undefined ? { className: reportStyles["track"] } : {})}
       value={cumulative[stage]??0} maximum={total} unit="applications" />
      <span className={reportStyles["value"]+" tabular-nums"}>{cumulative[stage]??0}</span>
    </div>)}
   </div>}
   <p className="text-xs text-muted-foreground leading-5">The status tiles above count one current stage per application. This chart counts an application once in each stage recorded in its current state or saved stage history. Missing imported transitions are not guessed; skipped stages and rejected/withdrawn paths may not form a continuous conversion chain.</p>
  </section>
  <section className="min-w-0 space-y-4 rounded-[var(--lms-radius-card)] border border-border bg-white p-4 md:p-5">
   <div className="flex flex-wrap items-center justify-between gap-3">
     <h2 className="text-lg font-semibold">Company-wise Hiring Report</h2>
     <Button type="button" variant="secondary" onClick={()=>{setShowExtraStatuses(v=>!v);setReportPage(1);}}
       aria-expanded={showExtraStatuses} className="min-h-11 md:min-h-9">
       {showExtraStatuses?"Hide extra statuses":"More statuses"}
     </Button>
   </div>
   {data.companyReportUnavailable ? (
     <div role="alert" className="flex flex-wrap items-center justify-between gap-2 border border-error/30 bg-error/5 px-3 py-2 text-sm">
       <span>Could not load the company-wise hiring report. The headline metrics may still be available.</span>
       <Link className="font-semibold text-primary-text underline" href={collegeHiringAnalyticsHref({...raw})}>Retry company report</Link>
     </div>
   ) : <DataTable
    caption="Company-wise Hiring Report"
    rows={reportRows}
    getRowKey={row=>row.jobId}
    columns={[
     {key:"company",header:"Company",mobilePriority:"primary",cell:row=>row.company},
     {key:"job",header:"Job",mobilePriority:"secondary",cell:row=>row.job},
     {key:"total",header:"Total",mobilePriority:"secondary",cell:row=>row.total},
     ...reportStages.map(stage=>({
       key:stage,header:label(stage),mobilePriority:"secondary" as const,
       cell:(row:(typeof data.companyRows)[number])=>row.byStage[stage]??0,
     })),
    ]}
    empty={<div className="space-y-2">
      <p role="status" className="text-body">{filtered?
        "No companies match these filters — try widening the date range or clearing filters":
        "No company hiring reports have been recorded yet"}</p>
      <Link href={collegeHiringAnalyticsHref({})} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Clear filters</Link>
    </div>}
   />}
   {!data.companyReportUnavailable&&data.companyRows.length>pageSize?<nav aria-label="Company report pages"
     className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
     <span className="text-sm text-body">Showing {(currentPage-1)*pageSize+1}–{Math.min(currentPage*pageSize,data.companyRows.length)} of {data.companyRows.length} drives</span>
     <div className="flex items-center gap-2">
       <Button type="button" variant="secondary" disabled={currentPage===1} onClick={()=>setReportPage(v=>Math.max(1,v-1))}>Previous</Button>
       <span className="text-xs text-body">Page {currentPage} of {numberOfPages}</span>
       <Button type="button" variant="secondary" disabled={currentPage===numberOfPages} onClick={()=>setReportPage(v=>Math.min(numberOfPages,v+1))}>Next</Button>
     </div>
   </nav>:null}
   {!data.companyReportUnavailable&&data.normalizedCompanySubtotals.length>0 ?
    <div aria-label="Company summary rows" className="sticky bottom-0 z-10 border border-border bg-surface shadow-[0_-4px_12px_rgba(15,23,42,0.08)]">
      <div className="border-b border-border px-3 py-2 text-sm font-semibold text-foreground">Company totals · all matching drives</div>
      <div className="max-h-52 overflow-auto overscroll-contain" role="region" tabIndex={0} aria-label="Company summary table">
        <table className="w-full min-w-[920px] border-collapse text-left text-xs tabular-nums">
          <caption className="sr-only">Company-wise totals by current application stage</caption>
          <thead className="sticky top-0 bg-surface-subtle text-foreground">
            <tr><th scope="col" className="px-3 py-2">Company</th><th scope="col" className="px-2 py-2">Total</th>
              {order.map(stage=><th scope="col" key={stage} className="px-2 py-2">{label(stage)}</th>)}
            </tr>
          </thead>
          <tbody>{data.normalizedCompanySubtotals.map(company=><tr key={company.company} className="border-t border-border">
            <th scope="row" className="px-3 py-2 font-semibold">{company.company}</th>
            <td className="px-2 py-2">{company.total}</td>
            {order.map(stage=><td key={stage} className="px-2 py-2">{company.byStage[stage]??0}</td>)}
          </tr>)}</tbody>
          <tfoot className="sticky bottom-0 border-t border-border bg-surface-subtle font-bold">
            <tr><th scope="row" className="px-3 py-2">All companies</th>
              <td className="px-2 py-2">{data.normalizedCompanySubtotals.reduce((total,row)=>total+row.total,0)}</td>
              {order.map(stage=><td key={stage} className="px-2 py-2">{data.normalizedCompanySubtotals.reduce((total,row)=>total+(row.byStage[stage]??0),0)}</td>)}
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="px-3 py-1 text-xs text-muted-foreground">Summary groups company aliases case-insensitively and uses the same filters as the report above.</p>
    </div> : null}
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
