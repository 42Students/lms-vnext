import { FilterBar } from "@/components/ui/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {EmptyState} from "@/components/ui/empty-state";
import {getMentorReports} from "@/modules/projects/mentor-reports-service";
import {mentorReportsQuerySchema,mentorReportsHref}
  from "@/modules/projects/mentor-reports-model";
type Search={taskCoverage?:string|string[];status?:string|string[];attention?:string|string[];assignment?:string|string[];order?:string|string[];
  search?:string|string[];page?:string|string[]};
const first=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;
export default async function MentorReportsPage({searchParams}:{
  searchParams:Promise<Search>;
}){
  const params=await searchParams;
  const duplicated=Object.values(params).some(value=>Array.isArray(value)&&value.length!==1);
  const parsed=mentorReportsQuerySchema.safeParse({
    taskCoverage:first(params.taskCoverage)??undefined,
    status:first(params.status)??undefined,attention:first(params.attention)??undefined,
    assignment:first(params.assignment)??undefined,
    order:first(params.order)??undefined,
    search:first(params.search)??undefined,page:first(params.page)??undefined,
  });
  if(duplicated||!parsed.success)return <section role="alert" className="space-y-3">
    <PageHeader title={"Invalid Mentor report filters"} />
    <Link href="/mentor/reports" className="inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lms-inline-link">Clear filters</Link>
  </section>;
  const data=await getMentorReports(await getCurrentRequestContext(),parsed.data);
  const statusMetrics=[
    ["Planned",data.statusCounts.PLANNED],["Active",data.statusCounts.ACTIVE],
    ["Completed",data.statusCounts.COMPLETED],["Archived",data.statusCounts.ARCHIVED],
  ] as const;
  const attentionMetrics=[
    ["Reviews",data.attentionCounts.REVIEW],["Stalled",data.attentionCounts.STALLED],
    ["Meeting requests",data.attentionCounts.REQUESTED],
    ["Meetings soon",data.attentionCounts.MEETING_SOON],
  ] as const;
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader eyebrow="Mentor · Reports" title="Assigned Project reports"
      description="Persisted project states and actionable attention across your current assigned workspaces."
      actions={<Link data-unskin="" href="/mentor/projects"
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-white px-4 text-sm font-[650] text-[var(--lms-body-text)] md:min-h-9 hover:bg-[var(--lms-primary-subtle)] hover:border-[var(--lms-primary)] hover:text-[var(--lms-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors duration-150 motion-reduce:transition-none">
        Projects list
      </Link>}/>
    {!data.enabled?<section role="status" className="border-b border-border pb-4 text-sm text-body">
      Projects are disabled for this membership. Project report data was not loaded.
    </section>:<>
      <section aria-label="Project status totals" className="space-y-3">
        <h2 className="font-semibold">Registered project status</h2>
        <div className="grid gap-x-4 gap-y-2 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-[var(--lms-space-4)] md:grid-cols-2 min-[992px]:grid-cols-4">
          {statusMetrics.map(([label,count])=>
            <article key={label} className="border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-4)]">
              <h3 className="text-xs font-semibold text-muted-foreground">{label}</h3>
              <p className="mt-2 text-2xl font-bold tabular-nums">{count}</p>
            </article>)}
        </div>
        <p className="text-xs text-muted-foreground">
          {data.projectCount} currently assigned projects; primary Mentor recorded on
          {" "}{data.primaryMentorCount}. These are not learner placement or success rates.
        </p>
      </section>
      <section aria-label="Recorded attention totals" className="space-y-3">
        <h2 className="font-semibold">Recorded project attention</h2>
        <div className="grid gap-x-4 gap-y-2 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-[var(--lms-space-4)] md:grid-cols-2 min-[992px]:grid-cols-4">
          {attentionMetrics.map(([label,count])=>
            <article key={label} className="border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-4)]">
              <h3 className="text-xs font-semibold text-muted-foreground">{label}</h3>
              <p className="mt-2 text-xl font-bold tabular-nums">{count}</p>
            </article>)}
        </div>
        <p className="text-xs text-muted-foreground">
          Each category counts projects with a registered signal, not event volume.
          Stalled means no recently recorded qualifying activity, not a prediction.
        </p>
      </section>
      <FilterBar title="Filters"><form method="get" action="/mentor/reports"
        className="flex flex-wrap items-end gap-3 max-[767px]:flex-col max-[767px]:items-stretch border-b border-border pb-4 max-[767px]:[&_label]:w-full">
        <label className="grid gap-1 text-[var(--lms-font-sm)] font-semibold text-[var(--lms-neutral-400)] leading-4">Project title
          <Input name="search" type="search" maxLength={120} defaultValue={data.query.search}
            className="min-h-11 md:min-h-9 border border-[var(--lms-canvas-border)] px-3"/>
        </label>
        <label className="grid gap-1 text-[var(--lms-font-sm)] font-semibold text-[var(--lms-neutral-400)] leading-4">Status
          <Select name="status" defaultValue={data.query.status}
            className="min-h-11 md:min-h-9 border border-[var(--lms-canvas-border)] px-3">
            {(["ALL","PLANNED","ACTIVE","COMPLETED","ARCHIVED"] as const).map(value=>
              <option key={value} value={value}>{value}</option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-[var(--lms-font-sm)] font-semibold text-[var(--lms-neutral-400)] leading-4">Attention
          <Select name="attention" defaultValue={data.query.attention}
            className="min-h-11 md:min-h-9 border border-[var(--lms-canvas-border)] px-3">
            <option value="ALL">All</option>
            <option value="REVIEW">Review</option>
            <option value="STALLED">Stalled</option>
            <option value="REQUESTED">Requested meeting</option>
            <option value="MEETING_SOON">Meeting soon</option>
            <option value="NONE">No currently recorded attention</option>
          </Select>
        </label>
        <label className="grid gap-1 text-[var(--lms-font-sm)] font-semibold text-[var(--lms-neutral-400)] leading-4">Recorded tasks
          <Select name="taskCoverage" defaultValue={data.query.taskCoverage} className="min-h-11 md:min-h-9 border border-[var(--lms-canvas-border)] px-3">
            <option value="ALL">All tasks</option><option value="NO_TASKS">No tracked tasks</option>
            <option value="OPEN_TASKS">Unfinished tasks</option><option value="ALL_DONE">All registered tasks done</option>
          </Select>
        </label>
        <label className="grid gap-1 text-[var(--lms-font-sm)] font-semibold text-[var(--lms-neutral-400)] leading-4">Mentor assignment
          <Select name="assignment" defaultValue={data.query.assignment}
            className="min-h-11 md:min-h-9 border border-[var(--lms-canvas-border)] px-3">
            <option value="ALL">All assigned projects</option>
            <option value="PRIMARY">Primary Mentor</option>
            <option value="SUPPORTING">Supporting Mentor</option>
          </Select>
        </label>
        <label className="grid gap-1 text-[var(--lms-font-sm)] font-semibold text-[var(--lms-neutral-400)] leading-4">Report order
          <Select name="order" defaultValue={data.query.order}
            className="min-h-11 md:min-h-9 border border-[var(--lms-canvas-border)] px-3">
            <option value="UPDATED">Recently updated</option>
            <option value="TITLE_AZ">Project title A–Z</option>
            <option value="TITLE_ZA">Project title Z–A</option>
            <option value="TASK_PROGRESS">Least registered task progress first</option>
          </Select>
        </label>
        <Button type="submit" variant="primary" className="min-h-11 md:min-h-9">
          Filter
        </Button>
        <Link href="/mentor/reports" className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lms-inline-link">Clear</Link>
      </form></FilterBar>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link data-unskin="" href={"/api/mentor/reports/export?"+
          new URLSearchParams({
            taskCoverage:data.query.taskCoverage,
            status:data.query.status,attention:data.query.attention,
            assignment:data.query.assignment,order:data.query.order,
            search:data.query.search,
          }).toString()} download
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary text-sm font-[650] text-[var(--lms-body-text)] bg-white md:min-h-9 hover:bg-[var(--lms-primary-subtle)] hover:border-[var(--lms-primary)] hover:text-[var(--lms-primary)] transition-colors duration-150 motion-reduce:transition-none">
          Export filtered project report CSV (max 100)
        </Link>
        {data.exportOmitted>0?<span role="status">
          CSV omits {data.exportOmitted} matching assigned projects.
        </span>:null}
      </div>
      <p className="text-sm text-body">{data.total} projects match these filters.</p>
      {data.items.length===0?<EmptyState title="No assigned projects match"
        description={data.projectCount===0?
          "No current Mentor assignments are registered for this membership.":
          "Clear filters to see the other currently assigned project records."}/>:
        <ol className="grid gap-3 md:grid-cols-2">{data.items.map(project=>
          <li key={project.id} className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="break-words font-semibold text-foreground">{project.title}</h3>
              <span className="text-xs font-semibold text-muted-foreground">{project.status}</span>
            </div>
            <p className="mt-2 text-sm text-body">
              {project.isPrimaryMentor?"Primary Mentor":"Assigned Mentor"}
              {project.attention.length?" · "+project.attention.join(", "):" · No currently recorded attention"}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Project record updated {new Intl.DateTimeFormat("en-IN",{
                dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
              }).format(project.updatedAt)} IST
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <Link href={"/mentor/projects/"+encodeURIComponent(project.id)}
                className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Open project</Link>
              <Link href={"/mentor/projects/"+encodeURIComponent(project.id)+"/risk-readiness"}
                className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Risk / readiness</Link>
            </div>
          </li>)}</ol>}
      <Pagination label="Mentor report pages" page={data.page} pageCount={data.totalPages} hrefForPage={page=>mentorReportsHref({...data.query,page})}/>
    </>}
    <p className="text-xs text-muted-foreground">
      Report counts use registered current assignments and project-attention producers only.
      No learner contact, inferred risk score, velocity or missing historical activity is disclosed.
    </p>
  </div>;
}
