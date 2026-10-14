import Link from "next/link";

import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { facultyResultsQuerySchema, facultyResultsHref } from "@/modules/courses/faculty-results-model";
import { getFacultyAssessmentResults } from "@/modules/courses/faculty-results-service";

type Search = {
  kind?: string | string[];
  status?: string | string[];
  search?: string | string[];
  page?: string | string[];
};
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function FacultyAssessmentResultsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const raw = await searchParams;
  const parsed = facultyResultsQuerySchema.safeParse({
    kind: first(raw.kind) ?? undefined,
    status: first(raw.status) ?? undefined,
    search: first(raw.search) ?? undefined,
    page: first(raw.page) ?? undefined,
  });
  if (!parsed.success) {
    return <section role="alert" className="space-y-3">
      <h1 className="text-xl font-semibold">Invalid assessment filters</h1>
      <Link href="/teacher/results" className="text-primary-text underline">Clear filters</Link>
    </section>;
  }
  const context = await getCurrentRequestContext();
  const data = await getFacultyAssessmentResults(context,parsed.data);
  return <div className="space-y-6">
    <PageHeader eyebrow="Faculty · Assessments" title="Assessment results"
      description="Section-specific recorded response counts and scores from your current teaching assignments."
      actions={<Link href="/teacher/allAssignments"
        className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-primary-text">
        All Assignments
      </Link>} />
    <form method="get" action="/teacher/results"
      className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
      <label className="grid gap-1 text-sm font-semibold text-body">Search
        <input name="search" type="search" maxLength={120} defaultValue={data.query.search}
          className="min-h-10 rounded-md border border-border bg-background px-3 text-foreground"
          placeholder="Assessment, course or Section" />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Type
        <select name="kind" defaultValue={data.query.kind}
          className="min-h-10 rounded-md border border-border bg-background px-3 text-foreground">
          <option value="ALL">All</option>
          <option value="ASSIGNMENT">Assignments</option>
          <option value="QUIZ">Quizzes</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Status
        <select name="status" defaultValue={data.query.status}
          className="min-h-10 rounded-md border border-border bg-background px-3 text-foreground">
          <option value="ALL">All</option>
          <option value="PUBLISHED">Published</option>
        </select>
      </label>
      <button type="submit" className="min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">
        Filter
      </button>
      <Link href="/teacher/results" className="px-3 py-2 text-sm font-semibold text-primary-text">
        Clear
      </Link>
    </form>
    <p className="text-sm text-body">{data.total} matching Section-assessment record{data.total === 1 ? "" : "s"}</p>
    {data.items.length === 0 ? <EmptyState title="No matching assessment results"
      description="No assignments or quizzes matched the current teaching Sections and filters. No scores or responses are invented." />
      : <div className="grid gap-3">
        {data.items.map(item =>
          <article key={item.kind + ":" + item.deliveryId + ":" + item.id}
            className="rounded-xl border border-border bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold text-foreground">{item.title}</h2>
                <p className="mt-1 text-sm text-body">{item.courseName} · {item.sectionName} · {item.kind}</p>
              </div>
              <span className="text-xs font-semibold text-body">{item.status}</span>
            </div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-4">
              {([
                ["Eligible", item.eligible],
                ["Responded", item.responded],
                ["No recorded response", item.pending],
                ["Average graded score", item.averagePercent === null
                  ? "Unknown" : item.averagePercent + "%"],
              ] as const).map(([label,value]) =>
                <div key={label}>
                  <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
                  <dd className="mt-1 text-lg font-semibold text-foreground">{value}</dd>
                </div>)}
            </dl>
            <Link href={item.reportHref}
              className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-primary-text hover:underline">
              Open Section report →
            </Link>
          </article>)}
      </div>}
    <nav aria-label="Assessment result pages" className="flex items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">Page {data.page} of {data.totalPages}</p>
      <div className="flex gap-3">
        {data.page > 1 && <Link href={facultyResultsHref({...data.query,page:data.page-1})}
          className="text-sm font-semibold text-primary-text">Previous</Link>}
        {data.page < data.totalPages && <Link href={facultyResultsHref({...data.query,page:data.page+1})}
          className="text-sm font-semibold text-primary-text">Next</Link>}
      </div>
    </nav>
    <p className="text-xs leading-5 text-muted-foreground">
      Only five assessments are summarized per page to bound database work.
      Results use existing authorized Section report readers. Missing responses
      are not graded failures, and unknown averages are not zero.
      Draft/private results are not evidence of learner-visible grades.
    </p>
  </div>;
}
