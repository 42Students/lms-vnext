import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
import {getSuperAdminCompanyHiringReport} from "@/modules/admin-ui/super-admin-hiring-report-service";
import {getSuperAdminHiringReportFilters} from "@/modules/admin-ui/super-admin-hiring-report-filters-service";
import {superAdminHiringReportQuery,hiringCompanyRollups,COMPANY_HIRING_COLUMNS} from "@/modules/admin-ui/super-admin-hiring-report-model";
import {PageHeader} from "@/components/ui/page-header";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {EmptyState} from "@/components/ui/empty-state";
import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
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
  <Link href="/admin/placements/analytics" className="inline-flex min-h-11 items-center text-primary-text underline">Clear all</Link></div>;
 const context=await getCurrentRequestContext();
 if(!context.adminScope?.collegeId)return <div className="min-w-0 space-y-5">
  <PageHeader eyebrow="Super Admin · Placements" title="Placement Analytics"
   description="Track the hiring funnel, conversion and company performance for the selected college. Filters apply consistently to the headline metrics, funnel and company report below."/>
  <EmptyState title="Select a college to continue" description="Choose a college in the Super Admin scope selector before reviewing placement analytics."/>
 </div>;
 requireSuperAdminSelectedCollege(context,"placements.read");
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
 const metricKeys=["totalApplications","applied","shortlisted","assessment","interview","offered","hired","rejected","withdrawn","waitlisted"] as const;
 type Row=(typeof data.rows)[number];
 const columns:DataTableColumn<Row>[]=[
  {key:"company",header:COMPANY_HIRING_COLUMNS[0]??"Company",mobilePriority:"primary",cell:row=>row.companyName},
  {key:"drive",header:COMPANY_HIRING_COLUMNS[1]??"Drive",mobilePriority:"secondary",cell:row=>
   <Link href={"/admin/placements/jobs/"+encodeURIComponent(row.jobId)}
    className="inline-flex min-h-11 items-center break-words font-semibold text-primary-text underline">
     {row.jobTitle}</Link>},
  ...metricKeys.map((key,index)=>({
    key,header:COMPANY_HIRING_COLUMNS[index+2]??key,mobilePriority:"secondary" as const,
    cell:(row:Row)=><span className="tabular-nums">{row[key]}</span>,
  })),
 ];
 const select=(key:"jobId"|"departmentId"|"programId"|"cohortId",label:string,values:readonly {id:string;name:string}[])=>(
  <label className="grid gap-1 text-sm font-semibold">{label}<Select name={key} defaultValue={q[key]??""}
   className="min-w-0">
   <option value="">All {label.toLowerCase()}</option>{values.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</Select></label>
 );
 return <div className="min-w-0 space-y-5">
  <PageHeader eyebrow="Super Admin · Placements" title="Placement Analytics"
   description="Track the hiring funnel, conversion and company performance for the selected college. Filters apply consistently to the headline metrics, funnel and company report below."/>
  <form method="get" action="/admin/placements/analytics" className="grid min-w-0 grid-cols-1 gap-3 border-b border-border pb-4 sm:grid-cols-2 lg:grid-cols-4">
   <label className="grid gap-1 text-sm font-semibold">Drive or company
    <Input name="q" defaultValue={q.q} maxLength={100} className="min-w-0"/></label>
   {select("jobId","Job",filters.jobs)}
   {select("departmentId","Department",filters.departments)}
   {select("programId","Program",filters.programs)}
   {select("cohortId","Batch",filters.batches)}
   <label className="grid gap-1 text-sm font-semibold">Applied from
    <Input type="date" name="appliedFrom" defaultValue={q.appliedFrom??""} className="min-w-0"/></label>
   <label className="grid gap-1 text-sm font-semibold">Applied through
    <Input type="date" name="appliedTo" defaultValue={q.appliedTo??""} className="min-w-0"/></label>
   <div className="flex flex-wrap items-end gap-3"><Button type="submit">Refresh</Button>
    <Link href="/admin/placements/analytics" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Clear all</Link></div>
  </form>
  {params.size?<p className="text-sm text-body">Active filters: {[...params.entries()].map(([key,value])=>key+" = "+value).join(" · ")}</p>:null}
  <div className="flex flex-wrap items-center justify-between gap-3">
   <p role="status" className="text-sm text-body">{data.rows.length} matching drives across {groups.length} companies{data.truncated?" · Capped at 5,000 drives":""}</p>
   <a href={"/api/admin/placements/hiring-report/export?"+params.toString()}
    className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 font-semibold text-primary-text">Export report (CSV) →</a>
  </div>
  {data.truncated?<p role="alert" className="border-l-2 border-warning bg-warning-subtle px-4 py-3 text-sm text-body">
    This report reached its 5,000-drive safety limit. The headline metrics, funnel, company totals and CSV may be incomplete. Narrow the filters before using these figures for decisions.
  </p>:null}
  <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{(["totalApplications","applied","shortlisted","assessment","interview","offered","hired","rejected","withdrawn","waitlisted"] as const).map(key=>
   <div key={key} className="min-w-0 border-b border-border px-1 py-3"><dt className="text-sm capitalize text-muted-foreground">{hiringMetricLabel(key)}</dt>
    <dd className="mt-1 text-2xl font-semibold tabular-nums">{totals[key]}</dd></div>)}</dl>
  <section className="border-b border-border pb-5" aria-label="Hiring Funnel">
   <div className="flex flex-wrap items-start justify-between gap-3">
    <h2 className="text-lg font-semibold">Hiring Funnel</h2>
    <p className="text-sm text-muted-foreground">Current persisted stages · the percentage is relative to the previous stage.</p>
   </div>
   <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{funnel.map(step=>
    <li key={step.key} className="min-w-0 border-l-2 border-border pl-3 py-1">
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
  <section aria-label="Company hiring results" className="min-w-0 space-y-4">
   <h2 className="text-lg font-semibold">Company hiring results</h2>
   <DataTable columns={columns} rows={data.rows} getRowKey={row=>row.jobId}
     caption="Company hiring report" empty={<p role="status" className="text-sm text-body">
       No hiring results match these filters.</p>}/>
  </section>
  {groups.length?<section aria-label="Company totals" className="space-y-3">
   <h2 className="text-lg font-semibold">Company totals</h2>
   <div className="grid min-w-0 gap-3 lg:grid-cols-2">{groups.map(group=>
     <article key={group.companyName} className="min-w-0 border-b border-border py-4">
      <h3 className="break-words text-base font-semibold">{group.companyName}</h3>
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
