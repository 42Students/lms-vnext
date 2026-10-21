import { MetricBar } from "@/components/ui/metric-bar";
import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
import {getSuperAdminCompanyHiringReport} from "@/modules/admin-ui/super-admin-hiring-report-service";
import {getSuperAdminHiringReportFilters} from "@/modules/admin-ui/super-admin-hiring-report-filters-service";
import {superAdminHiringReportQuery,hiringCompanyRollups,COMPANY_HIRING_COLUMNS} from "@/modules/admin-ui/super-admin-hiring-report-model";
import {PageHeader} from "@/components/ui/page-header";
import {Input} from "@/components/ui/input";
import {DateInput} from "@/components/ui/date-input";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {EmptyState} from "@/components/ui/empty-state";
import {Alert} from "@/components/ui/alert";
import {ErrorState} from "@/components/ui/error-state";
import {Banner} from "@/components/ui/banner";
import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
import {historicalHiringTotals,hiringFunnel, hiringMetricLabel} from "@/modules/admin-ui/super-admin-hiring-funnel-model";
import {SuperAdminHiringAcademicFilters} from "@/components/admin/super-admin-hiring-academic-filters";
import {Pagination} from "@/components/ui/pagination";
export default async function SuperAdminPlacementAnalytics({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const raw=await searchParams;
 const parsed=superAdminHiringReportQuery.safeParse({
  q:raw.q,jobId:raw.jobId||undefined,departmentId:raw.departmentId||undefined,
  programId:raw.programId||undefined,cohortId:raw.cohortId||undefined,
  appliedFrom:raw.appliedFrom||undefined,appliedTo:raw.appliedTo||undefined,
 });
 if(!parsed.success)return <div className="min-w-0 space-y-4 md:space-y-6">
  <PageHeader title="Analytics"/>
  <ErrorState title="Invalid analytics filters"
   description={parsed.error.issues[0]?.path[0]==="appliedTo"
     ?"Applied through must not precede Applied from."
     :parsed.error.issues[0]?.path[0]==="jobId"?"Select a valid drive."
     :parsed.error.issues[0]?.path[0]==="departmentId"?"Select a valid department."
     :parsed.error.issues[0]?.path[0]==="programId"?"Select a valid program."
     :parsed.error.issues[0]?.path[0]==="cohortId"?"Select a valid batch."
     :"Check the date format and selected analytics filters."}
   action={<Link href="/admin/placements/analytics" className="inline-flex items-center min-h-11 md:min-h-9 font-[650] text-primary-text underline hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] underline-offset-4 w-full md:w-auto justify-center rounded-[var(--lms-control-radius)] px-4">Clear all</Link>}/>
 </div>;
 const context=await getCurrentRequestContext();
 if(!context.adminScope?.collegeId)return <div className="min-w-0 space-y-4 md:space-y-6">
  <PageHeader title="Placement Analytics"
   description="Track the hiring funnel, conversion and company performance for the selected college. Filters apply consistently to the headline metrics, funnel and company report below."/>
  <Alert tone="warning" title="Select a college to continue">Hiring metrics are college-scoped. Pick an Organization + College in the header above.</Alert>
 </div>;
 requireSuperAdminSelectedCollege(context,"placements.read");
 const [reportResult,filterResult]=await Promise.allSettled([
  getSuperAdminCompanyHiringReport(context,parsed.data),
  getSuperAdminHiringReportFilters(context),
 ]);
 if(reportResult.status==="rejected")return <div className="min-w-0 space-y-4 md:space-y-6">
  <PageHeader title="Placement Analytics"/>
  <ErrorState title="Failed to load hiring data"
   description="Couldn't refresh hiring metrics. The selected college's hiring report could not be verified. Retry the current filters; no zero counts are implied."
   action={<Link href="/admin/placements/analytics" className="font-semibold text-primary-text underline">Retry hiring dashboard</Link>}/>
 </div>;
 const data=reportResult.value;
 const filters=filterResult.status==="fulfilled"?filterResult.value:null;
 const q=data.query;
 const params=new URLSearchParams();
 for(const key of ["q","jobId","departmentId","programId","cohortId","appliedFrom","appliedTo"] as const){
  if(q[key])params.set(key,q[key]!);
 }
 const groups=hiringCompanyRollups(data.rows);
 const reportPageRaw=typeof raw.reportPage==="string"?Number(raw.reportPage):1;
 const reportPages=Math.max(1,Math.ceil(data.rows.length/10));
 const reportPage=Number.isSafeInteger(reportPageRaw)&&reportPageRaw>0
  ?Math.min(reportPages,reportPageRaw):1;
 const reportRows=data.rows.slice((reportPage-1)*10,reportPage*10);
 const reportPageHref=(page:number)=>{
  const next=new URLSearchParams(params);
  if(page>1)next.set("reportPage",String(page));
  return "/admin/placements/analytics"+(next.size?"?"+next.toString():"");
 };
 const totals=groups.reduce((out,row)=>({
  totalApplications:out.totalApplications+row.totalApplications,
  applied:out.applied+row.applied,shortlisted:out.shortlisted+row.shortlisted,
  assessment:out.assessment+row.assessment,interview:out.interview+row.interview,
  offered:out.offered+row.offered,hired:out.hired+row.hired,rejected:out.rejected+row.rejected,
  withdrawn:out.withdrawn+row.withdrawn,waitlisted:out.waitlisted+row.waitlisted,
 }),{totalApplications:0,applied:0,shortlisted:0,assessment:0,interview:0,offered:0,hired:0,rejected:0,withdrawn:0,waitlisted:0});
 const funnelTotals=historicalHiringTotals(data.funnelRows);
 const funnel=hiringFunnel(funnelTotals);
 const metricKeys=["totalApplications","applied","shortlisted","assessment","interview","offered","hired","rejected","withdrawn","waitlisted"] as const;
 const visibleRows=[...reportRows,...groups.map(group=>({
  ...group,companyId:"",jobId:"total:"+group.companyName,jobTitle:"Company total",
 }))];
 type Row=(typeof data.rows)[number];
 const columns:DataTableColumn<Row>[]=[
  {key:"company",header:COMPANY_HIRING_COLUMNS[0]??"Company",mobilePriority:"primary",cell:row=>row.jobId.startsWith("total:")?<strong>{row.companyName} total</strong>:row.companyName},
  {key:"drive",header:COMPANY_HIRING_COLUMNS[1]??"Job",mobilePriority:"secondary",cell:row=>row.jobId.startsWith("total:")?<strong>Company total</strong>:
   <Link href={"/admin/placements/jobs/"+encodeURIComponent(row.jobId)}
    className="inline-flex min-h-11 items-center break-words font-semibold text-primary-text underline md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] underline-offset-4">
     {row.jobTitle}</Link>},
  ...metricKeys.map((key,index)=>({
    key,header:COMPANY_HIRING_COLUMNS[index+2]??key,mobilePriority:"secondary" as const,
    cell:(row:Row)=><span className="tabular-nums">{row[key]}</span>,
  })),
 ];
 const select=(key:"jobId"|"departmentId"|"programId"|"cohortId",label:string,values:readonly {id:string;name:string;companyName?:string|null}[])=>(
  <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">{label}<Select name={key} defaultValue={q[key]??""}
   className="min-w-0">
   <option value="">{label==="Job"?"All jobs":"All"}</option>{q[key]&&!values.some(item=>item.id===q[key])?<option value={q[key]}>Current selected {label.toLowerCase()}</option>:null}{values.map(item=><option key={item.id} value={item.id}>{label==="Job"?item.name.slice(0,30)+(item.name.length>30?"…":"")+(item.companyName?" - "+item.companyName:""):item.name}</option>)}</Select></label>
 );
 return <div className="min-w-0 space-y-4 md:space-y-6">
  <PageHeader title="Placement Analytics"
   description="Track the hiring funnel, conversion and company performance for the selected college. Filters apply consistently to the headline metrics, funnel and company report below."
   actions={<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Placements</span>}/>
  {filters===null?<Banner tone="warning" action={<Link href={reportPageHref(reportPage)} className="font-semibold underline">Retry dropdown choices</Link>}>
   Jobs, departments, programs and batches could not be loaded for filtering. The verified hiring results remain visible.
  </Banner>:filters.filtersError?<Banner tone="warning" role="status"
    action={<Link href={reportPageHref(reportPage)} className="font-semibold underline">Retry dropdown choices</Link>}>
    {filters.filtersError}
  </Banner>:null}
  <form method="get" action="/admin/placements/analytics" className="min-w-0 space-y-3 border-b border-[var(--lms-canvas-border)] pb-4 print:hidden">
   <fieldset className="min-w-0">
    <legend className="sr-only">Hiring report date range and filters</legend>
    <div className="flex min-w-0 flex-wrap items-end gap-3">
     <div className="grid w-full min-w-0 gap-2 sm:w-auto sm:grid-cols-2" role="group" aria-label="Filter by date range">
      <label className="grid min-w-0 gap-1 text-[13px] font-semibold text-[var(--lms-neutral-400)]">Applied from
       <DateInput mode="date" name="appliedFrom" defaultValue={q.appliedFrom??""} className="min-w-0" /></label>
      <label className="grid min-w-0 gap-1 text-[13px] font-semibold text-[var(--lms-neutral-400)]">Applied to
       <DateInput mode="date" name="appliedTo" defaultValue={q.appliedTo??""} className="min-w-0" /></label>
     </div>
     <div className="w-full min-w-0 sm:w-[205px]">{select("jobId","Job",filters?.jobs??[])}</div>
     <div className="w-full min-w-0 sm:w-[180px]">
      <label className="grid gap-1 text-[13px] font-semibold text-[var(--lms-neutral-400)]">Drive or company
       <Input type="search" name="q" defaultValue={q.q} maxLength={100} className="w-full" placeholder="Search jobs or companies" /></label>
     </div>
     <Button type="submit" variant="secondary" className="min-h-11 w-full gap-2 md:min-h-9 sm:w-auto">
      <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 11a8 8 0 1 0-2 6M20 5v6h-6"/></svg>Refresh
     </Button>
     <a href={"/api/admin/placements/hiring-report/export?"+params.toString()}
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-9">
      <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4"/></svg>Export report
     </a>
    </div>
    <details className="mt-3 min-w-0" open={Boolean(q.departmentId||q.programId||q.cohortId)}>
     <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Academic filters</summary>
     <div className="grid min-w-0 gap-3 pt-2 sm:grid-cols-2 xl:grid-cols-3">
      <SuperAdminHiringAcademicFilters key={[q.departmentId??"",q.programId??"",q.cohortId??""].join(":")}
       departments={filters?.departments??[]} programs={filters?.programs??[]}
       batches={filters?.batches??[]}
       selected={{departmentId:q.departmentId,programId:q.programId,cohortId:q.cohortId}}/>
     </div>
    </details>
   </fieldset>
  </form>
  {params.size?<div role="status" className="flex min-w-0 flex-wrap items-center gap-2 text-xs print:hidden" aria-label="Active hiring filters">
   {[...params.entries()].map(([key,value])=>{
    const next=new URLSearchParams(params);
    next.delete(key);
    return <Link key={key} href={"/admin/placements/analytics"+(next.size?"?"+next.toString():"")}
     className="inline-flex min-h-8 items-center gap-2 rounded border border-[var(--lms-info-border)] bg-[var(--lms-info-subtle)] px-2 font-medium text-primary-text hover:underline"
     aria-label={"Remove "+key+" filter"}>{key==="appliedFrom"?"Applied from":key==="appliedTo"?"Applied to":key==="jobId"?"Job":key==="cohortId"?"Batch":key==="departmentId"?"Department":key==="programId"?"Program":"Search"}: {value}<span aria-hidden="true">×</span></Link>;
   })}
   <Link href="/admin/placements/analytics" className="inline-flex min-h-9 items-center font-semibold text-primary-text underline">Clear all</Link>
  </div>:null}
  <p role="status" className="text-sm text-body">{data.rows.length} matching drives across {groups.length} companies{data.truncated?" · Capped at 5,000 drives":""}</p>
  {data.truncated?<Banner tone="warning">
    This report reached its 5,000-drive safety limit. The headline metrics, funnel, company totals and CSV may be incomplete. Narrow the filters before using these figures for decisions.
  </Banner>:null}
  <section aria-label="Hiring metrics" className="min-w-0">
   <h2 className="sr-only">Hiring metrics</h2>
   <dl className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
    {metricKeys.map((key,index)=><div key={key} className={"min-w-0 rounded-[8px] border border-border bg-surface px-3 py-4 "+(index===0?"col-span-2 sm:col-span-2":"")}>
     <dt className="text-[13px] font-medium text-muted-foreground">{hiringMetricLabel(key)}</dt>
     <dd className="mt-2 text-2xl font-semibold tabular-nums text-[var(--lms-heading)]">{totals[key].toLocaleString("en-IN")}</dd>
    </div>)}
   </dl>
  </section>
  <section className="min-w-0 rounded-[8px] border border-border bg-surface p-4" aria-label="Hiring Funnel">
   <h2 className="mb-4 text-[var(--lms-font-lg)] font-semibold text-[var(--lms-heading)]">Hiring Funnel</h2>
   {totals.totalApplications===0?
    <p role="status" className="text-sm text-muted-foreground">No funnel data</p>:
    <ol className="max-w-[500px] space-y-3">{funnel.map((step,index)=>
     <li key={step.key} className="min-w-0">
      <div className="mb-1 flex min-w-0 flex-wrap items-center justify-between gap-2 text-sm">
       <div className="flex min-w-0 flex-wrap items-center gap-2">
        <strong>{step.label}</strong>
        {step.percentPrevious!==null?<span className="rounded-full border border-[var(--lms-info-border)] bg-[var(--lms-info-subtle)] px-2 py-0.5 text-xs text-primary-text">
         {step.percentPrevious}% of {funnel[index-1]?.label??"previous stage"}
        </span>:null}
       </div>
       <span className="font-semibold tabular-nums">{step.count.toLocaleString("en-IN")}</span>
      </div>
      <MetricBar className="h-6 overflow-hidden rounded bg-muted" role="img"
       label={step.label+": "+step.count+" applications"}
       value={step.widthPercent} maximum={100} unit="percent"/>
     </li>)}</ol>}
  </section>
  <p className="text-sm text-muted-foreground">Avg. time to shortlist: Not recorded. Stage-transition timestamps are required for an accurate duration.</p>
  <section aria-label="Company-wise Hiring Report" className="min-w-0 space-y-3 rounded-[8px] border border-border bg-surface p-4">
   <h2 className="text-[var(--lms-font-lg)] font-semibold leading-7 text-[var(--lms-heading)]">Company-wise Hiring Report</h2>
   <DataTable columns={columns} rows={visibleRows} getRowKey={row=>row.jobId}
    caption="Company-wise Hiring Report" mobileMode="scroll"
    className="min-w-0 [&_table]:min-w-[950px]"
    empty={<EmptyState title={params.size?"No companies match these filters — try widening the date range or clearing filters":"No hiring data yet"}
     description={params.size?"Widen the selected date range or clear filters to review available hiring data.":"No hiring activity has been recorded for the selected college."}
     action={params.size?<Link href="/admin/placements/analytics" className="font-semibold text-primary-text underline">Clear filters</Link>:undefined}/>}/>
   {groups.length?<p className="text-xs text-muted-foreground">Company total rows summarize all matching drives across report pages, not just the currently visible page.</p>:null}
   {data.rows.length>10?<div className="flex min-w-0 flex-col gap-3 border-t border-border pt-3 text-sm sm:flex-row sm:items-center sm:justify-between">
    <span>Showing {(reportPage-1)*10+1}–{Math.min(reportPage*10,data.rows.length)} of {data.rows.length} drives</span>
    <Pagination page={reportPage} pageCount={reportPages} label="Company hiring results pagination" hrefForPage={reportPageHref}/>
   </div>:null}
  </section>
  <p className="text-xs text-muted-foreground">Stage counts are current persisted application stages, not historical transitions. Hired stage is not a substitute for confirmed joining. This report does not infer match scores or private candidate contacts.</p>
 </div>;
}
