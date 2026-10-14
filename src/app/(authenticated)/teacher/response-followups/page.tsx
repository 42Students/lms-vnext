import Link from "next/link";

import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  facultyResponseFollowUpHref, facultyResponseFollowUpQuerySchema,
} from "@/modules/courses/faculty-response-followup-model";
import { getFacultyResponseFollowUps } from "@/modules/courses/faculty-response-followup-service";

type Params = { kind?: string | string[]; search?: string | string[]; page?: string | string[] };
function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function FacultyResponseFollowUpsPage({
  searchParams,
}: { searchParams: Promise<Params> }) {
  const raw = await searchParams;
  const parsed = facultyResponseFollowUpQuerySchema.safeParse({
    kind: first(raw.kind) ?? undefined,
    search: first(raw.search) ?? undefined,
    page: first(raw.page) ?? undefined,
  });
  if (!parsed.success) return <section role="alert" className="space-y-3">
    <h1 className="text-xl font-semibold">Invalid follow-up filters</h1>
    <Link href="/teacher/response-followups" className="text-primary-text underline">Clear filters</Link>
  </section>;

  const context = await getCurrentRequestContext();
  const data = await getFacultyResponseFollowUps(context, parsed.data);
  return <div className="space-y-6">
    <PageHeader eyebrow="Faculty · Assessments" title="Response follow-ups"
      description="Published assessments past their due date with missing responses from learners in your current teaching Sections."
      actions={<Link href="/teacher/results"
        className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-primary-text">
        Results overview
      </Link>} />
    <form action="/teacher/response-followups" method="get"
      className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
      <label className="grid gap-1 text-sm font-semibold text-body">Search
        <input type="search" name="search" defaultValue={data.query.search} maxLength={120}
          placeholder="Course, Section or assessment"
          className="min-h-10 rounded-md border border-border bg-background px-3 text-foreground" />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Assessment type
        <select name="kind" defaultValue={data.query.kind}
          className="min-h-10 rounded-md border border-border bg-background px-3 text-foreground">
          <option value="ALL">All</option>
          <option value="ASSIGNMENT">Assignments</option>
          <option value="QUIZ">Quizzes</option>
        </select>
      </label>
      <button type="submit" className="min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">
        Filter
      </button>
      <Link href="/teacher/response-followups"
        className="px-3 py-2 text-sm font-semibold text-primary-text">Clear</Link>
    </form>
    <p className="text-sm text-body">
      {data.total} matching past-due published assessment{data.total === 1 ? "" : "s"}
    </p>
    {data.items.length === 0 ? <EmptyState title="No past-due assessments match"
      description="Only published assessments with recorded due dates in the past are eligible. Drafts, undated and future work are omitted rather than marked overdue." />
    : <div className="grid gap-3">{data.items.map(item =>
      <article key={item.kind + ":" + item.deliveryId + ":" + item.id}
        className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="font-semibold text-foreground">{item.title}</h2>
            <p className="mt-1 text-sm text-body">{item.courseName} · {item.sectionName} · {item.kind}</p>
          </div>
          <span className="text-sm font-semibold text-body">{item.missingCount} without a recorded response</span>
        </div>
        {item.missingCount === 0 ? <p className="mt-3 text-sm text-body">
          Every learner in the current Section roster has a recorded response.
        </p>
        : <>
          <h3 className="mt-4 text-sm font-semibold text-foreground">Learners without a recorded response</h3>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {item.missingPreview.map(learner =>
              <li key={learner.id} className="rounded-lg bg-surface-subtle px-3 py-2 text-sm text-body">
                {learner.displayName}
                {learner.rollNumber ? " · Roll " + learner.rollNumber : ""}
              </li>)}
          </ul>
          {item.hiddenCount > 0 ? <p className="mt-2 text-xs text-muted-foreground">
            {item.hiddenCount} additional learners; open the Section report for the complete list.
          </p> : null}
        </>}
        <Link href={item.reportHref}
          className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-primary-text hover:underline">
          Open authorized Section report →
        </Link>
      </article>)}</div>}
    <nav aria-label="Assessment follow-up pages" className="flex items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">Page {data.page} of {data.totalPages}</p>
      <div className="flex gap-3">
        {data.page > 1 && <Link href={facultyResponseFollowUpHref({...data.query,page:data.page-1})}
          className="text-sm font-semibold text-primary-text">Previous</Link>}
        {data.page < data.totalPages && <Link href={facultyResponseFollowUpHref({...data.query,page:data.page+1})}
          className="text-sm font-semibold text-primary-text">Next</Link>}
      </div>
    </nav>
    <p className="text-xs leading-5 text-muted-foreground">
      Missing means no persisted submission or quiz attempt for a currently enrolled learner.
      It does not establish misconduct, failure or a notification being sent. No messages are sent
      from this view; five assessments per page are expanded to keep work bounded.
    </p>
  </div>;
}
