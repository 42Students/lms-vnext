import {TPO_OWNER_PAGE_COPY} from "@/modules/placements/tpo-page-copy";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { listTpoBatches } from "@/modules/placements/tpo-batch-workspace-read-service";
import {countTpoLearnersWithoutClass} from "@/modules/placements/tpo-batch-unassigned-students-service";
import { listTpoBatchCardEligibility } from "@/modules/placements/tpo-batch-directory-counts-service";
import { listTpoBatchJourneyCounts } from "@/modules/placements/tpo-batch-journey-service";
import { batchEligibilityShare } from "@/modules/placements/tpo-batch-eligibility-summary-model";
import { PageHeader } from "@/components/ui/page-header";
import { summarizeTpoBatchStates } from "@/modules/placements/tpo-batch-kpi-model";
import { tpoBatchNextAction, tpoBatchNextActionLink } from "@/modules/placements/tpo-batch-next-action-model";
import { tpoBatchDeadlineLabel } from "@/modules/placements/tpo-batch-deadline-label-model";
import { tpoBatchPageSchema, paginateTpoBatches, tpoBatchPageHref,tpoBatchClearFiltersHref,tpoBatchEmptyReason } from "@/modules/placements/tpo-batch-directory-pagination-model";
import { tpoBatchDeadlineFilterSchema, filterTpoBatchDeadline } from "@/modules/placements/tpo-batch-deadline-filter-model";
import { tpoBatchDepartmentSchema, filterTpoBatchDepartment, listTpoBatchDepartments } from "@/modules/placements/tpo-batch-department-model";
import { tpoBatchProgramSchema, filterTpoBatchProgram, listTpoBatchPrograms } from "@/modules/placements/tpo-batch-program-model";
import { tpoBatchSortSchema, sortTpoBatchNames } from "@/modules/placements/tpo-batch-sort-model";
import { batchDirectoryFilterSchema, filterTpoBatchDirectory, batchDirectoryState } from "@/modules/placements/tpo-batch-directory-filter-model";
export const dynamic="force-dynamic";

export default async function TpoBatchesPage({searchParams}:{searchParams:Promise<{q?:string|string[];state?:string|string[];sort?:string|string[];program?:string|string[];department?:string|string[];deadline?:string|string[];page?:string|string[];pageSize?:string|string[]}>}){
 const raw=await searchParams,parsed=batchDirectoryFilterSchema.safeParse({q:Array.isArray(raw.q)?raw.q[0]:raw.q,state:Array.isArray(raw.state)?raw.state[0]:raw.state});
 const sortParsed=tpoBatchSortSchema.safeParse(Array.isArray(raw.sort)?raw.sort[0]:raw.sort);
 const programParsed=tpoBatchProgramSchema.safeParse(Array.isArray(raw.program)?raw.program[0]:raw.program);
 const departmentParsed=tpoBatchDepartmentSchema.safeParse(Array.isArray(raw.department)?raw.department[0]:raw.department);
 const deadlineParsed=tpoBatchDeadlineFilterSchema.safeParse(Array.isArray(raw.deadline)?raw.deadline[0]:raw.deadline);
 const pageParsed=tpoBatchPageSchema.safeParse({page:Array.isArray(raw.page)?raw.page[0]:raw.page,pageSize:Array.isArray(raw.pageSize)?raw.pageSize[0]:raw.pageSize});
 if(!pageParsed.success)return <div role="alert">Invalid batch page. <Link href="/tpo/batches">Clear filters</Link></div>;
 if(!deadlineParsed.success)return <div role="alert">Invalid deadline filter. <Link href="/tpo/batches">Clear filters</Link></div>;
 if(!departmentParsed.success)return <div role="alert">Invalid department filter. <Link href="/tpo/batches">Clear filters</Link></div>;
 if(!programParsed.success)return <div role="alert">Invalid program filter. <Link href="/tpo/batches">Clear filters</Link></div>;
 if(!sortParsed.success)return <div role="alert">Invalid batch sorting. <Link href="/tpo/batches">Clear filters</Link></div>;
 if(!parsed.success)return <div role="alert">Invalid search. <Link href="/tpo/batches">Clear search</Link></div>;
 const context=await getCurrentRequestContext();
 const [data,unassigned]=await Promise.all([listTpoBatches(context),countTpoLearnersWithoutClass(context)]);
 const selected=filterTpoBatchDepartment(filterTpoBatchProgram(filterTpoBatchDirectory(data.batches,data.ready?parsed.data:{...parsed.data,state:"ALL"}),programParsed.data),departmentParsed.data);
 const batches=sortTpoBatchNames(data.ready?filterTpoBatchDeadline(selected,deadlineParsed.data,new Date()):selected,sortParsed.data);
 const batchPage=paginateTpoBatches(batches,pageParsed.data.page,pageParsed.data.pageSize);
 const [eligibility,journey]=await Promise.all([
  listTpoBatchCardEligibility(context,data.batches.map(batch=>batch.id)),
  listTpoBatchJourneyCounts(context,data.batches.map(batch=>batch.id)),
 ]);
 const pageFilters={q:parsed.data.q,state:parsed.data.state,program:programParsed.data,department:departmentParsed.data,deadline:deadlineParsed.data,sort:sortParsed.data};
 const programs=listTpoBatchPrograms(data.batches);
 const departments=listTpoBatchDepartments(data.batches);
 const summary=summarizeTpoBatchStates(data.batches);
 const working=data.batches.filter(batch=>!batch.finishedAt);
 const activeCount=data.batches.filter(batch=>!batch.finishedAt && Boolean(batch.invitedAt)).length;
 const eligibleCount=working.reduce((sum,batch)=>sum+(eligibility.get(batch.id)?.eligible??0),0);
 const pendingCount=working.reduce((sum,batch)=>sum+(eligibility.get(batch.id)?.undecided??0),0);
 const placedCount=working.reduce((sum,batch)=>sum+(journey.get(batch.id)?.placed??0),0);
 return <main className="min-w-0 space-y-5">
  <PageHeader eyebrow="TPO · Batches" title={TPO_OWNER_PAGE_COPY.placementEligibility} description="Make placement eligibility decisions cohort by cohort. This list does not guess inherited learner eligibility."/>
  <form className="flex flex-wrap gap-2" action="/tpo/batches" method="get">
   <label className="min-w-0 flex-1 text-sm">Search batches<input type="search" name="q" defaultValue={parsed.data.q??""} maxLength={100} className="mt-1 block min-h-11 w-full rounded border border-border bg-surface px-3"/></label>
   <label className="text-sm">State<select name="state" defaultValue={parsed.data.state} className="mt-1 block min-h-11 rounded border border-border bg-surface px-3"><option value="ALL">All</option><option value="PLANNING">Planning</option><option value="INVITED">Invited</option><option value="FINISHED">Finished</option></select></label>
   <label className="text-sm">Program<select name="program" defaultValue={programParsed.data} className="mt-1 block min-h-11 rounded border border-border bg-surface px-3"><option value="">All programs</option>{programs.map(p=><option key={p} value={p}>{p}</option>)}</select></label>
   <label className="text-sm">Department<select name="department" defaultValue={departmentParsed.data} className="mt-1 block min-h-11 rounded border border-border bg-surface px-3"><option value="">All departments</option>{departments.map(d=><option key={d} value={d}>{d}</option>)}</select></label>
   <label className="text-sm">Deadline<select name="deadline" defaultValue={deadlineParsed.data} className="mt-1 block min-h-11 rounded border border-border bg-surface px-3"><option value="ALL">All deadlines</option><option value="NEXT_7_DAYS">Due in next 7 days</option><option value="PAST_DUE">Past due</option><option value="NO_DEADLINE">No deadline recorded</option></select></label>
   <label className="text-sm">Sort<select name="sort" defaultValue={sortParsed.data} className="mt-1 block min-h-11 rounded border border-border bg-surface px-3"><option value="NAME_ASC">Name A–Z</option><option value="NAME_DESC">Name Z–A</option><option value="DEADLINE_ASC">Deadline earliest</option><option value="DEADLINE_DESC">Deadline latest</option></select></label>
   <label className="text-sm">Page size<select name="pageSize" defaultValue={String(pageParsed.data.pageSize)} className="mt-1 block min-h-11 rounded border border-border bg-surface px-3"><option value="12">12</option><option value="24">24</option><option value="48">48</option></select></label>
   <button type="submit" className="min-h-11 self-end rounded bg-primary px-4 text-on-primary">Search</button>
  </form>
  {unassigned>0?<p role="status" className="rounded-md border border-warning bg-surface p-3 text-sm text-warning">
    {unassigned} {unassigned===1?"student is":"students are"} not in any active class. Assign their academic classes before deciding placement eligibility.
  </p>:null}
  {!data.ready&&deadlineParsed.data!=="ALL"?<p role="status" className="text-sm">Deadline filtering is unavailable until lifecycle storage is registered. Showing all matching batch names.</p>:null}
  {!data.ready&&parsed.data.state!=="ALL"?<p role="status" className="text-sm">State filtering is unavailable until batch lifecycle storage is registered. Showing all matching batch names.</p>:null}
  {!data.ready?<p role="status" className="rounded border border-border p-3">Placement batch lifecycle migration is pending. Academic cohorts remain visible; invitation and completion status is unavailable.</p>:null}
  <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[
  ["Open for placements",activeCount],["Students eligible",eligibleCount],["Not decided yet",pendingCount],["Placed (offer evidence)",placedCount],
  ].map(([label,value])=><div key={label} className="rounded-lg border border-border p-3"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-semibold">{data.ready?value:"—"}</dd></div>)}</dl>
  <p role="status" className="text-sm text-muted-foreground">{batches.length} matching batches · Showing {batchPage.from}–{batchPage.to} · Page {batchPage.page} of {batchPage.totalPages}</p>
  {pageParsed.data.page!==batchPage.page?<p role="status" className="rounded border border-border p-3 text-sm text-body">The requested batch page no longer exists for these filters. Showing the last available page.</p>:null}
  <nav aria-label="Batch pages" className="flex flex-wrap gap-3 text-sm">
   {batchPage.hasPrev?<Link className="min-h-10 inline-flex items-center rounded border border-border px-3 text-primary-text" href={tpoBatchPageHref(pageFilters,batchPage.page-1,pageParsed.data.pageSize)}>Previous page</Link>:null}
   {batchPage.hasNext?<Link className="min-h-10 inline-flex items-center rounded border border-border px-3 text-primary-text" href={tpoBatchPageHref(pageFilters,batchPage.page+1,pageParsed.data.pageSize)}>Next page</Link>:null}

  </nav>
  {batches.length===0?<section role="status" className="space-y-2 rounded border border-border p-4">
   <p>{tpoBatchEmptyReason(data.batches.length,batches.length)==="NO_BATCHES"?
     "No placement batches or academic cohorts are available to list yet.":
     "No batches match these filters."}</p>
   {data.batches.length>0?<Link href={tpoBatchClearFiltersHref(pageParsed.data.pageSize)}
      className="inline-flex min-h-11 items-center text-primary-text underline">Clear batch filters</Link>:null}
  </section>:<ul className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">{batchPage.items.map(b=><li key={b.id} className="min-w-0 space-y-2 rounded-xl border border-border bg-surface p-4">
    <h2 className="break-words font-semibold"><Link href={"/tpo/batches/"+b.id} className="text-primary-text underline">{b.name}</Link></h2>
    <p className="text-sm">{b.department===b.program?b.program:b.department+" · "+b.program}{b.startYear?" · "+b.startYear+(b.endYear?"–"+b.endYear:""):""}</p>
    <p className="text-xs text-muted-foreground">{data.ready?batchDirectoryState(b):"Lifecycle pending"}</p>
    <p className="text-xs text-muted-foreground">{tpoBatchDeadlineLabel(b.deadline,data.ready)}</p>
    {(() => {
      const summary = eligibility.get(b.id);
      if (!summary) return <p role="status" className="text-sm">Eligibility counts unavailable.</p>;
      const split = [
        { key: "eligible", label: "Eligible", count: summary.eligible, color: "bg-success" },
        { key: "ineligible", label: "Ineligible", count: summary.ineligible, color: "bg-error" },
        { key: "undecided", label: "Not decided", count: summary.undecided, color: "bg-muted-foreground" },
        { key: "review", label: "Needs review", count: summary.needsReview, color: "bg-warning" },
      ] as const;
      return <div className="space-y-2">
        <p className="text-xs text-muted-foreground">{summary.assessed} {summary.assessed===1?"student":"students"} in batch</p>
        <dl className="grid grid-cols-2 gap-1 text-xs">
         <div><dt className="text-muted-foreground">Invited</dt><dd className="font-semibold">{b.invitedAt?"Yes":"Not yet"}</dd></div>
         <div><dt className="text-muted-foreground">Registered</dt><dd className="font-semibold">{journey.get(b.id)?.registered??0}</dd></div>
         <div><dt className="text-muted-foreground">Verified profiles</dt><dd className="font-semibold">{journey.get(b.id)?.verified??0}</dd></div>
         <div><dt className="text-muted-foreground">Placed (offer evidence)</dt><dd className="font-semibold">{journey.get(b.id)?.placed??0}</dd></div>
        </dl>
        <dl className="grid grid-cols-2 gap-1 text-xs">
          {split.map(part=><div key={part.key}>
            <dt className="text-muted-foreground">{part.label}</dt>
            <dd className="font-semibold tabular-nums">{part.count}</dd>
          </div>)}
        </dl>
        <div role="img" aria-label={split.map(part=>part.label+": "+part.count).join(", ")}
          className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          {split.map(part=><div key={part.key} className={part.color}
            style={{width: batchEligibilityShare(part.count,summary.assessed)+"%"}} />)}
        </div>
        {summary.needsReview>0?<p className="text-xs text-warning">Ambiguous class membership requires review.</p>:null}
      </div>;
    })()}
    <Link href={"/tpo/batches/"+b.id+tpoBatchNextActionLink(b,data.ready,eligibility.get(b.id))} className="inline-flex min-h-11 items-center rounded border border-border px-3 text-sm font-semibold">{tpoBatchNextAction(b,data.ready)}</Link>
   </li>)}</ul>}
 </main>;
}
