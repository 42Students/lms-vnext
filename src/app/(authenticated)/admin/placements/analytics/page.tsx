import { MetricBar } from "@/components/ui/metric-bar";
import styles from "@/components/placements/super-admin-hiring-funnel.module.css";
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
import {ErrorState} from "@/components/ui/error-state";
import {Banner} from "@/components/ui/banner";
import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
import {hiringFunnel, hiringMetricLabel} from "@/modules/admin-ui/super-admin-hiring-funnel-model";
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
  <EmptyState title="Select a college to continue" description="Choose a college in the Super Admin scope selector before reviewing placement analytics."/>
 </div>;
 requireSuperAdminSelectedCollege(context,"placements.read");
 const [reportResult,filterResult]=await Promise.allSettled([
  getSuperAdminCompanyHiringReport(context,parsed.data),
  getSuperAdminHiringReportFilters(context),
 ]);
 if(reportResult.status==="rejected")return <div className="min-w-0 space-y-4 md:space-y-6">
  <PageHeader title="Placement Analytics"/>
  <ErrorState title="Failed to load hiring dashboard"
   description="The selected college's hiring report could not be loaded. Please try again; no zero counts are implied."
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
 const funnel=hiringFunnel(totals);
 const metricKeys=["totalApplications","applied","shortlisted","assessment","interview","offered","hired","rejected","withdrawn","waitlisted"] as const;
 type Row=(typeof data.rows)[number];
 const columns:DataTableColumn<Row>[]=[
  {key:"company",header:COMPANY_HIRING_COLUMNS[0]??"Company",mobilePriority:"primary",cell:row=>row.companyName},
  {key:"drive",header:COMPANY_HIRING_COLUMNS[1]??"Drive",mobilePriority:"secondary",cell:row=>
   <Link href={"/admin/placements/jobs/"+encodeURIComponent(row.jobId)}
    className="inline-flex min-h-11 items-center break-words font-semibold text-primary-text underline md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] underline-offset-4">
     {row.jobTitle}</Link>},
  ...metricKeys.map((key,index)=>({
    key,header:COMPANY_HIRING_COLUMNS[index+2]??key,mobilePriority:"secondary" as const,
    cell:(row:Row)=><span className="tabular-nums">{row[key]}</span>,
  })),
 ];
 const select=(key:"jobId"|"departmentId"|"programId"|"cohortId",label:string,values:readonly {id:string;name:string}[])=>(
  <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">{label}<Select name={key} defaultValue={q[key]??""}
   className="min-w-0">
   <option value="">All {label.toLowerCase()}</option>{values.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</Select></label>
 );
 return <div className="min-w-0 space-y-4 md:space-y-6">
  <PageHeader title="Placement Analytics"
   description="Track the hiring funnel, conversion and company performance for the selected college. Filters apply consistently to the headline metrics, funnel and company report below."
   actions={<a href={"/api/admin/placements/hiring-report/export?"+params.toString()}
    className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-[650] text-primary-text md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
    Export report</a>}/>
  {filters===null?<Banner tone="warning" action={<Link href={reportPageHref(reportPage)} className="font-semibold underline">Retry dropdown choices</Link>}>
   Department, program, batch and drive choices could not be loaded. The verified hiring results remain visible.
  </Banner>:null}
  <form method="get" action="/admin/placements/analytics" className="min-w-0 space-y-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
   <div className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_minmax(0,13rem)_auto]">
    <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Drive or company
     <Input type="search" name="q" defaultValue={q.q} maxLength={100} className="min-w-0 w-full"/></label>
    {select("jobId","Job",filters?.jobs??[])}
    <Button type="submit" className="min-h-11 w-full sm:col-span-2 md:col-span-1 md:min-h-9 md:w-auto">Refresh</Button>
   </div>
   <details className="min-w-0" open={Boolean(q.departmentId||q.programId||q.cohortId||q.appliedFrom||q.appliedTo)}>
    <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Filters</summary>
    <div className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-3)] pt-[var(--lms-space-2)] sm:grid-cols-2 xl:grid-cols-3">
     <SuperAdminHiringAcademicFilters
      key={[q.departmentId??"",q.programId??"",q.cohortId??""].join(":")}
      departments={filters?.departments??[]} programs={filters?.programs??[]}
      batches={filters?.batches??[]}
      selected={{departmentId:q.departmentId,programId:q.programId,cohortId:q.cohortId}}/>
     <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Applied from
      <DateInput mode="date" name="appliedFrom" defaultValue={q.appliedFrom??""} className="w-full"/></label>
     <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Applied through
      <DateInput mode="date" name="appliedTo" defaultValue={q.appliedTo??""} className="w-full"/></label>
    </div>
   </details>
   <Link href="/admin/placements/analytics" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)]">Clear all</Link>
  </form>
  {params.size?<p role="status" className="max-w-full break-words text-xs text-muted-foreground">Active filters: {[...params.entries()].map(([key,value])=>key+" = "+value).join(" · ")}</p>:null}
  <p role="status" className="text-sm text-body">{data.rows.length} matching drives across {groups.length} companies{data.truncated?" · Capped at 5,000 drives":""}</p>
  {data.truncated?<Banner tone="warning">
    This report reached its 5,000-drive safety limit. The headline metrics, funnel, company totals and CSV may be incomplete. Narrow the filters before using these figures for decisions.
  </Banner>:null}
  <dl className="grid min-w-0 grid-cols-2 gap-0 border-y border-border sm:grid-cols-3 lg:grid-cols-5">{(["totalApplications","applied","shortlisted","assessment","interview","offered","hired","rejected","withdrawn","waitlisted"] as const).map(key=>
   <div key={key} className="min-w-0 border-b border-r border-border px-[var(--lms-space-3)] py-[var(--lms-space-3)]"><dt className="text-[13px] font-semibold leading-4 capitalize text-[var(--lms-neutral-400)]">{hiringMetricLabel(key)}</dt>
    <dd className="mt-2 text-[16px] font-semibold leading-6 tabular-nums text-[var(--lms-heading)]">{totals[key]}</dd></div>)}</dl>
  <section className="min-w-0 border-b border-border pb-[var(--lms-space-4)]" aria-label="Hiring Funnel">
   <div className="flex flex-wrap items-start justify-between gap-3">
    <h2 className="text-[var(--lms-font-lg)] font-semibold leading-7 text-[var(--lms-heading)]">Hiring Funnel</h2>
    <p className="text-sm text-muted-foreground">Current persisted stages · the percentage is relative to the previous stage.</p>
   </div>
   <ol className="mt-[var(--lms-space-3)] grid min-w-0 gap-[var(--lms-space-3)] sm:grid-cols-2 lg:grid-cols-3">{funnel.map(step=>
    <li key={step.key} className={styles.step}>
     <span className={styles.label}>{step.label}</span>
     <strong className={styles.count}>{step.count.toLocaleString("en-IN")}</strong>
     <p className={styles.percent}>{step.percentPrevious===null?"No preceding stage":step.percentPrevious+"% of previous"}</p>
     <MetricBar className={styles.track+" mt-2"} role="img"
      label={step.label+": "+step.count+" applications"}
      value={step.widthPercent} maximum={100} unit="percent" />
    </li>)}</ol>
  </section>
  <p className="text-sm text-muted-foreground">Avg. time to shortlist: Not recorded. Stage-transition timestamps are required for an accurate duration.</p>
  <section aria-label="Company hiring results" className="min-w-0 space-y-4">
   <h2 className="text-[var(--lms-font-lg)] font-semibold leading-7 text-[var(--lms-heading)]">Company hiring results</h2>
   <DataTable columns={columns} rows={reportRows} getRowKey={row=>row.jobId}
     caption="Company hiring report" empty={<EmptyState title="No hiring results" description="No hiring results match these filters."/>}/>
   {data.rows.length>10?<div className="flex min-w-0 flex-col gap-3 border-t border-border pt-3 text-sm sm:flex-row sm:items-center sm:justify-between">
    <span>Showing {(reportPage-1)*10+1}–{Math.min(reportPage*10,data.rows.length)} of {data.rows.length} drives</span>
    <Pagination page={reportPage} pageCount={reportPages} label="Company hiring results pagination" hrefForPage={reportPageHref}/>
   </div>:null}
  </section>
  {groups.length?<section aria-label="Company totals" className="space-y-3">
   <h2 className="text-[var(--lms-font-lg)] font-semibold leading-7 text-[var(--lms-heading)]">Company totals</h2>
   <div className="grid min-w-0 gap-[var(--lms-space-3)] lg:grid-cols-2">{groups.map(group=>
     <article key={group.companyName} className="min-w-0 border-b border-border py-[var(--lms-space-4)]">
      <h3 className="break-words font-semibold text-[var(--lms-heading)] text-[var(--lms-font-md)] leading-[24px] min-[768px]:text-[var(--lms-font-lg)] min-[768px]:leading-[26px]">{group.companyName}</h3>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
       {metricKeys.map(key=><div key={key} className="min-w-0">
        <dt className="break-words text-body">{hiringMetricLabel(key)}</dt>
        <dd className="tabular-nums font-semibold text-foreground">{group[key]}</dd>
       </div>)}
      </dl>
     </article>)}</div>
  </section>:null}
  <p className="text-xs text-muted-foreground">Stage counts are current persisted application stages, not historical transitions. Hired stage is not a substitute for confirmed joining. This report does not infer match scores or private candidate contacts.</p>
 </div>;
}
