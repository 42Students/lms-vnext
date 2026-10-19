import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getMentorTaskReviews } from "@/modules/projects/mentor-task-review-service";
import { singleValueMentorFilters } from "@/modules/projects/mentor-filter-query";
import {
  mentorTaskReviewHref, mentorTaskReviewExportHref,
  mentorTaskReviewQuerySchema, mentorTaskReviewTargetHref,
  mentorTaskReviewMobileLayout, mentorTaskReviewMobileFilters,
} from "@/modules/projects/mentor-task-review-model";

type Params = {
  assignment?: string | string[];
  search?: string | string[];
  projectId?: string | string[];
  page?: string | string[];
  pageSize?: string | string[];
  priority?: string | string[];
  age?: string | string[];
  version?: string | string[];
  order?: string | string[];
};
export default async function MentorTaskReviewsPage({
  searchParams,
}: { searchParams: Promise<Params> }) {
  const context = await getCurrentRequestContext();
  if (!hasMembershipRole(context, "MENTOR")) redirect("/dashboard");
  const raw = await searchParams;
  const parsed = mentorTaskReviewQuerySchema.safeParse(singleValueMentorFilters({
    search:raw.search,projectId:raw.projectId,assignment:raw.assignment,
    page:raw.page,pageSize:raw.pageSize,priority:raw.priority,
    age:raw.age,version:raw.version,order:raw.order,
  }));
  if (!parsed.success) return <section role="alert" className="space-y-3">
    <PageHeader title="Invalid task review filters" />
    <Link href="/mentor/task-reviews" className="inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
      Clear filters
    </Link>
  </section>;

  const data = await getMentorTaskReviews(context, parsed.data);
  return <div className={mentorTaskReviewMobileLayout}>
    <PageHeader eyebrow="Mentor · Projects" title="Task reviews"
      description="Submitted project tasks waiting for review across your assigned projects."
      actions={<div className="flex flex-wrap items-center gap-3">
        <Link href="/mentor/task-review-history"
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 py-2 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Reviewed task history
        </Link>
        <Link href="/mentor/projects"
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 py-2 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Projects
        </Link>
      </div>}
    />
    {!data.enabled ? <section role="status" className="border-b border-border pb-4">
      Projects access is disabled for this membership. No task data was loaded.
    </section> : <>
      <form method="get" action="/mentor/task-reviews"
        className={mentorTaskReviewMobileFilters}>
        <label className="grid gap-1 text-sm font-semibold text-body">
          Task or project
          <Input type="search" name="search" maxLength={120} defaultValue={data.query.search}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3 text-foreground"
            placeholder="Search pending task reviews" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">
          Page size
          <Select name="pageSize" defaultValue={String(data.pageSize)}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="20">20</option><option value="50">50</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Assigned project
          <Select name="projectId" defaultValue={data.query.projectId ?? ""} className="min-h-11 sm:min-h-9 max-w-full rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="">All assigned projects</option>
            {data.projects.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">My Mentor assignment
          <Select name="assignment" defaultValue={data.query.assignment}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="ALL">All current assignments</option>
            <option value="PRIMARY">Primary Mentor</option>
            <option value="SUPPORTING">Supporting Mentor</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Priority
          <Select name="priority" defaultValue={data.query.priority}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            {(["ALL","CRITICAL","HIGH","MEDIUM","LOW"] as const).map(priority=>
              <option key={priority} value={priority}>{priority}</option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Submission version
          <Input type="number" name="version" min={1} max={100000}
            defaultValue={data.query.version ?? ""} placeholder="All versions"
            className="min-h-11 sm:min-h-9 w-32 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3 text-foreground" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Waiting since
          <Select name="age" defaultValue={data.query.age} className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="ALL">Any submission age</option><option value="LAST_7_DAYS">Past 7 days</option><option value="OLDER_THAN_7_DAYS">Over 7 days old</option><option value="OLDER_THAN_30_DAYS">Over 30 days old</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Review order
          <Select name="order" defaultValue={data.query.order}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="NEWEST">Newest first</option>
            <option value="OLDEST">Oldest first</option><option value="PRIORITY">Critical priority first</option>
          </Select>
        </label>
        <Button type="submit" variant="primary">
          Filter
        </Button>
        <Link href="/mentor/task-reviews" className="inline-flex min-h-11 items-center px-3 py-2 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Clear
        </Link>
      </form>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link href={mentorTaskReviewExportHref(data.query)} download
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Export pending task review metadata CSV (max 200)
        </Link>
        {data.total>200?<span role="status">CSV omits {data.total-200} matching task reviews.</span>:null}
      </div>
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
        : <div className="min-w-0 divide-y divide-border">{data.items.map(item =>
          <article key={item.id} className="py-4">
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
              className="min-h-11 mt-3 inline-flex min-h-9 items-center text-sm font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              Open exact task review →
            </Link>
          </article>)}</div>}
      {data.total>0&&data.items.length===0?
        <Link href={mentorTaskReviewHref({...data.query,page:1})}
          className="inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Return to first matching page
        </Link>:null}
      <nav aria-label="Task review pagination" className="flex items-center justify-between gap-3">
        <p className="text-sm text-body">Page {data.page} of {data.totalPages}</p>
        <div className="flex gap-3">
          {data.page > 1 && <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            href={mentorTaskReviewHref({...data.query, page: data.page - 1})}>Previous</Link>}
          {data.page < data.totalPages && <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
