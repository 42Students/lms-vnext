import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getSuperAdminCompanyHiringReport} from "@/modules/admin-ui/super-admin-hiring-report-service";
import {getSuperAdminHiringReportFilters} from "@/modules/admin-ui/super-admin-hiring-report-filters-service";
import {superAdminHiringReportQuery,hiringCompanyRollups,COMPANY_HIRING_COLUMNS} from "@/modules/admin-ui/super-admin-hiring-report-model";
import {PageHeader} from "@/components/ui/page-header";
import {hiringFunnel, hiringMetricLabel} from "@/modules/admin-ui/super-admin-hiring-funnel-model";
export default async function SuperAdminPlacementAnalytics({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const raw=await searchParams;
 const parsed=superAdminHiringReportQuery.safeParse({
  q:raw.q,jobId:raw.jobId||undefined,departmentId:raw.departmentId||undefined,
  programId:raw.programId||undefined,cohortId:raw.cohortId||undefined,
  appliedFrom:raw.appliedFrom||undefined,appliedTo:raw.appliedTo||undefined,
 });
 if(!parsed.success)return <div className="space-y-4"><PageHeader eyebrow="Super Admin · Placements" title="Analytics"/>
  <p role="alert">Invalid analytics filters. Check the selected dates or filters.</p>
  <Link href="/admin/placements/analytics" className="text-primary-text underline">Clear all</Link></div>;
 const context=await getCurrentRequestContext();
 const [data,filters]=await Promise.all([
  getSuperAdminCompanyHiringReport(context,parsed.data),
  getSuperAdminHiringReportFilters(context),
 ]);
 const q=data.query;
 const params=new URLSearchParams();
 for(const key of ["q","jobId","departmentId","programId","cohortId","appliedFrom","appliedTo"] as const){
  if(q[key])params.set(key,q[key]!);
 }
 const groups=hiringCompanyRollups(data.rows);
 const totals=groups.reduce((out,row)=>({
  totalApplications:out.totalApplications+row.totalApplications,
  applied:out.applied+row.applied,shortlisted:out.shortlisted+row.shortlisted,
  assessment:out.assessment+row.assessment,interview:out.interview+row.interview,
  offered:out.offered+row.offered,hired:out.hired+row.hired,rejected:out.rejected+row.rejected,
  withdrawn:out.withdrawn+row.withdrawn,waitlisted:out.waitlisted+row.waitlisted,
 }),{totalApplications:0,applied:0,shortlisted:0,assessment:0,interview:0,offered:0,hired:0,rejected:0,withdrawn:0,waitlisted:0});
 const funnel=hiringFunnel(totals);
 const select=(key:"jobId"|"departmentId"|"programId"|"cohortId",label:string,values:readonly {id:string;name:string}[])=>(
  <label className="grid gap-1 text-sm font-semibold">{label}<select name={key} defaultValue={q[key]??""}
   className="min-h-11 min-w-0 rounded-md border border-border bg-surface px-2">
   <option value="">All {label.toLowerCase()}</option>{values.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
 );
 return <main className="space-y-5">
  <PageHeader eyebrow="Super Admin · Placements" title="Placement Analytics"
   description="Track the hiring funnel, conversion and company performance for the selected college. Filters apply consistently to the headline metrics, funnel and company report below."/>
  <form method="get" action="/admin/placements/analytics" className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
   <label className="grid gap-1 text-sm font-semibold">Drive or company
    <input name="q" defaultValue={q.q} maxLength={100} className="min-h-11 min-w-0 rounded-md border border-border bg-surface px-2"/></label>
   {select("jobId","Job",filters.jobs)}
   {select("departmentId","Department",filters.departments)}
   {select("programId","Program",filters.programs)}
   {select("cohortId","Batch",filters.batches)}
   <label className="grid gap-1 text-sm font-semibold">Applied from
    <input type="date" name="appliedFrom" defaultValue={q.appliedFrom??""} className="min-h-11 rounded-md border border-border bg-surface px-2"/></label>
   <label className="grid gap-1 text-sm font-semibold">Applied through
    <input type="date" name="appliedTo" defaultValue={q.appliedTo??""} className="min-h-11 rounded-md border border-border bg-surface px-2"/></label>
   <div className="flex flex-wrap items-end gap-3"><button type="submit" className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary">Refresh</button>
    <Link href="/admin/placements/analytics" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Clear all</Link></div>
  </form>
  {params.size?<p className="text-sm text-body">Active filters: {[...params.entries()].map(([key,value])=>key+" = "+value).join(" · ")}</p>:null}
  <div className="flex flex-wrap items-center justify-between gap-3">
   <p role="status" className="text-sm text-body">{data.rows.length} matching drives across {groups.length} companies{data.truncated?" · Capped at 5,000 drives":""}</p>
   <a href={"/api/admin/placements/hiring-report/export?"+params.toString()}
    className="inline-flex min-h-11 items-center rounded-md border border-border px-4 font-semibold text-primary-text">Export report (CSV) →</a>
  </div>
  <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{(["totalApplications","applied","shortlisted","assessment","interview","offered","hired","rejected","withdrawn","waitlisted"] as const).map(key=>
   <div key={key} className="rounded-xl border border-border bg-surface p-4"><dt className="text-sm capitalize text-muted-foreground">{hiringMetricLabel(key)}</dt>
    <dd className="mt-1 text-2xl font-semibold tabular-nums">{totals[key]}</dd></div>)}</dl>
  <section className="rounded-xl border border-border bg-surface p-4 sm:p-5" aria-label="Hiring Funnel">
   <div className="flex flex-wrap items-start justify-between gap-3">
    <h2 className="text-lg font-semibold">Hiring Funnel</h2>
    <p className="text-sm text-muted-foreground">Current persisted stages · the percentage is relative to the previous stage.</p>
   </div>
   <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{funnel.map(step=>
    <li key={step.key} className="min-w-0 rounded-lg border border-border bg-surface-subtle p-3">
     <span className="block text-sm font-semibold">{step.label}</span>
     <strong className="block text-2xl tabular-nums">{step.count.toLocaleString("en-IN")}</strong>
     <p className="text-xs text-muted-foreground">{step.percentPrevious===null?"No preceding stage":step.percentPrevious+"% of previous"}</p>
     <div className="mt-2 h-2 overflow-hidden rounded bg-muted" role="img"
      aria-label={step.label+": "+step.count+" applications"}>
      <div className="h-full rounded bg-primary" style={{width:step.widthPercent+"%"}} />
     </div>
    </li>)}</ol>
  </section>
  <p className="text-sm text-muted-foreground">Avg. time to shortlist: Not recorded. Stage-transition timestamps are required for an accurate duration.</p>
  <section className="overflow-x-auto rounded-xl border border-border bg-surface">
   <table className="w-full min-w-[55rem] text-left text-sm">
    <thead><tr className="border-b border-border bg-muted">{COMPANY_HIRING_COLUMNS.map(name=><th key={name} scope="col" className="p-3">{name}</th>)}</tr></thead>
    <tbody>{data.rows.map(row=><tr key={row.jobId} className="border-b border-border">
     <td className="p-3">{row.companyName}</td>
     <td className="p-3"><Link href={"/admin/placements/jobs/"+encodeURIComponent(row.jobId)} className="text-primary-text underline">{row.jobTitle}</Link></td>
     {(["totalApplications","applied","shortlisted","assessment","interview","offered","hired","rejected","withdrawn","waitlisted"] as const).map(key=><td key={key} className="p-3 tabular-nums">{row[key]}</td>)}
    </tr>)}</tbody>
    <tfoot>{groups.map(row=><tr key={row.companyName} className="border-t border-border bg-muted font-semibold">
     <th className="p-3 text-left" scope="row">{row.companyName}</th><td className="p-3">Company total</td>
     {(["applied","shortlisted","assessment","interview","offered","hired","rejected"] as const).map(key=><td key={key} className="p-3 tabular-nums">{row[key]}</td>)}
    </tr>)}</tfoot>
   </table>
  </section>
  {!data.rows.length?<p role="status" className="text-sm text-body">No hiring results match these filters.</p>:null}
  <p className="text-xs text-muted-foreground">Stage counts are current persisted application stages, not historical transitions. Hired stage is not a substitute for confirmed joining. This report does not infer match scores or private candidate contacts.</p>
 </main>;
}
