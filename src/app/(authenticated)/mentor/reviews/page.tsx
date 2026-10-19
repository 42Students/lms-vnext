import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { hasMembershipRole } from "@/modules/identity/context";
import { getMentorReviewQueue } from "@/modules/projects/mentor-portfolio-service";
import { mentorPortfolioHref, mentorReviewQuerySchema, mentorDeliveryReviewMobileForm } from "@/modules/projects/mentor-portfolio-model";
import { singleValueMentorFilters } from "@/modules/projects/mentor-filter-query";
import {mentorReviewExportHref} from "@/modules/projects/mentor-review-export-model";

type Params = { assignment?:string|string[];projectId?:string|string[];projectStatus?: string | string[]; search?: string | string[]; order?: string | string[]; age?: string | string[]; page?: string | string[]; pageSize?: string | string[] };

export default async function MentorReviewsPage({
  searchParams,
}: { searchParams: Promise<Params> }) {
  const context = await getCurrentRequestContext();
  if (!hasMembershipRole(context,"MENTOR")) redirect("/dashboard");
  const raw = await searchParams;
  const parsed = mentorReviewQuerySchema.safeParse(singleValueMentorFilters({
    search:raw.search,projectStatus:raw.projectStatus,projectId:raw.projectId,
    assignment:raw.assignment,order:raw.order,age:raw.age,
    page:raw.page,pageSize:raw.pageSize,
  }));
  if (!parsed.success) return <section role="alert" className="space-y-3">
    <PageHeader title="Invalid review filters" />
    <Link href="/mentor/reviews" className="inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Clear filters</Link>
  </section>;
  const data = await getMentorReviewQueue(context, parsed.data);
  return <div className="min-w-0 max-w-full space-y-6 overflow-x-clip">
    <PageHeader eyebrow="Mentor · Projects" title="Delivery review queue"
      description="Submitted deliveries awaiting review across your currently assigned Mentor projects."
      actions={<div className="flex flex-wrap items-center gap-3">
        <Link href="/mentor/review-history"
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 py-2 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Review history
        </Link>
        <Link href="/mentor/projects"
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 py-2 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Projects
        </Link>
      </div>} />
    {!data.enabled ? <div role="status" className="border-b border-border pb-4 text-sm text-body">
      Projects access is disabled. No project data was loaded.
    </div> : <>
      <form action="/mentor/reviews" method="get" className={mentorDeliveryReviewMobileForm}>
        <label className="grid gap-1 text-sm font-semibold text-body">Search
          <Input type="search" name="search" maxLength={120} defaultValue={data.query.search}
            placeholder="Project title" className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3 text-foreground" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Assigned project
          <Select name="projectId" defaultValue={data.query.projectId ?? ""} className="min-h-11 sm:min-h-9 max-w-full rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="">All assigned projects</option>
            {data.projects.map(project=><option key={project.id} value={project.id}>{project.title}</option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">My Mentor assignment
          <Select name="assignment" defaultValue={data.query.assignment} className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="ALL">All assigned projects</option><option value="PRIMARY">Primary Mentor</option>
            <option value="SUPPORTING">Supporting Mentor</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Review order
          <Select name="order" defaultValue={data.query.order}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="NEWEST">Newest submitted first</option>
            <option value="OLDEST">Oldest submitted first</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Submitted within
          <Select name="age" defaultValue={data.query.age} className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="ALL">Any age</option><option value="LAST_7_DAYS">Last 7 days</option><option value="LAST_30_DAYS">Last 30 days</option><option value="OLDER_THAN_7_DAYS">Waiting over 7 days</option><option value="OLDER_THAN_30_DAYS">Waiting over 30 days</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Assigned Project lifecycle
          <Select name="projectStatus" defaultValue={data.query.projectStatus} className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="ALL">All current assignments</option><option value="PLANNED">Planned</option>
            <option value="ACTIVE">Active</option><option value="COMPLETED">Completed</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Page size
          <Select name="pageSize" defaultValue={String(data.pageSize)}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="20">20</option><option value="50">50</option>
          </Select>
        </label>
        <Button type="submit" variant="primary">Filter</Button>
        <Link href="/mentor/reviews" className="inline-flex min-h-11 items-center px-3 py-2 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Clear</Link>
      </form>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link href={mentorReviewExportHref(data.query)} download
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Export filtered delivery review metadata CSV (max 200)
        </Link>
        {data.total>200?<span role="status">CSV omits {data.total-200} matching reviews.</span>:null}
      </div>
      <p className="text-sm text-body">{data.total} matching review item{data.total === 1 ? "" : "s"}</p>
      {data.items.length === 0 ? <EmptyState title="No deliveries awaiting review"
        description="No submitted delivery needs review in the matching projects. Reopened or already-reviewed work is not treated as a new submission." />
        : <div className="grid">{data.items.map(item =>
          <Link key={item.key} href={item.href} className="min-h-11 block border-b border-border py-4 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            <p className="min-w-0 break-words font-semibold text-link">{item.description}</p>
            <p className="mt-2 text-xs text-muted-foreground">Submitted: {new Intl.DateTimeFormat("en-IN",{
              dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
            }).format(new Date(item.occurredAt))} IST</p>
            <p className="mt-2 text-sm font-semibold text-link">Open delivery review →</p>
          </Link>)}</div>}
      <Pagination label="Review queue pagination" page={data.page} pageCount={data.totalPages} hrefForPage={page=>mentorPortfolioHref("reviews",{...data.query,page})}/>
    </>}
    <p className="text-xs text-muted-foreground">
      Review actions remain in each assigned project&apos;s existing authorized Delivery workspace.
    </p>
  </div>;
}
