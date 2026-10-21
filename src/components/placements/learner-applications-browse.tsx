"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Disclosure } from "@/components/ui/disclosure";
import { learnerApplicationWithdrawalSchema,learnerWithdrawalReasonSchema } from "@/modules/placements/learner-withdrawal-model";
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
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Tabs } from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/pagination";
import {Textarea} from "@/components/ui/textarea";

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
/** Authorization is supplied by the scoped application reader; client
 * screening/round heuristics must never grant withdrawal privileges. */
type WithdrawalGrantItem=LearnerPlacementJourneyItem & {
 withdraw?:"SELF"|"REQUEST"|null;
 cancelledReason?:string|null;
};
function authorizedWithdrawalMode(item:LearnerPlacementJourneyItem|null){
 if(!item||item.applicationStatus!=="SUBMITTED")return null;
 const value=(item as WithdrawalGrantItem).withdraw;
 if(value==="SELF"||value==="REQUEST")return value;
 if(item.mayStaffOptOut===true && item.staffOptOutUntil instanceof Date &&
    item.staffOptOutUntil.getTime()>Date.now())return "SELF";
 return null;
}


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
    const granted=authorizedWithdrawalMode(withdrawTarget);
    if(!granted){setWithdrawError("Withdrawal is not currently available.");return;}
    const requested=granted==="REQUEST";
    const requestReason=requested?learnerWithdrawalReasonSchema.safeParse(withdrawReason):null;
    if(requested && !requestReason?.success){
      setWithdrawError(requestReason?.error.issues[0]?.message ?? "Enter a reason of at least three characters.");
      return;
    }
    const parsed=learnerApplicationWithdrawalSchema.safeParse({
      action:"WITHDRAW",confirmed:true,reason:withdrawReason,
    });
    if(!parsed.success){
      setWithdrawError(parsed.error.issues[0]?.message ?? "Enter a valid reason.");
      return;
    }
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
        const body:unknown=await response.json().catch(()=>null);
        const message=body && typeof body==="object" &&
          "message" in body && typeof body.message==="string" &&
          body.message.length<=250 ? body.message : null;
        throw new Error(message || (requested?"Could not send the request":"Could not withdraw"));
      }
      setWithdrawTarget(null);
      setWithdrawReason("");
      setWithdrawNotice(requested?"Sent. The placement cell will reply.":"Application withdrawn");
      updateQuery({ applicationId: null });
      router.refresh();
    } catch (error) {
      setWithdrawError(error instanceof Error ? error.message :
        requested ? "Could not send the request" : "Could not withdraw");
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
  const selectedWithdrawMode=authorizedWithdrawalMode(selected);
  const withdrawMode=authorizedWithdrawalMode(withdrawTarget);
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
    <div className="min-w-0 space-y-5">
      {learnerApplicationSelectionMissing(items,url.applicationId) ? (
        <div role="status" className="rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-4 text-sm text-body">
          The linked application is not available in your current learner history.
          <Button variant="ghost" type="button" onClick={()=>updateQuery({applicationId:null})}
            className="mt-2 min-h-11 w-full sm:ml-2 sm:mt-0 sm:w-auto">Return to application list</Button>
        </div>
      ) : null}
      {selectedStage.stale ? (
        <p role="status" className="rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-4 text-sm text-body">
          That screening stage is no longer present in your applications. Showing all stages while keeping your other filters.
          <Button variant="ghost" type="button" onClick={()=>updateQuery({stage:null})}
            className="mt-2 min-h-11 w-full sm:ml-2 sm:mt-0 sm:w-auto md:min-h-[var(--lms-control-height)]">
            Update stage link
          </Button>
        </p>
      ) : null}
      {withdrawNotice ? (
        <p role="status" className="rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-4 text-sm text-foreground">
          {withdrawNotice}
        </p>
      ) : null}
      {attention.rows.length>0 ? (
        <section aria-label="Application screening updates" role="status"
          className="min-w-0 border-b border-[var(--lms-canvas-border)] py-3 md:py-4">
          <h2 className="text-[16px] font-semibold leading-[26px] text-foreground min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px]">Application screening updates</h2>
          <p className="mt-1 text-sm text-body">
            {attention.shortlistedCount} shortlisted · {attention.underReviewCount} under review.
            These are saved placement-team stages, not application deadlines.
          </p>
          <ul className="mt-3 divide-y divide-border">
            {attention.rows.map(row=>(
              <li key={row.id} className="flex min-w-0 flex-col items-start gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="min-w-0 text-sm text-body">
                  <strong className="break-words text-foreground">{row.title}</strong>
                  <span className="ml-2 text-xs text-muted-foreground">{row.detail}</span>
                </span>
                <Link href={row.href} className="inline-flex min-h-[var(--lms-control-height)] max-[767px]:min-h-11 items-center text-sm font-semibold text-primary-text hover:underline focus-visible:underline">
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
        <Button variant="ghost" type="button" aria-controls="learner-app-filters" aria-expanded={mobileOpen}
          onClick={()=>setMobileOpen(open=>!open)}
          className="flex min-h-11 w-full items-center justify-between gap-3 text-left min-[768px]:hidden">
          <span>{mobileOpen?"Hide application filters":learnerApplicationMobileSummary(filters)}</span>
          <span aria-hidden="true">{mobileOpen?"−":"+"}</span>
        </Button>
        <div id="learner-app-filters" className={(mobileOpen?"block":"hidden")+" space-y-4 min-[768px]:block"}>
        <Tabs ariaLabel="Application stage views" renderPanel={false} controlledOnly
          value={view}
          onValueChange={(next) => updateQuery({ view: next })}
          items={viewOptions.map(option => ({
            value: option.key,
            label: option.label,
            count: viewCounts[option.key],
          }))} />
        <p className="text-xs leading-5 text-muted-foreground">
          Finished means rejected or withdrawn here. Shortlisting and applied round results
          do not by themselves prove an offer, hiring, or employer completion.
        </p>
        <Disclosure title="Screening stage" className="border-b border-border" contentClassName="pb-3">
        <SegmentedControl label="Screening stage filter chips"
          className="w-fit max-w-full"
          value={filters.stage}
          onChange={(next) => updateQuery({ stage: next })}
          options={stageCounts.map(({ stage: stageKey, count }) => ({
            value: stageKey,
            label: (stageKey === "all" ? "All screening stages" : humanize(stageKey)) + " (" + count + ")",
          }))} />
        </Disclosure>
        <div className="grid min-w-0 grid-cols-1 gap-3 min-[768px]:grid-cols-2 min-[992px]:grid-cols-3">
          <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Company or role
            <Input type="search" value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search company or role" maxLength={100}
              className="mt-1 w-full" />
          </label>
          <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Screening stage
            <Select
              value={filters.stage}
              onChange={(event) => updateQuery({stage:event.target.value})}
              className="mt-1 w-full">
              <option value="all">All stages</option>
              {stages.map((stage) => (
                <option value={stage} key={stage}>{humanize(stage)}</option>
              ))}
            </Select>
          </label>
          <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Sort applications
            <Select
              value={sort}
              onChange={(event) => updateQuery({sort:event.target.value})}
              className="mt-1 w-full">
              <option value="activity">Recent activity</option>
              <option value="company">Company A–Z</option>
              <option value="stage">Screening stage A–Z</option>
              <option value="oldest">Oldest application</option>
            </Select>
          </label>
        </div>
        </div>
      </section>
      <div className="flex min-w-0 flex-col items-stretch gap-3 text-sm text-body md:flex-row md:flex-wrap md:items-center md:justify-between">
        <p role="status">{rows.length} of {items.length} applications</p>
        {rows.length>0 ? (
          <Button variant="secondary" type="button" onClick={downloadOwnApplications}
            className="min-h-11 w-full px-3 md:min-h-[var(--lms-control-height)] md:w-auto">
            Export matching applications CSV
          </Button>
        ) : null}
        {rows.length>LEARNER_APPLICATION_CSV_LIMIT ? (
          <p role="status" className="w-full text-xs text-muted-foreground">
            CSV includes the first {LEARNER_APPLICATION_CSV_LIMIT} of {rows.length} matching applications. Narrow your filters to export other records.
          </p>
        ) : null}
        {(search || view!=="all" || filters.stage!=="all" || sort!=="activity") ? (
          <Button variant="ghost" type="button"
            onClick={() => {setSearch("");router.push(pathname,{scroll:false});}}
            className="min-h-[var(--lms-control-height)] max-[767px]:min-h-11">
            Clear filters
          </Button>
        ):null}
      </div>

      {pagination.corrected && rows.length>0 ? <p role="status" className="rounded-lg border border-border bg-surface p-3 text-sm text-body">
        The requested application page is outside the matching results; showing page {page} of {totalPages}.
        <Button variant="ghost" type="button" className="ml-2 min-h-11"
          onClick={()=>updateQuery({page:String(page)})}>Use this page in the link</Button>
      </p> : null}
      {emptyKind==="NO_APPLICATIONS" ? (
        <div className="space-y-3">
          <LearnerPlacementJourney items={[]} />
          <div className="border-t border-border py-4">
            <p className="text-sm text-body">No applications have been recorded for this learner yet.
              Browse your published college drives and check eligibility before applying.</p>
            <Link href="/learn/my-placements/jobs"
              className="mt-2 inline-flex min-h-[var(--lms-control-height)] max-[767px]:min-h-11 items-center text-sm font-semibold text-primary-text underline focus-visible:underline">
              Browse available drives →
            </Link>
          </div>
        </div>
      ) : emptyKind==="FILTERED_OUT" ? (
        <div className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-[var(--lms-neutral-50)] px-6 py-12 text-center">
          <p className="font-semibold text-foreground">No applications match these filters.</p>
          <Button variant="ghost" type="button" onClick={() => {setSearch("");router.push(pathname,{scroll:false});}}
            className="mt-3 min-h-[var(--lms-control-height)] max-[767px]:min-h-11">
            View all applications
          </Button>
        </div>
      ) : <LearnerPlacementJourney items={paged} scheduledRounds={scheduledRounds} />}

      {totalPages>1 ? (
        <Pagination label="Application results pages" page={page} pageCount={totalPages}
          scroll={false}
          hrefForPage={target=>{
            const query=updateLearnerApplicationUrl(params.toString(),{page:String(target)});
            return query?pathname+"?"+query:pathname;
          }}/>
      ) : null}

      {selected ? <section id={"application-details-"+selected.applicationId}
        aria-label={"Application details for "+selected.companyName}
        className="min-w-0 scroll-mt-24 space-y-4 border-t border-border pt-5 [&_dd]:min-w-0 [&_dd]:break-words [&_dd]:[overflow-wrap:anywhere]">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div>
            <h2 className="break-words text-lg font-semibold text-foreground">
              {selected.companyName} · {selected.jobTitle}
            </h2>
            <p className="text-sm text-muted-foreground">Your application history and confirmed outcome</p>
          </div>
          <Button type="button" variant="ghost" aria-expanded={true}
            aria-controls={"application-details-"+selected.applicationId}
            onClick={()=>updateQuery({applicationId:null})}>Collapse details −</Button>
        </div>
        <div className="flex min-w-0 w-full flex-col-reverse items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {selected ? (
            <>
              {ownApplicationJobHref(selected.jobId) ? <Link
                href={ownApplicationJobHref(selected.jobId)!}
                className="inline-flex min-h-[var(--lms-control-height)] max-[767px]:min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-[650] text-primary-text">
                View drive
              </Link> : null}
              <Link
                href={`/learn/my-placements/applications/${encodeURIComponent(selected.applicationId)}`}
                className="inline-flex min-h-[var(--lms-control-height)] max-[767px]:min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 text-center text-sm font-[650] text-primary-text md:w-auto"
              >Application detail</Link>
              <Link
                href={`/learn/my-placements/applications/${encodeURIComponent(selected.applicationId)}/history`}
                className="inline-flex min-h-[var(--lms-control-height)] max-[767px]:min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 text-center text-sm font-[650] text-primary-text md:w-auto"
              >
                Full history
              </Link>
              <Link
                href={`/learn/my-placements/applications/${encodeURIComponent(selected.applicationId)}/company`}
                className="inline-flex min-h-[var(--lms-control-height)] max-[767px]:min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 text-center text-sm font-[650] text-primary-text md:w-auto"
              >
                What the company sees
              </Link>
            </>
          ) : null}
          {selectedWithdrawMode ? (
            <Button
              variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9"
              disabled={withdrawPending}
              onClick={() => {
                setWithdrawTarget(selected);
                setWithdrawReason("");
                setWithdrawError(null);
                setWithdrawNotice(null);
              }}
            >
              {selectedWithdrawMode==="REQUEST"?"Ask to withdraw":"Withdraw application"}
            </Button>
          ) : null}
          <Link href={selectedAssessment?.href??"/learn/my-placements/assessments"}
            className="inline-flex min-h-[var(--lms-control-height)] max-[767px]:min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 text-center text-sm font-[650] text-primary-text md:w-auto">
            {selectedAssessment?"Open this assessment":"Assessments"}
          </Link>
          <Link href={selectedInterview?.href??"/learn/my-placements/interviews"} className="inline-flex min-h-[var(--lms-control-height)] max-[767px]:min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 text-center text-sm font-[650] text-primary-text md:w-auto">
            {selectedInterview?"Open this interview":"Interviews"}
          </Link>
          <Button className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={() => updateQuery({applicationId:null})}>Got it</Button>
        </div>
        {selected ? (
          <div className="space-y-5">
            {selected.driveStatus==="CANCELLED"?<div role="alert" className="rounded-[var(--lms-control-radius)] border border-warning bg-warning-subtle p-3 text-sm text-body">
              <p className="font-semibold text-foreground">This drive was cancelled</p>
              <p>{(selected as WithdrawalGrantItem).cancelledReason ?? "Review placement cell notices for any published reason. Your saved application history remains available."}</p>
              <Link href="/learn/my-placements/announcements" className="mt-2 inline-flex min-h-[var(--lms-control-height)] max-[767px]:min-h-11 items-center text-primary-text underline focus-visible:underline">College notices</Link>
            </div>:selected.driveStatus==="CLOSED"?<p role="status" className="border-b border-[var(--lms-canvas-border)] py-3 text-sm text-body">This drive has closed. Previously recorded results remain visible.</p>:null}
            {selected.mayStaffOptOut && selected.staffOptOutUntil &&
              selected.staffOptOutUntil.getTime()>Date.now() ?
              <p role="status" className="border-b border-border py-3 text-sm text-body">
                The placement cell applied for you. You may opt out until {formatDate(selected.staffOptOutUntil)}.
              </p> : null}
            {selected.screening.status==="REJECTED" ? (
              <p role="status" className="border-b border-border py-3 text-sm text-body">
                Not selected by the company{selected.screening.candidateMessage?
                  ": "+selected.screening.candidateMessage:"."}
              </p>
            ) : null}
            <dl className="grid gap-3 md:grid-cols-2">
              <div><dt className="text-xs font-semibold text-muted-foreground">Applied</dt>
                <dd className="mt-1 text-sm text-foreground">{formatDate(selected.submittedAt)}</dd></div>
              <div><dt className="text-xs font-semibold text-muted-foreground">Channel</dt>
                <dd className="mt-1 text-sm text-foreground">{humanize(selected.channel)}</dd></div>
              <div><dt className="text-xs font-semibold text-muted-foreground">Status</dt>
                <dd className="mt-1 text-sm text-foreground">{humanize(selected.applicationStatus)}</dd></div>
              <div><dt className="text-xs font-semibold text-muted-foreground">Screening</dt>
                <dd className="mt-1 text-sm text-foreground">{humanize(learnerApplicationStage(selected))}</dd></div>
            </dl>
            <section aria-label="Selection process" className="min-w-0 border-t border-border pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-foreground">Selection process</h3>
                <Link href="/learn/my-placements/schedule" className="inline-flex min-h-[var(--lms-control-height)] max-[767px]:min-h-11 items-center text-sm font-semibold text-primary-text underline focus-visible:underline">See in schedule</Link>
              </div>
              <ol className="mt-3 space-y-2 text-sm text-body">
                {scheduledRounds.filter(round=>round.applicationId===selected.applicationId)
                  .sort((a,b)=>Date.parse(a.scheduledAt??"9999-12-31")-Date.parse(b.scheduledAt??"9999-12-31"))
                  .map(round=><li key={round.roundId} className="min-w-0 border-b border-border py-3">
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
            <section aria-label="Application milestones" className="min-w-0 border-t border-border pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">Recent recorded milestones</h3>
                <Link href={"/learn/my-placements/applications/"+
                  encodeURIComponent(selected.applicationId)+"/history"}
                  className="inline-flex min-h-[var(--lms-control-height)] max-[767px]:min-h-11 items-center text-sm font-semibold text-primary-text underline focus-visible:underline">
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
              <section className="min-w-0 border-t border-border pt-4 text-sm text-body">
                <h3 className="font-semibold text-foreground">Placement team feedback</h3>
                <p className="mt-2 whitespace-pre-wrap">{selected.screening.candidateMessage}</p>
              </section>
            ):null}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Round history</h3>
              {selected.results.length ? selected.results
                .slice().sort((a,b)=>a.roundSequence-b.roundSequence)
                .map((result)=>(
                  <article key={result.resultId} className="min-w-0 border-b border-border py-4">
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
      </section> : null}

      <Dialog
        open={withdrawTarget !== null}
        onOpenChange={(open) => {
          if (!open && !withdrawPending) {
            setWithdrawTarget(null);
            setWithdrawError(null);
          }
        }}
        title={withdrawMode==="REQUEST"?"Ask to withdraw":"Confirm application withdrawal"}
        description={withdrawMode==="REQUEST"
          ?"Your request goes to the placement cell; it does not immediately withdraw your application."
          :"This changes the official status of your submitted application. This action cannot be undone here."}
        footer={
          <div className="flex min-w-0 w-full flex-col-reverse items-stretch gap-2 sm:flex-row sm:justify-end [&_button]:min-h-11 [&_button]:w-full sm:[&_button]:w-auto md:[&_button]:min-h-9">
            <Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={withdrawPending}
              onClick={() => { setWithdrawTarget(null); setWithdrawError(null); }}>
              Keep application
            </Button>
            <Button className="min-h-11 w-full sm:w-auto md:min-h-9"
              disabled={withdrawPending || !withdrawMode ||
                (withdrawMode==="REQUEST" &&
                  !learnerWithdrawalReasonSchema.safeParse(withdrawReason).success) ||
                !learnerApplicationWithdrawalSchema.safeParse({
                  action: "WITHDRAW", confirmed: true, reason: withdrawReason,
                }).success}
              onClick={() => { void confirmWithdrawal(); }}
            >
              {withdrawPending ? "Withdrawing…" : "Confirm withdrawal"}
            </Button>
          </div>
        }
      >
        {withdrawTarget ? (
          <div className="space-y-4">
            <p className="break-words text-sm text-body">
              {withdrawTarget.companyName} · {withdrawTarget.jobTitle}
            </p>
            <label className="block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
              Reason for withdrawal <span className="font-normal text-muted-foreground">{withdrawMode==="REQUEST"?"(required)":"(optional)"}</span>
              <Textarea
                value={withdrawReason}
                onChange={(event) => { setWithdrawReason(event.target.value); setWithdrawError(null); }}
                minLength={withdrawMode==="REQUEST"?3:undefined}
                maxLength={900}
                rows={3}
                disabled={withdrawPending}
                aria-describedby="withdrawal-reason-hint"
                className="mt-2 w-full"
                placeholder="Briefly explain why you are withdrawing"
              />
            </label>
            <p id="withdrawal-reason-hint" className="text-xs text-muted-foreground">
              {withdrawMode==="REQUEST"?"3–900 characters.":"Optional; up to 900 characters."} Your reason is stored in application status history
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
