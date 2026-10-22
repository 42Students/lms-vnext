import { Pagination } from "@/components/ui/pagination";
import { PageSizeSelect } from "@/components/ui/page-size-select";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Disclosure } from "@/components/ui/disclosure";
import { hasMembershipRole } from "@/modules/identity/context";
import { getMentorPortfolioActivity } from "@/modules/projects/mentor-portfolio-service";
import {singleValueMentorFilters} from "@/modules/projects/mentor-filter-query";
import {mentorPortfolioActivityExportHref} from "@/modules/projects/mentor-portfolio-activity-export-model";
import { mentorActivityQuerySchema, mentorPortfolioHref, mentorActivityImportanceLabel } from "@/modules/projects/mentor-portfolio-model";

type Params = { search?:string|string[];assignment?:string|string[];projectId?:string|string[];projectStatus?: string | string[]; order?: string | string[]; window?: string | string[]; importance?: string | string[]; view?: string | string[]; page?: string | string[]; pageSize?: string | string[] };

export default async function MentorActivityPage({ searchParams }: { searchParams: Promise<Params> }) {
  const context = await getCurrentRequestContext();
  if (!hasMembershipRole(context,"MENTOR")) redirect("/dashboard");
  const raw = await searchParams;
  const parsed = mentorActivityQuerySchema.safeParse(singleValueMentorFilters({
    search:raw.search,importance:raw.importance,window:raw.window,
    order:raw.order,projectStatus:raw.projectStatus,projectId:raw.projectId,
    assignment:raw.assignment,view:raw.view,page:raw.page,pageSize:raw.pageSize,
  }));
  if (!parsed.success) return <section role="alert" className="min-w-0 max-w-full space-y-4">
    <PageHeader title={"Invalid activity filters"} />
    <Link href="/mentor/activity" className="inline-flex min-h-11 items-center text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] lms-inline-link hover:text-[var(--lms-primary-text)]">Clear filters</Link>
  </section>;
  const data = await getMentorPortfolioActivity(context, parsed.data);
  const hasAdvancedFilters =
    data.query.importance !== "ALL" ||
    Boolean(data.query.projectId) ||
    data.query.assignment !== "ALL" ||
    data.query.window !== "ALL" ||
    data.query.order !== "NEWEST" ||
    data.query.projectStatus !== "ALL" ||
    data.pageSize !== 20;
  const hasActiveFilters = hasAdvancedFilters ||
    Boolean(data.query.search) ||
    data.query.view !== "ALL";
  return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
    <PageHeader eyebrow="Mentor · Projects" title="Project activity"
      description="Recorded activity in your currently assigned projects. Raw summaries and metadata are omitted."
      actions={<Link data-unskin="" href="/mentor/projects" className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Projects</Link>} />
    {!data.enabled ? <div role="status" className="min-w-0 border-b border-border pb-4 text-sm text-body">
      Projects access is disabled. No activity was loaded.
    </div> : <>
      <form action="/mentor/activity" method="get" role="search" aria-label="Mentor project activity filters"
        className="min-w-0 space-y-3 border-b border-[var(--lms-canvas-border)] pb-4">
        <div className="grid min-w-0 items-end gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Assigned project title
            <Input type="search" name="search" maxLength={120} defaultValue={data.query.search}
              placeholder="Search your project names" className="min-h-11 md:min-h-9 w-full min-w-0" />
          </label>
          <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Recorded event group
            <Select name="view" defaultValue={data.query.view}
              className="min-h-11 md:min-h-9 max-w-full">
              <option value="ALL">All event groups</option>
              <option value="PROJECT">Project lifecycle</option><option value="REVIEWS">Review decisions</option><option value="DELIVERIES">Final delivery history</option>
              <option value="MEETINGS">Meeting decisions</option><option value="TASKS">Task events</option><option value="EVALUATIONS">Recorded evaluations</option><option value="SPRINTS">Sprint changes</option><option value="ASSIGNMENTS">Mentor assignments</option><option value="RESOURCES">Resources</option><option value="TEAM">Team membership</option>
            </Select>
          </label>
          <Button type="submit" variant="primary" className="min-h-11 w-full md:min-h-9 md:w-auto">Apply</Button>
        </div>
        <Disclosure title="More filters" defaultOpen={hasAdvancedFilters}
          className="min-w-0" contentClassName="min-w-0 pt-3 pb-2">
          <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Recorded importance
            <Select name="importance" defaultValue={data.query.importance}
              className="min-h-11 md:min-h-9 max-w-full">
              <option value="ALL">All importance</option><option value="LOW">Low</option>
              <option value="NORMAL">Normal</option><option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </Select>
          </label>
          <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Assigned project
            <Select name="projectId" defaultValue={data.query.projectId ?? ""} className="min-h-11 md:min-h-9 max-w-full">
              <option value="">All assigned projects</option>
              {data.projects.map(project=><option key={project.id} value={project.id}>{project.title}</option>)}
            </Select>
          </label>
          <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">My assignment
            <Select name="assignment" defaultValue={data.query.assignment} className="min-h-11 md:min-h-9 max-w-full">
              <option value="ALL">All assigned projects</option><option value="PRIMARY">Primary Mentor</option>
              <option value="SUPPORTING">Supporting Mentor</option>
            </Select>
          </label>
          <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Recorded within
            <Select name="window" defaultValue={data.query.window} className="min-h-11 md:min-h-9 max-w-full">
              <option value="ALL">All recorded dates</option><option value="PAST_7_DAYS">Past 7 days</option><option value="PAST_30_DAYS">Past 30 days</option><option value="PAST_90_DAYS">Past 90 days</option><option value="OLDER_THAN_30_DAYS">Older than 30 days</option>
            </Select>
          </label>
          <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Chronology
            <Select name="order" defaultValue={data.query.order} className="min-h-11 md:min-h-9 max-w-full">
              <option value="NEWEST">Newest recorded first</option><option value="OLDEST">Oldest recorded first</option>
            </Select>
          </label>
          <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Project lifecycle
            <Select name="projectStatus" defaultValue={data.query.projectStatus} className="min-h-11 md:min-h-9 max-w-full">
              <option value="ALL">All assigned projects</option><option value="PLANNED">Planned</option>
              <option value="ACTIVE">Active</option><option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </label>
            <PageSizeSelect label="Page size" name="pageSize" defaultValue={String(data.pageSize)} options={[20,50]} />
          </div>
        </Disclosure>
        {hasActiveFilters ? <div className="flex min-w-0 justify-start">
          <Link href="/mentor/activity" className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] lms-inline-link">Clear</Link>
        </div> : null}
      </form>
      <div className="flex min-w-0 flex-col gap-2 border-b border-[var(--lms-canvas-border)] pb-3 md:flex-row md:items-center md:justify-between">
        <p className="m-0 text-sm text-body">{data.total.toLocaleString("en-IN")} recorded project event{data.total === 1 ? "" : "s"}</p>
        <div className="flex min-w-0 flex-col items-start gap-1 md:items-end">
          <Link data-unskin="" href={mentorPortfolioActivityExportHref(data.query)} download
            className="inline-flex min-h-11 max-w-full items-center break-words text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            Export filtered activity CSV (max 200)
          </Link>
          {data.total>200?<span role="status" className="text-xs text-body">
            Export omits {data.total-200} matching records.
          </span>:null}
        </div>
      </div>
      {data.items.length === 0 ? <EmptyState title="No recorded activity"
        description="No persisted events match your assigned projects. Missing events do not imply no work occurred."
        action={<Link href={hasActiveFilters ? "/mentor/activity" : "/mentor/projects"}
          className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          {hasActiveFilters ? "Clear" : "Projects"}
        </Link>} />
        : <ol className="divide-y divide-[var(--lms-canvas-border)] border-b border-[var(--lms-canvas-border)]">{data.items.map(event =>
          <li key={event.id} className="py-[var(--lms-space-3)]">
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-4 gap-y-1">
              <p className="m-0 min-w-0 break-words text-sm font-semibold text-foreground">{event.label}</p>
              <span className="shrink-0 text-xs text-muted-foreground">{mentorActivityImportanceLabel(event.importance)}</span>
            </div>
            <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
              <Link href={`/mentor/projects/${encodeURIComponent(event.projectId)}?tab=activity`}
                className="inline-flex min-h-11 min-w-0 items-center break-words text-sm font-semibold text-link underline-offset-4 hover:underline md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
                {event.projectTitle} →
              </Link>
              <time dateTime={event.occurredAt.toISOString()} className="text-xs text-muted-foreground">
                {new Intl.DateTimeFormat("en-IN", {dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(event.occurredAt)} IST
              </time>
            </div>
          </li>)}</ol>}
      {data.totalPages > 1 ? <Pagination label="Project activity pagination" page={data.page}
        pageCount={data.totalPages} hrefForPage={page=>{ const { projectId, ...query } = data.query; return mentorPortfolioHref("activity", { ...query, ...(projectId === undefined ? {} : { projectId }), page }); }}/> : null}
    </>}
    <p className="text-xs text-muted-foreground">
      Only registered project activity events tied to active Mentor assignments are counted. Full legacy history is not yet certified.
    </p>
  </div>;
}
