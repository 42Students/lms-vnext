"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Dialog } from "@/components/ui/dialog";
import { learnerApplicationWithdrawalSchema } from "@/modules/placements/learner-withdrawal-model";
import {learnerWithdrawalMode} from "@/modules/placements/learner-withdrawal-mode-model";
import {learnerApplicationJourneyTimeline} from "@/modules/placements/learner-application-journey-timeline-model";
import {ownApplicationJobHref} from "@/modules/placements/learner-application-job-link-model";
import {readLearnerApplicationUrl,updateLearnerApplicationUrl} from "@/modules/placements/learner-application-url-model";
import {learnerApplicationMobileSummary} from "@/modules/placements/learner-applications-mobile-model";
import {learnerApplicationStageCounts} from "@/modules/placements/learner-application-stage-chips-model";
import {learnerApplicationStageSelection} from "@/modules/placements/learner-application-stage-selection-model";
import {learnerApplicationAttention} from "@/modules/placements/learner-application-attention-model";
import {learnerApplicationEmptyKind} from "@/modules/placements/learner-application-empty-model";
import {learnerApplicationPage} from "@/modules/placements/learner-application-pagination-model";
import {learnerApplicationSelectionMissing} from "@/modules/placements/learner-application-selection-model";
import { learnerApplicationsCsv,LEARNER_APPLICATION_CSV_LIMIT } from "@/modules/placements/learner-applications-csv-model";
import type {OwnApplicationInterviewLink} from "@/modules/placements/learner-application-interview-links-model";
import type {OwnApplicationAssessmentLink} from "@/modules/placements/learner-application-assessment-links-model";
import {learnerApplicationDateLabel} from "@/modules/placements/learner-application-date-label-model";
import { LearnerPlacementJourney, type LearnerPlacementJourneyItem } from "./learner-placement-journey";
import {
  browseLearnerApplications,
  learnerApplicationStage,
  learnerApplicationStageOptions,
  learnerApplicationViewCounts,
  DEFAULT_LEARNER_APPLICATION_FILTERS,
  type LearnerApplicationBrowseFilters,
} from "@/modules/placements/learner-applications-browse-model";

const PAGE_SIZE = 20;
const viewOptions=[
  {key:"progress",label:"In progress"},
  {key:"completed",label:"Finished"},
  {key:"all",label:"All"},
] as const;

function humanize(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

const formatDate=learnerApplicationDateLabel;

export function LearnerApplicationsBrowse({
  items,interviewLinks=[],assessmentLinks=[],scheduledRounds=[],
}: {
  items: readonly LearnerPlacementJourneyItem[];
  scheduledRounds?:readonly {applicationId:string;roundId:string;roundName:string;
    scheduledAt:string|null;mode:string;venue:string|null;isRescheduled:boolean;booked:boolean}[];
  interviewLinks?:readonly OwnApplicationInterviewLink[];
  assessmentLinks?:readonly OwnApplicationAssessmentLink[];
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
  // A synchronous flight lock prevents duplicate withdrawals before React rerenders.
  const pendingRef = useRef(false);
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
    if (!withdrawTarget || withdrawPending || pendingRef.current) return;
    const parsed = learnerApplicationWithdrawalSchema.safeParse({
      action: "WITHDRAW",
      confirmed: true,
      reason: withdrawReason,
    });
    if (!parsed.success) {
      setWithdrawError(parsed.error.issues[0]?.message ?? "Enter a valid reason.");
      return;
    }
    const requested=learnerWithdrawalMode({
      applicationStatus:withdrawTarget.applicationStatus,
      screeningStatus:withdrawTarget.screening.status,
      scheduledRoundCount:scheduledRounds.filter(r=>
        r.applicationId===withdrawTarget.applicationId&&(r.booked||r.isRescheduled)).length,
    })==="REQUEST";
    pendingRef.current = true;
    setWithdrawPending(true);
    setWithdrawError(null);
    try {
      const response=await fetch(requested?"/api/placements/requests":
        "/api/placements/applications/"+encodeURIComponent(withdrawTarget.applicationId)+"/actions",{
          method:"POST",headers:{"content-type":"application/json"},
          body:JSON.stringify(requested?{
            requestType:"APPLICATION_WITHDRAWAL",applicationId:withdrawTarget.applicationId,reason:withdrawReason.trim(),
          }:parsed.data),
        });
      if (!response.ok) {
        throw new Error("Withdrawal could not be saved. Your application has not been changed.");
      }
      setWithdrawTarget(null);
      setWithdrawReason("");
      setWithdrawNotice(requested?"Withdrawal request sent to the placement cell. Your application is still active until approved.":"Application withdrawn. The updated status will appear in your history.");
      updateQuery({ applicationId: null });
      router.refresh();
    } catch (error) {
      setWithdrawError(error instanceof Error ? error.message : "Unable to withdraw application.");
    } finally {
      pendingRef.current = false;
      setWithdrawPending(false);
    }
  }

  const view:LearnerApplicationBrowseFilters["view"]=url.view;
  const sort:LearnerApplicationBrowseFilters["sort"]=url.sort;
  const stages = learnerApplicationStageOptions(items);
  const selectedStage=learnerApplicationStageSelection(stages,url.stage);
  const filters:LearnerApplicationBrowseFilters={
    ...DEFAULT_LEARNER_APPLICATION_FILTERS,search,view,stage:selectedStage.stage,sort,
  };
  const rows = browseLearnerApplications(items, filters);
  const viewCounts=learnerApplicationViewCounts(items);
  const emptyKind=learnerApplicationEmptyKind(items.length,rows.length);
  const pagination = learnerApplicationPage(rows.length,url.page,PAGE_SIZE);
  const totalPages = pagination.pages;
  const page = pagination.page;
  const paged = rows.slice(pagination.start,pagination.end);
  const stageCounts = learnerApplicationStageCounts(items);
  const attention=learnerApplicationAttention(items);
  const selected = items.find((item) =>
    item.applicationId === url.applicationId) ?? null;
  const selectedAssessment=selected
    ? assessmentLinks.find(link=>link.applicationId===selected.applicationId)??null
    : null;
  const selectedInterview=selected
    ? interviewLinks.find(link=>link.applicationId===selected.applicationId)??null
    : null;

  function downloadOwnApplications(){
    const csv=learnerApplicationsCsv(rows);
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
    try{
      const link=document.createElement("a");
      link.href=url;
      link.download="my-placement-applications.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {URL.revokeObjectURL(url);}
  }
  return (
    <div className="space-y-5">
      {learnerApplicationSelectionMissing(items,url.applicationId) ? (
        <div role="status" className="rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-4 text-sm text-body">
          The linked application is not available in your current learner history.
          <button type="button" onClick={()=>updateQuery({applicationId:null})}
            className="ml-2 min-h-11 font-semibold text-primary-text underline">Return to application list</button>
        </div>
      ) : null}
      {selectedStage.stale ? (
        <p role="status" className="rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-4 text-sm text-body">
          That screening stage is no longer present in your applications. Showing all stages while keeping your other filters.
          <button type="button" onClick={()=>updateQuery({stage:null})}
            className="ml-2 inline-flex min-h-11 sm:min-h-9 items-center font-semibold text-primary-text underline">
            Update stage link
          </button>
        </p>
      ) : null}
      {withdrawNotice ? (
        <p role="status" className="rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-4 text-sm text-foreground">
          {withdrawNotice}
        </p>
      ) : null}
      {attention.rows.length>0 ? (
        <section aria-label="Application screening updates" role="status"
          className="rounded-xl border border-border bg-surface p-4 sm:p-5">
          <h2 className="text-base font-semibold text-foreground">Application screening updates</h2>
          <p className="mt-1 text-sm text-body">
            {attention.shortlistedCount} shortlisted · {attention.underReviewCount} under review.
            These are saved placement-team stages, not application deadlines.
          </p>
          <ul className="mt-3 space-y-2">
            {attention.rows.map(row=>(
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3">
                <span className="min-w-0 text-sm text-body">
                  <strong className="break-words text-foreground">{row.title}</strong>
                  <span className="ml-2 text-xs text-muted-foreground">{row.detail}</span>
                </span>
                <Link href={row.href} className="inline-flex min-h-11 sm:min-h-9 items-center text-sm font-semibold text-primary-text">
                  View application →
                </Link>
              </li>
            ))}
          </ul>
          {attention.overflow>0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {attention.overflow} more applications in these stages. Use filters below.
            </p>
          ) : null}
        </section>
      ) : null}
      <section aria-label="Application list filters" className="border-t border-border pt-4">
        <button type="button" aria-controls="learner-app-filters" aria-expanded={mobileOpen}
          onClick={()=>setMobileOpen(open=>!open)}
          className="flex min-h-11 sm:min-h-9 w-full items-center justify-between gap-3 text-left text-sm font-semibold text-primary-text sm:hidden">
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
                ? "min-h-9 border-b-2 border-[var(--lms-button-primary)] px-4 py-2 text-sm font-semibold text-[var(--lms-primary-text)]"
                : "min-h-9 border-b-2 border-transparent px-4 py-2 text-sm font-semibold text-body hover:text-[var(--lms-primary-text)]"}
            >{option.label} ({viewCounts[option.key]})</button>
          ))}
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          Finished means rejected or withdrawn here. Shortlisting and applied round results
          do not by themselves prove an offer, hiring, or employer completion.
        </p>
        <div role="group" aria-label="Screening stage filter chips" className="flex flex-wrap gap-2">
          {stageCounts.map(({stage:stageKey,count})=>(
            <button type="button" key={stageKey} aria-pressed={filters.stage===stageKey}
              onClick={()=>updateQuery({stage:stageKey})}
              className={filters.stage===stageKey
                ? "min-h-11 rounded-[var(--lms-control-radius)] bg-[var(--lms-button-primary)] px-4 text-sm font-semibold text-[var(--lms-on-primary)] sm:min-h-9"
                : "min-h-11 rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-body sm:min-h-9"}>
              {stageKey==="all"?"All screening stages":humanize(stageKey)} ({count})
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs font-semibold text-body">
            Company or role
            <input type="search" value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search company or role" maxLength={100}
              className="mt-1 min-h-11 sm:min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]" />
          </label>
          <label className="text-xs font-semibold text-body">
            Screening stage
            <select
              value={filters.stage}
              onChange={(event) => updateQuery({stage:event.target.value})}
              className="mt-1 min-h-11 sm:min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm text-foreground">
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
              className="mt-1 min-h-11 sm:min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm text-foreground">
              <option value="activity">Recent activity</option>
              <option value="company">Company A–Z</option>
              <option value="stage">Screening stage A–Z</option>
              <option value="oldest">Oldest application</option>
            </select>
          </label>
        </div>
        </div>
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-body">
        <p role="status">{rows.length} of {items.length} applications</p>
        {rows.length>0 ? (
          <button type="button" onClick={downloadOwnApplications}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-primary-text">
            Export matching applications CSV
          </button>
        ) : null}
        {rows.length>LEARNER_APPLICATION_CSV_LIMIT ? (
          <p role="status" className="w-full text-xs text-muted-foreground">
            CSV includes the first {LEARNER_APPLICATION_CSV_LIMIT} of {rows.length} matching applications. Narrow your filters to export other records.
          </p>
        ) : null}
        {(search || view!=="all" || filters.stage!=="all" || sort!=="activity") ? (
          <button type="button"
            onClick={() => {setSearch("");router.push(pathname,{scroll:false});}}
            className="min-h-10 font-semibold text-primary-text hover:underline">
            Clear filters
          </button>
        ):null}
      </div>

      {pagination.corrected && rows.length>0 ? <p role="status" className="rounded-lg border border-border bg-surface p-3 text-sm text-body">
        The requested application page is outside the matching results; showing page {page} of {totalPages}.
        <button type="button" className="ml-2 min-h-11 font-semibold text-primary-text underline"
          onClick={()=>updateQuery({page:String(page)})}>Use this page in the link</button>
      </p> : null}
      {emptyKind==="NO_APPLICATIONS" ? (
        <div className="space-y-3">
          <LearnerPlacementJourney items={[]} />
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-sm text-body">No applications have been recorded for this learner yet.
              Browse your published college drives and check eligibility before applying.</p>
            <Link href="/learn/my-placements/jobs"
              className="mt-2 inline-flex min-h-11 sm:min-h-9 items-center text-sm font-semibold text-primary-text underline">
              Browse available drives →
            </Link>
          </div>
        </div>
      ) : emptyKind==="FILTERED_OUT" ? (
        <div className="rounded-xl border border-border bg-surface p-6 text-center">
          <p className="font-semibold text-foreground">No applications match these filters.</p>
          <button type="button" onClick={() => {setSearch("");router.push(pathname,{scroll:false});}}
            className="mt-3 min-h-10 text-sm font-semibold text-primary-text hover:underline">
            View all applications
          </button>
        </div>
      ) : <LearnerPlacementJourney items={paged} scheduledRounds={scheduledRounds} />}

      {totalPages>1 ? (
        <nav aria-label="Application results pages" className="flex items-center justify-between gap-3">
          <button type="button" disabled={page<=1}
            onClick={() => updateQuery({page:String(page-1)})}
            className="min-h-9 rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-body disabled:opacity-40">
            Previous
          </button>
          <span className="text-sm tabular-nums text-body">Page {page} of {totalPages}</span>
          <button type="button" disabled={page>=totalPages}
            onClick={() => updateQuery({page:String(page+1)})}
            className="min-h-9 rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-body disabled:opacity-40">
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
              {ownApplicationJobHref(selected.jobId) ? <Link
                href={ownApplicationJobHref(selected.jobId)!}
                className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-primary-text">
                View drive
              </Link> : null}
              <Link
                href={`/learn/my-placements/applications/${encodeURIComponent(selected.applicationId)}`}
                className="inline-flex min-h-11 sm:min-h-9 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 text-center text-sm font-semibold text-primary-text sm:w-auto"
              >Application detail</Link>
              <Link
                href={`/learn/my-placements/applications/${encodeURIComponent(selected.applicationId)}/history`}
                className="inline-flex min-h-11 sm:min-h-9 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 text-center text-sm font-semibold text-primary-text sm:w-auto"
              >
                Full history
              </Link>
              <Link
                href={`/learn/my-placements/applications/${encodeURIComponent(selected.applicationId)}/company`}
                className="inline-flex min-h-11 sm:min-h-9 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 text-center text-sm font-semibold text-primary-text sm:w-auto"
              >
                What the company sees
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
              {selected.screening.status==="SHORTLISTED"&&scheduledRounds.some(r=>r.applicationId===selected.applicationId)?"Ask to withdraw":"Withdraw application"}
            </Button>
          ) : null}
          <Link href={selectedAssessment?.href??"/learn/my-placements/assessments"}
            className="inline-flex min-h-11 sm:min-h-9 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 text-center text-sm font-semibold text-primary-text sm:w-auto">
            {selectedAssessment?"Open this assessment":"Assessments"}
          </Link>
          <Link href={selectedInterview?.href??"/learn/my-placements/interviews"} className="inline-flex min-h-11 sm:min-h-9 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 text-center text-sm font-semibold text-primary-text sm:w-auto">
            {selectedInterview?"Open this interview":"Interviews"}
          </Link>
          <Button onClick={() => updateQuery({applicationId:null})}>Got it</Button>
        </>}>
        {selected ? (
          <div className="space-y-5">
            {selected.driveStatus==="CANCELLED"?<div role="alert" className="rounded-[var(--lms-control-radius)] border border-warning bg-warning-subtle p-3 text-sm text-body">
              <p className="font-semibold text-foreground">This drive was cancelled</p>
              <p>Review placement cell notices for any published reason. Your saved application history remains available.</p>
              <Link href="/learn/my-placements/announcements" className="mt-2 inline-flex min-h-10 items-center text-primary-text underline">College notices</Link>
            </div>:selected.driveStatus==="CLOSED"?<p role="status" className="rounded-lg border border-border p-3 text-sm text-body">This drive has closed. Previously recorded results remain visible.</p>:null}
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
            <section aria-label="Selection process" className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-foreground">Selection process</h3>
                <Link href="/learn/my-placements/schedule" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">See in schedule</Link>
              </div>
              <ol className="mt-3 space-y-2 text-sm text-body">
                {scheduledRounds.filter(round=>round.applicationId===selected.applicationId)
                  .sort((a,b)=>Date.parse(a.scheduledAt??"9999-12-31")-Date.parse(b.scheduledAt??"9999-12-31"))
                  .map(round=><li key={round.roundId} className="rounded-[var(--lms-control-radius)] border border-border p-3">
                    <p className="font-semibold text-foreground">{round.roundName} · Booked</p>
                    <p>{round.scheduledAt?formatDate(new Date(round.scheduledAt)):"Date to be told"}
                      {" · "}{round.mode==="VIRTUAL"?"Online":round.mode==="ON_CAMPUS"?"On campus":round.mode}
                    </p>
                    <p>{round.venue??"Venue to be told"}</p>
                    {round.isRescheduled?<p className="text-xs font-semibold text-primary-text">You asked to reschedule · Updated time shown</p>:null}
                  </li>)}
                {!scheduledRounds.some(round=>round.applicationId===selected.applicationId)?<li>
                  No upcoming rounds are booked for this application.
                </li>:null}
              </ol>
            </section>
            <section aria-label="Application milestones" className="rounded-xl border border-border bg-surface-subtle p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">Recent recorded milestones</h3>
                <Link href={"/learn/my-placements/applications/"+
                  encodeURIComponent(selected.applicationId)+"/history"}
                  className="inline-flex min-h-11 sm:min-h-9 items-center text-sm font-semibold text-primary-text underline">
                  Full saved history →
                </Link>
              </div>
              <ol className="mt-3 space-y-3">
                {learnerApplicationJourneyTimeline(selected).slice(0,5).map(item=>(
                  <li key={item.key} className="border-l-2 border-primary pl-3 text-sm">
                    <p className="font-semibold text-foreground">{item.label}</p>
                    <time dateTime={item.at.toISOString()} className="mt-1 block text-xs text-muted-foreground">
                      {formatDate(item.at)}
                    </time>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-xs text-muted-foreground">
                Only events with recorded timestamps are shown. This is a summary, not the full audit history.
              </p>
            </section>
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
                  <article key={result.resultId} className="rounded-[var(--lms-control-radius)] border border-border p-4">
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
        title={withdrawTarget?.screening.status==="SHORTLISTED"&&scheduledRounds.some(r=>r.applicationId===withdrawTarget.applicationId)?"Ask to withdraw":"Confirm application withdrawal"}
        description={withdrawTarget?.screening.status==="SHORTLISTED"&&scheduledRounds.some(r=>r.applicationId===withdrawTarget.applicationId)
          ?"A scheduled round has been booked. Your request goes to the placement cell; it does not immediately withdraw your application."
          :"This changes the official status of your submitted application. This action cannot be undone here."}
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
