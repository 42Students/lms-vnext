import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasMembershipRole } from "@/modules/identity/context";
import { listMyDriveDayRounds } from "@/modules/placements/drive-day-coordinator-service";
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

export default async function DriveDayPage({searchParams}:{searchParams:Promise<{issue?:string|string[];sort?:string|string[]}>}) {
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
    const issue=tpoDriveDayIssueSchema.safeParse(Array.isArray(raw.issue)?raw.issue[0]:raw.issue);
    if(!issue.success)return <section role="alert">Invalid Drive Day filter. <Link href="/tpo/drive-day">Clear filters</Link></section>;
    const snapshot = await getTpoLiveDriveDaySummary(context);
    const liveRows=filterTpoDriveDayIssues(snapshot.rows,issue.data);
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="TPO · Drive Day" title="Live rounds"
          description="Rounds happening now, using recorded schedule and duration plus persisted attendance." />
        <form action="/tpo/drive-day" method="get" className="flex flex-wrap gap-3">
          <label className="text-sm">Attendance focus<select name="issue" defaultValue={issue.data} className="mt-1 block min-h-11 rounded border border-border bg-surface px-3"><option value="ALL">All live rounds</option><option value="NO_SHOWS">Recorded no-shows</option><option value="PENDING">Attendance pending</option></select></label>
          <button type="submit" className="self-end min-h-11 rounded bg-primary px-4 text-on-primary">Apply</button>
        </form>
        {snapshot.truncated ? (
          <p role="status" className="rounded-lg border border-border bg-surface p-4 text-sm text-body">
            Only the first 20 live rounds are shown; more records may exist.
          </p>
        ) : null}
        {liveRows.length === 0 ? (
          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-base font-semibold text-foreground">{snapshot.rows.length===0?"No verified round happening now":"No live rounds match this filter"}</h2>
            <p className="mt-2 text-sm text-body">
              Only published scheduled rounds with a recorded start and duration count as live.
              A round without duration is not assumed active. No check-ins or no-shows are inferred.
            </p>
          </section>
        ) : (
          <div className="grid gap-4">
            {liveRows.map((round) => (
              <article key={round.id} className="rounded-xl border border-border bg-surface p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{round.companyName} · {round.name}</h2>
                    <p className="text-sm text-body">{round.jobTitle} · Started {
                      round.scheduledAt ? new Date(round.scheduledAt).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short",
                      }) : "unknown"
                    } IST</p>
                  </div>
                  <Link href={"/tpo/drive-day/" + round.id}
                    className="inline-flex min-h-10 items-center justify-center rounded-md border border-primary px-4 text-sm font-semibold text-primary-text">
                    Open round
                  </Link>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {([
                    ["Roster", round.counts.total], ["Checked in", round.counts.checkedIn],
                    ["Explicit no-shows", round.counts.noShow], ["Pending", round.counts.pending],
                    ["Unknown", round.counts.unknown],
                  ] as const).map(([label, count]) => (
                    <div key={label} className="rounded-lg bg-surface-subtle p-3">
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student coordinator"
        title="Drive day"
        description="Your assigned rounds for today, optimized for quick on-site attendance."
      />

      {rounds.length === 0 ? (
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="m-0 text-base font-semibold text-foreground">
            There is no drive day for you today.
          </h2>
          <p className="mt-2 text-sm text-body">
            This workspace appears only for dates when the placement cell assigns you as a student coordinator.
          </p>
        </section>
      ) : (
        <div className="grid gap-4">
          {rounds.map((round) => (
            <article
              key={round.roundId}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-primary-text">
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
                  className="inline-flex min-h-9 items-center justify-center rounded-md border border-primary bg-primary px-3 text-sm font-semibold text-on-primary transition hover:border-primary-hover hover:bg-primary-hover"
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
