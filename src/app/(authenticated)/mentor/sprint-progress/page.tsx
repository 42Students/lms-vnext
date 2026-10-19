import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import {
  mentorSprintProgressHref, mentorSprintProgressQuerySchema,
} from "@/modules/projects/mentor-sprint-progress-model";
import { getMentorSprintProgress } from "@/modules/projects/mentor-sprint-progress-service";

type Params = { order?:string|string[];taskAttention?:string|string[];projectId?:string|string[];state?: string | string[]; release?: string | string[]; search?: string | string[]; page?: string | string[] };
function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MentorSprintProgressPage({
  searchParams,
}: { searchParams: Promise<Params> }) {
  const raw = await searchParams;
  const parsed = mentorSprintProgressQuerySchema.safeParse(Object.values(raw).some(Array.isArray)?null:{
    state: first(raw.state) ?? undefined,
    projectId:first(raw.projectId) ?? undefined,
    taskAttention:first(raw.taskAttention) ?? undefined,
    order:first(raw.order) ?? undefined,
    release: first(raw.release) ?? undefined,
    search: first(raw.search) ?? undefined,
    page: first(raw.page) ?? undefined,
  });
  if (!parsed.success) return <section role="alert" className="space-y-3">
    <h1 className="font-semibold text-[30px] font-semibold leading-[1.35] tracking-[-0.02em] text-[var(--lms-heading)]">Invalid sprint progress filters</h1>
    <Link href="/mentor/sprint-progress" className="inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Clear filters</Link>
  </section>;
  const context = await getCurrentRequestContext();
  if (!hasMembershipRole(context, "MENTOR")) redirect("/dashboard");
  const data = await getMentorSprintProgress(context, parsed.data);
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader eyebrow="Mentor · Projects" title="Sprint progress"
      description="Registered sprint, release and task status across your current project assignments."
      actions={<Link href="/mentor/projects" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 py-2 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        Mentoring projects
      </Link>} />
    {!data.enabled ? <section role="status" className="border-b border-border pb-4 text-sm text-body">
      Projects access is disabled. Sprint progress was not loaded.
    </section> : <>
      <form action="/mentor/sprint-progress" method="get"
        className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
        <label className="grid gap-1 text-sm font-semibold text-body">Search
          <Input type="search" name="search" defaultValue={data.query.search} maxLength={120}
            placeholder="Sprint, release or project" className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3 text-foreground" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Assigned project
          <Select name="projectId" defaultValue={data.query.projectId??""} className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="">All assigned projects</option>
            {data.projects.map(project=><option key={project.id} value={project.id}>{project.title}</option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Sprint status
          <Select name="state" defaultValue={data.query.state}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3 text-foreground">
            <option value="ALL">All</option><option value="ACTIVE">Active</option>
            <option value="PLANNED">Planned</option><option value="COMPLETED">Completed</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Registered task attention
          <Select name="taskAttention" defaultValue={data.query.taskAttention} className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="ALL">All sprints</option><option value="BLOCKED">Has blocked tasks</option><option value="IN_REVIEW">Has submitted tasks in review</option><option value="DONE">Sprints with recorded Done tasks</option><option value="TODO">Sprints with recorded To Do tasks</option><option value="NO_TASKS">Sprints without recorded tasks</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Release status
          <Select name="release" defaultValue={data.query.release}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="ALL">All releases</option><option value="PLANNED">Planned</option>
            <option value="IN_PROGRESS">In progress</option><option value="SHIPPED">Shipped</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Sprint order
          <Select name="order" defaultValue={data.query.order} className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="PROJECT">Project and Sprint order</option><option value="ACTIVE_FIRST">Active Sprints first</option>
          </Select>
        </label>
        <Button type="submit" variant="primary">
          Filter
        </Button>
        <Link href="/mentor/sprint-progress" className="inline-flex min-h-11 items-center px-3 py-2 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Clear</Link>
      </form>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link href={"/api/mentor/sprint-progress/export?"+
          new URLSearchParams({
            state:data.query.state,release:data.query.release,search:data.query.search,
            projectId:data.query.projectId??"",taskAttention:data.query.taskAttention,
            order:data.query.order,
          }).toString()}
          download className="min-h-11 rounded-[var(--lms-control-radius)] border border-border px-4 py-2 font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Export filtered sprint CSV (max 100)
        </Link>
        {data.total>100?<span role="status">
          Export omits {data.total-100} sprints beyond the 100-row cap.
        </span>:null}
      </div>
      <p className="text-sm text-body">{data.total} matching sprint{data.total === 1 ? "" : "s"}</p>
      {data.items.length === 0 ? <EmptyState title="No persisted sprint progress"
        description="No sprints matched the selected state and current Mentor assignments. Unmaterialized or missing pre-migration work is not counted." />
      : <div className="divide-y divide-border">{data.items.map(item =>
        <article key={item.id} className="py-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div><h2 className="font-semibold text-foreground">{item.title}</h2>
              <p className="mt-1 text-sm text-body">{item.projectTitle} · {item.releaseTitle}</p>
            </div>
            <span className="text-xs font-semibold text-body">{item.status}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Release: {item.releaseStatus}</p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-4">
            {([
              ["Tasks", item.tasks.total],
              ["Done", item.tasks.completed],
              ["In review", item.tasks.inReview],
              ["Blocked", item.tasks.blocked],
            ] as const).map(([label, value]) =>
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums">{value}</dd>
              </div>)}
          </dl>
          <p className="mt-3 text-sm text-body">
            Completion: {item.tasks.completionPercent === null
              ? "Unknown (no tasks)" : item.tasks.completionPercent + "%"} of persisted tasks marked Done
          </p>
          <Link href={"/mentor/projects/" + encodeURIComponent(item.projectId) + "?tab=sprints"}
            className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            Open authorized sprint workspace →
          </Link>
        </article>)}</div>}
      <Pagination label="Sprint progress pages" page={data.page} pageCount={data.totalPages} hrefForPage={page=>mentorSprintProgressHref({...data.query,page})}/>
    </>}
    <p className="text-xs leading-5 text-muted-foreground">
      Counts reflect registered tasks and workflow statuses, not hours, sprint velocity or
      release readiness. Archived projects and projects without a current Mentor assignment
      are not included. Lifecycle changes remain in the authorized project workspace.
    </p>
  </div>;
}
