"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Dialog } from "@/components/ui/dialog";
import { learnerApplicationWithdrawalSchema } from "@/modules/placements/learner-withdrawal-model";
import {readLearnerApplicationUrl,updateLearnerApplicationUrl} from "@/modules/placements/learner-application-url-model";
import {learnerApplicationMobileSummary} from "@/modules/placements/learner-applications-mobile-model";
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
  const url=readLearnerApplicationUrl(params.toString());
  const [search,setSearch]=useState(url.q);
  const [mobileOpen,setMobileOpen]=useState(false);
  const lastCommitted=useRef(url.q);
  const expectedNavigation=useRef<string|null>(null);
  const [withdrawTarget, setWithdrawTarget] = useState<LearnerPlacementJourneyItem | null>(null);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [withdrawPending, setWithdrawPending] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawNotice, setWithdrawNotice] = useState<string | null>(null);
  const updateQuery=useCallback((changes:Record<string,string|null>)=>{
    const q=updateLearnerApplicationUrl(params.toString(),changes);
    router.push(q?pathname+"?"+q:pathname,{scroll:false});
  },[params,router,pathname]);
  useEffect(()=>{
    const onPop=()=>{
      const current=readLearnerApplicationUrl(window.location.search).q;
      expectedNavigation.current=current;
      lastCommitted.current=current;setSearch(current);
    };
    window.addEventListener("popstate",onPop);
    return ()=>window.removeEventListener("popstate",onPop);
  },[]);
  useEffect(()=>{
    // Wait for the route state to catch up to Back/Forward or a pending push.
    // Never replace a navigated search with the old query from the prior render.
    if(expectedNavigation.current!==null){
      if(url.q!==expectedNavigation.current)return;
      expectedNavigation.current=null;
      return;
    }
    if(lastCommitted.current===url.q)return;
    lastCommitted.current=url.q;setSearch(url.q);
  },[url.q]);
  useEffect(()=>{
    if(expectedNavigation.current!==null)return;
    const value=search.trim().slice(0,100);
    if(value===url.q)return;
    const timer=window.setTimeout(()=>{
      expectedNavigation.current=value;
      lastCommitted.current=value;updateQuery({q:value||null});
    },350);
    return ()=>window.clearTimeout(timer);
  },[search,url.q,updateQuery]);
  async function confirmWithdrawal() {
    if (!withdrawTarget || withdrawPending) return;
    const parsed = learnerApplicationWithdrawalSchema.safeParse({
      action: "WITHDRAW",
      confirmed: true,
      reason: withdrawReason,
    });
    if (!parsed.success) {
      setWithdrawError(parsed.error.issues[0]?.message ?? "Enter a valid reason.");
      return;
    }
    setWithdrawPending(true);
    setWithdrawError(null);
    try {
      const response = await fetch(
        "/api/placements/applications/" +
          encodeURIComponent(withdrawTarget.applicationId) + "/actions",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(parsed.data),
        },
      );
      if (!response.ok) {
        throw new Error("Withdrawal could not be saved. Your application has not been changed.");
      }
      setWithdrawTarget(null);
      setWithdrawReason("");
      setWithdrawNotice("Application withdrawn. The updated status will appear in your history.");
      updateQuery({ applicationId: null });
      router.refresh();
    } catch (error) {
      setWithdrawError(error instanceof Error ? error.message : "Unable to withdraw application.");
    } finally {
      setWithdrawPending(false);
    }
  }

  const view:LearnerApplicationBrowseFilters["view"]=url.view;
  const sort:LearnerApplicationBrowseFilters["sort"]=url.sort;
  const filters:LearnerApplicationBrowseFilters={
    ...DEFAULT_LEARNER_APPLICATION_FILTERS,search,view,stage:url.stage,sort,
  };
  const rows = browseLearnerApplications(items, filters);
  const totalPages = Math.max(1,Math.ceil(rows.length / PAGE_SIZE));
  const requested = url.page;
  const page = Number.isInteger(requested) && requested > 0
    ? Math.min(requested,totalPages) : 1;
  const paged = rows.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const stages = learnerApplicationStageOptions(items);
  const selected = items.find((item) =>
    item.applicationId === url.applicationId) ?? null;
  const viewOptions = [
    {key:"all", label:"All"},
    {key:"progress", label:"In Progress"},
    {key:"completed", label:"Completed"},
  ] as const;

  return (
    <div className="space-y-5">
      {withdrawNotice ? (
        <p role="status" className="rounded-lg border border-border bg-surface p-4 text-sm text-foreground">
          {withdrawNotice}
        </p>
      ) : null}
      <section aria-label="Application list filters" className="rounded-xl border border-border bg-surface p-3 sm:p-5">
        <button type="button" aria-controls="learner-app-filters" aria-expanded={mobileOpen}
          onClick={()=>setMobileOpen(open=>!open)}
          className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-sm font-semibold text-primary-text sm:hidden">
          <span>{mobileOpen?"Hide application filters":learnerApplicationMobileSummary(filters)}</span>
          <span aria-hidden="true">{mobileOpen?"−":"+"}</span>
        </button>
        <div id="learner-app-filters" className={(mobileOpen?"block":"hidden")+" space-y-4 sm:block"}>
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
              placeholder="Search applications…" maxLength={100}
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
        </div>
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-body">
        <p role="status">{rows.length} of {items.length} applications</p>
        {(search || view!=="all" || filters.stage!=="all" || sort!=="activity") ? (
          <button type="button"
            onClick={() => {setSearch("");router.push(pathname,{scroll:false});}}
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
          <button type="button" onClick={() => {setSearch("");router.push(pathname,{scroll:false});}}
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
                href={`/learn/my-placements/applications/${encodeURIComponent(selected.applicationId)}`}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border px-3 text-center text-sm font-semibold text-primary-text sm:w-auto"
              >Application detail</Link>
              <Link
                href={`/learn/my-placements/applications/${encodeURIComponent(selected.applicationId)}/history`}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border px-3 text-center text-sm font-semibold text-primary-text sm:w-auto"
              >
                Full history
              </Link>
              <Link
                href={`/learn/my-placements/applications/${encodeURIComponent(selected.applicationId)}/company`}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border px-3 text-center text-sm font-semibold text-primary-text sm:w-auto"
              >
                Company preview
              </Link>
            </>
          ) : null}
          {selected?.applicationStatus === "SUBMITTED" ? (
            <Button
              variant="secondary"
              disabled={withdrawPending}
              onClick={() => {
                setWithdrawTarget(selected);
                setWithdrawReason("");
                setWithdrawError(null);
                setWithdrawNotice(null);
              }}
            >
              Withdraw application
            </Button>
          ) : null}
          <Link href="/learn/my-placements/assessments" className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border px-3 text-center text-sm font-semibold text-primary-text sm:w-auto">
            Assessments
          </Link>
          <Link href="/learn/my-placements/interviews" className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border px-3 text-center text-sm font-semibold text-primary-text sm:w-auto">
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

      <Dialog
        open={withdrawTarget !== null}
        onOpenChange={(open) => {
          if (!open && !withdrawPending) {
            setWithdrawTarget(null);
            setWithdrawError(null);
          }
        }}
        title="Confirm application withdrawal"
        description="This changes the official status of your submitted application. This action cannot be undone here."
        footer={
          <>
            <Button variant="secondary" disabled={withdrawPending}
              onClick={() => { setWithdrawTarget(null); setWithdrawError(null); }}>
              Keep application
            </Button>
            <Button
              disabled={withdrawPending || !learnerApplicationWithdrawalSchema.safeParse({
                action: "WITHDRAW", confirmed: true, reason: withdrawReason,
              }).success}
              onClick={() => { void confirmWithdrawal(); }}
            >
              {withdrawPending ? "Withdrawing…" : "Confirm withdrawal"}
            </Button>
          </>
        }
      >
        {withdrawTarget ? (
          <div className="space-y-4">
            <p className="break-words text-sm text-body">
              {withdrawTarget.companyName} · {withdrawTarget.jobTitle}
            </p>
            <label className="block text-sm font-semibold text-foreground">
              Reason for withdrawal <span className="font-normal text-muted-foreground">(required)</span>
              <textarea
                value={withdrawReason}
                onChange={(event) => { setWithdrawReason(event.target.value); setWithdrawError(null); }}
                minLength={5}
                maxLength={500}
                rows={4}
                disabled={withdrawPending}
                aria-describedby="withdrawal-reason-hint"
                className="mt-2 min-h-24 w-full rounded-md border border-border bg-surface p-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
                placeholder="Briefly explain why you are withdrawing"
              />
            </label>
            <p id="withdrawal-reason-hint" className="text-xs text-muted-foreground">
              5–500 characters. Your reason is stored in application status history
              for the placement team; it is not shown on the public Learner timeline.
            </p>
            {withdrawError ? (
              <p role="alert" className="text-sm font-semibold text-error">{withdrawError}</p>
            ) : null}
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
