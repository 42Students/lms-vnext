"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { LearnerPlacementJourney, type LearnerPlacementJourneyItem } from "./learner-placement-journey";
import {
  browseLearnerApplications,
  learnerApplicationStage,
  learnerApplicationStageOptions,
  DEFAULT_LEARNER_APPLICATION_FILTERS,
  type LearnerApplicationBrowseFilters,
} from "@/modules/placements/learner-applications-browse-model";

const PAGE_SIZE = 20;

function humanize(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(date: Date | null) {
  if (!date) return "Not available";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle:"medium", timeStyle:"short", timeZone:"Asia/Kolkata",
  }).format(date);
}

export function LearnerApplicationsBrowse({
  items,
}: {
  items: readonly LearnerPlacementJourneyItem[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [search, setSearch] = useState(() => params.get("q") ?? "");
  const updateQuery = useCallback((change: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key,value] of Object.entries(change)) {
      if (!value || value === "all") next.delete(key);
      else next.set(key, value);
    }
    if (!Object.prototype.hasOwnProperty.call(change, "page")) next.delete("page");
    const query = next.toString();
    router.replace(query ? pathname + "?" + query : pathname, { scroll:false });
  }, [params, router, pathname]);

  useEffect(() => {
    const onPop = () => {
      setSearch(new URLSearchParams(window.location.search).get("q") ?? "");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    if (search === (params.get("q") ?? "")) return;
    const timer = window.setTimeout(() => updateQuery({q:search.trim() || null}), 220);
    return () => window.clearTimeout(timer);
  }, [search, params, updateQuery]);

  const viewRaw = params.get("view");
  const view: LearnerApplicationBrowseFilters["view"] =
    viewRaw === "progress" || viewRaw === "completed" ? viewRaw : "all";
  const sortRaw = params.get("sort");
  const sort: LearnerApplicationBrowseFilters["sort"] =
    sortRaw === "company" || sortRaw === "oldest" ? sortRaw : "activity";
  const filters: LearnerApplicationBrowseFilters = {
    ...DEFAULT_LEARNER_APPLICATION_FILTERS,
    search,
    view,
    stage: params.get("stage") ?? "all",
    sort,
  };
  const rows = browseLearnerApplications(items, filters);
  const totalPages = Math.max(1,Math.ceil(rows.length / PAGE_SIZE));
  const requested = Number(params.get("page") ?? "1");
  const page = Number.isInteger(requested) && requested > 0
    ? Math.min(requested,totalPages) : 1;
  const paged = rows.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const stages = learnerApplicationStageOptions(items);
  const selected = items.find((item) =>
    item.applicationId === params.get("applicationId")) ?? null;
  const viewOptions = [
    {key:"all", label:"All"},
    {key:"progress", label:"In Progress"},
    {key:"completed", label:"Completed"},
  ] as const;

  return (
    <div className="space-y-5">
      <section aria-label="Application list filters" className="space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Application stage views">
          {viewOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              aria-pressed={view===option.key}
              onClick={() => updateQuery({view:option.key})}
              className={view===option.key
                ? "min-h-10 rounded-full bg-primary px-4 text-sm font-semibold text-on-primary"
                : "min-h-10 rounded-full border border-border px-4 text-sm font-semibold text-body"}
            >{option.label}</button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs font-semibold text-body">
            Company or role
            <input type="search" value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search applications…"
              className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]" />
          </label>
          <label className="text-xs font-semibold text-body">
            Screening stage
            <select
              value={filters.stage}
              onChange={(event) => updateQuery({stage:event.target.value})}
              className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground">
              <option value="all">All stages</option>
              {stages.map((stage) => (
                <option value={stage} key={stage}>{humanize(stage)}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-body">
            Sort applications
            <select
              value={sort}
              onChange={(event) => updateQuery({sort:event.target.value})}
              className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground">
              <option value="activity">Recent activity</option>
              <option value="company">Company A–Z</option>
              <option value="oldest">Oldest application</option>
            </select>
          </label>
        </div>
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-body">
        <p role="status">{rows.length} of {items.length} applications</p>
        {(search || view!=="all" || filters.stage!=="all" || sort!=="activity") ? (
          <button type="button"
            onClick={() => {setSearch("");router.replace(pathname,{scroll:false});}}
            className="min-h-10 font-semibold text-primary-text hover:underline">
            Clear filters
          </button>
        ):null}
      </div>

      {items.length===0 ? (
        <LearnerPlacementJourney items={[]} />
      ) : rows.length===0 ? (
        <div className="rounded-xl border border-border bg-surface p-6 text-center">
          <p className="font-semibold text-foreground">No applications match these filters.</p>
          <button type="button" onClick={() => {setSearch("");router.replace(pathname,{scroll:false});}}
            className="mt-3 min-h-10 text-sm font-semibold text-primary-text hover:underline">
            View all applications
          </button>
        </div>
      ) : <LearnerPlacementJourney items={paged} />}

      {totalPages>1 ? (
        <nav aria-label="Application results pages" className="flex items-center justify-between gap-3">
          <button type="button" disabled={page<=1}
            onClick={() => updateQuery({page:String(page-1)})}
            className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-body disabled:opacity-40">
            Previous
          </button>
          <span className="text-sm tabular-nums text-body">Page {page} of {totalPages}</span>
          <button type="button" disabled={page>=totalPages}
            onClick={() => updateQuery({page:String(page+1)})}
            className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-body disabled:opacity-40">
            Next
          </button>
        </nav>
      ) : null}

      <Drawer open={selected!==null}
        onOpenChange={(open) => {if(!open)updateQuery({applicationId:null});}}
        title={selected ? selected.companyName + " · " + selected.jobTitle : "Application"}
        description={selected ? "Your application history and confirmed outcome" : undefined}
        footer={<>
          {selected ? (
            <>
              <Link
                href={`/learn/my-placements/applications/${encodeURIComponent(selected.applicationId)}/history`}
                className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text"
              >
                Full history
              </Link>
              <Link
                href={`/learn/my-placements/applications/${encodeURIComponent(selected.applicationId)}/company`}
                className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text"
              >
                Company preview
              </Link>
            </>
          ) : null}
          <Link href="/learn/my-placements/assessments" className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text">
            Assessments
          </Link>
          <Link href="/learn/my-placements/interviews" className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text">
            Interviews
          </Link>
          <Button onClick={() => updateQuery({applicationId:null})}>Got it</Button>
        </>}>
        {selected ? (
          <div className="space-y-5">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div><dt className="text-xs font-semibold text-muted-foreground">Applied</dt>
                <dd className="mt-1 text-sm text-foreground">{formatDate(selected.submittedAt)}</dd></div>
              <div><dt className="text-xs font-semibold text-muted-foreground">Channel</dt>
                <dd className="mt-1 text-sm text-foreground">{humanize(selected.channel)}</dd></div>
              <div><dt className="text-xs font-semibold text-muted-foreground">Status</dt>
                <dd className="mt-1 text-sm text-foreground">{humanize(selected.applicationStatus)}</dd></div>
              <div><dt className="text-xs font-semibold text-muted-foreground">Screening</dt>
                <dd className="mt-1 text-sm text-foreground">{humanize(learnerApplicationStage(selected))}</dd></div>
            </dl>
            {selected.screening.candidateMessage ? (
              <section className="rounded-lg border border-border bg-surface-subtle p-4 text-sm text-body">
                <h3 className="font-semibold text-foreground">Placement team feedback</h3>
                <p className="mt-2 whitespace-pre-wrap">{selected.screening.candidateMessage}</p>
              </section>
            ):null}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Round history</h3>
              {selected.results.length ? selected.results
                .slice().sort((a,b)=>a.roundSequence-b.roundSequence)
                .map((result)=>(
                  <article key={result.resultId} className="rounded-md border border-border p-4">
                    <p className="text-sm font-semibold text-foreground">Round {result.roundSequence} · {result.roundName}</p>
                    <p className="mt-1 text-sm text-body">
                      {humanize(result.outcome)} · {formatDate(result.appliedAt)}
                    </p>
                    {result.candidateMessage ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-body">{result.candidateMessage}</p>
                    ):null}
                  </article>
                )) : (
                <p className="text-sm text-body">No confirmed round results yet.</p>
              )}
            </section>
            {selected.withdrawnAt ? <p className="text-sm text-muted-foreground">
              Withdrawn {formatDate(selected.withdrawnAt)}
            </p> : null}
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
