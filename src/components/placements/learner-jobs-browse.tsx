"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { LearnerPlacementJobs, type LearnerPlacementJobItem } from "./learner-placement-jobs";
import {
  availableLearnerJobFacets,
  filterLearnerPlacementJobs,
  learnerJobEmploymentTypeCounts,
  type LearnerJobBrowseFilters,
} from "@/modules/placements/learner-jobs-browse-model";
import { readLearnerDriveUrl, learnerDriveQueryWithChanges } from "@/modules/placements/learner-drive-url-model";
import {learnerDriveOverview,learnerDriveAvailabilityDriveCounts} from "@/modules/placements/learner-drive-overview-model";
import {learnerDrivePageState} from "@/modules/placements/learner-drive-pagination-model";
import {learnerJobsMobileFilterLabel} from "@/modules/placements/learner-jobs-mobile-model";
import {learnerDrivesEmptyState} from "@/modules/placements/learner-drives-empty-state-model";
import {learnerSavedDriveSummary} from "@/modules/placements/learner-saved-drives-model";

const PAGE_SIZE = 20;

function humanize(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function LearnerJobsBrowse({
  items,
  snapshotNowIso,
  savedJobIds,
}: {
  items: readonly LearnerPlacementJobItem[];
  snapshotNowIso: string;
  savedJobIds:readonly string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const urlState=readLearnerDriveUrl(params.toString());
  const urlSearch=urlState.filters.search;
  const [search,setSearch]=useState(urlSearch);
  const [mobileOpen,setMobileOpen]=useState(false);
  const lastCommittedQuery=useRef(urlSearch);

  const updateQuery=useCallback((changes:Record<string,string|null>)=>{
    const query=learnerDriveQueryWithChanges(params.toString(),changes);
    router.push(query?pathname+"?"+query:pathname,{scroll:false});
  },[pathname,params,router]);

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
      updateQuery({q:text||null});
    },350);
    return ()=>window.clearTimeout(handle);
  },[search,urlSearch,updateQuery]);

  const filters:LearnerJobBrowseFilters={...urlState.filters,search};
  const facets = useMemo(() => availableLearnerJobFacets(items), [items]);
  const employmentCounts=useMemo(()=>learnerJobEmploymentTypeCounts(items),[items]);
  const availabilityCounts=useMemo(()=>learnerDriveAvailabilityDriveCounts(items),[items]);
  const allDrives=useMemo(()=>learnerDriveOverview(items),[items]);
  const savedSummary=learnerSavedDriveSummary(items.map(row=>row.job.id),savedJobIds);
  const savedOnly=urlState.savedOnly;
  const matchingItems=savedOnly?items.filter(item=>savedSummary.visibleIds.has(item.job.id)):items;
  const visible = filterLearnerPlacementJobs(matchingItems, filters, Date.parse(snapshotNowIso));
  const parsedPage=urlState.page;
  const pagination=learnerDrivePageState(visible.length,parsedPage,PAGE_SIZE);
  const {page,totalPages}=pagination;
  const paged=visible.slice(pagination.startIndex,pagination.endIndex);
  const ordinaryRoleCards=paged.filter(item=>item.canApply||item.application!==null||item.deadlinePassed);
  const notOpenRoleCards=paged.filter(item=>!item.canApply&&item.application===null&&!item.deadlinePassed);
  const savedExpired=paged.filter(item=>item.deadlinePassed);
  const savedOpen=paged.filter(item=>!item.deadlinePassed);
  const empty=learnerDrivesEmptyState(matchingItems.length,visible.length,filters);

  const selectClass = "mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]";
  return (
    <div className="space-y-5">
      <nav aria-label="Drive bookmarks" className="flex flex-wrap items-center gap-3">
        <button type="button" aria-pressed={!savedOnly}
          onClick={()=>updateQuery({saved:null})}
          className={!savedOnly?"min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary":"min-h-11 rounded-md border border-border px-4 text-sm text-body"}>
          All drives
        </button>
        <button type="button" aria-pressed={savedOnly}
          onClick={()=>updateQuery({saved:"1"})}
          className={savedOnly?"min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary":"min-h-11 rounded-md border border-border px-4 text-sm text-body"}>
          Saved ({savedSummary.saved})
        </button>
      </nav>
      <section className="rounded-xl border border-border bg-surface p-3 sm:p-5" aria-label="Find placement drives">
        <button type="button" aria-expanded={mobileOpen} aria-controls="learner-drive-filters"
          onClick={()=>setMobileOpen(value=>!value)}
          className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-sm font-semibold text-primary-text sm:hidden">
          <span>{mobileOpen ? "Hide drive filters" : learnerJobsMobileFilterLabel(filters)}</span>
          <span aria-hidden="true">{mobileOpen ? "−" : "+"}</span>
        </button>
        <div id="learner-drive-filters"
          className={(mobileOpen?"block":"hidden")+" space-y-4 sm:block"}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-semibold text-body sm:col-span-2">
            Search drives, companies and roles
            <input
              type="search"
              value={search}
              maxLength={100}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, company, location…"
              className={selectClass}
            />
          </label>
          <label className="text-xs font-semibold text-body">
            Employment type
            <select value={filters.employmentType}
              onChange={(event) => updateQuery({ type: event.target.value })}
              className={selectClass}>
              <option value="all">All types</option>
              {facets.types.map((type) => (
                <option key={type} value={type}>{humanize(type)} ({employmentCounts.get(type)??0})</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-body">
            Location
            <select value={filters.location}
              onChange={(event) => updateQuery({ loc: event.target.value })}
              className={selectClass}>
              <option value="all">All locations</option>
              {facets.locations.map((location) => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Drive application availability">
          {([
            ["all","All published"],
            ["open","Open to apply"],
            ["not-open","Not open to you"],
            ["closed","Deadline passed"],
          ] as const).map(([key,label])=>(
            <button type="button" key={key} aria-pressed={filters.availability===key}
              onClick={()=>updateQuery({availability:key})}
              className={filters.availability===key
                ? "min-h-10 rounded-full bg-primary px-4 text-sm font-semibold text-on-primary"
                : "min-h-10 rounded-full border border-border px-4 text-sm font-semibold text-body"}>
              {label} ({availabilityCounts[key]})
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-body">
            <input
              type="checkbox"
              checked={filters.eligibleOnly}
              onChange={(event) => updateQuery({
                eligible: event.target.checked ? "1" : null,
              })}
              className="h-4 w-4 accent-[var(--lms-primary)]"
            />
            Eligible only
          </label>
          <label className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-body">
            <input
              type="checkbox"
              checked={filters.closingSoon}
              onChange={(event) => updateQuery({
                soon: event.target.checked ? "1" : null,
              })}
              className="h-4 w-4 accent-[var(--lms-primary)]"
            />
            Closing in 7 days
          </label>
          <label className="ml-auto inline-flex min-h-10 items-center gap-2 text-sm text-body">
            Sort by
            <select value={filters.sort}
              aria-label="Sort placement drives"
              onChange={(event) => updateQuery({ sort: event.target.value })}
              className="min-h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground">
              <option value="deadline">Deadline soonest</option>
              <option value="newest">Newest first</option>
              <option value="ctc">Highest CTC</option>
              <option value="title">Role A–Z</option>
            </select>
          </label>
          <button type="button" onClick={() => {
              setSearch("");
              router.push(pathname, { scroll: false });
            }}
            className="min-h-10 px-2 text-sm font-semibold text-primary-text hover:underline">
            Clear filters
          </button>
        </div>
        </div>
      </section>

      <section aria-label="All published drives summary" className="rounded-xl border border-border bg-surface p-4">
        <h2 className="text-base font-semibold text-foreground">All drives</h2>
        <p className="mt-1 text-sm text-body">
          {allDrives.drives} published {allDrives.drives===1?"drive":"drives"} · {allDrives.roles} role options
          · {allDrives.withApplications} {allDrives.withApplications===1?"drive has":"drives have"} your application.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Role filters below show options, not distinct employers or separate drives.
        </p>
      </section>
      <p role="status" className="text-sm text-body">
        {visible.length===0?"No matching drives":
          `Showing ${pagination.firstNumber}–${pagination.lastNumber} of ${visible.length} matching roles`}
      </p>
      {pagination.recovered ? (
        <p role="status" className="rounded-lg border border-border bg-surface-subtle p-3 text-sm text-body">
          Your requested results page is no longer available after filtering.
          Showing page {page} instead.
          <button type="button" onClick={()=>updateQuery({page:String(page)})}
            className="ml-2 min-h-10 font-semibold text-primary-text underline">
            Update page link
          </button>
        </p>
      ):null}

      {savedOnly && matchingItems.length===0?<div className="space-y-3 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-semibold text-foreground">No saved drives yet</h2>
        <p className="text-sm text-body">Save drives from All Drives by tapping the heart. They will appear here.</p>
        <button type="button" className="min-h-11 text-sm font-semibold text-primary-text underline"
          onClick={()=>updateQuery({saved:null})}>Browse all jobs</button>
      </div>:empty.kind==="NO_PUBLISHED" ? (
        <div className="space-y-3">
          <EmptyState title={empty.title} description={empty.description} />
          <Link href="/learn/my-placements"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text">
            Review placement dashboard →
          </Link>
        </div>
      ) : empty.kind==="FILTERED_OUT" ? (
        <div className="rounded-xl border border-border bg-surface p-6 text-center" role="status">
          <p className="font-semibold text-foreground">{empty.title}</p>
          <p className="mt-2 text-sm text-body">{empty.description}</p>
          {empty.showReset ? <button type="button"
            onClick={()=>{setSearch("");router.push(pathname,{scroll:false});}}
            className="mt-3 min-h-11 text-sm font-semibold text-primary-text hover:underline">
            Clear all filters
          </button>:null}
        </div>
      ) : (
        savedOnly?<div className="space-y-5">
          {savedOpen.length?<LearnerPlacementJobs items={savedOpen} snapshotNowIso={snapshotNowIso}
             returnQuery={params.toString()} savedJobIds={savedJobIds}/>:null}
          {savedExpired.length?<section aria-label="Expired saved jobs" className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Expired saved jobs</h2>
            <p className="text-sm text-body">These saved drives no longer accept applications, but you can review their details or remove the bookmark.</p>
            <LearnerPlacementJobs items={savedExpired} snapshotNowIso={snapshotNowIso}
             returnQuery={params.toString()} savedJobIds={savedJobIds}/>
          </section>:null}
        </div>:<div className="space-y-5">
          {ordinaryRoleCards.length>0?<LearnerPlacementJobs items={ordinaryRoleCards}
            snapshotNowIso={snapshotNowIso} returnQuery={params.toString()} savedJobIds={savedJobIds}/>:null}
          {notOpenRoleCards.length>0?<details className="rounded-xl border border-border bg-surface p-4"
            open={filters.availability==="not-open"} aria-label="Not open to you">
            <summary className="min-h-11 cursor-pointer font-semibold text-foreground">
              Not open to you ({notOpenRoleCards.length} roles on this page) · See reasons
            </summary>
            <p className="mb-3 mt-2 text-sm text-body">
              These published roles target your cohort but a registration, academic,
              deadline, or college policy check currently prevents self-application.
            </p>
            <LearnerPlacementJobs items={notOpenRoleCards}
              snapshotNowIso={snapshotNowIso} returnQuery={params.toString()} savedJobIds={savedJobIds}/>
          </details>:null}
        </div>
      )}

      {totalPages > 1 ? (
        <nav aria-label="Drive results pages" className="flex items-center justify-between gap-4">
          <button type="button" disabled={page <= 1}
            onClick={() => updateQuery({ page: String(page - 1) })}
            className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-body disabled:opacity-40">
            Previous
          </button>
          <span className="text-sm tabular-nums text-body">Page {page} of {totalPages}</span>
          <button type="button" disabled={page >= totalPages}
            onClick={() => updateQuery({ page: String(page + 1) })}
            className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-body disabled:opacity-40">
            Next
          </button>
        </nav>
      ) : null}
    </div>
  );
}
