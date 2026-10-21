"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {Disclosure} from "@/components/ui/disclosure";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { LearnerPlacementJobs, type LearnerPlacementJobItem } from "./learner-placement-jobs";
import {
  availableLearnerJobFacets,
  filterLearnerPlacementJobs,
  learnerJobEmploymentTypeCounts,
  closingSoonIstDayEndMs,
  type LearnerJobBrowseFilters,
} from "@/modules/placements/learner-jobs-browse-model";
import { readLearnerDriveUrl, learnerDriveQueryWithChanges } from "@/modules/placements/learner-drive-url-model";
import {learnerDriveOverview,learnerDriveAvailabilityDriveCounts} from "@/modules/placements/learner-drive-overview-model";
import {learnerDrivePageState} from "@/modules/placements/learner-drive-pagination-model";
import {learnerJobsMobileFilterLabel} from "@/modules/placements/learner-jobs-mobile-model";
import {learnerDrivesEmptyState} from "@/modules/placements/learner-drives-empty-state-model";
import {learnerSavedDriveSummary} from "@/modules/placements/learner-saved-drives-model";
import {Button} from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import {LearnerSaveDriveButton} from "./learner-save-drive-button";

const PAGE_SIZE = 20;

function humanize(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function LearnerJobsBrowse({
  items,
  snapshotNowIso,
  savedJobIds,savedHistory=[],
}: {
  items: readonly LearnerPlacementJobItem[];
  snapshotNowIso: string;
  savedJobIds:readonly string[];
  savedHistory?:readonly {jobId:string;title:string;status:string;deadline:string|null}[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const urlState=readLearnerDriveUrl(params.toString());
  const urlSearch=urlState.filters.search;
  const [search,setSearch]=useState(urlSearch);
  const [mobileOpen,setMobileOpen]=useState(false);
  const [navigating,startNavigation]=useTransition();
  const mobileFilterButton=useRef<HTMLButtonElement|null>(null);
  const lastCommittedQuery=useRef(urlSearch);

  const updateQuery=useCallback((changes:Record<string,string|null>,options?:{replace?:boolean})=>{
    // Legacy ?tab=saved deep links keep their tab when a facet or page
    // changes. Canonicalize only in the link we are about to navigate to.
    const prior=new URLSearchParams(params.toString());
    if(prior.get("tab")==="saved"){
      prior.delete("tab");
      if(!prior.has("saved"))prior.set("saved","1");
    }
    const query=learnerDriveQueryWithChanges(prior.toString(),changes);
    const href=query?pathname+"?"+query:pathname;
    startNavigation(()=>{
      if(options?.replace)router.replace(href,{scroll:false});
      else router.push(href,{scroll:false});
    });
  },[pathname,params,router,startNavigation]);

  useEffect(()=>{
    const onPopState=()=>{
      const navigated=readLearnerDriveUrl(window.location.search).filters.search;
      lastCommittedQuery.current=navigated;
      setSearch(navigated);
    };
    window.addEventListener("popstate",onPopState);
    return ()=>window.removeEventListener("popstate",onPopState);
  },[]);

  useEffect(()=>{
    if(lastCommittedQuery.current===urlSearch)return;
    lastCommittedQuery.current=urlSearch;
    setSearch(urlSearch);
  },[urlSearch]);

  useEffect(()=>{
    const text=search.trim().slice(0,100);
    if(text===urlSearch)return;
    const handle=window.setTimeout(()=>{
      lastCommittedQuery.current=text;
      updateQuery({q:text||null},{replace:true});
    },220);
    return ()=>window.clearTimeout(handle);
  },[search,urlSearch,updateQuery]);

  const filters:LearnerJobBrowseFilters={...urlState.filters,search};
  const facets = useMemo(() => availableLearnerJobFacets(items), [items]);
  const employmentCounts=useMemo(()=>learnerJobEmploymentTypeCounts(items),[items]);
  const locationCounts=useMemo(()=>{
    const counts=new Map<string,number>();
    for(const item of items)for(const location of new Set(item.roleOption.locations
      .map(value=>value.trim()).filter(Boolean))){
      counts.set(location.toLowerCase(),(counts.get(location.toLowerCase())??0)+1);
    }
    return counts;
  },[items]);
  const eligibleCount=new Set(items.filter(row=>row.canApply).map(row=>row.job.id)).size;
  const soonCutoff=closingSoonIstDayEndMs(Date.parse(snapshotNowIso));
  const closingCount=new Set(items.filter(row=>{
    const deadline=row.job.applicationDeadline?Date.parse(row.job.applicationDeadline):NaN;
    return !row.deadlinePassed&&Number.isFinite(deadline)&&deadline>=Date.parse(snapshotNowIso)&&
      deadline<=soonCutoff;
  }).map(row=>row.job.id)).size;
  const availabilityCounts=useMemo(()=>learnerDriveAvailabilityDriveCounts(items),[items]);
  const allDrives=useMemo(()=>learnerDriveOverview(items),[items]);
  const savedSummary=learnerSavedDriveSummary(items.map(row=>row.job.id),savedJobIds);
  const accessibleIds=new Set(items.map(row=>row.job.id));
  const ownSavedIds=new Set(savedJobIds);
  const historicSaved=savedHistory.filter(row=>
    ownSavedIds.has(row.jobId)&&!accessibleIds.has(row.jobId));
  const savedOnly=urlState.savedOnly||params.get("tab")==="saved";
  const historicExpired=historicSaved.filter(row=>
    row.status!=="PUBLISHED"||
    (row.deadline!==null&&Number.isFinite(Date.parse(row.deadline))&&
      Date.parse(row.deadline)<Date.parse(snapshotNowIso)));
  const historicNotOpen=historicSaved.filter(row=>!historicExpired.includes(row));
  const filterSummary=[
    search.trim()?'"'+search.trim()+'"':null,
    filters.employmentType!=="all"?humanize(filters.employmentType):null,
    filters.location!=="all"?filters.location:null,
    filters.eligibleOnly?"eligible":null,
    filters.closingSoon?"closing soon":null,
    filters.availability!=="all"?filters.availability.replaceAll("-"," "):null,
  ].filter(Boolean).join(", ")||"your filters";
  const matchingItems=useMemo(()=>savedOnly
    ?items.filter(item=>savedSummary.visibleIds.has(item.job.id)):items,
    [items,savedOnly,savedJobIds.join(",")]);
  const visible=useMemo(()=>
    filterLearnerPlacementJobs(matchingItems,filters,Date.parse(snapshotNowIso)),
   [matchingItems,snapshotNowIso,filters.search,filters.employmentType,filters.location,
    filters.eligibleOnly,filters.closingSoon,filters.availability,filters.sort,
    filters.departmentId,filters.programId,filters.jobType]);
  const parsedPage=urlState.page;
  const isNotOpen=(item:LearnerPlacementJobItem)=>
    !item.deadlinePassed&&!item.canApply;
  // The old LMS paginates its open/current cards separately. Closed saved
  // records and ineligible cards stay in their own sections, without
  // consuming the 20 slots available on the primary open page.
  const notOpenAll=visible.filter(isNotOpen);
  const expiredAll=visible.filter(item=>item.deadlinePassed);
  const savedExpired=savedOnly?expiredAll:[];
  const savedNotOpen=savedOnly?notOpenAll:[];
  const primary=savedOnly
    ?filters.availability==="closed"||filters.availability==="not-open"
      ?[]:visible.filter(item=>!item.deadlinePassed&&!isNotOpen(item))
    :filters.availability==="not-open"||filters.availability==="closed"?[]:
      visible.filter(item=>!isNotOpen(item)&&!item.deadlinePassed);
  const pagination=learnerDrivePageState(primary.length,parsedPage,PAGE_SIZE);
  const {page,totalPages}=pagination;
  const paged=primary.slice(pagination.startIndex,pagination.endIndex);
  const ordinaryRoleCards=savedOnly?[]:paged;
  const notOpenRoleCards=savedOnly?[]:notOpenAll;
  const expiredRoleCards=savedOnly?[]:expiredAll;
  const savedOpen=savedOnly&&filters.availability!=="closed"?paged:[];
  const empty=learnerDrivesEmptyState(matchingItems.length,visible.length,filters);
  const filteredEmpty=matchingItems.length>0&&visible.length===0;
  // The source response is already tenant/eligibility scoped. Old global
  // popular/select usage endpoints cannot be cloned as passive tracking:
  // view analytics require a product-approved purpose, retention and a
  // server-side scoped write, never an onClick mutation of client counts.
  const hasPrimaryOpen=primary.length>0;

  const selectClass = "mt-1 min-h-[var(--lms-control-height)] max-md:min-h-11";
  const closeMobileFilters=()=>{setMobileOpen(false);mobileFilterButton.current?.focus();};
  const resetFilters=()=>{
    setSearch("");
    updateQuery({q:null,type:null,loc:null,eligible:null,soon:null,
      availability:null,sort:null});
    setMobileOpen(false);
  };
  return (
    <div className="min-w-0 space-y-4">
      <section className="border-b border-border pb-3" aria-label="Drives at a glance">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Drives</h2>
            <p className="mt-1 text-sm text-body">{allDrives.drives} published {allDrives.drives===1?"drive":"drives"} · {allDrives.roles} role options</p>
          </div>
          <Button variant="link" type="button" aria-label={"View "+new Set(savedJobIds).size+" saved drives"}
            onClick={()=>updateQuery({saved:"1"})} className="min-h-11 px-1 text-sm font-semibold md:min-h-9">
            {new Set(savedJobIds).size} saved →
          </Button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {allDrives.withApplications} {allDrives.withApplications===1?"drive has":"drives have"} your application.
        </p>
      </section>
      <nav role="tablist" aria-label="Drive bookmarks" className="flex min-h-11 items-end gap-6 border-b border-border">
        <button role="tab" type="button" aria-selected={!savedOnly} aria-controls="learner-drive-results"
          className={"min-h-11 border-b-[3px] px-1 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 "+(!savedOnly?"border-[var(--lms-primary)] text-primary-text":"border-transparent text-body hover:text-foreground")}
          onClick={()=>updateQuery({saved:null})}>All drives</button>
        <button role="tab" type="button" aria-selected={savedOnly} aria-controls="learner-drive-results"
          className={"flex min-h-11 items-center gap-2 border-b-[3px] px-1 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 "+(savedOnly?"border-[var(--lms-primary)] text-primary-text":"border-transparent text-body hover:text-foreground")}
          onClick={()=>updateQuery({saved:"1"})}>
          Saved <span aria-label={new Set(savedJobIds).size+" saved drives"} className="rounded-full bg-[var(--lms-primary-subtle)] px-2 py-0.5 text-xs font-semibold text-primary-text">{new Set(savedJobIds).size}</span>
        </button>
      </nav>
      {navigating?<p role="status" className="text-xs text-body">Updating drives…</p>:null}
      <section className="pt-3" aria-label="Find placement drives">
        <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(220px,2fr)_repeat(3,minmax(130px,1fr))] md:items-start">
          <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Search
            <Input type="search" value={search} maxLength={100}
              onChange={event=>setSearch(event.target.value)}
              placeholder="Search jobs, companies, roles, locations…"
              className={selectClass}/>
            <span className="mt-1 block text-[11px] font-normal text-muted-foreground">
              {search.length}/100 characters · Search is limited to 100 characters.
            </span>
          </label>
          <Button ref={mobileFilterButton} variant="secondary" type="button"
            aria-expanded={mobileOpen} aria-controls="learner-drive-filters"
            onClick={()=>setMobileOpen(prev=>!prev)}
            className="min-h-11 w-full justify-between md:hidden">
            <span>{mobileOpen?"Hide filters":learnerJobsMobileFilterLabel(filters)}</span>
            <span aria-hidden="true">{mobileOpen?"−":"+"}</span>
          </Button>
          {mobileOpen?<button type="button" aria-label="Close drive filters"
            className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={closeMobileFilters}/>:null}
          <div id="learner-drive-filters"
            className={(mobileOpen?"flex":"hidden")+
             " fixed inset-x-0 bottom-0 z-50 max-h-[82dvh] min-w-0 flex-col gap-4 overflow-y-auto rounded-t-[var(--lms-control-radius)] border border-border bg-surface p-4 shadow-lg md:static md:col-span-3 md:flex md:max-h-none md:flex-row md:items-start md:gap-3 md:overflow-visible md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none"}>
            <div className="flex items-center justify-between md:hidden">
              <h3 className="text-base font-semibold text-foreground">Filter drives</h3>
              <Button type="button" variant="secondary" onClick={closeMobileFilters}>Done</Button>
            </div>
            <label className="min-w-0 flex-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Sort
              <Select value={filters.sort} aria-label="Sort placement drives"
                onChange={event=>updateQuery({sort:event.target.value})} className={selectClass}>
                <option value="deadline">Deadline soonest</option>
                <option value="newest">Newest first</option>
                <option value="ctc">Highest CTC</option>
                <option value="title">Role A–Z</option>
              </Select>
            </label>
            <label className="min-w-0 flex-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Type
              <Select value={filters.employmentType} aria-label="Type"
                onChange={event=>updateQuery({type:event.target.value})} className={selectClass}>
                <option value="all">All types ({allDrives.roles})</option>
                {facets.types.map(type=><option key={type} value={type}>
                  {type.includes("_")?humanize(type):type} ({employmentCounts.get(type)??0})
                </option>)}
              </Select>
            </label>
            <label className="min-w-0 flex-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Location
              <Select value={filters.location} aria-label="Location"
                onChange={event=>updateQuery({loc:event.target.value})} className={selectClass}>
                <option value="all">All locations</option>
                {facets.locations.map(location=><option key={location} value={location}>
                  {location} ({locationCounts.get(location.toLowerCase())??0})
                </option>)}
              </Select>
            </label>
          </div>
        </div>
        <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
          <button type="button" aria-pressed={filters.eligibleOnly}
            onClick={()=>updateQuery({eligible:filters.eligibleOnly?null:"1"})}
            className={"inline-flex min-h-11 items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 md:min-h-9 "+
              (filters.eligibleOnly?"border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)] text-primary-text":"border-border bg-surface text-body hover:border-[var(--lms-primary)]")}>
            Eligible <span className="text-xs opacity-80">{eligibleCount}</span>
          </button>
          <button type="button" aria-pressed={filters.closingSoon}
            onClick={()=>updateQuery({soon:filters.closingSoon?null:"1"})}
            className={"inline-flex min-h-11 items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 md:min-h-9 "+
              (filters.closingSoon?"border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)] text-primary-text":"border-border bg-surface text-body hover:border-[var(--lms-primary)]")}>
            Closing soon <span className="text-xs opacity-80">{closingCount}</span>
          </button>
          <label className="inline-flex min-h-11 flex-wrap items-center gap-2 text-xs font-semibold text-body md:ml-auto md:min-h-9">
            Availability
            <Select className="min-h-9 w-auto max-w-full" value={filters.availability}
              onChange={event=>updateQuery({availability:event.target.value})}>
              <option value="all">All ({availabilityCounts.all})</option>
              <option value="open">Open ({availabilityCounts.open})</option>
              <option value="not-open">Not open to you ({availabilityCounts["not-open"]})</option>
              <option value="closed">Expired ({availabilityCounts.closed})</option>
            </Select>
          </label>
          <Button variant="link" type="button" onClick={resetFilters}
            className="min-h-11 px-2 md:min-h-9">Clear filters</Button>
        </div>
      </section>

      <div id="learner-drive-results" role="status" className="text-sm text-body">
        {visible.length===0?"No matching drives":
          primary.length===0?`${visible.length} matching roles in secondary sections`:
          `Showing ${pagination.firstNumber}–${pagination.lastNumber} of ${primary.length} primary roles`}
      </div>
      {pagination.recovered ? (
        <p role="status" className="border-b border-border py-3 text-sm text-body">
          Your requested results page is no longer available after filtering.
          Showing page {page} instead.
          <Button variant="link" type="button" onClick={()=>updateQuery({page:String(page)})}
            className="ml-2 min-h-11 px-0 md:min-h-9">
            Update page link
          </Button>
        </p>
      ):null}

      {savedOnly&&historicSaved.length>0?<p role="status" className="border-b border-border pb-3 text-xs text-body">
        {historicSaved.length} saved drive(s) are no longer in the current published catalogue.
        Their bookmarks remain until you remove them.
      </p>:null}
      {savedOnly && matchingItems.length===0&&historicSaved.length===0?<div className="flex min-h-44 min-w-0 flex-col items-center justify-center gap-3 border-y border-border bg-[var(--lms-neutral-50)] px-6 py-12 text-center">
        <svg aria-hidden="true" width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--lms-neutral-400)]">
          <path d="M16 12h32a3 3 0 0 1 3 3v40L32 43 13 55V15a3 3 0 0 1 3-3z"/>
          <path d="M23 25h18M23 31h12"/>
        </svg>
        <h2 className="text-lg font-semibold text-foreground">No saved jobs</h2>
        <p className="text-sm text-body">Save jobs from All drives to find them here later.</p>
        <Button variant="primary" type="button" className="min-h-11"
          onClick={()=>updateQuery({saved:null})}>Browse all jobs</Button>
        <Button variant="link" type="button" className="min-h-11"
          onClick={()=>router.refresh()}>Retry saved jobs</Button>
      </div>:empty.kind==="NO_PUBLISHED"&&!savedOnly ? (
        <div className="space-y-3">
          <div className="flex flex-col items-center gap-3 py-5">
            <svg aria-hidden="true" width="70" height="70" viewBox="0 0 70 70" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="text-[var(--lms-neutral-400)]">
              <rect x="13" y="13" width="44" height="44" rx="6"/>
              <path d="M23 27h24M23 35h16M23 43h11"/>
              <circle cx="52" cy="51" r="12" fill="var(--lms-surface)"/>
              <path d="M46 51h12"/>
            </svg>
            <EmptyState title="No open jobs right now"
              description="New opportunities are added regularly. Check back soon or contact your placement cell."/>
          </div>
          <Link href="/learn/my-placements"
            className="inline-flex min-h-[var(--lms-control-height)] max-md:min-h-11 items-center text-sm font-semibold text-primary-text hover:underline focus-visible:underline">
            Review placement dashboard →
          </Link>
          <Button type="button" variant="secondary" onClick={()=>router.refresh()}
            className="min-h-11 w-full sm:w-auto md:min-h-9">
            Retry loading drives
          </Button>
        </div>
      ) : filteredEmpty ? (
        <div className="flex min-h-44 flex-col items-center justify-center gap-3 border-y border-border bg-[var(--lms-neutral-50)] px-6 py-12 text-center" role="status">
          <svg aria-hidden="true" width="58" height="58" viewBox="0 0 58 58" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--lms-neutral-400)]">
            <circle cx="24" cy="24" r="15"/><path d="m35 35 14 14M15 24h18"/>
          </svg>
          <p className="text-lg font-semibold text-foreground">No jobs match {filterSummary}</p>
          <p className="mt-2 text-sm text-body">Try a different search, type or location.</p>
          <div className="mt-3 flex min-w-0 flex-wrap justify-center gap-3">
            <Button variant="primary" type="button"
              onClick={resetFilters} className="min-h-11">
              Show all {savedOnly?new Set(savedJobIds).size:allDrives.drives} jobs
            </Button>
            <Button variant="secondary" type="button"
              onClick={resetFilters} className="min-h-11">
              Clear filters
            </Button>
          </div>
        </div>
      ) : (
        savedOnly?<div className="space-y-5">
          {savedOpen.length?<LearnerPlacementJobs items={savedOpen} snapshotNowIso={snapshotNowIso}
             returnQuery={params.toString()} savedJobIds={savedJobIds}/>:null}
          {(savedExpired.length||historicExpired.length)?<Disclosure
            title={"Expired ("+(savedExpired.length+historicExpired.length)+" saved)"}
            defaultOpen ariaLabel="Expired saved jobs" className="border-t border-border py-3">
            <p className="mb-3 text-sm text-body">Saved jobs remain listed after the deadline or closure. Applying is not available.</p>
            {savedExpired.length?<LearnerPlacementJobs items={savedExpired} snapshotNowIso={snapshotNowIso}
              returnQuery={params.toString()} savedJobIds={savedJobIds}/>:null}
            {historicExpired.length?<ul className="divide-y divide-border border-y border-border">
              {historicExpired.map(saved=><li key={saved.jobId} className="flex min-w-0 flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0"><strong className="block break-words">{saved.title?.trim()||"Untitled drive"}</strong>
                  <span className="text-xs text-body">{saved.status.replaceAll("_"," ")}
                    {saved.deadline&&Number.isFinite(Date.parse(saved.deadline))?" · Deadline "+new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium"}).format(new Date(saved.deadline)):""}
                  </span>
                </div>
                <LearnerSaveDriveButton jobId={saved.jobId} jobTitle={saved.title?.trim()||"Untitled drive"} initialSaved surface="LIST"/>
              </li>)}
            </ul>:null}
          </Disclosure>:null}
          {(savedNotOpen.length||historicNotOpen.length)?<Disclosure
            title={"Not open to you ("+(savedNotOpen.length+historicNotOpen.length)+" saved)"}
            defaultOpen ariaLabel="Saved drives not open to you" className="border-t border-border py-3">
            <p className="mb-3 text-sm text-body">These saved drives are not open to your current placement registration or cohort.</p>
            {savedNotOpen.length?<LearnerPlacementJobs items={savedNotOpen}
              snapshotNowIso={snapshotNowIso} returnQuery={params.toString()} savedJobIds={savedJobIds}/>:null}
            {historicNotOpen.length?<ul className="divide-y divide-border border-y border-border">
              {historicNotOpen.map(saved=><li key={saved.jobId} className="flex min-w-0 flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0"><strong className="block break-words">{saved.title?.trim()||"Untitled drive"}</strong>
                  <p className="text-xs text-body">No longer visible to your current cohort</p></div>
                <LearnerSaveDriveButton jobId={saved.jobId} jobTitle={saved.title?.trim()||"Untitled drive"} initialSaved surface="LIST"/>
              </li>)}
            </ul>:null}
          </Disclosure>:null}
        </div>:<div className="space-y-5">
          {!hasPrimaryOpen&&(expiredRoleCards.length>0||notOpenRoleCards.length>0)
            ?<p role="status" className="border-y border-border py-3 text-sm text-body">
              No drive is open to you right now. Other published and expired jobs appear below.
            </p>:null}
          {ordinaryRoleCards.length>0?<LearnerPlacementJobs items={ordinaryRoleCards}
            snapshotNowIso={snapshotNowIso} returnQuery={params.toString()} savedJobIds={savedJobIds}/>:null}
          {expiredRoleCards.length>0?<Disclosure title={"Expired ("+expiredRoleCards.length+" roles)"}
             defaultOpen={filters.availability==="closed"} ariaLabel="Expired drives"
             className="border-t border-border py-3 [&>summary]:min-h-11">
            <p className="mb-3 text-sm text-body">The application deadline has passed. These records remain available for review.</p>
            <LearnerPlacementJobs items={expiredRoleCards} snapshotNowIso={snapshotNowIso}
             returnQuery={params.toString()} savedJobIds={savedJobIds}/>
          </Disclosure>:null}
          {notOpenRoleCards.length>0?<Disclosure title={"Not open to you ("+notOpenRoleCards.length+" roles) · See reasons"}
             defaultOpen={filters.availability==="not-open"} ariaLabel="Not open to you"
             className="border-t border-border py-3 [&>summary]:min-h-11 [&>summary]:text-foreground">
            <p className="mb-3 mt-2 text-sm text-body">
              These published roles target your cohort but a registration, academic,
              deadline, or college policy check currently prevents self-application.
            </p>
            <LearnerPlacementJobs items={notOpenRoleCards}
              snapshotNowIso={snapshotNowIso} returnQuery={params.toString()} savedJobIds={savedJobIds}/>
          </Disclosure>:null}
        </div>
      )}

      {totalPages > 1 ? (
        <Pagination page={page} pageCount={totalPages} label="Drive results pages"
          className="justify-center md:justify-between"
          hrefForPage={target=>{
            const query=learnerDriveQueryWithChanges(params.toString(),{page:String(target)});
            return pathname+(query?"?"+query:"");
          }}/>
      ) : null}
    </div>
  );
}
