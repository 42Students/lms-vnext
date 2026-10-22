import { Pagination } from "@/components/ui/pagination";
import { Disclosure } from "@/components/ui/disclosure";
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
  mentorTaskReviewMobileLayout,
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
    <PageHeader title={"Invalid task review filters"} />
    <Link href="/mentor/task-reviews" className="inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] lms-inline-link hover:text-[var(--lms-primary-text)]">
      Clear filters
    </Link>
  </section>;

  const data = await getMentorTaskReviews(context, parsed.data);
  const { projectId, version, ...requiredQuery } = data.query;
  const linkQuery = { ...requiredQuery, ...(projectId === undefined ? {} : { projectId }), ...(version === undefined ? {} : { version }) };
  const hasFilters = Boolean(data.query.search || data.query.projectId || data.query.assignment !== "ALL" || data.query.priority !== "ALL" || data.query.age !== "ALL" || data.query.version !== undefined || data.query.order !== "NEWEST" || data.pageSize !== 20);
  const hasAdvancedFilters = data.query.assignment !== "ALL" || data.query.priority !== "ALL" || data.query.age !== "ALL" || data.query.version !== undefined || data.query.order !== "NEWEST" || data.pageSize !== 20;
  return <div className={mentorTaskReviewMobileLayout}>
    <PageHeader eyebrow="Mentor · Projects" title="Task reviews"
      description="Submitted project tasks waiting for review across your assigned projects."
      actions={<div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <Link href="/mentor/task-review-history"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
          Reviewed task history
        </Link>
        <Link href="/mentor/projects"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
          Projects
        </Link>
      </div>}
    />
    {!data.enabled ? <section role="status" className="border-b border-border pb-4">
      Projects access is disabled for this membership. No task data was loaded.
    </section> : <>
      <form role="search" aria-label="mentor task reviews filters" method="get" action="/mentor/task-reviews"
        className="grid min-w-0 grid-cols-1 items-end gap-3 border-b border-border pb-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Task or project
          <Input type="search" name="search" maxLength={120} defaultValue={data.query.search}
            className="min-h-11 md:min-h-9"
            placeholder="Search pending task reviews" />
        </label>
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Assigned project
          <Select name="projectId" defaultValue={data.query.projectId ?? ""} className="min-h-11 md:min-h-9 max-w-full">
            <option value="">All assigned projects</option>
            {data.projects.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}
          </Select>
        </label>
        <div className="flex min-w-0 flex-wrap items-center gap-2 md:col-span-1">
          <Button type="submit" variant="primary" className="min-h-11 w-full md:min-h-9 md:w-auto">Filter</Button>
          {hasFilters?<Link href="/mentor/task-reviews" className="inline-flex min-h-11 items-center px-3 py-2 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] lms-inline-link hover:text-[var(--lms-primary-text)]">Clear</Link>:null}
        </div>
        <Disclosure title="More task review filters" defaultOpen={hasAdvancedFilters} className="md:col-span-3" contentClassName="grid min-w-0 grid-cols-1 gap-3 pt-3 sm:grid-cols-2 xl:grid-cols-3">
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Page size
          <Select name="pageSize" defaultValue={String(data.pageSize)}
            className="min-h-11 md:min-h-9">
            <option value="20">20</option><option value="50">50</option>
          </Select>
        </label>
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">My Mentor assignment
          <Select name="assignment" defaultValue={data.query.assignment}
            className="min-h-11 md:min-h-9">
            <option value="ALL">All current assignments</option>
            <option value="PRIMARY">Primary Mentor</option>
            <option value="SUPPORTING">Supporting Mentor</option>
          </Select>
        </label>
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Priority
          <Select name="priority" defaultValue={data.query.priority}
            className="min-h-11 md:min-h-9">
            {(["ALL","CRITICAL","HIGH","MEDIUM","LOW"] as const).map(priority=>
              <option key={priority} value={priority}>{priority}</option>)}
          </Select>
        </label>
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Submission version
          <Input type="number" name="version" min={1} max={100000}
            defaultValue={data.query.version ?? ""} placeholder="All versions"
            className="min-h-11 min-w-0 w-full max-w-full md:min-h-9 md:w-32" />
        </label>
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Waiting since
          <Select name="age" defaultValue={data.query.age} className="min-h-11 md:min-h-9">
            <option value="ALL">Any submission age</option><option value="LAST_7_DAYS">Past 7 days</option><option value="OLDER_THAN_7_DAYS">Over 7 days old</option><option value="OLDER_THAN_30_DAYS">Over 30 days old</option>
          </Select>
        </label>
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Review order
          <Select name="order" defaultValue={data.query.order}
            className="min-h-11 md:min-h-9">
            <option value="NEWEST">Newest first</option>
            <option value="OLDEST">Oldest first</option><option value="PRIORITY">Critical priority first</option>
          </Select>
        </label>
        </Disclosure>

      </form>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 text-sm">
        <p className="text-sm text-body leading-[22px]">{data.total === 0 ? "No matching submissions" : "Showing " + data.first + "–" + data.last + " of " + data.total + " pending submissions"}</p>
        <div className="flex flex-wrap items-center gap-3">
        <Link href={mentorTaskReviewExportHref(linkQuery)} download
          className="inline-flex min-h-11 items-center font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
          Export pending task review metadata CSV (max 200)
        </Link>
        {data.total>200?<span role="status">CSV omits {data.total-200} matching task reviews.</span>:null}
        </div>
      </div>
      {data.items.length === 0
        ? <EmptyState title="No pending task reviews"
            description={data.total > 0
              ? "This page is outside the matching result range. Return to page 1."
              : "No submitted tasks currently need review in your assigned projects. Older reviewed submissions are not pending."}
            action={data.total === 0 ? <Link href={hasFilters ? "/mentor/task-reviews" : "/mentor/task-review-history"} className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">{hasFilters ? "Clear filters" : "Reviewed task history"}</Link> : undefined} />
        : <div className="min-w-0 divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">{data.items.map(item =>
          <article key={item.id} className="py-[var(--lms-space-3)]">
            <p className="text-sm font-semibold text-foreground leading-[22px]">{item.taskTitle}</p>
            <p className="mt-1 text-sm text-body leading-[22px]">
              {item.projectTitle} · Version {item.version} · Priority {item.priority}
            </p>
            <p className="mt-1 text-xs text-muted-foreground leading-5">
              Submitted {new Intl.DateTimeFormat("en-IN", {
                dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata",
              }).format(item.submittedAt)} IST
            </p>
            <Link href={mentorTaskReviewTargetHref(item.projectId,item.taskId)}
              className="mt-3 inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
              Open exact task review →
            </Link>
          </article>)}</div>}
      {data.total>0&&data.items.length===0?
        <Link href={mentorTaskReviewHref({...linkQuery,page:1})}
          className="inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)]">
          Return to first matching page
        </Link>:null}
      {data.totalPages > 1 ? <Pagination label="Task review pagination" page={data.page} pageCount={data.totalPages} hrefForPage={page => mentorTaskReviewHref({...linkQuery,page})}/> : null}
    </>}
    <p className="text-xs leading-5 text-muted-foreground">
      This view reads registered task submissions only.
      Review updates remain in the existing authorized project Board.
    </p>
  </div>;
}
