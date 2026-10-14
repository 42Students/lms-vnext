import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {EmptyState} from "@/components/ui/empty-state";
import {getMentorReports} from "@/modules/projects/mentor-reports-service";
import {mentorReportsQuerySchema,mentorReportsHref}
  from "@/modules/projects/mentor-reports-model";
type Search={status?:string|string[];attention?:string|string[];
  search?:string|string[];page?:string|string[]};
const first=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;
export default async function MentorReportsPage({searchParams}:{
  searchParams:Promise<Search>;
}){
  const params=await searchParams;
  const parsed=mentorReportsQuerySchema.safeParse({
    status:first(params.status)??undefined,attention:first(params.attention)??undefined,
    search:first(params.search)??undefined,page:first(params.page)??undefined,
  });
  if(!parsed.success)return <section role="alert" className="space-y-3">
    <h1 className="text-xl font-semibold">Invalid Mentor report filters</h1>
    <Link href="/mentor/reports" className="text-primary-text underline">Clear filters</Link>
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
  return <div className="space-y-6">
    <PageHeader eyebrow="Mentor · Reports" title="Assigned Project reports"
      description="Persisted project states and actionable attention across your current assigned workspaces."
      actions={<Link href="/mentor/projects"
        className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
        Projects list
      </Link>}/>
    {!data.enabled?<section role="status" className="rounded-xl border border-border bg-surface p-5 text-sm text-body">
      Projects are disabled for this membership. Project report data was not loaded.
    </section>:<>
      <section aria-label="Project status totals" className="space-y-3">
        <h2 className="font-semibold">Registered project status</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {statusMetrics.map(([label,count])=>
            <article key={label} className="rounded-xl border border-border bg-surface p-4">
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {attentionMetrics.map(([label,count])=>
            <article key={label} className="rounded-xl border border-border bg-surface p-4">
              <h3 className="text-xs font-semibold text-muted-foreground">{label}</h3>
              <p className="mt-2 text-xl font-bold tabular-nums">{count}</p>
            </article>)}
        </div>
        <p className="text-xs text-muted-foreground">
          Each category counts projects with a registered signal, not event volume.
          Stalled means no recently recorded qualifying activity, not a prediction.
        </p>
      </section>
      <form method="get" action="/mentor/reports"
        className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
        <label className="grid gap-1 text-sm font-semibold text-body">Project title
          <input name="search" type="search" maxLength={120} defaultValue={data.query.search}
            className="min-h-10 rounded-md border border-border bg-background px-3"/>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Status
          <select name="status" defaultValue={data.query.status}
            className="min-h-10 rounded-md border border-border bg-background px-3">
            {(["ALL","PLANNED","ACTIVE","COMPLETED","ARCHIVED"] as const).map(value=>
              <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Attention
          <select name="attention" defaultValue={data.query.attention}
            className="min-h-10 rounded-md border border-border bg-background px-3">
            <option value="ALL">All</option>
            <option value="REVIEW">Review</option>
            <option value="STALLED">Stalled</option>
            <option value="REQUESTED">Requested meeting</option>
            <option value="MEETING_SOON">Meeting soon</option>
          </select>
        </label>
        <button type="submit" className="min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">
          Filter
        </button>
        <Link href="/mentor/reports" className="text-sm font-semibold text-primary-text underline">Clear</Link>
      </form>
      <p className="text-sm text-body">{data.total} projects match these filters.</p>
      {data.items.length===0?<EmptyState title="No assigned projects match"
        description={data.projectCount===0?
          "No current Mentor assignments are registered for this membership.":
          "Clear filters to see the other currently assigned project records."}/>:
        <ol className="grid gap-3 sm:grid-cols-2">{data.items.map(project=>
          <li key={project.id} className="min-w-0 rounded-xl border border-border bg-surface p-4">
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
                className="min-h-10 font-semibold text-primary-text underline">Open project</Link>
              <Link href={"/mentor/projects/"+encodeURIComponent(project.id)+"/risk-readiness"}
                className="min-h-10 font-semibold text-primary-text underline">Risk / readiness</Link>
            </div>
          </li>)}</ol>}
      <nav aria-label="Mentor report pages" className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">Page {data.page} of {data.totalPages}</span>
        <div className="flex gap-3">
          {data.page>1?<Link href={mentorReportsHref({...data.query,page:data.page-1})}
            className="text-sm font-semibold text-primary-text underline">Previous</Link>:null}
          {data.page<data.totalPages?<Link href={mentorReportsHref({...data.query,page:data.page+1})}
            className="text-sm font-semibold text-primary-text underline">Next</Link>:null}
        </div>
      </nav>
    </>}
    <p className="text-xs text-muted-foreground">
      Report counts use registered current assignments and project-attention producers only.
      No learner contact, inferred risk score, velocity or missing historical activity is disclosed.
    </p>
  </div>;
}
