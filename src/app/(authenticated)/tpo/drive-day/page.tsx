import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import Link from "next/link";
import { redirect } from "next/navigation";
import { tpoIstDayWindow } from "@/modules/placements/tpo-live-drive-day-model";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasMembershipRole } from "@/modules/identity/context";
import { listMyDriveDayRounds } from "@/modules/placements/drive-day-coordinator-service";
import {tpoLiveAttendanceAttention} from "@/modules/placements/tpo-live-attendance-attention-model";
import {tpoLiveRoundVenueLabel} from "@/modules/placements/tpo-live-round-venue-model";
import {tpoLiveRoundJobHref} from "@/modules/placements/tpo-live-round-job-link-model";
import {tpoLiveCsvHref} from "@/modules/placements/tpo-live-drive-day-csv-model";
import {tpoLiveRoundTiming} from "@/modules/placements/tpo-live-round-timing-model";
import {summarizeTpoLiveTriage} from "@/modules/placements/tpo-live-triage-summary-model";
import {filterTpoLiveRoundSearch,tpoLiveRoundSearchSchema} from "@/modules/placements/tpo-live-round-search-model";
import { tpoDriveDaySortSchema, sortTpoDriveDayRows } from "@/modules/placements/tpo-drive-day-sort-model";
import { tpoDriveDayIssueSchema, filterTpoDriveDayIssues } from "@/modules/placements/tpo-drive-day-issue-filter-model";
import { getTpoLiveDriveDaySummary, getTpoDriveDayQueue } from "@/modules/placements/tpo-live-drive-day-service";
import { TpoDriveDayTodayList } from "@/components/tpo/tpo-drive-day-today-list";

function formatWhen(
  value: Date | null,
  timezone: string | null,
) {
  if (!value) return "Time not scheduled";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone:
      timezone ?? "Asia/Kolkata",
  }).format(value);
}

export default async function DriveDayPage({searchParams}:{searchParams:Promise<{issue?:string|string[];sort?:string|string[];q?:string|string[]}>}) {
  const context =
    await getCurrentRequestContext();
  if (!context.membership ||
      (!hasMembershipRole(context, "LEARNER") && !hasMembershipRole(context, "TPO"))) {
    redirect("/dashboard");
  }

  // The TPO portal always uses the TPO scope; holding a learner role must
  // not silently replace the operational view with a coordinator roster.
  if (hasMembershipRole(context, "TPO")) {
    const raw=await searchParams;
    if (Object.values(raw).some(Array.isArray)) return <div className="min-w-0 space-y-4"><PageHeader title="Drive day" /><Alert tone="error">Invalid drive day filter. <Link href="/tpo/drive-day">Clear filters</Link></Alert></div>;
    const search=tpoLiveRoundSearchSchema.safeParse(Array.isArray(raw.q)?raw.q[0]:raw.q);
    if(!search.success)return <div className="min-w-0 space-y-4"><PageHeader title="Drive day" /><Alert tone="error">Invalid search. <Link href="/tpo/drive-day">Clear filters</Link></Alert></div>;
    const issue=tpoDriveDayIssueSchema.safeParse(Array.isArray(raw.issue)?raw.issue[0]:raw.issue);
    const sort=tpoDriveDaySortSchema.safeParse(Array.isArray(raw.sort)?raw.sort[0]:raw.sort);
    if(!sort.success)return <div className="min-w-0 space-y-4"><PageHeader title="Drive day" /><Alert tone="error">Invalid drive day sorting. <Link href="/tpo/drive-day">Clear filters</Link></Alert></div>;
    if(!issue.success)return <div className="min-w-0 space-y-4"><PageHeader title="Drive day" /><Alert tone="error">Invalid drive day filter. <Link href="/tpo/drive-day">Clear filters</Link></Alert></div>;
    // All on-campus rounds dated today are the primary list, not merely
    // those whose scheduled duration happens to include the current instant.
    const window=tpoIstDayWindow(new Date().toISOString());
    let todayRounds: Awaited<ReturnType<typeof getTpoDriveDayQueue>> = [];
    let todayError=false;
    try { todayRounds=await getTpoDriveDayQueue(context); }
    catch { todayError=true; }
    let snapshot: Awaited<ReturnType<typeof getTpoLiveDriveDaySummary>> | null = null;
    try { snapshot=await getTpoLiveDriveDaySummary(context); } catch { /* Independent live snapshot. */ }
    const liveTotals=snapshot?summarizeTpoLiveTriage(snapshot.rows):null;
    const liveRows=snapshot?sortTpoDriveDayRows(filterTpoDriveDayIssues(filterTpoLiveRoundSearch(snapshot.rows,search.data),issue.data),sort.data):[];
    return (
      <div className="min-w-0 space-y-[var(--lms-space-6)]">
        <PageHeader title="Drive day"
          description="Today's on-campus interview rounds, followed by live attendance attention." />
        <TpoDriveDayTodayList
          rows={todayRounds.map(round => ({
            ...round,
            scheduledAt: round.scheduledAt?.toISOString() ?? null,
          }))}
          failed={todayError}
          cacheKey={context.user.id + ":" + context.membership.collegeId + ":" + window.start.toISOString().slice(0, 10)}
        />
        {!snapshot?<Alert tone="error">Could not load today&apos;s drive-day assignments. <Link href="/tpo/drive-day" className="font-semibold text-link underline">Retry</Link></Alert>:null}
        <h2 className="text-lg font-semibold">Rounds happening now</h2>
        <form action="/tpo/drive-day" method="get" className="grid min-w-0 grid-cols-1 gap-[8px] sm:grid-cols-2 sm:items-end xl:grid-cols-[minmax(0,1fr)_auto_auto_auto]" aria-label="Filter drive day">
          <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search live rounds<Input name="q" type="search" maxLength={100} defaultValue={search.data} placeholder="Company, job or round" className="block min-h-11 min-[768px]:min-h-[var(--lms-control-height)] mt-[6px]"/></label>
          <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Attendance focus<Select name="issue" defaultValue={issue.data} className="block min-h-11 min-[768px]:min-h-[var(--lms-control-height)] mt-[6px]"><option value="ALL">All live rounds</option><option value="NO_SHOWS">Recorded no-shows</option><option value="PENDING">Attendance pending</option><option value="UNKNOWN">Attendance not recorded</option><option value="UNRESOLVED">Pending or unrecorded</option><option value="ALL_UNRECORDED">No attendance entries recorded</option></Select></label>
          <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Prioritize<Select name="sort" defaultValue={sort.data} className="block min-h-11 min-[768px]:min-h-[var(--lms-control-height)] mt-[6px]"><option value="RECENT">Most recent scheduled</option><option value="PENDING_DESC">Most pending first</option><option value="NO_SHOW_DESC">Most no-shows first</option><option value="UNRESOLVED_DESC">Most unresolved first</option></Select></label>
          <Button type="submit" className="min-h-11 w-full self-end bg-primary px-4 text-on-primary md:min-h-[var(--lms-control-height)] xl:w-auto">Apply</Button>
        </form>
        <div className="flex flex-wrap gap-3"><Link href={tpoLiveCsvHref({q:search.data,issue:issue.data,sort:sort.data})} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm text-[var(--lms-teal-deep)] md:min-h-9">Export current live snapshot CSV</Link><Link href="/tpo/drive-day" className="inline-flex min-h-11 items-center text-[var(--lms-teal-deep)] underline md:min-h-9">Reset focus</Link></div>
        {liveTotals?<dl aria-label="Current authorized live-round snapshot" className="grid min-w-0 grid-cols-2 gap-px overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border bg-border md:grid-cols-3 lg:grid-cols-6">{[
          ["Live rounds",liveTotals.rounds],["Roster",liveTotals.roster],["Checked in",liveTotals.checkedIn],
          ["Explicit no-shows",liveTotals.explicitNoShows],["Pending",liveTotals.pending],["Unrecorded",liveTotals.unrecorded],
        ].map(([name,count])=><div key={name} className="min-w-0 bg-surface px-3 py-3"><dt className="text-xs text-muted-foreground">{name}</dt><dd className="font-semibold tabular-nums">{count}</dd></div>)}</dl>:null}
        <p className="text-xs text-muted-foreground leading-5">Counts describe the full retrieved live-round sample before these screen filters, not every round in the college or verified attendance.</p>
        {snapshot?.truncated ? (
          <Alert tone="warning">Only the first 20 live rounds are shown; more records may exist.</Alert>
        ) : null}
        {liveRows.length === 0 ? (
          <EmptyState title={!snapshot||snapshot.rows.length===0?"No verified round happening now":"No live rounds match this filter"} description="Only published scheduled rounds with a recorded start and duration count as live. A round without duration is not assumed active. No check-ins or no-shows are inferred." action={<Link href="/tpo/drive-day" className="lms-inline-link inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Reset focus</Link>}/>
        ) : (
          <div className="grid gap-4">
            {liveRows.map((round) => (
              <article key={round.id} className="border-b border-border py-4">
                <div className="flex min-w-0 flex-col gap-3 min-[768px]:flex-row min-[768px]:items-center min-[768px]:justify-between">
                  <div>
                    <h2 className="font-semibold text-[18px] leading-[1.4] text-[var(--lms-heading)]">{round.companyName} · {round.name}</h2>
                    <p className="text-sm text-body leading-[22px]">{round.jobTitle} · Started {
                      round.scheduledAt ? new Date(round.scheduledAt).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short",
                      }) : "unknown"
                    } IST</p>
                    <p className="text-xs text-muted-foreground leading-5">{tpoLiveRoundVenueLabel(round.venue)}</p>
                    {tpoLiveRoundTiming(round,snapshot!.asOf).remainingMinutes!==null?<p className="text-xs text-muted-foreground leading-5">Elapsed {tpoLiveRoundTiming(round,snapshot!.asOf).elapsedMinutes} min · approximately {tpoLiveRoundTiming(round,snapshot!.asOf).remainingMinutes} min scheduled remaining. This is not an actual completion state.</p>:null}
                  </div>
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap"><Link href={tpoLiveRoundJobHref(round.jobId)} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm text-[var(--lms-teal-deep)] md:min-h-9">Open drive</Link>
                  <Link href={"/tpo/drive-day/" + round.id}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-primary bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover sm:w-auto md:min-h-9">
                    Open round
                  </Link></div>
                </div>
                <p role="status" className="mt-3 text-sm text-body leading-[1.6]">{tpoLiveAttendanceAttention(round.counts)}</p>
                <dl className="mt-4 grid min-w-0 grid-cols-2 gap-px overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border bg-border md:grid-cols-5">
                  {([
                    ["Roster", round.counts.total], ["Checked in", round.counts.checkedIn],
                    ["Explicit no-shows", round.counts.noShow], ["Pending", round.counts.pending],
                    ["Unknown", round.counts.unknown],
                  ] as const).map(([label, count]) => (
                    <div key={label} className="min-w-0 bg-surface p-[var(--lms-space-3)] last:col-span-2 md:last:col-span-1">
                      <dt className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">{label}</dt>
                      <dd className="mt-2 text-[24px] font-semibold leading-[1.3] tabular-nums text-[var(--lms-heading)]">{count}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        )}
      </div>
    );
  }

  const rounds =
    await listMyDriveDayRounds(context);

  return (
    <div className="min-w-0 space-y-[var(--lms-space-6)]">
      <PageHeader
        eyebrow="Student coordinator"
        title="Drive day"
        description="Your assigned rounds for today, optimized for quick on-site attendance."
      />

      {rounds.length === 0 ? (
        <EmptyState title="There is no drive day for you today." description="This workspace appears only for dates when the placement cell assigns you as a student coordinator."/>
      ) : (
        <div className="grid gap-4">
          {rounds.map((round) => (
            <article
              key={round.roundId}
              className="border-b border-border py-4"
            >
              <div className="flex min-w-0 flex-col gap-4 min-[768px]:flex-row min-[768px]:items-start min-[768px]:justify-between">
                <div>
                  <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-link leading-5">
                    Assigned round
                  </p>
                  <h2 className="mt-1 font-semibold text-[18px] leading-[1.4] text-[var(--lms-heading)]">
                    {round.company} ·{" "}
                    {round.jobTitle}
                  </h2>
                  <p className="mt-1 text-sm text-body leading-[22px]">
                    {round.roundName} ·{" "}
                    {formatWhen(
                      round.startsAt,
                      round.timezone,
                    )}
                    {round.venue
                      ? " · " + round.venue
                      : ""}
                  </p>
                  <div className="mt-3">
                    <StatusBadge tone={round.roundStatus==="COMPLETED"?"success":"info"}>
                      {round.roundStatus}
                    </StatusBadge>
                  </div>
                </div>
                <Link
                  href={
                    "/tpo/drive-day/" +
                    round.roundId
                  }
                  className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-primary bg-primary px-3 text-sm font-[650] transition hover:border-primary-hover hover:bg-primary-hover text-on-primary md:min-h-9"
                >
                  Open round
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
