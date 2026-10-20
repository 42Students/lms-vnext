import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import Link from "next/link";
import { redirect } from "next/navigation";
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
import { getTpoLiveDriveDaySummary } from "@/modules/placements/tpo-live-drive-day-service";

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

  // A dual-role student coordinator retains the existing assignment view.
  // TPO-only staff see a scoped operational snapshot, not a coordinator roster.
  if (hasMembershipRole(context, "TPO") && !hasMembershipRole(context, "LEARNER")) {
    const raw=await searchParams;
    const search=tpoLiveRoundSearchSchema.safeParse(Array.isArray(raw.q)?raw.q[0]:raw.q);
    if(!search.success)return <Alert tone="error">Invalid search. <Link href="/tpo/drive-day">Clear filters</Link></Alert>;
    const issue=tpoDriveDayIssueSchema.safeParse(Array.isArray(raw.issue)?raw.issue[0]:raw.issue);
    const sort=tpoDriveDaySortSchema.safeParse(Array.isArray(raw.sort)?raw.sort[0]:raw.sort);
    if(!sort.success)return <Alert tone="error">Invalid Drive Day sorting. <Link href="/tpo/drive-day">Clear filters</Link></Alert>;
    if(!issue.success)return <Alert tone="error">Invalid Drive Day filter. <Link href="/tpo/drive-day">Clear filters</Link></Alert>;
    const snapshot = await getTpoLiveDriveDaySummary(context);
    const liveTotals=summarizeTpoLiveTriage(snapshot.rows);
    const liveRows=sortTpoDriveDayRows(filterTpoDriveDayIssues(filterTpoLiveRoundSearch(snapshot.rows,search.data),issue.data),sort.data);
    return (
      <div className="min-w-0 space-y-[var(--lms-space-6)]">
        <PageHeader eyebrow="TPO · Drive Day" title="Live rounds"
          description="Rounds happening now, using recorded schedule and duration plus persisted attendance." />
        <form action="/tpo/drive-day" method="get" className="flex flex-wrap gap-3">
          <label className="text-sm">Search live rounds<Input name="q" type="search" maxLength={100} defaultValue={search.data} placeholder="Company, job or round" className="mt-1 block min-h-11 max-[767px]:min-h-11"/></label>
          <label className="text-sm">Attendance focus<Select name="issue" defaultValue={issue.data} className="mt-1 block min-h-11 max-[767px]:min-h-11"><option value="ALL">All live rounds</option><option value="NO_SHOWS">Recorded no-shows</option><option value="PENDING">Attendance pending</option><option value="UNKNOWN">Attendance not recorded</option><option value="UNRESOLVED">Pending or unrecorded</option><option value="ALL_UNRECORDED">No attendance entries recorded</option></Select></label>
          <label className="text-sm">Prioritize<Select name="sort" defaultValue={sort.data} className="mt-1 block min-h-11 max-[767px]:min-h-11"><option value="RECENT">Most recent scheduled</option><option value="PENDING_DESC">Most pending first</option><option value="NO_SHOW_DESC">Most no-shows first</option><option value="UNRESOLVED_DESC">Most unresolved first</option></Select></label>
          <Button type="submit" className="self-end min-h-11 rounded-[var(--lms-control-radius)] bg-primary px-4 text-on-primary">Apply</Button>
        </form>
        <div className="flex flex-wrap gap-3"><Link href={tpoLiveCsvHref({q:search.data,issue:issue.data,sort:sort.data})} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm text-[var(--lms-teal-deep)] md:min-h-9">Export current live snapshot CSV</Link><Link href="/tpo/drive-day" className="inline-flex min-h-11 items-center text-[var(--lms-teal-deep)] underline md:min-h-9">Reset focus</Link></div>
        <dl aria-label="Current authorized live-round snapshot" className="grid min-w-0 grid-cols-2 gap-3 min-[768px]:grid-cols-3 lg:grid-cols-6">{[
          ["Live rounds",liveTotals.rounds],["Roster",liveTotals.roster],["Checked in",liveTotals.checkedIn],
          ["Explicit no-shows",liveTotals.explicitNoShows],["Pending",liveTotals.pending],["Unrecorded",liveTotals.unrecorded],
        ].map(([name,count])=><div key={name} className="border-b border-border px-1 py-3"><dt className="text-xs text-muted-foreground">{name}</dt><dd className="font-semibold tabular-nums">{count}</dd></div>)}</dl>
        <p className="text-xs text-muted-foreground">Counts describe the full retrieved live-round sample before these screen filters, not every round in the college or verified attendance.</p>
        {snapshot.truncated ? (
          <Alert tone="warning">Only the first 20 live rounds are shown; more records may exist.</Alert>
        ) : null}
        {liveRows.length === 0 ? (
          <EmptyState title={snapshot.rows.length===0?"No verified round happening now":"No live rounds match this filter"} description="Only published scheduled rounds with a recorded start and duration count as live. A round without duration is not assumed active. No check-ins or no-shows are inferred."/>
        ) : (
          <div className="grid gap-4">
            {liveRows.map((round) => (
              <article key={round.id} className="border-b border-border py-5">
                <div className="flex min-w-0 flex-col gap-3 min-[768px]:flex-row min-[768px]:items-center min-[768px]:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{round.companyName} · {round.name}</h2>
                    <p className="text-sm text-body">{round.jobTitle} · Started {
                      round.scheduledAt ? new Date(round.scheduledAt).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short",
                      }) : "unknown"
                    } IST</p>
                    <p className="text-xs text-muted-foreground">{tpoLiveRoundVenueLabel(round.venue)}</p>
                    {tpoLiveRoundTiming(round,snapshot.asOf).remainingMinutes!==null?<p className="text-xs text-muted-foreground">Elapsed {tpoLiveRoundTiming(round,snapshot.asOf).elapsedMinutes} min · approximately {tpoLiveRoundTiming(round,snapshot.asOf).remainingMinutes} min scheduled remaining. This is not an actual completion state.</p>:null}
                  </div>
                  <div className="flex flex-wrap gap-2"><Link href={tpoLiveRoundJobHref(round.jobId)} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm text-[var(--lms-teal-deep)] md:min-h-9">Open drive</Link>
                  <Link href={"/tpo/drive-day/" + round.id}
                    className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-primary px-4 text-sm font-semibold text-[var(--lms-teal-deep)] md:min-h-9">
                    Open round
                  </Link></div>
                </div>
                <p role="status" className="mt-3 text-sm text-body">{tpoLiveAttendanceAttention(round.counts)}</p>
                <dl className="mt-4 grid grid-cols-2 gap-3 min-[768px]:grid-cols-5">
                  {([
                    ["Roster", round.counts.total], ["Checked in", round.counts.checkedIn],
                    ["Explicit no-shows", round.counts.noShow], ["Pending", round.counts.pending],
                    ["Unknown", round.counts.unknown],
                  ] as const).map(([label, count]) => (
                    <div key={label} className="min-w-0 border-b border-[var(--lms-canvas-border)] p-[var(--lms-space-3)]">
                      <dt className="text-xs text-body">{label}</dt>
                      <dd className="mt-1 text-xl font-semibold tabular-nums text-foreground">{count}</dd>
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
              className="border-b border-border py-5"
            >
              <div className="flex min-w-0 flex-col gap-4 min-[768px]:flex-row min-[768px]:items-start min-[768px]:justify-between">
                <div>
                  <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-link">
                    Assigned round
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-foreground">
                    {round.company} ·{" "}
                    {round.jobTitle}
                  </h2>
                  <p className="mt-1 text-sm text-body">
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
                    <StatusBadge tone="info">
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
