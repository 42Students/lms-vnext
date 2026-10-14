import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getMentorTaskReviews } from "@/modules/projects/mentor-task-review-service";
import {
  mentorTaskReviewHref, mentorTaskReviewQuerySchema, mentorTaskReviewTargetHref,
} from "@/modules/projects/mentor-task-review-model";

type Params = {
  search?: string | string[];
  page?: string | string[];
  pageSize?: string | string[];
  priority?: string | string[];
  order?: string | string[];
};
function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
export default async function MentorTaskReviewsPage({
  searchParams,
}: { searchParams: Promise<Params> }) {
  const context = await getCurrentRequestContext();
  if (!hasMembershipRole(context, "MENTOR")) redirect("/dashboard");
  const raw = await searchParams;
  const parsed = mentorTaskReviewQuerySchema.safeParse({
    search: first(raw.search) ?? undefined,
    page: first(raw.page) ?? undefined,
    pageSize: first(raw.pageSize) ?? undefined,
    priority: first(raw.priority) ?? undefined,
    order: first(raw.order) ?? undefined,
  });
  if (!parsed.success) return <section role="alert" className="space-y-3">
    <h1 className="text-xl font-semibold">Invalid task review filters</h1>
    <Link href="/mentor/task-reviews" className="text-primary-text underline">
      Clear filters
    </Link>
  </section>;

  const data = await getMentorTaskReviews(context, parsed.data);
  return <div className="space-y-6">
    <PageHeader eyebrow="Mentor · Projects" title="Task reviews"
      description="Submitted project tasks waiting for review across your assigned projects."
      actions={<div className="flex flex-wrap items-center gap-3">
        <Link href="/mentor/task-review-history"
          className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-primary-text">
          Reviewed task history
        </Link>
        <Link href="/mentor/projects"
          className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-primary-text">
          Projects
        </Link>
      </div>}
    />
    {!data.enabled ? <section role="status" className="rounded-xl border border-border bg-surface p-5">
      Projects access is disabled for this membership. No task data was loaded.
    </section> : <>
      <form method="get" action="/mentor/task-reviews"
        className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
        <label className="grid gap-1 text-sm font-semibold text-body">
          Task or project
          <input type="search" name="search" maxLength={120} defaultValue={data.query.search}
            className="min-h-10 rounded-md border border-border bg-background px-3 text-foreground"
            placeholder="Search pending task reviews" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">
          Page size
          <select name="pageSize" defaultValue={String(data.pageSize)}
            className="min-h-10 rounded-md border border-border bg-background px-3">
            <option value="20">20</option><option value="50">50</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Priority
          <select name="priority" defaultValue={data.query.priority}
            className="min-h-10 rounded-md border border-border bg-background px-3">
            {(["ALL","CRITICAL","HIGH","MEDIUM","LOW"] as const).map(priority=>
              <option key={priority} value={priority}>{priority}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Review order
          <select name="order" defaultValue={data.query.order}
            className="min-h-10 rounded-md border border-border bg-background px-3">
            <option value="NEWEST">Newest first</option>
            <option value="OLDEST">Oldest first</option>
          </select>
        </label>
        <button type="submit"
          className="min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">
          Filter
        </button>
        <Link href="/mentor/task-reviews" className="px-3 py-2 text-sm font-semibold text-primary-text">
          Clear
        </Link>
      </form>
      <p className="text-sm text-body">
        {data.total === 0
          ? "No matching submissions"
          : "Showing " + data.first + "–" + data.last +
            " of " + data.total + " pending submissions"}
      </p>
      {data.items.length === 0
        ? <EmptyState title="No pending task reviews"
            description={data.total > 0
              ? "This page is outside the matching result range. Return to page 1."
              : "No submitted tasks currently need review in your assigned projects. Older reviewed submissions are not pending."} />
        : <div className="grid gap-3">{data.items.map(item =>
          <article key={item.id} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-sm font-semibold text-foreground">{item.taskTitle}</p>
            <p className="mt-1 text-sm text-body">
              {item.projectTitle} · Version {item.version} · Priority {item.priority}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Submitted {new Intl.DateTimeFormat("en-IN", {
                dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata",
              }).format(item.submittedAt)} IST
            </p>
            <Link href={mentorTaskReviewTargetHref(item.projectId,item.taskId)}
              className="mt-3 inline-flex min-h-9 items-center text-sm font-semibold text-primary-text hover:underline">
              Open exact task review →
            </Link>
          </article>)}</div>}
      <nav aria-label="Task review pagination" className="flex items-center justify-between gap-3">
        <p className="text-sm text-body">Page {data.page} of {data.totalPages}</p>
        <div className="flex gap-3">
          {data.page > 1 && <Link className="text-sm font-semibold text-primary-text"
            href={mentorTaskReviewHref({...data.query, page: data.page - 1})}>Previous</Link>}
          {data.page < data.totalPages && <Link className="text-sm font-semibold text-primary-text"
            href={mentorTaskReviewHref({...data.query, page: data.page + 1})}>Next</Link>}
        </div>
      </nav>
    </>}
    <p className="text-xs leading-5 text-muted-foreground">
      This view reads registered task submissions only.
      Review updates remain in the existing authorized project Board.
    </p>
  </div>;
}
