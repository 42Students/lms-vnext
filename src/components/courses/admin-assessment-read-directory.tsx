import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { adminAssessmentHref, adminAssessmentStats } from "@/modules/courses/admin-assessment-directory-model";
import type { listCollegeAssessmentAggregate } from "@/modules/courses/college-assessment-aggregate-service";

type Data = Awaited<ReturnType<typeof listCollegeAssessmentAggregate>>;
function formatDue(value: Date | null) {
  return value ? new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata",
  }).format(value) + " IST" : "Not scheduled";
}
export function AdminAssessmentDirectory({ data }: { data: Data }) {
  const assignment = data.kind === "ASSIGNMENT";
  const title = assignment ? "Assignments" : "Quizzes";
  const base = assignment ? "/admin/assignments" : "/admin/quizzes";
  const stats = adminAssessmentStats(data.items);
  return <div className="space-y-5">
    <PageHeader eyebrow="Super Admin · Courses" title={title}
      description={`Read-only ${title.toLowerCase()} across the selected college. Submission/attempt counts reflect persisted rows, not distinct learners or completion rates.`} />
    <form action={base} className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 xl:grid-cols-3">
      <label className="grid gap-1 text-sm font-semibold text-body">Assessment title
        <input name="q" type="search" maxLength={100} defaultValue={data.query.q}
          className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Status
        <select name="status" defaultValue={data.query.status} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
          <option value="ALL">All</option><option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          {!assignment ? <option value="CLOSED">Closed</option> : null}
          <option value="ARCHIVED">Archived</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Course code
        <input name="courseCode" maxLength={64} defaultValue={data.query.courseCode??""} placeholder="All courses" className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Audience
        <select name="scope" defaultValue={data.query.scope} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
          <option value="ALL">All audiences</option><option value="SHARED">Shared offering</option><option value="SECTION">Section-specific</option>
        </select>
      </label>
      {!assignment?<label className="grid gap-1 text-sm font-semibold text-body">Results
        <select name="results" defaultValue={data.query.results} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
         <option value="ALL">All results</option><option value="PUBLISHED">Released</option><option value="HIDDEN">Withheld</option>
        </select>
      </label>:null}
      <button type="submit" className="min-h-11 self-end rounded-md bg-primary px-4 font-semibold text-on-primary">Filter</button>
    </form>
    <p className="text-sm text-muted-foreground">{data.total} matching records · on this page: {stats.published} published, {stats.activity} {assignment ? "submissions" : "attempts"}</p>
    {data.items.length ? <div className="grid gap-3 md:grid-cols-2">
      {data.items.map(item => <article key={item.id} className="min-w-0 rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="m-0 break-words text-base font-semibold text-foreground">{item.title}</h2>
          <StatusBadge tone={item.status === "PUBLISHED" ? "success" : "neutral"}>{item.status}</StatusBadge>
        </div>
        <p className="mt-1 text-sm text-body">{item.courseName} ({item.courseCode}) · {item.lessonName}</p>
        <p className="mt-2 text-xs text-muted-foreground">{item.deliverySpecific ? "Section-specific" : "Shared offering"} · {item.points} maximum points</p>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm text-body">
          <div><dt className="text-xs text-muted-foreground">Due</dt><dd>{formatDue(item.dueAt)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">{assignment ? "Submissions" : "Attempts"}</dt>
            <dd className="text-lg font-semibold tabular-nums">{item.activityCount}</dd></div>
        </dl>
        <Link href={`/admin/courses/offerings/${encodeURIComponent(item.offeringId)}`}
          className="mt-3 inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
          Open offering →
        </Link>
      </article>)}
    </div> : <EmptyState title={assignment?"No assignments found for this college":"No quizzes found for this college"} description="Try adjusting your filters." />}
    <nav aria-label={title + " pages"} className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">Page {data.page} of {data.totalPages} · 25 per page</span>
      <div className="flex gap-2">
        {data.page > 1 ? <Link href={adminAssessmentHref(data.kind, { ...data.query, page: data.page - 1 })}
          className="rounded-md border border-border px-4 py-2 font-semibold text-primary-text">Previous</Link> : null}
        {data.page < data.totalPages ? <Link href={adminAssessmentHref(data.kind, { ...data.query, page: data.page + 1 })}
          className="rounded-md border border-border px-4 py-2 font-semibold text-primary-text">Next</Link> : null}
      </div>
    </nav>
    <p className="text-xs text-muted-foreground">No answers, submission body, learner contacts or stored attachments are fetched by this directory.</p>
    <Link href="/admin/courses" className="inline-flex min-h-10 items-center font-semibold text-primary-text">← Courses</Link>
  </div>;
}
