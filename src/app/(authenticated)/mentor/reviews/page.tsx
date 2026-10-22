import { Pagination } from "@/components/ui/pagination";
import { Disclosure } from "@/components/ui/disclosure";
import { Select } from "@/components/ui/select";
import { PageSizeSelect } from "@/components/ui/page-size-select";
import { Input } from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { hasMembershipRole } from "@/modules/identity/context";
import { getMentorReviewQueue } from "@/modules/projects/mentor-portfolio-service";
import { mentorPortfolioHref, mentorReviewQuerySchema } from "@/modules/projects/mentor-portfolio-model";
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
    <PageHeader title="Delivery review queue" description="Invalid review filters" />
    <Link href="/mentor/reviews" className="inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] lms-inline-link md:min-h-[var(--lms-control-height)]">Clear filters</Link>
  </section>;
  const data = await getMentorReviewQueue(context, parsed.data);
  return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
    <PageHeader title="Delivery review queue"
      description="Submitted deliveries awaiting review across your currently assigned mentor projects."
      actions={<div className="flex flex-wrap items-center gap-3">
        <Link href="/mentor/review-history"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          Review history
        </Link>
        <Link href="/mentor/projects"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          Projects
        </Link>
      </div>} />
    {!data.enabled ? <div role="status" className="border-b border-border pb-4 text-sm text-body">
      Projects access is disabled. No project data was loaded.
    </div> : <>
      <form role="search" aria-label="mentor reviews filters" action="/mentor/reviews" method="get"
        className="min-w-0 space-y-3 border-b border-border pb-4">
        <div className="grid min-w-0 items-end gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search
            <Input type="search" name="search" maxLength={120} defaultValue={data.query.search}
              placeholder="Project title" className="min-h-11 md:min-h-9" />
          </label>
          <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Assigned project
            <Select name="projectId" defaultValue={data.query.projectId ?? ""} className="min-h-11 md:min-h-9 max-w-full">
              <option value="">All assigned projects</option>
              {data.projects.map(project=><option key={project.id} value={project.id}>{project.title}</option>)}
            </Select>
          </label>
          <Button type="submit" variant="primary" className="min-h-11 w-full md:min-h-9 md:w-auto">Filter</Button>
        </div>
        <Disclosure title="Filters" defaultOpen={data.query.assignment!=="ALL"||data.query.order!=="NEWEST"||data.query.age!=="ALL"||data.query.projectStatus!=="ALL"||data.pageSize!==20}
          className="min-w-0" contentClassName="min-w-0 pt-3 pb-2">
          <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">My Mentor assignment
            <Select name="assignment" defaultValue={data.query.assignment} className="min-h-11 md:min-h-9">
              <option value="ALL">All assigned projects</option><option value="PRIMARY">Primary Mentor</option>
              <option value="SUPPORTING">Supporting Mentor</option>
            </Select>
          </label>
          <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Review order
            <Select name="order" defaultValue={data.query.order}
              className="min-h-11 md:min-h-9">
              <option value="NEWEST">Newest submitted first</option>
              <option value="OLDEST">Oldest submitted first</option>
            </Select>
          </label>
          <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Submitted within
            <Select name="age" defaultValue={data.query.age} className="min-h-11 md:min-h-9">
              <option value="ALL">Any age</option><option value="LAST_7_DAYS">Last 7 days</option><option value="LAST_30_DAYS">Last 30 days</option><option value="OLDER_THAN_7_DAYS">Waiting over 7 days</option><option value="OLDER_THAN_30_DAYS">Waiting over 30 days</option>
            </Select>
          </label>
          <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Assigned Project lifecycle
            <Select name="projectStatus" defaultValue={data.query.projectStatus} className="min-h-11 md:min-h-9">
              <option value="ALL">All current assignments</option><option value="PLANNED">Planned</option>
              <option value="ACTIVE">Active</option><option value="COMPLETED">Completed</option>
            </Select>
          </label>
            <PageSizeSelect label="Page size" name="pageSize"
          defaultValue={String(data.pageSize)} options={[20,50]} />
          </div>
        </Disclosure>
        {(Boolean(data.query.search)||Boolean(data.query.projectId)||data.query.assignment!=="ALL"||data.query.projectStatus!=="ALL"||data.query.order!=="NEWEST"||data.query.age!=="ALL"||data.pageSize!==20)?<Link href="/mentor/reviews" className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear</Link>:null}
      </form>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link data-unskin="" href={mentorReviewExportHref(data.query)} download
          className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          Export filtered delivery review metadata CSV (max 200)
        </Link>
        {data.total>200?<span role="status">CSV omits {data.total-200} matching reviews.</span>:null}
      </div>
      <p className="text-sm text-body leading-[22px]">{data.total.toLocaleString("en-IN")} matching review item{data.total === 1 ? "" : "s"}</p>
      {data.items.length === 0 ? <EmptyState title="No deliveries awaiting review"
        description="No submitted delivery needs review in the matching projects. Reopened or already-reviewed work is not treated as a new submission." action={<Link href="/mentor/projects" className="inline-flex min-h-11 items-center text-link underline md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Projects</Link>} />
        : <div className="grid">{data.items.map(item =>
          <Link key={item.key} href={item.href} className="min-h-11 block border-b border-border py-4 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-[var(--lms-control-height)]">
            <p className="min-w-0 break-words font-semibold text-link">{item.description}</p>
            <p className="mt-2 text-xs text-muted-foreground leading-5">Submitted: {new Intl.DateTimeFormat("en-IN",{
              dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
            }).format(new Date(item.occurredAt))} IST</p>
            <p className="mt-1 text-xs font-semibold text-link leading-5">Open delivery review →</p>
          </Link>)}</div>}
      {data.totalPages>1?<Pagination label="Review queue pagination" page={data.page} pageCount={data.totalPages} hrefForPage={page=>{ const { projectId, ...query } = data.query; return mentorPortfolioHref("reviews", { ...query, ...(projectId === undefined ? {} : { projectId }), page }); }}/>:null}
    </>}
    <p className="text-xs text-muted-foreground leading-5">
      Review actions remain in each assigned project&apos;s existing authorized Delivery workspace.
    </p>
  </div>;
}
