import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import type { learnerPlacementDashboard } from "@/modules/placements/learner-dashboard-model";
import { learnerDashboardPartialState,type PlacementDashboardAvailability } from "@/modules/placements/learner-dashboard-partial-model";
import { learnerPlacementOnboardingSteps } from "@/modules/placements/learner-onboarding-steps-model";
import {learnerPlacementHeroGreeting} from "@/modules/placements/learner-dashboard-greeting-model";
import type {learnerPlacementApplicationFunnel} from "@/modules/placements/learner-dashboard-funnel-model";
import {learnerDashboardSafeFallback} from "@/modules/placements/learner-dashboard-fallback-model";
import {learnerDashboardMetricView} from "@/modules/placements/learner-dashboard-metric-view-model";
import {learnerDashboardDateLabel} from "@/modules/placements/learner-dashboard-date-label-model";
import {learnerWaitingOnYou} from "@/modules/placements/learner-waiting-on-you-model";
import {learnerPlacementHeroPriority} from "@/modules/placements/learner-dashboard-hero-priority-model";

type Snapshot = ReturnType<typeof learnerPlacementDashboard>;

const formatWhen=learnerDashboardDateLabel;

function Metric({
  label,
  value,
  href,
  detail,
}: {
  label: string;
  value: number | null;
  href: string;
  detail: string;
}) {
  const metric=learnerDashboardMetricView(value,label,detail);
  return (
    <Link
      href={href}
      aria-label={metric.ariaLabel}
      className="group rounded-xl border border-border bg-surface p-4 transition hover:border-primary hover:bg-primary-subtle focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
    >
      <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 break-words text-2xl font-bold tabular-nums text-foreground sm:text-3xl">{metric.display}</p>
      <p className="mt-2 text-xs leading-5 text-body group-hover:text-primary-text">{metric.detail} →</p>
    </Link>
  );
}

export function LearnerPlacementsDashboard({
  snapshot,availability,learnerName=null,applicationFunnel=null,registration=null,profileFixes=[],acceptedOffer=null,
}: {
  snapshot: Snapshot;
  availability:PlacementDashboardAvailability;
  learnerName?:string|null;
  applicationFunnel?:ReturnType<typeof learnerPlacementApplicationFunnel>|null;
  registration?:{stage:string;choice:string|null}|null;
  profileFixes?:readonly {label:string;href:string}[];
  acceptedOffer?:boolean|null;
}) {
  const display=learnerDashboardPartialState(availability,snapshot);
  const next = learnerPlacementHeroPriority({pendingOffers:display.activeOffers,registration,acceptedOffer,fallback:display.nextAction});
  const safeFallback=learnerDashboardSafeFallback(availability);
  const greeting=learnerPlacementHeroGreeting(learnerName,display.firstRun);
  const onboarding=learnerPlacementOnboardingSteps(display.firstRun,availability.preferences);
  const shownWeekEvents=display.weekDays?.reduce((count,day)=>count+day.events.length,0)??0;
  const waitingOnYou=learnerWaitingOnYou({
    pendingOffers:display.activeOffers,
    urgentAssessment:display.urgentAssessment,
    urgentInterview:display.urgentInterview,
    nextAction:next,
    registration,
    profileFixes,
    eligibleToApply:display.eligibleJobs,
    applications:display.applications,
  });
  return (
    <section className="space-y-5" aria-label="Placement dashboard">
      {next ? <div className="rounded-xl border border-primary bg-primary-subtle p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-3xl">
            <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-primary-text">
              {greeting}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">
              {next.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-body">
              {next.detail}
              {next.when ? ` · ${formatWhen(next.when)}` : ""}
            </p>
            {display.firstRun ? (
              <p className="mt-2 text-sm text-body">
                Explore your college’s published opportunities and check eligibility before applying.
              </p>
            ) : null}
          </div>
          <Link
            href={next.href}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
          >
            {display.firstRun ? "Browse drives" : "View next step"} →
          </Link>
        </div>
      </div> : (
        <p role="status" className="rounded-xl border border-border bg-surface p-5 text-sm text-body">
          Next placement action is temporarily unavailable while key sources reload.
          Your current applications or schedule have not been treated as empty.
          {safeFallback ? <Link href={safeFallback.href}
            className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4">
            {safeFallback.label} →
          </Link> : null}
        </p>
      )}

      <section aria-label="Waiting on you" className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-foreground">Waiting on you</h3>
          <span className="text-xs font-semibold text-muted-foreground">{waitingOnYou.length} to-do item{waitingOnYou.length===1?"":"s"}</span>
        </div>
        {waitingOnYou.length?<ul className="mt-3 space-y-2">{waitingOnYou.map(item=><li key={item.key}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
          <div>
            <span className={"text-xs font-semibold "+(item.priority==="URGENT"?"text-warning-text":"text-primary-text")}>{item.priority==="URGENT"?"Urgent":item.priority==="SOON"?"Soon":"Next"}</span>
            <p className="font-semibold text-foreground">{item.label}</p>
            <p className="text-xs text-body">{item.detail}</p>
          </div>
          <Link href={item.href} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Review now</Link>
        </li>)}</ul>:<p role="status" className="mt-2 text-sm text-muted-foreground">
          No recorded offers awaiting your reply or upcoming assessments/interviews need attention right now.
        </p>}
      </section>
      {onboarding.length>0 ? (
        <section className="rounded-xl border border-border bg-surface p-4 sm:p-5" aria-label="First placement steps">
          <h3 className="m-0 text-base font-semibold text-foreground">Get started with placements</h3>
          <p className="mt-1 text-sm text-body">These are useful starting points, not completed or verified milestones.</p>
          <ol className="mt-4 grid gap-3 sm:grid-cols-3">
            {onboarding.map((step,index)=>(
              <li key={step.href} className="min-w-0 rounded-lg border border-border p-3">
                <p className="text-xs font-bold uppercase text-primary-text">Step {index+1}</p>
                <Link href={step.href} className="mt-2 block min-h-11 break-words text-sm font-semibold text-primary-text underline underline-offset-4">{step.label} →</Link>
                <p className="mt-1 text-xs leading-5 text-body">{step.detail}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Placement snapshot">
        <Metric
          label="Published drives before deadline"
          value={display.openJobs}
          href="/learn/my-placements/jobs"
          detail={`${display.eligibleJobs ?? "Unknown"} eligible · ${display.notOpenToApplyJobs ?? "Unknown"} not currently open to apply`}
        />
        <Metric
          label="Applications"
          value={display.applications}
          href="/learn/my-placements/applications"
          detail={`${display.activeApplications ?? "Unknown"} under consideration`}
        />
        <Metric
          label="Upcoming assessments"
          value={display.assessments}
          href="/learn/my-placements/assessments"
          detail={display.thisWeekAssessments===null
            ?"Assessment schedule unavailable"
            :`${display.thisWeekAssessments} in next seven IST calendar dates · not employer completion`}
        />
        <Metric
          label="Upcoming interviews"
          value={display.interviews}
          href="/learn/my-placements/interviews"
          detail={display.thisWeekInterviews===null
            ?"Interview schedule unavailable"
            :`${display.thisWeekInterviews} in the next seven IST calendar dates · view all scheduled`}
        />
      </div>

      <section aria-label="Application screening breakdown" className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-foreground">Application stages</h3>
          <Link href="/learn/my-placements/applications" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">See all applications →</Link>
        </div>
        {applicationFunnel===null ? <p role="status" className="mt-2 text-sm text-body">Application stages are currently unavailable. They have not been counted as zero.</p>
          : <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {applicationFunnel.stages.map(stage=><div key={stage.key} className="min-w-0 rounded-lg border border-border bg-surface-subtle p-3">
              <p className="text-2xl font-bold tabular-nums text-foreground">{stage.count}</p>
              <p className="mt-1 text-xs font-semibold text-body">{stage.label}</p>
            </div>)}
          </div>}
        <p className="mt-2 text-xs text-muted-foreground">Based on your saved application and screening stages; not offer or hiring outcomes.</p>
      </section>
      {display.urgentAssessment ? (
        <aside aria-label="Upcoming assessment action"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-primary-text">Assessment in the next seven IST days</p>
            <p className="mt-1 break-words text-sm font-semibold text-foreground">{display.urgentAssessment.roundName} · {display.urgentAssessment.companyName}</p>
            <p className="mt-1 text-xs text-body">{formatWhen(display.urgentAssessment.when)} · Scheduled time, not provider submission deadline</p>
          </div>
          <Link href={display.urgentAssessment.href}
            className="inline-flex min-h-11 items-center rounded-lg border border-primary px-4 text-sm font-semibold text-primary-text">
            Review assessment →
          </Link>
        </aside>
      ) : null}
      {display.urgentInterview ? (
        <aside aria-label="Upcoming interview action"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-primary-text">Interview in the next seven IST days</p>
            <p className="mt-1 break-words text-sm font-semibold text-foreground">{display.urgentInterview.roundName} · {display.urgentInterview.companyName}</p>
            <p className="mt-1 text-xs text-body">{formatWhen(display.urgentInterview.when)} · Scheduled, not attendance-confirmed</p>
          </div>
          <Link href={display.urgentInterview.href}
            className="inline-flex min-h-11 items-center rounded-lg border border-primary px-4 text-sm font-semibold text-primary-text">
            Review interview →
          </Link>
        </aside>
      ) : null}
      {display.activeOffers !== null && display.activeOffers > 0 ? (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning bg-surface px-5 py-4">
          <div>
            <p className="m-0 font-semibold text-foreground">
              {display.activeOffers} offer{snapshot.activeOfferCount === 1 ? "" : "s"} awaiting a response
            </p>
            <p className="mt-1 text-sm text-body">
              Review the issued offer terms and expiration before responding.
            </p>
          </div>
          <Link href="/learn/my-placements/offers?status=pending" className="text-sm font-semibold text-primary-text hover:underline">
            Review offers →
          </Link>
        </div>
      ) : null}

      {display.nextScheduledEvent ? (
        <aside aria-label="Next scheduled placement calendar event"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-primary-text">Next scheduled placement event</p>
            <p className="mt-1 break-words text-sm font-semibold text-foreground">
              {display.nextScheduledEvent.roundName} · {display.nextScheduledEvent.companyName}
            </p>
            <p className="mt-1 text-xs text-body">
              {formatWhen(display.nextScheduledEvent.when)} · {display.nextScheduledEvent.rescheduled?"Approved reschedule":"Recorded schedule"}
            </p>
          </div>
          <Link href={display.nextScheduledEvent.href}
            className="inline-flex min-h-11 items-center rounded-md border border-primary px-4 text-sm font-semibold text-primary-text">
            View event details →
          </Link>
        </aside>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-3 rounded-xl border border-border bg-surface p-5" aria-labelledby="placement-attention-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 id="placement-attention-heading" className="m-0 text-base font-semibold text-foreground">
              Needs attention
            </h3>
            <StatusBadge tone={display.attention?.length ? "warning" : "neutral"}>
              {display.attentionTotal===null ? "Unknown" : display.attentionTotal ? `${display.attentionTotal} soon` : "All clear"}
            </StatusBadge>
          </div>
          {display.attention===null ? (
            <p role="status" className="text-sm text-body">Schedule data unavailable; please retry.</p>
          ) : display.attention.length ? (
            <ul className="divide-y divide-border">
              {display.attention.map((event) => (
                <li key={event.applicationId + ":" + event.roundId} className="py-3 first:pt-0 last:pb-0">
                  <Link href={event.href} className="block rounded-md hover:text-primary-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]">
                    <p className="text-sm font-semibold text-foreground">{event.roundName}</p>
                    <p className="mt-1 text-xs text-body">{event.companyName} · {formatWhen(event.when)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {event.kind === "ASSESSMENT" ? "Assessment" : "Interview"}
                      {event.rescheduled ? " · Rescheduled" : ""}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm leading-6 text-body">
              No assessment or interview rounds are scheduled within the next seven days.
            </p>
          )}
          {display.attentionOverflow!==null&&display.attentionOverflow>0 ? (
            <p role="status" className="rounded-lg border border-border bg-surface-subtle p-3 text-sm text-body">
              {display.attentionOverflow} additional scheduled {display.attentionOverflow===1?"event":"events"}
              {" "}need attention. Only the first three are shown here.
            </p>
          ) : null}
          <Link href="/learn/my-placements/calendar"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline">
            {display.attentionOverflow!==null&&display.attentionOverflow>0
              ? `View ${display.attentionOverflow} more in career calendar →`
              : "Open career calendar →"}
          </Link>
        </section>

        <section className="space-y-3 rounded-xl border border-border bg-surface p-5" aria-labelledby="placement-week-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 id="placement-week-heading" className="m-0 text-base font-semibold text-foreground">
              Next 7 days
            </h3>
            <StatusBadge>{display.fullWeekEventCount===null ? "Unknown" : `${display.fullWeekEventCount} events`}</StatusBadge>
          </div>
          {display.fullWeekEventCount===0 ? <p role="status" className="text-sm text-body">No tests or interviews in the next 7 days. When the placement cell books you, it shows here and you get a notice.</p> : display.weekEvents===null ? (
            <p role="status" className="text-sm text-body">Schedule data unavailable; please retry.</p>
          ) : display.weekDays ? (
            <ol className="divide-y divide-border">
              {display.weekDays.map(day=>(
                <li key={day.date} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-xs font-semibold text-foreground">{day.label} · {day.total} {day.total===1?"event":"events"}</p>
                  {day.events.length===0 ? <p className="mt-1 text-xs text-muted-foreground">No rounds scheduled</p> :
                    <ul className="mt-2 space-y-2">{day.events.map(event=>(
                      <li key={event.applicationId+":"+event.roundId}>
                        <Link href={event.href} className="block min-h-11 rounded-md text-sm font-semibold text-primary-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]">
                          {event.companyName} · {event.roundName}
                          <span className="mt-1 block text-xs font-normal text-body">{formatWhen(event.when)}</span>
                        </Link>
                         <Link href={"/learn/my-placements?requestRoundId="+encodeURIComponent(event.roundId)}
                           className="mt-1 inline-flex min-h-10 items-center text-xs font-semibold text-primary-text underline">
                           Ask to reschedule →
                         </Link>
                      </li>
                    ))}</ul>}
                  {day.total>day.events.length?<p className="mt-1 text-xs text-muted-foreground">{day.total-day.events.length} more that day · open full calendar</p>:null}
                </li>
              ))}
            </ol>
          ) : null}
          {display.fullWeekEventCount !== null && display.weekDays !== null &&
            display.fullWeekEventCount > shownWeekEvents ? (
            <p className="text-xs text-muted-foreground">
              {display.fullWeekEventCount-shownWeekEvents} further scheduled
              {display.fullWeekEventCount-shownWeekEvents===1?" event":" events"} are included in the full calendar.
            </p>
          ) : null}
          <Link href="/learn/my-placements/calendar" className="inline-block min-h-10 pt-3 text-sm font-semibold text-primary-text hover:underline">
            Full schedule →
          </Link>
        </section>
      </div>
    </section>
  );
}
