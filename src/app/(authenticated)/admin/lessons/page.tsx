import Link from "next/link";
import {SuperAdminLessonBulkVisibility} from "@/components/courses/super-admin-lesson-bulk-visibility";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { listCollegeLessons } from "@/modules/courses/college-learning-directory-service";
import { adminLearningHref, adminLearningQuerySchema, adminLessonStats } from "@/modules/courses/admin-learning-read-model";

export default async function SuperAdminLessonsPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const parsed = adminLearningQuerySchema.safeParse({ q: raw.q, status: raw.status, page: raw.page });
  if (!parsed.success) return <div className="space-y-5">
    <PageHeader eyebrow="Super Admin · Courses" title="Lessons" />
    <ErrorState title="Invalid lesson filters" description="Check the search, status and page values."
      action={<Link href="/admin/lessons" className="font-semibold text-primary-text">Clear filters</Link>} />
  </div>;
  const context = await getCurrentRequestContext();
  if (!context.adminScope?.collegeId) return <div className="space-y-5">
    <PageHeader eyebrow="Super Admin · Courses" title="Lessons" />
    <EmptyState title="Select a college to continue" description="Choose a college in the header above to see its lessons." />
  </div>;
  const data = await listCollegeLessons(context, parsed.data);
  const summary = adminLessonStats(data.items);
  return <div className="space-y-5">
    <PageHeader eyebrow="Super Admin · Courses" title="Lessons"
      description="Read-only authored lesson catalogue in your selected college. Counts reflect registered content records, not learner completion." />
    <a href={"/api/admin/lessons/export?"+new URLSearchParams({q:data.query.q,status:data.query.status}).toString()}
     className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text">Export lessons.csv</a>
    <form className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[1fr_auto_auto]">
      <label className="grid gap-1 text-sm font-semibold text-body">Search
        <input name="q" type="search" maxLength={100} defaultValue={data.query.q} placeholder="Lesson or course"
          className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Status
        <select name="status" defaultValue={data.query.status} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
          <option value="ACTIVE">Active</option><option value="ARCHIVED">Archived</option><option value="ALL">All</option>
        </select>
      </label>
      <button type="submit" className="min-h-11 self-end rounded-md bg-primary px-4 font-semibold text-on-primary">Filter</button>
    </form>
    <p className="text-sm text-muted-foreground">{data.total} matching lessons · on this page: {summary.authored} content records, {summary.published} published</p>
    {data.items.length?<SuperAdminLessonBulkVisibility lessons={data.items}/>:null}
    {data.items.length ? <div className="grid gap-3 md:grid-cols-2">
      {data.items.map(lesson => <article key={lesson.id} className="min-w-0 rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="m-0 break-words text-base font-semibold text-foreground">{lesson.name}</h2>
          <StatusBadge tone={lesson.status === "ACTIVE" ? "success" : "neutral"}>{lesson.status}</StatusBadge>
        </div>
        <p className="mt-1 text-sm text-body">{lesson.courseName} ({lesson.courseCode})</p>
        <p className="mt-1 text-xs text-muted-foreground">{lesson.cohortName} · {lesson.periodName} · Order {lesson.sequence + 1}</p>
        <p className="mt-3 text-sm text-body">Learning path: {lesson.pathStatus} · Offering: {lesson.offeringStatus}</p>
        <p className="mt-2 text-sm text-body">{lesson.publishedContentCount} published / {lesson.contentCount} authored content records</p>
      </article>)}
    </div> : <EmptyState title="No lessons found" description="The current college and filters have no recorded lessons." />}
    <nav aria-label="Lesson pages" className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">Page {data.query.page} of {data.totalPages} · 25 per page</span>
      <div className="flex gap-2">
        {data.query.page > 1 ? <Link href={adminLearningHref("LESSONS", { ...data.query, page: data.query.page - 1 })}
          className="rounded-md border border-border px-4 py-2 font-semibold text-primary-text">Previous</Link> : null}
        {data.query.page < data.totalPages ? <Link href={adminLearningHref("LESSONS", { ...data.query, page: data.query.page + 1 })}
          className="rounded-md border border-border px-4 py-2 font-semibold text-primary-text">Next</Link> : null}
      </div>
    </nav>
    <Link href="/admin/courses" className="inline-flex min-h-10 items-center font-semibold text-primary-text">← Courses</Link>
  </div>;
}
