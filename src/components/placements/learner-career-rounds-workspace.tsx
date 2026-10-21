"use client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

import {LearnerInterviewWithdrawalRequest} from "./learner-interview-withdrawal-request";
import {learnerInterviewWithdrawalTarget,type LearnerInterviewWithdrawalTarget} from "@/modules/placements/learner-interview-withdrawal-model";
import {learnerAssessmentLinkState,filterLearnerAssessmentsMissingLink} from "@/modules/placements/learner-assessment-link-state-model";
import {learnerAssessmentExternalLaunch} from "@/modules/placements/learner-assessment-external-launch-model";
import {learnerAssessmentDueHref,readLearnerAssessmentDueFromUrl} from "@/modules/placements/learner-assessment-bucket-url-model";
import {learnerAssessmentMissingSchedule} from "@/modules/placements/learner-assessment-missing-schedule-model";
import {learnerAssessmentPastReview} from "@/modules/placements/learner-assessment-past-review-model";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/filter-chip";
import { Dialog } from "@/components/ui/dialog";
import { Disclosure } from "@/components/ui/disclosure";
import { learnerRoundSearchHref,learnerRoundSearchQuerySchema }
  from "@/modules/placements/learner-round-search-query-model";
import { learnerInterviewScheduleCounts,learnerInterviewScheduleViewSchema,
  learnerInterviewViewHref,type LearnerInterviewScheduleView }
  from "@/modules/placements/learner-interview-view-model";
import { learnerInterviewCalendarArtifacts } from "@/modules/placements/learner-interview-calendar-model";
import {learnerInterviewCountdown} from "@/modules/placements/learner-interview-countdown-model";
import {learnerInterviewFocusState} from "@/modules/placements/learner-interview-focus-model";
import {learnerInterviewRescheduleSummary} from "@/modules/placements/learner-interview-reschedule-summary-model";
import {learnerInterviewMobileSummary} from "@/modules/placements/learner-interview-mobile-model";
import { Drawer } from "@/components/ui/drawer";
import { StatusBadge } from "@/components/ui/status-badge";
import { LearnerCareerRounds, type LearnerCareerRound } from "./learner-career-rounds";
import {
  learnerAssessmentDueBucketSchema,
  learnerAssessmentDueBuckets,
  filterLearnerAssessmentDueBucket,
  type LearnerAssessmentDueBucket,
} from "@/modules/placements/learner-assessment-due-buckets";
import {
  learnerAssessmentReminderId,
  learnerAssessmentReminderStorageKey,
  parseLearnerAssessmentReminders,
  toggleLearnerAssessmentReminder,
  type LearnerAssessmentReminders,
} from "@/modules/placements/learner-assessment-reminders";
import {
  browseLearnerCareerRounds,
  learnerRoundScheduledInstant,
  learnerRoundUrgency,
  type LearnerRoundBrowseFilters,
  type LearnerRoundTimeBucket,
} from "@/modules/placements/learner-rounds-browse-model";

type Kind = "ASSESSMENT" | "INTERVIEW";
/** Legacy /schedule view aliases retain their original meaning. The combined
 * schedule itself must be populated by an authorized cross-kind page loader.
 */
export function legacyLearnerScheduleView(view:string|null):LearnerRoundTimeBucket{
 if(view==="ahead")return "upcoming";
 if(view==="past")return "past";
 if(view==="month")return "all";
 return "upcoming";
}
const timeChoices: { value: LearnerRoundTimeBucket; label: string }[] = [
  { value:"all", label:"All" },
  { value:"upcoming", label:"Upcoming" },
  { value:"past", label:"Past schedule" },
  { value:"unscheduled", label:"Awaiting schedule" },
];
const defaults: LearnerRoundBrowseFilters = {
  search:"", time:"all", urgency:"all", sort:"soonest",
};
function externalLink(url: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export function LearnerCareerRoundsWorkspace({
  kind,
  rounds,
  snapshotNowIso,
  membershipId = null,
  initialSelectedKey = null,
  initialSearch = "",
  initialTimeView = "upcoming",
  initialDueBucket = "all",
  withdrawalTargets = [],
}: {
  kind: Kind;
  withdrawalTargets?:readonly LearnerInterviewWithdrawalTarget[];
  rounds: readonly LearnerCareerRound[];
  snapshotNowIso: string;
  membershipId?: string | null;
  initialSelectedKey?: string | null;
  initialSearch?: string;
  initialTimeView?: LearnerInterviewScheduleView;
  initialDueBucket?:LearnerAssessmentDueBucket;
}) {
  const nowMs = Date.parse(snapshotNowIso);
  const [filters, setFilters] = useState<LearnerRoundBrowseFilters>(()=>({...defaults,search:initialSearch,time:initialTimeView}));
  const [dueBucket, setDueBucket] = useState<LearnerAssessmentDueBucket>(initialDueBucket);
  const [missingLinkOnly,setMissingLinkOnly]=useState(false);
  const [confirmExternalTest,setConfirmExternalTest]=useState<string|null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(initialSelectedKey);
  const [reminders, setReminders] = useState<LearnerAssessmentReminders>({});
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [copyStatus,setCopyStatus]=useState<string|null>(null);

  useEffect(()=>{
    if(kind!=="ASSESSMENT"&&kind!=="INTERVIEW")return;
    const onPop=()=>{
      const incoming=learnerRoundSearchQuerySchema.safeParse({
        q:new URLSearchParams(window.location.search).get("q")??"",
      });
      if(incoming.success)setFilters(current=>({...current,search:incoming.data.q}));
    };
    window.addEventListener("popstate",onPop);
    return ()=>window.removeEventListener("popstate",onPop);
  },[kind]);

  useEffect(()=>{
    if(kind!=="INTERVIEW")return;
    const onPop=()=>{
      const raw=new URLSearchParams(window.location.search).get("view");
      const view=learnerInterviewScheduleViewSchema.safeParse(raw??"upcoming");
      if(view.success)setFilters(current=>({...current,time:view.data}));
      else if(raw==="ahead"||raw==="month")
        setFilters(current=>({...current,time:legacyLearnerScheduleView(raw)}));
    };
    window.addEventListener("popstate",onPop);
    return ()=>window.removeEventListener("popstate",onPop);
  },[kind]);

  useEffect(()=>{
    if(kind!=="ASSESSMENT")return;
    const onPop=()=>setDueBucket(readLearnerAssessmentDueFromUrl(window.location.search));
    window.addEventListener("popstate",onPop);
    return ()=>window.removeEventListener("popstate",onPop);
  },[kind]);

  function chooseTimeView(value:LearnerRoundTimeBucket){
    setFilter("time",value);
    if(kind==="INTERVIEW") {
      const parsed=learnerInterviewScheduleViewSchema.safeParse(value);
      if(parsed.success)window.history.pushState(null,"",
        learnerInterviewViewHref(window.location.href,parsed.data));
    }
  }

  function saveSearchInUrl(){
    const parsed=learnerRoundSearchQuerySchema.safeParse({q:filters.search});
    if(!parsed.success)return;
    window.history.pushState(null,"",learnerRoundSearchHref(window.location.href,parsed.data.q));
  }

  useEffect(() => {
    if (kind !== "ASSESSMENT" || !membershipId) return;
    // Hydrate after the server-safe first render; never trust malformed storage.
    const handle = window.setTimeout(() => {
      try {
        setReminders(parseLearnerAssessmentReminders(
          window.localStorage.getItem(learnerAssessmentReminderStorageKey(membershipId)),
        ));
      } catch {
        setReminderError("Local reminders are unavailable in this browser.");
      }
    }, 0);
    return () => window.clearTimeout(handle);
  }, [kind, membershipId]);

  function toggleReminder(applicationId: string, roundId: string) {
    if (!membershipId) {
      setReminderError("Sign in as a Learner to save personal reminders.");
      return;
    }
    try {
      const key = learnerAssessmentReminderStorageKey(membershipId);
      // Re-read at click time so an initial slow hydration cannot erase a saved reminder.
      const stored = parseLearnerAssessmentReminders(window.localStorage.getItem(key));
      const id = learnerAssessmentReminderId(applicationId, roundId);
      const next = toggleLearnerAssessmentReminder(stored, id, new Date().toISOString());
      window.localStorage.setItem(key, JSON.stringify(next));
      setReminders(next);
      setReminderError(null);
    } catch {
      setReminderError("Unable to save this personal reminder. No employer status was changed.");
    }
  }
  const setFilter = <K extends keyof LearnerRoundBrowseFilters,>(
    key: K, value: LearnerRoundBrowseFilters[K],
  ) => {
    setDueBucket("all");
    if(kind==="ASSESSMENT")window.history.replaceState(null,"",learnerAssessmentDueHref(window.location.href,"all"));
    setMissingLinkOnly(false);
    setFilters((current) => ({ ...current, [key]: value }));
  };
  const rows = useMemo(
    () => browseLearnerCareerRounds(rounds, kind, filters, nowMs),
    [rounds, kind, filters, nowMs],
  );
  const relevant = useMemo(
    () => browseLearnerCareerRounds(rounds, kind, defaults, nowMs),
    [rounds, kind, nowMs],
  );
  const interviewCounts=useMemo(
    ()=>kind==="INTERVIEW" ? learnerInterviewScheduleCounts(relevant,nowMs) : null,
    [kind,relevant,nowMs],
  );
  const dueCounts = useMemo(
    () => learnerAssessmentDueBuckets(relevant, nowMs),
    [relevant, nowMs],
  );
  const missingSchedule=kind==="ASSESSMENT"
    ? learnerAssessmentMissingSchedule(dueCounts.unscheduled):null;
  const pastReview=kind==="ASSESSMENT" ? learnerAssessmentPastReview(dueCounts.past,nowMs) : null;
  const visibleRows = useMemo(() => {
    const dueRows = kind === "ASSESSMENT"
      ? filterLearnerAssessmentDueBucket(rows, dueBucket, nowMs) : rows;
    return kind === "ASSESSMENT" && missingLinkOnly
      ? filterLearnerAssessmentsMissingLink(dueRows) : dueRows;
  },[rows,dueBucket,nowMs,kind,missingLinkOnly]);
  function selectDueBucket(rawBucket: unknown) {
    const parsed = learnerAssessmentDueBucketSchema.safeParse(rawBucket);
    if (!parsed.success) return;
    setDueBucket(parsed.data);
    if(kind==="ASSESSMENT"){
      window.history.pushState(null,"",learnerAssessmentDueHref(window.location.href,parsed.data));
    }
    setMissingLinkOnly(false);
    // A quick bucket must not accidentally combine with a conflicting
    // schedule or urgency filter and silently show an empty result.
    setFilters(defaults);
  }
  const focus=kind==="INTERVIEW"
    ? learnerInterviewFocusState(relevant,visibleRows,selectedKey)
    : {highlightedKey:null,hiddenByFilters:false};
  const selected = relevant.find(
    (round) => round.applicationId + ":" + round.roundId === selectedKey,
  ) ?? null;
  const withdrawalTarget=selected&&kind==="INTERVIEW"
    ? learnerInterviewWithdrawalTarget(withdrawalTargets,selected.applicationId,selected.roundId):null;
  const urgencyCount = relevant.filter((round) => {
    const urgent = learnerRoundUrgency(round, nowMs);
    return urgent === "today" || urgent === "week";
  }).length;
  const selectClass = "mt-1 min-h-11 min-[768px]:min-h-9";
  const date = selected ? learnerRoundScheduledInstant(selected) : null;
  const meeting = externalLink(selected?.exception?.meetingUrl ?? selected?.meetingUrl ?? null);
  const mobileInterviewSummary=kind==="INTERVIEW"&&selected
    ? learnerInterviewMobileSummary({
        scheduledAt:selected.scheduledAt,
        approvedScheduledAt:selected.exception?.scheduledAt??null,
      })
    : null;
  const interviewCalendar=kind==="INTERVIEW" && selected
    ? learnerInterviewCalendarArtifacts({
        applicationId:selected.applicationId,
        roundId:selected.roundId,
        companyName:selected.companyName,
        roleTitle:selected.roleTitle,
        roundName:selected.roundName,
        scheduledAt:date===null ? null : new Date(date).toISOString(),
        durationMinutes:selected.durationMinutes ?? null,
        venue:selected.exception?.venue ?? selected.venue ?? null,
        mode:(selected.exception?.mode ?? selected.mode) === "ON_CAMPUS"
          ? "ON_CAMPUS"
          : (selected.exception?.mode ?? selected.mode) === "VIRTUAL"
            ? "VIRTUAL" : null,
      },new Date(snapshotNowIso))
    : null;
  const rescheduleSummary=kind==="INTERVIEW"&&selected?.exception
    ? learnerInterviewRescheduleSummary({
        companyName:selected.companyName,roleTitle:selected.roleTitle,
        roundName:selected.roundName,originalScheduledAt:selected.scheduledAt,
        approvedScheduledAt:selected.exception.scheduledAt,
        mode:selected.exception.mode==="ON_CAMPUS"?"ON_CAMPUS":selected.exception.mode==="VIRTUAL"?"VIRTUAL":null,
        venue:selected.exception.venue??null,
      }) : null;

  async function copyRescheduleSummary(){
    if(!rescheduleSummary)return;
    try{
      await navigator.clipboard.writeText(rescheduleSummary.copyText);
      setCopyStatus("Approved schedule copied. No message was sent to the employer.");
    }catch{
      setCopyStatus("Clipboard unavailable. Select and copy the displayed schedule instead.");
    }
  }
  const employerTest = kind === "ASSESSMENT"
    ? externalLink(selected?.testUrl ?? null) : null;
  const externalAssessment=employerTest && selected ? learnerAssessmentExternalLaunch({
    href:employerTest,scheduledAt:selected.exception?.scheduledAt??selected.scheduledAt,
    roundName:selected.roundName,
  },nowMs):null;
  const selectedReminderId = selected && kind === "ASSESSMENT"
    ? learnerAssessmentReminderId(selected.applicationId, selected.roundId)
    : null;
  const personalReminderAt = selectedReminderId ? reminders[selectedReminderId] ?? null : null;

  return (
    <div className="min-w-0 space-y-5">
      <section aria-label={kind === "ASSESSMENT" ? "Assessment filters" : "Interview filters"}
        className="space-y-4 border-b border-border pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="m-0 text-sm font-semibold text-foreground">
            {relevant.length} scheduled round{relevant.length === 1 ? "" : "s"}
          </p>
          <StatusBadge tone={urgencyCount ? "warning" : "neutral"}>
            {urgencyCount} within seven days
          </StatusBadge>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:flex-wrap" role="group" aria-label="Filter by schedule">
          {timeChoices.map(({ value, label }) => (
            <FilterChip
              type="button"
              key={value}
              aria-pressed={filters.time === value}
              onClick={() => chooseTimeView(value)}
               className="min-h-11 shrink-0 whitespace-nowrap"
            >{label}{interviewCounts ? ` (${interviewCounts[value]})` : ""}</FilterChip>
          ))}
        </div>
        {kind==="INTERVIEW" ? (
          <p role="status" className="text-xs text-muted-foreground">
            Upcoming and past refer only to scheduled interview times. Past does
            not confirm attendance, recruiter feedback or a completed interview.
            Unscheduled interviews remain visible under Awaiting schedule.
          </p>
        ) : null}
        {kind === "ASSESSMENT" ? (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Assessment due buckets">
            <FilterChip type="button" aria-pressed={dueBucket === "all"}
              onClick={() => selectDueBucket("all")}
               className="min-h-11">
              All assessment rounds ({relevant.length})
            </FilterChip>
            <FilterChip type="button" aria-pressed={missingLinkOnly}
              onClick={()=>{const next=!missingLinkOnly;selectDueBucket("all");setMissingLinkOnly(next);}}
               className="min-h-11">
              Waiting on employer link ({relevant.filter(row=>learnerAssessmentLinkState(row)==="MISSING").length})
            </FilterChip>
            <FilterChip type="button" aria-pressed={dueBucket === "today"}
              onClick={() => selectDueBucket("today")}
               className="min-h-11">
              Due today ({dueCounts.today.length})
            </FilterChip>
            <FilterChip type="button" aria-pressed={dueBucket === "week"}
              onClick={() => selectDueBucket("week")}
               className="min-h-11">
              Due this week ({dueCounts.week.length})
            </FilterChip>
            {([
              ["later","Later",dueCounts.later.length],
              ["past","Scheduled time passed",dueCounts.past.length],
              ["unscheduled","Awaiting employer schedule",dueCounts.unscheduled.length],
            ] as const).map(([value,label,count])=>(
              <FilterChip type="button" key={value} aria-pressed={dueBucket===value}
                onClick={()=>selectDueBucket(value)}
                 className="min-h-11">
                {label} ({count})
              </FilterChip>
            ))}
            <p className="w-full text-xs text-muted-foreground">
              IST schedule categories: Today and this week refer to the published
              round time; Later is a future week. A past scheduled time is not
              evidence of employer submission, attendance or completion.
            </p>
          </div>
        ) : null}
        <Disclosure title="Search employers or rounds" className="border-b border-border" contentClassName="pb-3">
        <div className="grid min-w-0 gap-3 md:grid-cols-3">
          <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Search employers or rounds
            <Input
              type="search" value={filters.search}
              maxLength={100}
              onChange={(event) => setFilter("search", event.target.value)}
              placeholder="Search rounds…"
              className={selectClass}
            />
          </label>
          <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Urgency
            <Select value={filters.urgency}
              onChange={(event) => setFilter("urgency", event.target.value as LearnerRoundBrowseFilters["urgency"])}
              className={selectClass}>
              <option value="all">Any date</option>
              <option value="today">Today</option>
              <option value="week">Within seven days</option>
            </Select>
          </label>
          <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Order
            <Select value={filters.sort}
              onChange={(event) => setFilter("sort", event.target.value as LearnerRoundBrowseFilters["sort"])}
              className={selectClass}>
              <option value="soonest">Soonest first</option>
              <option value="latest">Latest first</option>
              <option value="company">Employer A–Z</option>
            </Select>
          </label>
        </div>
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Button type="button" onClick={saveSearchInUrl}
            variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9">
            Save {kind==="INTERVIEW"?"interview":"assessment"} search link
          </Button>
          <p className="text-xs text-muted-foreground">
            Search filters your own shortlisted rounds as you type. Save the query in the URL
            to revisit it without sharing another learner&apos;s records.
          </p>
        </div>
        </Disclosure>
      </section>

      {kind==="ASSESSMENT"&&dueBucket==="past"&&pastReview&&pastReview.count>0 ? (
        <aside role="status" aria-label="Past scheduled assessments"
          className="min-w-0 border-b border-border py-4 md:py-6">
          <h3 className="text-sm font-semibold text-foreground">
            {pastReview.count} assessment schedule{pastReview.count===1?"":"s"} passed
          </h3>
          <p className="mt-2 text-sm text-body">{pastReview.notice}</p>
          <Link href="/learn/my-placements/assessments/results"
            className="mt-3 inline-flex min-h-[var(--lms-control-height)] max-md:min-h-11 items-center text-sm font-semibold text-primary-text underline focus-visible:underline">
            Check officially applied results →
          </Link>
        </aside>
      ):null}
      {kind==="ASSESSMENT"&&dueBucket==="unscheduled"&&missingSchedule&&missingSchedule.count>0 ? (
        <aside role="status" aria-label="Assessments without a recorded date"
          className="min-w-0 border-b border-border py-4 md:py-6">
          <h3 className="text-sm font-semibold text-foreground">{missingSchedule.count} assessment round{missingSchedule.count===1?"":"s"} without a recorded schedule</h3>
          <p className="mt-2 text-sm text-body">{missingSchedule.notice}</p>
          {missingSchedule.missingLinkCount>0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {missingSchedule.missingLinkCount} also {missingSchedule.missingLinkCount===1?"lacks an":"lack"} actionable provider link.
            </p>
          ):null}
        </aside>
      ):null}
      {kind==="INTERVIEW"&&focus.hiddenByFilters ? (
        <aside role="status" className="border-l-2 border-primary bg-primary-subtle px-4 py-3">
          <p className="text-sm font-semibold text-foreground">
            The linked interview is hidden by your current filters.
          </p>
          <Button type="button" onClick={()=>{
            setFilters(defaults);setDueBucket("all");
          }} variant="ghost" className="mt-2 min-h-11 min-[768px]:min-h-9 !text-[var(--lms-primary-text)] underline">
            Show linked interview
          </Button>
        </aside>
      ) : null}
      {visibleRows.length === 0 && relevant.length > 0 ? (
        <div role="status" className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-[var(--lms-neutral-50)] px-6 py-12 text-center">
          <p className="text-sm font-semibold text-foreground">No rounds match your filters</p>
          <p className="mt-2 text-sm text-body">Try a different date range or employer.</p>
          <Button type="button"
            onClick={() => { setFilters(defaults); setDueBucket("all"); setMissingLinkOnly(false); }}
            variant="ghost" className="mt-3 min-h-11 min-[768px]:min-h-9 !text-[var(--lms-primary-text)] underline">
            Clear filters
          </Button>
        </div>
      ) : (
        <LearnerCareerRounds
          kind={kind}
          rounds={visibleRows}
          onSelect={(round) => setSelectedKey(round.applicationId + ":" + round.roundId)}
          snapshotNowIso={snapshotNowIso}
          highlightedKey={focus.highlightedKey}
        />
      )}

      <Drawer
        open={selected !== null}
        onOpenChange={(open) => { if (!open) {setSelectedKey(null);setCopyStatus(null);} }}
        title={selected?.roundName ?? "Placement round"}
        description={selected ? selected.companyName + " · " + selected.roleTitle : undefined}
        footer={<div className="flex min-w-0 w-full flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <Link
            href={selected
              ? "/learn/my-placements/applications?applicationId=" + encodeURIComponent(selected.applicationId)
              : "/learn/my-placements/applications"}
            className="inline-flex min-h-[var(--lms-control-height)] max-md:min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-center text-sm font-[650] text-primary-text md:w-auto"
          >View application</Link>
          {kind === "INTERVIEW" && selected ? (
            <Link
              href={"/learn/my-placements/interviews?applicationId=" +
                encodeURIComponent(selected.applicationId) +
                "&roundId=" + encodeURIComponent(selected.roundId)}
              className="inline-flex min-h-[var(--lms-control-height)] max-md:min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-center text-sm font-[650] text-primary-text md:w-auto"
            >
              Direct link
            </Link>
          ) : null}
          {kind === "INTERVIEW" && selected ? (
            <Link
              href={"/learn/my-placements?requestRoundId=" +
                encodeURIComponent(selected.roundId) + "#round-reschedule"}
              className="inline-flex min-h-[var(--lms-control-height)] max-md:min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-primary px-4 text-center text-sm font-[650] text-primary-text md:w-auto"
            >
              Request reschedule
            </Link>
          ) : null}
          <Button className="min-h-[var(--lms-control-height)] max-md:min-h-11 w-full md:w-auto" onClick={() => setSelectedKey(null)}>Close</Button>
        </div>}
      >
        {selected ? (
          <div className="min-w-0 space-y-4">
            {kind==="INTERVIEW" && selected && Number.isFinite(nowMs) ? (
              <p role="status" className="rounded-lg border border-border bg-surface-subtle p-3 text-sm font-semibold text-body">
                {learnerInterviewCountdown({
                  scheduledAt:selected.exception?.scheduledAt ?? selected.scheduledAt,
                  durationMinutes:selected.durationMinutes,
                },nowMs).label}
              </p>
            ) : null}
            {mobileInterviewSummary ? (
              <p role="status" className="rounded-lg border border-border bg-surface-subtle p-3 text-sm font-semibold text-foreground md:hidden">
                {mobileInterviewSummary}
              </p>
            ) : null}
            <dl className="grid min-w-0 gap-4 text-sm md:grid-cols-2 [&_dd]:min-w-0 [&_dd]:break-words [&_dd]:[overflow-wrap:anywhere]">
              <div><dt className="text-xs font-semibold text-muted-foreground">Date & time (IST)</dt>
                <dd className="mt-1 text-foreground">
                  {date === null ? "Schedule pending" :
                    new Intl.DateTimeFormat("en-IN", {
                      dateStyle:"medium", timeStyle:"short", timeZone:"Asia/Kolkata",
                    }).format(new Date(date))}
                </dd>
              </div>
              <div><dt className="text-xs font-semibold text-muted-foreground">Location</dt>
                <dd className="mt-1 text-foreground">{selected.exception?.venue ?? selected.venue ?? "Venue pending"}</dd>
              </div>
              <div><dt className="text-xs font-semibold text-muted-foreground">Mode</dt>
                <dd className="mt-1 text-foreground">{selected.exception?.mode ?? selected.mode ?? "Pending"}</dd>
              </div>
              <div><dt className="text-xs font-semibold text-muted-foreground">Round</dt>
                <dd className="mt-1 text-foreground">#{selected.sequence} · {selected.roundName}</dd>
              </div>
            </dl>
            {rescheduleSummary ? (
              <section className="space-y-3 rounded-lg border border-primary bg-primary-subtle p-4"
                aria-label="Approved reschedule summary">
                <h3 className="text-sm font-semibold text-foreground">Approved schedule change</h3>
                <dl className="grid gap-3 text-sm md:grid-cols-2">
                  <div><dt className="font-semibold text-body">Previous (IST)</dt>
                    <dd className="mt-1 text-foreground">{rescheduleSummary.previous}</dd></div>
                  <div><dt className="font-semibold text-body">Approved (IST)</dt>
                    <dd className="mt-1 text-foreground">{rescheduleSummary.approved}</dd></div>
                  <div><dt className="font-semibold text-body">Location</dt>
                    <dd className="mt-1 text-foreground">{rescheduleSummary.location}</dd></div>
                </dl>
                <Button type="button" onClick={()=>void copyRescheduleSummary()}
                  variant="secondary" className="min-h-11 min-[768px]:min-h-9 w-full md:w-auto">
                  Copy schedule summary
                </Button>
                {copyStatus?<p role="status" className="text-xs text-body">{copyStatus}</p>:null}
                <p className="text-xs text-body">
                  This approved time replaces the original schedule. Copying does not notify
                  the employer or confirm attendance.
                </p>
              </section>
            ) : null}
            <div className="flex flex-wrap gap-3">
              {externalAssessment ? (
                <Button type="button" onClick={()=>setConfirmExternalTest(externalAssessment.href)}
                  variant="ghost" className="min-h-11 min-[768px]:min-h-9 !text-[var(--lms-primary-text)] underline underline-offset-4">
                  Open employer assessment ↗
                </Button>
              ) : null}
              {meeting ? (
                <a href={meeting} target="_blank" rel="noopener noreferrer"
                  className="inline-flex min-h-[var(--lms-control-height)] max-md:min-h-11 items-center text-sm font-semibold text-primary-text hover:underline focus-visible:underline">
                  Open meeting ↗
                </a>
              ) : null}
            </div>
            {withdrawalTarget ? <LearnerInterviewWithdrawalRequest key={withdrawalTarget.applicationId+":"+withdrawalTarget.roundId+":"+withdrawalTarget.expectedUpdatedAt} target={withdrawalTarget} />:null}
            {kind === "INTERVIEW" ? (
              <section className="min-w-0 border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-foreground">Save to your calendar</h3>
                <p className="mt-1 text-sm leading-6 text-body">
                  Calendar exports use the recorded interview start and duration.
                  Event titles and descriptions are safely escaped and folded for calendar apps.
                  Approved reschedules use your own updated time. No calendar event is
                  created until you import the file or confirm it with Google.
                </p>
                {interviewCalendar ? <div className="mt-3 flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap">
                  <a download={interviewCalendar.filename}
                    href={"data:text/calendar;charset=utf-8,"+encodeURIComponent(interviewCalendar.ics)}
                    className="inline-flex min-h-[var(--lms-control-height)] max-md:min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-center text-sm font-[650] text-primary-text md:w-auto">
                    Download .ics
                  </a>
                  <a href={interviewCalendar.googleUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-[650] text-primary-text sm:w-auto md:min-h-[var(--lms-control-height)]">
                    Add to Google Calendar ↗
                  </a>
                </div> : <p className="mt-2 text-sm text-muted-foreground">
                  Calendar export becomes available when the placement team records
                  both the interview time and duration.
                </p>}
              </section>
            ) : null}
            {kind === "ASSESSMENT" ? (
              <section className="min-w-0 space-y-3 border-t border-border pt-4">
                <h3 className="m-0 text-sm font-semibold text-foreground">Personal submission reminder</h3>
                <p className="text-sm leading-6 text-body">
                  This is only a reminder on this device. It is not sent to your employer or placement team
                  and does not confirm assessment completion, submission or a result.
                </p>
                {personalReminderAt ? (
                  <p role="status" className="text-xs font-semibold text-primary-text">
                    Personal reminder marked · {new Intl.DateTimeFormat("en-IN", {
                      dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata",
                    }).format(new Date(personalReminderAt))}
                  </p>
                ) : null}
                <Button
                  variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9"
                  onClick={() => toggleReminder(selected.applicationId, selected.roundId)}
                >
                  {personalReminderAt ? "Undo personal reminder" : "Mark submitted (personal reminder only)"}
                </Button>
                {reminderError ? (
                  <p role="alert" className="text-sm text-warning">{reminderError}</p>
                ) : null}
              </section>
            ) : (
              <p role="note" className="text-sm leading-6 text-body">
                Scheduled time alone does not confirm attendance or an interview outcome.
              </p>
            )}
          </div>
        ) : null}
      </Drawer>
      <Dialog open={confirmExternalTest!==null} onOpenChange={open=>{if(!open)setConfirmExternalTest(null);}}
        title="Open employer assessment?"
        description="This opens an external provider in a new tab. Leaving the LMS does not submit or confirm an assessment."
        footer={<div className="flex min-w-0 w-full flex-col-reverse items-stretch gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={()=>setConfirmExternalTest(null)}>Stay here</Button>
          {confirmExternalTest ? <a href={confirmExternalTest} target="_blank" rel="noopener noreferrer"
            onClick={()=>setConfirmExternalTest(null)}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] bg-[var(--lms-button-primary)] px-4 text-sm font-[650] text-on-primary sm:w-auto md:min-h-[var(--lms-control-height)]">
            Open external assessment ↗
          </a>:null}
        </div>}>
        <p className="text-sm text-body">{externalAssessment?.notice??"Confirm the provider instructions before proceeding."}</p>
      </Dialog>
    </div>
  );
}
