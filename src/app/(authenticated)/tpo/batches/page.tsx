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
import { StackedMetricBar } from "@/components/ui/stacked-metric-bar";
import batchStyles from "@/components/tpo/legacy-batch-eligibility.module.css";
import { PageHeader } from "@/components/ui/page-header";
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
  listTpoBatchRecentCohortActions(context,batchPage.items.map(batch=>batch.id)).catch(()=>null),
 ]);
 const pageFilters={q:parsed.data.q,state:parsed.data.state,program:programParsed.data,department:departmentParsed.data,deadline:deadlineParsed.data,sort:sortParsed.data,...(showOlder?{showOlder:"1"}:{}),facetState:facets.states,facetProgram:facets.programs,facetDepartment:facets.departments,facetFinalYear:facets.finalYears.map(String)};
 const programs=listTpoBatchPrograms(data.batches);
 const departments=listTpoBatchDepartments(data.batches);
 const working=data.batches.filter(batch=>!batch.finishedAt);
 const activeCount=eligibility===null?null:data.batches.filter(batch=>tpoBatchPlacementState({finishedAt:batch.finishedAt,eligible:eligibility.get(batch.id)?.eligible??null})==="In placements").length;
 const eligibleCount=eligibility===null?null:working.reduce((sum,batch)=>sum+(eligibility.get(batch.id)?.eligible??0),0);
 const pendingCount=eligibility===null?null:working.reduce((sum,batch)=>sum+(eligibility.get(batch.id)?.undecided??0),0);
 const placedCount=journey===null?null:working.reduce((sum,batch)=>sum+(journey.get(batch.id)?.placed??0),0);
 return <div className="min-w-0 space-y-4">
  <PageHeader eyebrow="TPO · Batches" title={TPO_OWNER_PAGE_COPY.placementEligibility} description="Decide who is in placements, one passing-out batch at a time. New students follow their class."/>
  {eligibility===null&&facets.states.length>0?<Alert tone="warning">State checklist filtering is unavailable until eligibility data loads; other filters remain applied.</Alert>:null}

  <form role="search" aria-label="tpo batches filters" className="grid min-w-0 grid-cols-1 items-end gap-[8px] border-b border-[var(--lms-canvas-border)] pb-4 sm:grid-cols-2 lg:grid-cols-3" action="/tpo/batches" method="get">
   <TpoBatchInstantSearch key={parsed.data.q??""} value={parsed.data.q??""}/>
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
  {unassigned!==null&&unassigned>0?<Banner tone="warning">
    {unassigned} {unassigned===1?"student is":"students are"} not in any active class. Assign their academic classes before deciding placement eligibility.
   </Banner>:null}
  {unassigned===null?<InlineNotice tone="info" message="Class assignment counts could not load. The batch list is still available. Try again later."/>:null}
  {eligibility===null?<InlineNotice tone="info" message="Eligibility counts could not load. The batch list is still available. Try again later."/>:null}
  {journey===null?<InlineNotice tone="info" message="Placement journey counts could not load. Other batch details are still available."/>:null}
  {recent===null?<InlineNotice tone="info" message="Recent decisions could not load. Open a batch to view its history."/>:null}
  {!data.ready&&deadlineParsed.data!=="ALL"?<InlineNotice tone="info" message="Deadline details are temporarily unavailable. All matching batches are still shown."/>:null}
  {!data.ready&&parsed.data.state!=="ALL"?<InlineNotice tone="info" message="Batch state details are temporarily unavailable. All matching batches are still shown."/>:null}
  {!data.ready?<Alert tone="warning">Couldn\u0027t refresh batches. Some batch details are temporarily unavailable; academic batches remain visible. <Link href="/tpo/batches" className="lms-inline-link inline-flex min-h-9 items-center font-semibold text-link underline">Retry</Link></Alert>:null}
  <dl className="grid min-w-0 grid-cols-2 gap-0 overflow-hidden border-y border-[var(--lms-canvas-border)] md:grid-cols-4">{[
  ["Open for placements",activeCount],["Students eligible",eligibleCount],["Not decided yet",pendingCount],["Placed (offer evidence)",placedCount],
  ].map(([label,value])=><div key={label} className="min-w-0 border-b border-r border-[var(--lms-canvas-border)] p-3 last:border-r-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-semibold">{data.ready&&value!==null?value:"—"}</dd></div>)}</dl>
  {workingSet.hidden>0?<Alert tone="info" className="flex-row flex-wrap items-center gap-2">
    {workingSet.hidden} older {workingSet.hidden===1?"batch is":"batches are"} hidden from your working set.
    <Link href={tpoBatchPageHref({...pageFilters,showOlder:"1"},1,pageParsed.data.pageSize)}
      className="lms-inline-link inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Show older batches</Link>
    </Alert>:showOlder?<Link href={tpoBatchPageHref({...pageFilters,showOlder:""},1,pageParsed.data.pageSize)}
      className="lms-inline-link inline-flex min-h-11 items-center text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Hide older batches</Link>:null}
  <p role="status" className="text-sm text-muted-foreground leading-[1.6]">{batches.length} matching batches · Showing {batchPage.from}–{batchPage.to} · Page {batchPage.page} of {batchPage.totalPages}</p>
  {pageParsed.data.page!==batchPage.page?<Alert tone="warning">The requested batch page no longer exists for these filters. Showing the last available page.</Alert>:null}
  {batches.length===0?<EmptyState
    title={tpoBatchEmptyReason(data.batches.length,batches.length)==="NO_BATCHES"?"No placement batches or academic cohorts are available to list yet.":"No batches match these filters."}
    action={data.batches.length>0?<Link href={tpoBatchClearFiltersHref(pageParsed.data.pageSize)}
      className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Clear batch filters</Link>:undefined}/>:<ul className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">{batchPage.items.map(b=><li key={b.id} className="min-w-0 space-y-3 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
    <h2 className="break-words font-semibold"><Link href={"/tpo/batches/"+b.id+"?returnTo="+encodeURIComponent(tpoBatchPageHref(pageFilters,batchPage.page,pageParsed.data.pageSize))} className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">{b.name}</Link></h2>
    <p className="text-sm">{b.department===b.program?b.program:b.department+" · "+b.program}{b.startYear?" · "+b.startYear+(b.endYear?"–"+b.endYear:""):""}</p>
    <p className="text-xs text-muted-foreground">{data.ready?tpoBatchPlacementState({finishedAt:b.finishedAt,eligible:eligibility?.get(b.id)?.eligible??null}):"Status unavailable"}</p>
    {tpoBatchCardDeadlineLabel(b.deadline,data.ready,Boolean(b.finishedAt))?<p className="text-xs text-muted-foreground">{tpoBatchCardDeadlineLabel(b.deadline,data.ready,Boolean(b.finishedAt))}</p>:null}
    {(() => {
      const summary = eligibility?.get(b.id);
      if (!summary) return <p role="status" className="text-sm leading-[1.6]">Eligibility counts unavailable.</p>;
      const split = [
        { key: "eligible", label: "Eligible", count: summary.eligible, color: "bg-success" },
        { key: "ineligible", label: "Ineligible", count: summary.ineligible, color: "bg-error" },
        { key: "undecided", label: "Not decided", count: summary.undecided, color: "bg-muted-foreground" },
        { key: "review", label: "Needs review", count: summary.needsReview, color: "bg-warning" },
      ] as const;
      return <div className="min-w-0 space-y-2">
        <p className="text-xs text-muted-foreground leading-5">{summary.assessed} {summary.assessed===1?"student":"students"} in batch</p>
        <dl className="grid grid-cols-2 gap-2 text-xs">
         <div><dt className="text-muted-foreground">Invited</dt><dd className="font-semibold">{b.invitedAt?"Yes":"Not yet"}</dd></div>
         <div><dt className="text-muted-foreground">Registered</dt><dd className="font-semibold">{journey===null?"—":journey.get(b.id)?.registered??0}</dd></div>
         <div><dt className="text-muted-foreground">Verified profiles</dt><dd className="font-semibold">{journey===null?"—":journey.get(b.id)?.verified??0}</dd></div>
         <div><dt className="text-muted-foreground">Placed (offer evidence)</dt><dd className="font-semibold">{journey===null?"—":journey.get(b.id)?.placed??0}</dd></div>
        </dl>
        <dl className="grid grid-cols-1 gap-1 text-xs md:grid-cols-2">
          {split.map(part=><div key={part.key}>
            <dt className="text-muted-foreground">{part.label}</dt>
            <dd className="font-semibold tabular-nums">{part.count}</dd>
          </div>)}
        </dl>
        <StackedMetricBar className={"w-full "+batchStyles.bar} maximum={summary.assessed}
          label={split.map(part=>part.label+": "+part.count).join(", ")}
          segments={split.map(part=>({
            label:part.label,value:part.count,
            tone:part.key==="eligible"?"success" as const:
              part.key==="ineligible"?"error" as const:
              part.key==="review"?"warning" as const:"muted" as const,
          }))} />
        {summary.needsReview>0?<p className="text-[var(--lms-font-sm)] font-semibold leading-5 text-[var(--lms-warning-text)]">Ambiguous class membership requires review.</p>:null}
      </div>;
    })()}
    {recent?.get(b.id)?<section className="border-t border-[var(--lms-canvas-border)] pt-3 text-xs">
     <p className="font-semibold">Last batch decision</p>
     <p className="text-muted-foreground">By {recent?.get(b.id)!.actor} · {new Date(recent?.get(b.id)!.occurredAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST</p>
     {recent?.get(b.id)!.canUndo&&!b.finishedAt?<TpoBatchUndoControl batchId={b.id} actionId={recent?.get(b.id)!.actionId}/>:null}
    </section>:null}
    <Link href={"/tpo/batches/"+b.id+tpoBatchNextActionLink(b,data.ready,eligibility?.get(b.id),journey?.get(b.id))} className="lms-inline-link inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">{tpoBatchNextAction(b,data.ready,eligibility?.get(b.id),journey?.get(b.id))}</Link>
   </li>)}</ul>}
  {(batchPage.hasPrev||batchPage.hasNext)?<nav aria-label="Batch pages" className="flex flex-wrap gap-3 text-sm">
   {batchPage.hasPrev?<Link className="lms-inline-link inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:bg-[rgba(38,186,199,0.07)]" href={tpoBatchPageHref(pageFilters,batchPage.page-1,pageParsed.data.pageSize)}>Previous page</Link>:null}
   {batchPage.hasNext?<Link className="lms-inline-link inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:bg-[rgba(38,186,199,0.07)]" href={tpoBatchPageHref(pageFilters,batchPage.page+1,pageParsed.data.pageSize)}>Next page</Link>:null}

  </nav>:null}
 </div>;
}
