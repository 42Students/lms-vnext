import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getFacultySessionCoverage } from "@/modules/courses/faculty-session-coverage-service";

const backLinkClass = "inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-9";
const dateFormat = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

export default async function FacultySessionCoveragePage({
  params,
}: { params: Promise<{ deliveryId: string }> }) {
  const { deliveryId } = await params;
  const data = await getFacultySessionCoverage(await getCurrentRequestContext(), { deliveryId });
  const base = "/teacher/courses/" + encodeURIComponent(deliveryId) + "/attendanceDetail";
  const counts = [
    ["Scheduled sessions", data.total],
    ["Marked", data.marked],
    ["Ended without marks", data.completedUnmarked],
    ["Upcoming", data.upcoming],
  ] as const;

  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader title="Attendance session coverage"
      actions={<Link href={base} className={backLinkClass}>← Attendance</Link>} />

    <section aria-label="Session state counts" className="min-w-0">
      <dl className="grid grid-cols-2 gap-x-4 border-y border-[var(--lms-canvas-border)] sm:grid-cols-4">
        {counts.map(([name, value]) => <div key={name} className="min-w-0 py-4">
          <dt className="text-xs font-semibold leading-5 text-muted-foreground">{name}</dt>
          <dd className="mt-1 text-xl font-semibold leading-7 tabular-nums text-[var(--lms-heading)]">{value}</dd>
        </div>)}
      </dl>
    </section>

    <section className="min-w-0 space-y-3" aria-label="Persisted session history">
      <h2 className="text-lg font-semibold leading-7 text-[var(--lms-heading)]">Recent scheduled sessions</h2>
      {data.shown.length === 0
        ? <EmptyState title="No scheduled sessions" description="No persisted class sessions were found for this authorized Section." />
        : <ol className="min-w-0 divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">
          {data.shown.map(row => <li key={row.id} className="flex min-w-0 flex-col gap-1 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold leading-6 text-[var(--lms-heading)]">{row.title}</p>
              <p className="mt-1 break-words text-sm leading-[22px] text-body">{row.label}</p>
            </div>
            <time dateTime={row.startsAt} className="shrink-0 text-xs leading-5 text-muted-foreground sm:pt-1">
              {dateFormat.format(new Date(row.startsAt))} IST
            </time>
          </li>)}
        </ol>}
      {data.omitted > 0 ? <p role="status" className="text-sm leading-6 text-body">
        Showing latest 40 sessions; {data.omitted} older sessions omitted.
      </p> : null}
    </section>

    <p className="max-w-prose text-xs leading-5 text-muted-foreground">
      Snapshot {dateFormat.format(new Date(data.nowIso))} IST.
      Unmarked sessions are not counted as absent learner records. The view does
      not calculate learner attendance eligibility or infer missing records.
    </p>
  </div>;
}
