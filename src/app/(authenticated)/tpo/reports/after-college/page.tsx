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
  return <p role="alert">Invalid batch. <Link href="/tpo/reports/after-college">Clear filters</Link></p>;
 const data=await getTpoAfterCollegeReport(ctx,{collegeId:ctx.membership.collegeId,batchId,branchId});
 const branches=new Map(data.branches.map(row=>[row.id,row.name]));
 if(branchId&&!branches.has(branchId))return <p role="alert">Invalid branch for this college. <Link href="/tpo/reports/after-college">Clear filters</Link></p>;
 const query=new URLSearchParams({...batchId?{batchId}: {},...branchId?{branchId}:{}});
 const displayedCount=Math.min(data.rows.length,300);
 const pageCount=Math.max(1,Math.ceil(displayedCount/25));
 const requestedPage=Number(first(raw.page)??"1");
 const page=Number.isSafeInteger(requestedPage)?Math.max(1,Math.min(pageCount,requestedPage)):1;
 const pageHref=(nextPage:number)=>{const next=new URLSearchParams(query);next.set("page",String(nextPage));return "/tpo/reports/after-college?"+next.toString();};
 return <div data-tpo-presentation-report className="space-y-5">
  <Link href="/tpo/reports" className="text-sm font-semibold text-link underline lms-inline-link">← All reports</Link>
      <TpoReportPresentation />
  <PageHeader eyebrow="TPO · Reports" title="After college"
   description="Student-reported destinations after graduation, including higher studies, entrepreneurship, competitive exams and job searching."/>
      <Suspense fallback={null}><TpoReportSavedFilters path="/tpo/reports/after-college" collegeId={ctx.membership.collegeId} userId={ctx.user.id}/></Suspense>
  {!data.available?<p role="status" className="rounded border border-border p-4">
    After-college outcomes storage is unavailable. This page does not infer destinations.
   </p>:<>
   <form method="get" className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
    <label className="grid gap-1 text-sm">Batch
     <Select name="batchId" defaultValue={batchId??""} className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-border p-2">
      <option value="">All current batches</option>
      {batches.batches.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
     </Select></label>
    <label className="grid gap-1 text-sm">Branch
     <Select name="branchId" defaultValue={branchId??""} className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-border p-2">
      <option value="">All branches</option>
      {[...branches].sort((a,b)=>a[1].localeCompare(b[1])).map(([id,label])=><option key={id} value={id}>{label}</option>)}
     </Select></label>
    <Button type="submit" className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] bg-primary px-4 font-[650] text-white">Filter</Button>
    <Link href="/tpo/reports/after-college" className="text-link underline lms-inline-link">Clear</Link>
    <a href={"/api/placements/tpo/reports/after-college?"+query.toString()}
      className="text-link underline">Download CSV</a>
   </form>
   <p className="text-sm text-body">{data.total} students in this reporting population. NAAC 5.2 / NIRF working data only; unreported choices remain Not decided.</p>
   <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
    {AFTER_COLLEGE_OUTCOMES.map(key=><div key={key} className="rounded border border-border p-4">
     <p className="text-xs font-semibold">{AFTER_COLLEGE_LABELS[key]}</p>
     <p className="mt-2 text-2xl font-bold tabular-nums">{data.counts[key]}</p>
    </div>)}
   </div>
   <DataTable rows={data.rows.slice((page-1)*25,page*25)} getRowKey={row=>row.membershipId}
    caption="After college"
    empty={<p role="status">No students match these filters.</p>}
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
