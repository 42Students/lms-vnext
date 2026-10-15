import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { hasMembershipRole } from "@/modules/identity/context";
import { getMentorPortfolioActivity } from "@/modules/projects/mentor-portfolio-service";
import { mentorActivityQuerySchema, mentorPortfolioHref, mentorActivityFormLayout } from "@/modules/projects/mentor-portfolio-model";

type Params = { search?:string|string[];assignment?:string|string[];projectId?:string|string[];projectStatus?: string | string[]; order?: string | string[]; window?: string | string[]; importance?: string | string[]; view?: string | string[]; page?: string | string[]; pageSize?: string | string[] };
function first(v: string | string[] | undefined) { return Array.isArray(v) ? v[0] : v; }

export default async function MentorActivityPage({ searchParams }: { searchParams: Promise<Params> }) {
  const context = await getCurrentRequestContext();
  if (!hasMembershipRole(context,"MENTOR")) redirect("/dashboard");
  const raw = await searchParams;
  const parsed = mentorActivityQuerySchema.safeParse({
    search:first(raw.search)??undefined,
    importance: first(raw.importance) ?? undefined,
    window: first(raw.window) ?? undefined,
    order:first(raw.order) ?? undefined,
    projectStatus:first(raw.projectStatus) ?? undefined,
    projectId:first(raw.projectId) ?? undefined,
    assignment:first(raw.assignment) ?? undefined,
    view: first(raw.view) ?? undefined,
    page: first(raw.page) ?? undefined, pageSize: first(raw.pageSize) ?? undefined,
  });
  if (!parsed.success) return <section role="alert" className="space-y-3">
    <h1 className="text-xl font-semibold">Invalid activity filters</h1>
    <Link href="/mentor/activity" className="text-primary-text underline">Clear filters</Link>
  </section>;
  const data = await getMentorPortfolioActivity(context, parsed.data);
  return <div className="space-y-6">
    <PageHeader eyebrow="Mentor · Projects" title="Project activity"
      description="Recorded activity in your currently assigned projects. Raw summaries and metadata are omitted."
      actions={<Link href="/mentor/projects" className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary-text">Projects</Link>} />
    {!data.enabled ? <div role="status" className="rounded-xl border border-border bg-surface p-5 text-sm text-body">
      Projects access is disabled. No activity was loaded.
    </div> : <>
      <form action="/mentor/activity" method="get" className={mentorActivityFormLayout}>
        <label className="grid gap-1 text-sm font-semibold text-body">Assigned project title
          <input type="search" name="search" maxLength={120} defaultValue={data.query.search}
            placeholder="Search your project names" className="min-h-10 w-full min-w-0 rounded-md border border-border bg-background px-3" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Recorded importance
          <select name="importance" defaultValue={data.query.importance}
            className="min-h-10 rounded-md border border-border bg-background px-3">
            <option value="ALL">All importance</option><option value="LOW">Low</option>
            <option value="NORMAL">Normal</option><option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Assigned project
          <select name="projectId" defaultValue={data.query.projectId ?? ""} className="min-h-10 max-w-full rounded-md border border-border bg-background px-3">
            <option value="">All assigned projects</option>
            {data.projects.map(project=><option key={project.id} value={project.id}>{project.title}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">My assignment
          <select name="assignment" defaultValue={data.query.assignment} className="min-h-10 rounded-md border border-border bg-background px-3">
            <option value="ALL">All assigned projects</option><option value="PRIMARY">Primary Mentor</option>
            <option value="SUPPORTING">Supporting Mentor</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Recorded event group
          <select name="view" defaultValue={data.query.view}
            className="min-h-10 rounded-md border border-border bg-background px-3">
            <option value="ALL">All event groups</option>
            <option value="PROJECT">Project lifecycle</option><option value="REVIEWS">Review decisions</option>
            <option value="MEETINGS">Meeting decisions</option><option value="TASKS">Task events</option><option value="EVALUATIONS">Recorded evaluations</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Recorded within
          <select name="window" defaultValue={data.query.window} className="min-h-10 rounded-md border border-border bg-background px-3">
            <option value="ALL">All recorded dates</option><option value="PAST_7_DAYS">Past 7 days</option><option value="PAST_30_DAYS">Past 30 days</option><option value="PAST_90_DAYS">Past 90 days</option><option value="OLDER_THAN_30_DAYS">Older than 30 days</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Chronology
          <select name="order" defaultValue={data.query.order} className="min-h-10 rounded-md border border-border bg-background px-3">
            <option value="NEWEST">Newest recorded first</option><option value="OLDEST">Oldest recorded first</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Project lifecycle
          <select name="projectStatus" defaultValue={data.query.projectStatus} className="min-h-10 rounded-md border border-border bg-background px-3">
            <option value="ALL">All assigned projects</option><option value="PLANNED">Planned</option>
            <option value="ACTIVE">Active</option><option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Page size
          <select name="pageSize" defaultValue={String(data.pageSize)} className="min-h-10 rounded-md border border-border bg-background px-3">
            <option value="20">20</option><option value="50">50</option>
          </select>
        </label>
        <button type="submit" className="min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Apply</button>
        <Link href="/mentor/activity" className="px-3 py-2 text-sm font-semibold text-primary-text">Clear</Link>
      </form>
      <p className="text-sm text-body">{data.total} recorded project event{data.total === 1 ? "" : "s"}</p>
      {data.items.length === 0 ? <EmptyState title="No recorded activity"
        description="No persisted events match your assigned projects. Missing events do not imply no work occurred." />
        : <ol className="grid gap-3">{data.items.map(event =>
          <li key={event.id} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-sm font-semibold text-foreground">{event.label}</p>
            <Link href={`/mentor/projects/${encodeURIComponent(event.projectId)}?tab=activity`}
              className="mt-1 block break-words text-sm font-semibold text-primary-text hover:underline">
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
            className="text-sm font-semibold text-primary-text">Previous</Link>}
          {data.page < data.totalPages && <Link href={mentorPortfolioHref("activity",{...data.query,page:data.page+1})}
            className="text-sm font-semibold text-primary-text">Next</Link>}
        </div>
      </nav>
    </>}
    <p className="text-xs text-muted-foreground">
      Only registered project activity events tied to active Mentor assignments are counted. Full legacy history is not yet certified.
    </p>
  </div>;
}
