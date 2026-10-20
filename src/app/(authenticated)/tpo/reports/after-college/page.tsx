import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {TpoReportPresentation} from "@/components/placements/tpo-report-presentation";
import {Suspense} from "react";
import {TpoReportSavedFilters} from "@/components/placements/tpo-report-saved-filters";
import Link from "next/link";
import {DataTable} from "@/components/ui/data-table";
import {Pagination} from "@/components/ui/pagination";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {SummaryStrip} from "@/components/ui/summary-strip";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import {hasMembershipRole} from "@/modules/identity/context";
import {listTpoBatches} from "@/modules/placements/tpo-batch-workspace-read-service";
import {getTpoAfterCollegeReport} from "@/modules/placements/tpo-after-college-report-service";
import {AFTER_COLLEGE_LABELS,AFTER_COLLEGE_OUTCOMES} from "@/modules/placements/tpo-after-college-model";
export const dynamic="force-dynamic";
type Raw=Record<string,string|string[]|undefined>;
const first=(v:string|string[]|undefined)=>Array.isArray(v)?v[0]:v;
export default async function AfterCollegeReportPage({searchParams}:{searchParams:Promise<Raw>}){
 const ctx=await getCurrentRequestContext();
 if(!ctx.membership||!hasMembershipRole(ctx,"TPO"))redirect("/dashboard");
 const raw=await searchParams;
 const batches=await listTpoBatches(ctx);
 const batchId=first(raw.batchId)||undefined,branchId=first(raw.branchId)||undefined;
 if(batchId&&!batches.batches.some(batch=>batch.id===batchId))
  return <div className="space-y-4"><PageHeader title="After college"/><ErrorState title="Invalid batch" description="Choose an available batch for this college." action={<Link href="/tpo/reports/after-college" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Clear filters</Link>}/></div>;
 const data=await getTpoAfterCollegeReport(ctx,{collegeId:ctx.membership.collegeId,batchId,branchId});
 const branches=new Map(data.branches.map(row=>[row.id,row.name]));
 if(branchId&&!branches.has(branchId))return <div className="space-y-4"><PageHeader title="After college"/><ErrorState title="Invalid branch" description="Choose a branch in this college." action={<Link href="/tpo/reports/after-college" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Clear filters</Link>}/></div>;
 const query=new URLSearchParams({...batchId?{batchId}: {},...branchId?{branchId}:{}});
 const displayedCount=Math.min(data.rows.length,300);
 const pageCount=Math.max(1,Math.ceil(displayedCount/25));
 const requestedPage=Number(first(raw.page)??"1");
 const page=Number.isSafeInteger(requestedPage)?Math.max(1,Math.min(pageCount,requestedPage)):1;
 const pageHref=(nextPage:number)=>{const next=new URLSearchParams(query);next.set("page",String(nextPage));return "/tpo/reports/after-college?"+next.toString();};
 return <div data-tpo-presentation-report className="space-y-5">
  <PageHeader title="After college"
   description="Student-reported destinations after graduation, including higher studies, entrepreneurship, competitive exams and job searching."
   actions={<><Link href="/tpo/reports" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text md:min-h-9 md:w-auto">← All reports</Link>{data.available?<a href={"/api/placements/tpo/reports/after-college?"+query.toString()} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text md:min-h-9 md:w-auto">Download CSV</a>:null}</>}/>
  <TpoReportPresentation />
      <Suspense fallback={null}><TpoReportSavedFilters path="/tpo/reports/after-college" collegeId={ctx.membership.collegeId} userId={ctx.user.id}/></Suspense>
  {!data.available?<Alert tone="warning">After-college outcomes storage is unavailable. This page does not infer destinations.</Alert>:<>
   <form method="get" className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
    <label className="grid w-full min-w-0 basis-full gap-1 text-sm md:w-[220px] md:basis-auto">Batch
     <Select name="batchId" defaultValue={batchId??""} className="min-h-11 w-full md:min-h-9">
      <option value="">All current batches</option>
      {batches.batches.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
     </Select></label>
    <label className="grid w-full min-w-0 basis-full gap-1 text-sm md:w-[220px] md:basis-auto">Branch
     <Select name="branchId" defaultValue={branchId??""} className="min-h-11 w-full md:min-h-9">
      <option value="">All branches</option>
      {[...branches].sort((a,b)=>a[1].localeCompare(b[1])).map(([id,label])=><option key={id} value={id}>{label}</option>)}
     </Select></label>
    <Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">Filter</Button>
    <Link href="/tpo/reports/after-college" className="inline-flex min-h-11 w-full items-center justify-center font-semibold text-link underline md:min-h-9 md:w-auto">Clear</Link>

   </form>
   <p className="text-sm text-body">{data.total} students in this reporting population. NAAC 5.2 / NIRF working data only; unreported choices remain Not decided.</p>
   <SummaryStrip label="After-college outcomes" steps={AFTER_COLLEGE_OUTCOMES.map(key=>({label:AFTER_COLLEGE_LABELS[key],value:data.counts[key]}))}/>
   <DataTable rows={data.rows.slice((page-1)*25,page*25)} getRowKey={row=>row.membershipId}
    caption="After college"
    empty={<EmptyState title="No students match these filters."/>}
    columns={[
     {key:"student",header:"Student",cell:row=>row.displayName,mobilePriority:"primary"},
     {key:"roll",header:"Roll no.",cell:row=>row.rollNumber??"—",mobilePriority:"secondary"},
     {key:"batch",header:"Batch",cell:row=>row.cohortName,mobilePriority:"secondary"},
     {key:"branch",header:"Branch",cell:row=>row.branchName,mobilePriority:"secondary"},
     {key:"after",header:"After college",cell:row=>AFTER_COLLEGE_LABELS[row.outcome],mobilePriority:"secondary"},
     {key:"applications",header:"Applications",cell:row=>row.applicationCount,mobilePriority:"secondary"},
    ]}
   />
   <Pagination page={page} pageCount={pageCount} hrefForPage={pageHref} label="After-college report pages"/>
   {data.rows.length>300?<p className="text-xs text-muted-foreground">Showing the first 300 rows. Download CSV for the complete filtered list.</p>:null}
  </>}
 </div>;
}
