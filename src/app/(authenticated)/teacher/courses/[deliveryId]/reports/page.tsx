import Link from "next/link";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentRequestContext } from "@/auth/request-context";
import { parseFacultyReportsHubLocation, facultyReportHubHref } from "@/modules/courses/faculty-reports-hub-model";
import { getFacultyReportsHub } from "@/modules/courses/faculty-reports-hub-service";

type Search = { kind?: string | string[]; page?: string | string[] };
const reportLink = "inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-9";
const textLink = "inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9";

export default async function FacultyReportsHubPage({
  params, searchParams,
}: {
  params: Promise<{ deliveryId: string }>;
  searchParams: Promise<Search>;
}) {
  const [{ deliveryId }, raw] = await Promise.all([params, searchParams]);
  const parsed = parseFacultyReportsHubLocation(deliveryId, raw);
  if (!parsed.success) {
    return <section className="min-w-0 space-y-4">
      <PageHeader title="Invalid report filters" />
      <p role="alert" className="text-sm leading-[1.6] text-body">Use the Section reports page to choose valid filters.</p>
      <Link href="/teacher/courses" className={reportLink}>Courses</Link>
    </section>;
  }
  const data = await getFacultyReportsHub(await getCurrentRequestContext(), parsed.data);
  const root = "/teacher/courses/" + encodeURIComponent(deliveryId);
  const metrics = [
    ["Assignments", data.breakdown.assignments],
    ["Quizzes", data.breakdown.quizzes],
    ["Published assignments", data.breakdown.publishedAssignments],
    ["Published quizzes", data.breakdown.publishedQuizzes],
  ] as const;

  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader title="Section reports"
      description={data.rosterSize + " current eligible learners."}
      actions={<Link href={root + "/home"} className={reportLink}>Section workspace</Link>} />

    <section aria-label="Assessment summary" className="min-w-0 space-y-3">
      <h2 className="text-lg font-semibold leading-7 text-[var(--lms-heading)]">Assessment overview</h2>
      <dl className="grid grid-cols-2 gap-x-4 border-y border-[var(--lms-canvas-border)] sm:grid-cols-4">
        {metrics.map(([title, value]) => <div key={title} className="min-w-0 py-4">
          <dt className="text-xs font-semibold leading-5 text-muted-foreground">{title}</dt>
          <dd className="mt-1 text-xl font-semibold leading-7 tabular-nums text-[var(--lms-heading)]">{value}</dd>
        </div>)}
      </dl>
    </section>

    <section aria-label="Other reports" className="min-w-0 space-y-3">
      <div className="grid min-w-0 gap-x-6 md:grid-cols-2">
        <div className="min-w-0 space-y-2 border-b border-[var(--lms-canvas-border)] py-4">
          <h2 className="text-lg font-semibold leading-7 text-[var(--lms-heading)]">Attendance</h2>
          <p className="max-w-prose text-sm leading-[22px] text-body">
            {data.attendance.scheduled} scheduled sessions; {data.attendance.marked} marked. Unmarked attendance is unknown, not zero.
          </p>
          <Link href={root + "/attendanceDetail"} className={textLink}>Open attendance report →</Link>
        </div>
        <div className="min-w-0 space-y-2 border-b border-[var(--lms-canvas-border)] py-4">
          <h2 className="text-lg font-semibold leading-7 text-[var(--lms-heading)]">Published gradebook</h2>
          <p className="max-w-prose text-sm leading-[22px] text-body">
            Published assessment counts are not a final grade. Individual published scores are shown only in the gradebook.
          </p>
          <Link href={root + "/gradebook"} className={textLink}>Open gradebook →</Link>
        </div>
      </div>
    </section>

    <section aria-labelledby="published-reports-heading" className="min-w-0 space-y-4">
      <h2 id="published-reports-heading" className="text-lg font-semibold leading-7 text-[var(--lms-heading)]">Published assessment reports</h2>
      <form method="get" className="grid min-w-0 gap-3 border-b border-[var(--lms-canvas-border)] pb-4 sm:grid-cols-[minmax(0,16rem)_auto_auto] sm:items-end sm:justify-start">
        <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Assessment type
          <Select name="kind" defaultValue={data.query.kind} className="min-h-11 w-full md:min-h-9">
            <option value="ALL">All</option>
            <option value="ASSIGNMENT">Assignments</option>
            <option value="QUIZ">Quizzes</option>
          </Select>
        </label>
        <Button type="submit" variant="primary" className="w-full sm:w-auto">Filter</Button>
        {data.query.kind !== "ALL" ? <Link
          href={facultyReportHubHref({ ...data.query, kind: "ALL", page: 1 })}
          className="inline-flex min-h-11 items-center justify-center px-3 text-sm font-semibold text-primary-text hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"
        >Clear</Link> : null}
      </form>

      {data.health.items.length === 0 ? <EmptyState title="No published assessment reports"
        description="This Section has no published assessments matching the filter. Private or ungraded work is not fabricated."
        action={undefined} />
        : <div className="min-w-0 divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">
          {data.health.items.map(item => <article key={item.kind + item.id}
            className="flex min-w-0 flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="min-w-0 space-y-1">
              <h3 className="break-words text-base font-semibold leading-6 text-[var(--lms-heading)]">{item.title}</h3>
              <p className="text-sm leading-[22px] text-body">{item.kind} · {item.responded}/{item.eligible} recorded responses · {item.outstanding} not responded</p>
              <p className="text-xs leading-5 text-muted-foreground">Graded average: {item.averagePercent === null ? "Unknown" : item.averagePercent + "%"}</p>
            </div>
            <Link href={item.href} className={reportLink}>Open Section report →</Link>
          </article>)}
        </div>}

      {data.health.totalPages > 1 ? <nav aria-label="Report pages" className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-muted-foreground">Page {data.health.page} of {data.health.totalPages}</span>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          {data.health.page > 1 ? <Link href={facultyReportHubHref({ ...data.query, page: data.health.page - 1 })} className={reportLink}>Previous</Link> : <span aria-hidden="true" />}
          {data.health.page < data.health.totalPages ? <Link href={facultyReportHubHref({ ...data.query, page: data.health.page + 1 })} className={reportLink}>Next</Link> : null}
        </div>
      </nav> : null}
    </section>
    <p className="max-w-prose text-xs leading-5 text-muted-foreground">All counts are exact current-Section persisted records. Missing and unpublished grades remain unknown.</p>
  </div>;
}
