import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { hasMembershipRole } from "@/modules/identity/context";
import { getMentorPortfolioActivity } from "@/modules/projects/mentor-portfolio-service";
import {singleValueMentorFilters} from "@/modules/projects/mentor-filter-query";
import {mentorPortfolioActivityExportHref} from "@/modules/projects/mentor-portfolio-activity-export-model";
import { mentorActivityQuerySchema, mentorPortfolioHref, mentorActivityFormLayout, mentorActivityImportanceLabel } from "@/modules/projects/mentor-portfolio-model";

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
  if (!parsed.success) return <section role="alert" className="space-y-3">
    <PageHeader title="Invalid activity filters" />
    <Link href="/mentor/activity" className="inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Clear filters</Link>
  </section>;
  const data = await getMentorPortfolioActivity(context, parsed.data);
  return <div className="min-w-0 max-w-full space-y-6 overflow-x-clip">
    <PageHeader eyebrow="Mentor · Projects" title="Project activity"
      description="Recorded activity in your currently assigned projects. Raw summaries and metadata are omitted."
      actions={<Link href="/mentor/projects" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 py-2 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Projects</Link>} />
    {!data.enabled ? <div role="status" className="border-b border-border pb-4 text-sm text-body">
      Projects access is disabled. No activity was loaded.
    </div> : <>
      <form action="/mentor/activity" method="get" className={mentorActivityFormLayout}>
        <label className="grid gap-1 text-sm font-semibold text-body">Assigned project title
          <Input type="search" name="search" maxLength={120} defaultValue={data.query.search}
            placeholder="Search your project names" className="min-h-11 sm:min-h-9 w-full min-w-0 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Recorded importance
          <Select name="importance" defaultValue={data.query.importance}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="ALL">All importance</option><option value="LOW">Low</option>
            <option value="NORMAL">Normal</option><option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Assigned project
          <Select name="projectId" defaultValue={data.query.projectId ?? ""} className="min-h-11 sm:min-h-9 max-w-full rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="">All assigned projects</option>
            {data.projects.map(project=><option key={project.id} value={project.id}>{project.title}</option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">My assignment
          <Select name="assignment" defaultValue={data.query.assignment} className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="ALL">All assigned projects</option><option value="PRIMARY">Primary Mentor</option>
            <option value="SUPPORTING">Supporting Mentor</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Recorded event group
          <Select name="view" defaultValue={data.query.view}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="ALL">All event groups</option>
            <option value="PROJECT">Project lifecycle</option><option value="REVIEWS">Review decisions</option><option value="DELIVERIES">Final delivery history</option>
            <option value="MEETINGS">Meeting decisions</option><option value="TASKS">Task events</option><option value="EVALUATIONS">Recorded evaluations</option><option value="SPRINTS">Sprint changes</option><option value="ASSIGNMENTS">Mentor assignments</option><option value="RESOURCES">Resources</option><option value="TEAM">Team membership</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Recorded within
          <Select name="window" defaultValue={data.query.window} className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="ALL">All recorded dates</option><option value="PAST_7_DAYS">Past 7 days</option><option value="PAST_30_DAYS">Past 30 days</option><option value="PAST_90_DAYS">Past 90 days</option><option value="OLDER_THAN_30_DAYS">Older than 30 days</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Chronology
          <Select name="order" defaultValue={data.query.order} className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="NEWEST">Newest recorded first</option><option value="OLDEST">Oldest recorded first</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Project lifecycle
          <Select name="projectStatus" defaultValue={data.query.projectStatus} className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="ALL">All assigned projects</option><option value="PLANNED">Planned</option>
            <option value="ACTIVE">Active</option><option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Page size
          <Select name="pageSize" defaultValue={String(data.pageSize)} className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="20">20</option><option value="50">50</option>
          </Select>
        </label>
        <Button type="submit" variant="primary">Apply</Button>
        <Link href="/mentor/activity" className="inline-flex min-h-11 items-center px-3 py-2 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Clear</Link>
      </form>
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-body">{data.total} recorded project event{data.total === 1 ? "" : "s"}</p>
        <Link href={mentorPortfolioActivityExportHref(data.query)} download
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Export filtered activity CSV (max 200)
        </Link>
        {data.total>200?<span role="status" className="text-xs text-body">
          Export omits {data.total-200} matching records.
        </span>:null}
      </div>
      {data.items.length === 0 ? <EmptyState title="No recorded activity"
        description="No persisted events match your assigned projects. Missing events do not imply no work occurred." />
        : <ol className="grid gap-3">{data.items.map(event =>
          <li key={event.id} className="py-4">
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
              <p className="min-w-0 break-words text-sm font-semibold text-foreground">{event.label}</p>
              <span className="text-xs text-muted-foreground">{mentorActivityImportanceLabel(event.importance)}</span>
            </div>
            <Link href={`/mentor/projects/${encodeURIComponent(event.projectId)}?tab=activity`}
              className="min-h-11 mt-1 block break-words text-sm font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              {event.projectTitle} →
            </Link>
            <time dateTime={event.occurredAt.toISOString()} className="mt-2 block text-xs text-muted-foreground">
              {new Intl.DateTimeFormat("en-IN", {dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(event.occurredAt)} IST
            </time>
          </li>)}</ol>}
      <nav aria-label="Project activity pagination" className="flex items-center justify-between gap-3">
        <span className="text-sm text-body">Page {data.page} of {data.totalPages}</span>
        <div className="flex gap-3">
          {data.page > 1 && <Link href={mentorPortfolioHref("activity",{...data.query,page:data.page-1})}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Previous</Link>}
          {data.page < data.totalPages && <Link href={mentorPortfolioHref("activity",{...data.query,page:data.page+1})}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Next</Link>}
        </div>
      </nav>
    </>}
    <p className="text-xs text-muted-foreground">
      Only registered project activity events tied to active Mentor assignments are counted. Full legacy history is not yet certified.
    </p>
  </div>;
}
