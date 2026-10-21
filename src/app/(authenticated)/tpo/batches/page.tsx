import { Disclosure } from "@/components/ui/disclosure";
import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {TpoBatchUndoControl} from "@/components/tpo/tpo-batch-undo-control";
import {listTpoBatchRecentCohortActions} from "@/modules/placements/tpo-batch-recent-decision-service";
import {TPO_OWNER_PAGE_COPY} from "@/modules/placements/tpo-page-copy";
import Link from "next/link";
import {TpoBatchInstantSearch} from "@/components/tpo/tpo-batch-instant-search";
import { getCurrentRequestContext } from "@/auth/request-context";
import {redirect} from "next/navigation";
import {hasMembershipRole} from "@/modules/identity/context";
import {requireTpoBatchActor} from "@/modules/placements/tpo-batch-workspace-read-service";
import { listTpoBatches } from "@/modules/placements/tpo-batch-workspace-read-service";
import {countTpoLearnersWithoutClass} from "@/modules/placements/tpo-batch-unassigned-students-service";
import { listTpoBatchCardEligibility } from "@/modules/placements/tpo-batch-directory-counts-service";
import { listTpoBatchJourneyCounts } from "@/modules/placements/tpo-batch-journey-service";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Banner } from "@/components/ui/banner";
import { InlineNotice } from "@/components/ui/inline-notice";
import { EmptyState } from "@/components/ui/empty-state";
import { tpoBatchNextAction, tpoBatchNextActionLink } from "@/modules/placements/tpo-batch-next-action-model";
import { tpoBatchCardDeadlineLabel } from "@/modules/placements/tpo-batch-deadline-label-model";
import { tpoBatchPageSchema, paginateTpoBatches, tpoBatchPageHref,tpoBatchClearFiltersHref,tpoBatchEmptyReason } from "@/modules/placements/tpo-batch-directory-pagination-model";
import { tpoBatchDeadlineFilterSchema, filterTpoBatchDeadline } from "@/modules/placements/tpo-batch-deadline-filter-model";
import { tpoBatchDepartmentSchema, filterTpoBatchDepartment, listTpoBatchDepartments } from "@/modules/placements/tpo-batch-department-model";
import { tpoBatchProgramSchema, filterTpoBatchProgram, listTpoBatchPrograms } from "@/modules/placements/tpo-batch-program-model";
import { tpoBatchSortSchema, sortTpoBatchNames } from "@/modules/placements/tpo-batch-sort-model";
import { batchDirectoryFilterSchema, filterTpoBatchDirectory, batchDirectoryState } from "@/modules/placements/tpo-batch-directory-filter-model";
import {tpoBatchPlacementState,tpoBatchMatchesPlacementState} from "@/modules/placements/tpo-batch-state-label-model";
import {visibleTpoBatchWorkingSet} from "@/modules/placements/tpo-batch-working-set-model";
import {sortTpoBatchWorkingPriority} from "@/modules/placements/tpo-batch-priority-sort-model";
import {parseTpoBatchFacetQuery,filterTpoBatchFacets} from "@/modules/placements/tpo-batch-facets-model";
import {TpoBatchFacetFilters} from "@/components/tpo/tpo-batch-facet-filters";
export const dynamic="force-dynamic";

export default async function TpoBatchesPage({searchParams}:{searchParams:Promise<{q?:string|string[];state?:string|string[];sort?:string|string[];program?:string|string[];department?:string|string[];deadline?:string|string[];page?:string|string[];pageSize?:string|string[];showOlder?:string|string[];facetState?:string|string[];facetProgram?:string|string[];facetDepartment?:string|string[];facetFinalYear?:string|string[]}>}){
 // Authorize before even returning filter feedback to a stale or foreign actor.

 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 await requireTpoBatchActor(context);
 const raw=await searchParams;
 const scalarKeys=["q","state","sort","program","department","deadline","page","pageSize","showOlder"] as const;
 if(scalarKeys.some(key=>Array.isArray(raw[key])))
  return <div className="min-w-0 space-y-4"><PageHeader title={TPO_OWNER_PAGE_COPY.placementEligibility}/><Alert tone="error">Invalid batch filters. <Link className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9" href="/tpo/batches">Clear filters</Link></Alert></div>;
 const parsed=batchDirectoryFilterSchema.safeParse({q:raw.q,state:raw.state});
 const sortParsed=tpoBatchSortSchema.safeParse(Array.isArray(raw.sort)?raw.sort[0]:raw.sort);
 const programParsed=tpoBatchProgramSchema.safeParse(Array.isArray(raw.program)?raw.program[0]:raw.program);
 const departmentParsed=tpoBatchDepartmentSchema.safeParse(Array.isArray(raw.department)?raw.department[0]:raw.department);
 const deadlineParsed=tpoBatchDeadlineFilterSchema.safeParse(Array.isArray(raw.deadline)?raw.deadline[0]:raw.deadline);
 const pageParsed=tpoBatchPageSchema.safeParse({page:Array.isArray(raw.page)?raw.page[0]:raw.page,pageSize:Array.isArray(raw.pageSize)?raw.pageSize[0]:raw.pageSize});
 if(!pageParsed.success)return <div className="min-w-0 space-y-4"><PageHeader title={TPO_OWNER_PAGE_COPY.placementEligibility}/><Alert tone="error">Invalid batch page. <Link className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9" href="/tpo/batches">Clear filters</Link></Alert></div>;
 if(!deadlineParsed.success)return <div className="min-w-0 space-y-4"><PageHeader title={TPO_OWNER_PAGE_COPY.placementEligibility}/><Alert tone="error">Invalid deadline filter. <Link className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9" href="/tpo/batches">Clear filters</Link></Alert></div>;
 if(!departmentParsed.success)return <div className="min-w-0 space-y-4"><PageHeader title={TPO_OWNER_PAGE_COPY.placementEligibility}/><Alert tone="error">Invalid department filter. <Link className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9" href="/tpo/batches">Clear filters</Link></Alert></div>;
 if(!programParsed.success)return <div className="min-w-0 space-y-4"><PageHeader title={TPO_OWNER_PAGE_COPY.placementEligibility}/><Alert tone="error">Invalid program filter. <Link className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9" href="/tpo/batches">Clear filters</Link></Alert></div>;
 if(!sortParsed.success)return <div className="min-w-0 space-y-4"><PageHeader title={TPO_OWNER_PAGE_COPY.placementEligibility}/><Alert tone="error">Invalid batch sorting. <Link className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9" href="/tpo/batches">Clear filters</Link></Alert></div>;
 if(!parsed.success)return <div className="min-w-0 space-y-4"><PageHeader title={TPO_OWNER_PAGE_COPY.placementEligibility}/><Alert tone="error">Invalid search. <Link className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9" href="/tpo/batches">Clear search</Link></Alert></div>;
 const [data,unassigned]=await Promise.all([
  listTpoBatches(context).catch(()=>null),
  countTpoLearnersWithoutClass(context).catch(()=>null),
 ]);
 if(data===null)return <div className="min-w-0 space-y-4">
  <PageHeader eyebrow="TPO · Batches" title={TPO_OWNER_PAGE_COPY.placementEligibility}
   description="Decide who is in placements, one passing-out batch at a time. New students follow their class."/>
  <Alert tone="error">Could not load batches. The batch directory is temporarily unavailable.
   <Link href="/tpo/batches" className="ml-2 inline-flex min-h-9 items-center font-semibold text-link underline">Retry</Link>
  </Alert>
 </div>;
 const eligibility=await listTpoBatchCardEligibility(context,data.batches.map(batch=>batch.id)).catch(()=>null);
 const selected=filterTpoBatchDepartment(filterTpoBatchProgram(
  filterTpoBatchDirectory(data.batches,{...parsed.data,state:"ALL"}),
  programParsed.data),departmentParsed.data);
 const stateFiltered=selected.filter(batch=>!data.ready||eligibility===null||tpoBatchMatchesPlacementState({
  finishedAt:batch.finishedAt,eligible:eligibility?.get(batch.id)?.eligible??null,
 },parsed.data.state));
 const candidates=data.ready?filterTpoBatchDeadline(stateFiltered,deadlineParsed.data,new Date()):stateFiltered;
 const facetResult=parseTpoBatchFacetQuery(raw,data.batches);
 if(!facetResult.success)return <Alert tone="error">Invalid batch checklist filters. <Link className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9" href="/tpo/batches">Clear all</Link></Alert>;
 const facets=facetResult.data;
 const facetRows=candidates.map(batch=>({...batch,placementState:tpoBatchPlacementState({
  finishedAt:batch.finishedAt,eligible:eligibility?.get(batch.id)?.eligible??null,
 })}));
 const selectedFacets=eligibility===null?{...facets,states:[]}:facets;
 const facetFiltered=filterTpoBatchFacets(facetRows,selectedFacets);
 const sorted=sortParsed.data==="WORKING_SET"?
  sortTpoBatchWorkingPriority(facetFiltered,eligibility??new Map()):sortTpoBatchNames(facetFiltered,sortParsed.data);
 const showOlder=(Array.isArray(raw.showOlder)?raw.showOlder[0]:raw.showOlder)==="1";
 const currentYear=new Date().getFullYear();
 const workingSet=visibleTpoBatchWorkingSet(sorted,currentYear,showOlder,
  Boolean(parsed.data.q||parsed.data.state!=="ALL"||programParsed.data||departmentParsed.data||deadlineParsed.data!=="ALL"||facets.states.length||facets.programs.length||facets.departments.length||facets.finalYears.length));
 const batches=workingSet.visible;
 const batchPage=paginateTpoBatches(batches,pageParsed.data.page,pageParsed.data.pageSize);
 const [journey,recent]=await Promise.all([
  listTpoBatchJourneyCounts(context,data.batches.map(batch=>batch.id)).catch(()=>null),
  listTpoBatchRecentCohortActions(context,data.batches.map(batch=>batch.id)).catch(()=>null),
 ]);
 const pageFilters={q:parsed.data.q,state:parsed.data.state,program:programParsed.data,department:departmentParsed.data,deadline:deadlineParsed.data,sort:sortParsed.data,...(showOlder?{showOlder:"1"}:{}),facetState:facets.states,facetProgram:facets.programs,facetDepartment:facets.departments,facetFinalYear:facets.finalYears.map(String)};
 const programs=listTpoBatchPrograms(data.batches);
 const departments=listTpoBatchDepartments(data.batches);
 const working=data.batches.filter(batch=>!batch.finishedAt);
 const activeCount=eligibility===null?null:data.batches.filter(batch=>tpoBatchPlacementState({finishedAt:batch.finishedAt,eligible:eligibility.get(batch.id)?.eligible??null})==="In placements").length;
 const eligibleCount=eligibility===null?null:working.reduce((sum,batch)=>sum+(eligibility.get(batch.id)?.eligible??0),0);
 const pendingCount=eligibility===null?null:working.reduce((sum,batch)=>sum+(eligibility.get(batch.id)?.undecided??0),0);
 const placedCount=journey===null?null:working.reduce((sum,batch)=>sum+(journey.get(batch.id)?.placed??0),0);
 const latestDecision=recent===null?null:[...recent.entries()].sort((a,b)=>b[1].occurredAt.localeCompare(a[1].occurredAt))[0]??null;
 const filterCount=Number(parsed.data.state!=="ALL")+Number(Boolean(programParsed.data))+Number(Boolean(departmentParsed.data))+Number(deadlineParsed.data!=="ALL")+facets.states.length+facets.programs.length+facets.departments.length+facets.finalYears.length;
 return <div className="min-w-0 space-y-4">
  <PageHeader eyebrow="TPO · Batches" title={TPO_OWNER_PAGE_COPY.placementEligibility} description="Decide who is in placements, one passing-out batch at a time. New students follow their class."/>
  <dl aria-label="Batch numbers" className="grid min-w-0 grid-cols-2 gap-0 overflow-hidden rounded-[var(--lms-radius-md)] border border-[var(--lms-canvas-border)] md:grid-cols-4">{[
  [activeCount===1?"batch open for placements":"batches open for placements",activeCount],[eligibleCount===1?"student eligible":"students eligible",eligibleCount],["not decided yet",pendingCount],["placed",placedCount],
  ].map(([label,value])=><div key={label} className="min-w-0 border-b border-r border-[var(--lms-canvas-border)] p-3 last:border-r-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-semibold">{data.ready&&value!==null?value:"—"}</dd></div>)}</dl>
  {eligibility===null&&facets.states.length>0?<Alert tone="warning">State checklist filtering is unavailable until eligibility data loads; other filters remain applied.</Alert>:null}

  <div className="flex min-w-0 flex-wrap items-end gap-2 border-b border-[var(--lms-canvas-border)] pb-3">
   <div className="min-w-[min(100%,220px)] flex-[1_1_220px] sm:max-w-[320px]"><TpoBatchInstantSearch key={parsed.data.q??""} value={parsed.data.q??""}/></div>
   <details className="group relative min-w-0">
    <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-body marker:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">
     <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path d="M3 5h18M6 12h12M10 19h4"/></svg>
     Filters{filterCount>0?<Badge tone="info">{filterCount}</Badge>:null}
    </summary>
    <div className="absolute right-0 z-20 mt-2 max-h-[min(75vh,700px)] w-[min(90vw,480px)] min-w-[min(90vw,300px)] overflow-y-auto rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 shadow-lg">
     <h2 className="mb-3 text-lg font-semibold">Filter batches</h2>
  <form role="search" aria-label="tpo batches filters" className="grid min-w-0 grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-3" action="/tpo/batches" method="get">
   <input type="hidden" name="q" value={parsed.data.q??""}/>
   <label className="grid min-w-0 gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">State<Select name="state" defaultValue={parsed.data.state} className="block min-h-11 w-full md:min-h-9"><option value="ALL">All</option><option value="IN_PLACEMENTS">In placements</option><option value="NOT_STARTED">Not started</option><option value="FINISHED">Finished</option></Select></label>
   <Disclosure title="Program · Department · Deadline · Sort · Page size" className="min-w-0 sm:col-span-2 lg:col-span-3" defaultOpen={Boolean(programParsed.data||departmentParsed.data||deadlineParsed.data!=="ALL"||sortParsed.data!=="WORKING_SET"||pageParsed.data.pageSize!==24)} contentClassName="pt-3"><div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
   <label className="grid min-w-0 gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Program<Select name="program" defaultValue={programParsed.data} className="block min-h-11 w-full md:min-h-9"><option value="">All programs</option>{programs.map(p=><option key={p} value={p}>{p}</option>)}</Select></label>
   <label className="grid min-w-0 gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Department<Select name="department" defaultValue={departmentParsed.data} className="block min-h-11 w-full md:min-h-9"><option value="">All departments</option>{departments.map(d=><option key={d} value={d}>{d}</option>)}</Select></label>
   <label className="grid min-w-0 gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Deadline<Select name="deadline" defaultValue={deadlineParsed.data} className="block min-h-11 w-full md:min-h-9"><option value="ALL">All deadlines</option><option value="NEXT_7_DAYS">Due in next 7 days</option><option value="PAST_DUE">Past due</option><option value="NO_DEADLINE">No deadline recorded</option></Select></label>
   <label className="grid min-w-0 gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Sort<Select name="sort" defaultValue={sortParsed.data} className="block min-h-11 w-full md:min-h-9"><option value="WORKING_SET">Recommended order</option><option value="NAME_ASC">Name A–Z</option><option value="NAME_DESC">Name Z–A</option><option value="DEADLINE_ASC">Deadline earliest</option><option value="DEADLINE_DESC">Deadline latest</option></Select></label>
   <label className="grid min-w-0 gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Page size<Select name="pageSize" defaultValue={String(pageParsed.data.pageSize)} className="block min-h-11 w-full md:min-h-9"><option value="12">12</option><option value="24">24</option><option value="48">48</option></Select></label>
   </div></Disclosure>
   <Button type="submit" className="min-h-11 w-full px-4 sm:w-auto sm:justify-self-start md:min-h-9">Search</Button>
  </form>
  <TpoBatchFacetFilters key={JSON.stringify(facets)} initial={facets}
   rows={facetRows} baseQuery={{
    q:parsed.data.q,state:parsed.data.state,program:programParsed.data,
    department:departmentParsed.data,deadline:deadlineParsed.data,
    sort:sortParsed.data,pageSize:String(pageParsed.data.pageSize),
    ...(showOlder?{showOlder:"1"}:{}),
   }}/>

    </div>
   </details>
  </div>
  {latestDecision?<Alert tone="info" className="mt-3">
    <span>Last change {new Date(latestDecision[1].occurredAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST by {latestDecision[1].actor}</span>
    {latestDecision[1].canUndo&&!data.batches.find(batch=>batch.id===latestDecision[0])?.finishedAt?<TpoBatchUndoControl batchId={latestDecision[0]} actionId={latestDecision[1].actionId}/>:null}
   </Alert>:null}
  {unassigned!==null&&unassigned>0?<Banner tone="warning">
    {unassigned.toLocaleString("en-IN")} {unassigned===1?"student is":"students are"} not in any class. They can't be part of placements until Academic Setup puts them in a class of a batch.
   </Banner>:null}
  {unassigned===null?<InlineNotice tone="info" message="Class assignment counts could not load. The batch list is still available. Try again later."/>:null}
  {eligibility===null?<InlineNotice tone="info" message="Eligibility counts could not load. The batch list is still available. Try again later."/>:null}
  {journey===null?<InlineNotice tone="info" message="Placement journey counts could not load. Other batch details are still available."/>:null}
  {recent===null?<InlineNotice tone="info" message="Recent decisions could not load. Open a batch to view its history."/>:null}
  {!data.ready&&deadlineParsed.data!=="ALL"?<InlineNotice tone="info" message="Deadline details are temporarily unavailable. All matching batches are still shown."/>:null}
  {!data.ready&&parsed.data.state!=="ALL"?<InlineNotice tone="info" message="Batch state details are temporarily unavailable. All matching batches are still shown."/>:null}
  {!data.ready?<Alert tone="warning">Couldn't refresh batches. Some batch details are temporarily unavailable; academic batches remain visible. <Link href="/tpo/batches" className="lms-inline-link inline-flex min-h-9 items-center font-semibold text-link underline">Retry</Link></Alert>:null}
  {workingSet.hidden>0?<Alert tone="info" className="flex-row flex-wrap items-center gap-2">
    {workingSet.hidden} older {workingSet.hidden===1?"batch is":"batches are"} hidden from your working set.
    <Link href={tpoBatchPageHref({...pageFilters,showOlder:"1"},1,pageParsed.data.pageSize)}
      className="lms-inline-link inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Show older batches</Link>
    </Alert>:showOlder?<Link href={tpoBatchPageHref({...pageFilters,showOlder:""},1,pageParsed.data.pageSize)}
      className="lms-inline-link inline-flex min-h-11 items-center text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Hide older batches</Link>:null}
  <p role="status" className="text-sm text-muted-foreground leading-[1.6]">{batches.length} matching batches · Showing {batchPage.from}–{batchPage.to} · Page {batchPage.page} of {batchPage.totalPages}</p>
  {pageParsed.data.page!==batchPage.page?<Alert tone="warning">The requested batch page no longer exists for these filters. Showing the last available page.</Alert>:null}
  {batches.length===0?<EmptyState
    title={tpoBatchEmptyReason(data.batches.length,batches.length)==="NO_BATCHES"?"No batches yet":"No batches match this view"}
    description={data.batches.length===0?"Batches come from Academic Setup. Create the academic batch there first.":"Try another search or clear the active batch filters."}
    action={data.batches.length>0?<Link href={tpoBatchClearFiltersHref(pageParsed.data.pageSize)}
      className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Clear search and filters</Link>:undefined}/>:<ul className="grid min-w-0 grid-cols-1 gap-4 min-[700px]:grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
   {batchPage.items.map(b=>{
    const summary=eligibility?.get(b.id);
    const total=summary?.assessed??0;
    const status=data.ready?tpoBatchPlacementState({finishedAt:b.finishedAt,eligible:summary?.eligible??null}):"Status unavailable";
    const next=tpoBatchNextAction(b,data.ready,summary,journey?.get(b.id));
    const detailsHref="/tpo/batches/"+b.id+"?returnTo="+encodeURIComponent(tpoBatchPageHref(pageFilters,batchPage.page,pageParsed.data.pageSize));
    const progress=journey?.get(b.id);
    return <li key={b.id} className={"flex min-w-0 flex-col gap-3 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] p-4 shadow-sm "+(b.finishedAt?"bg-[var(--lms-neutral-50)]":"bg-surface")}>
     <header className="flex min-w-0 items-start justify-between gap-2">
      <div className="flex min-w-0 flex-col gap-1">
       <h2 className="m-0 break-words text-[var(--lms-font-lg)] font-semibold leading-6">
        <Link href={detailsHref} className="lms-inline-link text-[var(--lms-heading)] hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{b.name}</Link>
       </h2>
       <p className="text-xs text-muted-foreground">{b.department===b.program?b.program:b.department+" · "+b.program}{b.startYear?" · "+b.startYear+(b.endYear?"–"+b.endYear:""):""}</p>
      </div>
      <Badge tone={status==="In placements"?"success":status==="Finished"?"neutral":"warning"} className="shrink-0">{status}</Badge>
     </header>
     {summary?<div className="space-y-2">
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
       <span><strong className="text-[var(--lms-heading)]">{total.toLocaleString("en-IN")}</strong> {total===1?"student":"students"}</span>
       <span><strong className="text-[var(--lms-success-text)]">{summary.eligible.toLocaleString("en-IN")}</strong> eligible</span>
       <span><strong className="text-[var(--lms-error-text)]">{summary.ineligible.toLocaleString("en-IN")}</strong> ineligible</span>
       <span><strong className="text-[var(--lms-heading)]">{(summary.undecided+summary.needsReview).toLocaleString("en-IN")}</strong> not decided</span>
      </div>
      <div role="img" aria-label={summary.eligible+" eligible, "+summary.ineligible+" ineligible, "+(summary.undecided+summary.needsReview)+" not decided"} className="flex h-[6px] overflow-hidden rounded-full bg-[var(--lms-header-border)]">
       <span className="bg-[#15803d]" style={{width:total>0?summary.eligible/total*100+"%":"0%"}}/>
       <span className="bg-[var(--lms-error-text)]" style={{width:total>0?summary.ineligible/total*100+"%":"0%"}}/>
      </div>
      {summary.needsReview>0?<p className="text-xs font-semibold text-[var(--lms-warning-text)]">{summary.needsReview} need class membership review</p>:null}
      {total>0?<ol aria-label="Journey" className="grid grid-cols-3 gap-1 text-center">
       {([["Registered",progress?.registered],["Verified",progress?.verified],["Placed",progress?.placed]] as const).map(([label,value])=>
        <li key={label} className="flex min-w-0 flex-col rounded-[var(--lms-radius-sm)] bg-[var(--lms-neutral-50)] px-1 py-2">
         <strong className="text-sm text-[var(--lms-heading)]">{value??"—"}</strong><span className="text-xs text-muted-foreground">{label}</span>
        </li>)}
      </ol>:null}
     </div>:<p role="status" className="text-sm text-muted-foreground">Eligibility counts unavailable.</p>}
     <footer className="mt-auto flex flex-wrap items-center gap-3 pt-2">
      <Link href={"/tpo/batches/"+b.id+tpoBatchNextActionLink(b,data.ready,summary,progress)}
       className={"lms-inline-link inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9 "+(next==="Review history"?"border-border bg-surface text-link":"border-[var(--lms-primary)] bg-[var(--lms-primary)] text-white")}>{next}</Link>
      {tpoBatchCardDeadlineLabel(b.deadline,data.ready,Boolean(b.finishedAt))?<span className="text-xs text-muted-foreground">{tpoBatchCardDeadlineLabel(b.deadline,data.ready,Boolean(b.finishedAt))}</span>:null}
     </footer>
    </li>;
   })}</ul>}
  {(batchPage.hasPrev||batchPage.hasNext)?<nav aria-label="Batch pages" className="flex flex-wrap gap-3 text-sm">
   {batchPage.hasPrev?<Link className="lms-inline-link inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:bg-[rgba(38,186,199,0.07)]" href={tpoBatchPageHref(pageFilters,batchPage.page-1,pageParsed.data.pageSize)}>Previous page</Link>:null}
   {batchPage.hasNext?<Link className="lms-inline-link inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:bg-[rgba(38,186,199,0.07)]" href={tpoBatchPageHref(pageFilters,batchPage.page+1,pageParsed.data.pageSize)}>Next page</Link>:null}

  </nav>:null}
 </div>;
}
