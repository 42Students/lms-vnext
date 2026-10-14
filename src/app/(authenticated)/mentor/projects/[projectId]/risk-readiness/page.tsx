import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {EmptyState} from "@/components/ui/empty-state";
import {getMentorRiskReadiness} from "@/modules/projects/mentor-risk-readiness-service";
import {mentorRiskReadinessHref,mentorRiskReadinessQuerySchema}
  from "@/modules/projects/mentor-risk-readiness-model";

type Search={focus?:string|string[];page?:string|string[]};
const first=(v:string|string[]|undefined)=>Array.isArray(v)?v[0]:v;

export default async function MentorRiskReadinessPage({params,searchParams}:{
  params:Promise<{projectId:string}>;searchParams:Promise<Search>;
}){
  const [{projectId},raw]=await Promise.all([params,searchParams]);
  const parsed=mentorRiskReadinessQuerySchema.safeParse({
    projectId,focus:first(raw.focus)??undefined,page:first(raw.page)??undefined,
  });
  if(!parsed.success)return <section role="alert">
    <h1>Invalid risk/readiness filters</h1>
    <Link href="/mentor/projects" className="text-primary-text underline">Projects</Link>
  </section>;
  const data=await getMentorRiskReadiness(await getCurrentRequestContext(),parsed.data);
  const base="/mentor/projects/"+encodeURIComponent(projectId);
  return <div className="space-y-6">
    <PageHeader eyebrow="Mentor · Project" title="At-risk & readiness drill-in"
      description={data.projectTitle+" · "+data.projectStatus}
      actions={<Link href={base}
        className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
        Full project workspace
      </Link>}/>
    {!data.enabled?<section role="status" className="rounded-xl border border-border bg-surface p-5">
      Projects are disabled. No private task, meeting or delivery evidence was loaded.
    </section>:<>
      <section aria-label="Recorded workflow signals" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {([
          ["Blocked tasks",data.counts.blockedTasks],
          ["Awaiting task review",data.counts.reviewTasks],
          ["Requested meetings",data.counts.pendingMeetings],
          ["Tasks not Done",data.counts.incompleteTasks],
        ] as const).map(([label,value])=>
          <article key={label} className="rounded-xl border border-border bg-surface p-4">
            <h2 className="text-xs font-semibold text-muted-foreground">{label}</h2>
            <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
          </article>)}
      </section>
      <p className="text-sm text-body">{data.riskCount} recorded attention items ·
        {" "}{data.readinessGapCount} outstanding readiness checkpoints</p>
      <p className="text-xs text-muted-foreground">
        Signals are persisted workflow states, not a failure prediction or readiness score.
        A project without tasks is never assumed complete.
      </p>
      <form method="get" action={base+"/risk-readiness"}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
        <label className="grid gap-1 text-sm font-semibold text-body">Show
          <select name="focus" defaultValue={data.query.focus}
            className="min-h-10 rounded border border-border bg-background px-3">
            <option value="ALL">All evidence</option><option value="RISK">Attention only</option>
            <option value="READINESS">Readiness gaps only</option>
          </select>
        </label>
        <button type="submit" className="min-h-10 rounded bg-primary px-4 text-sm font-semibold text-on-primary">
          Filter
        </button>
        <Link href={base+"/risk-readiness"}
          className="inline-flex min-h-10 items-center text-sm text-primary-text underline">Clear</Link>
      </form>
      {data.items.length===0?<EmptyState title="No recorded items for this filter"
        description="No matching stored signals were found. This is not a certificate of project safety or completeness."/>:
      <ol className="grid gap-3">{data.items.map(row=>
        <li key={row.key} className="rounded-xl border border-border bg-surface p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="break-words font-semibold text-foreground">{row.title}</h2>
            <span className="text-xs font-semibold text-body">
              {row.category==="RISK"?"Attention":"Readiness"}
            </span>
          </div>
          <p className="mt-2 break-words text-sm text-body">{row.detail}</p>
          <Link href={row.href}
            className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">
            Open exact project workspace →
          </Link>
        </li>)}</ol>}
      <nav aria-label="Risk and readiness pages" className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">Page {data.page} of {data.totalPages}</span>
        <div className="flex gap-3">
          {data.page>1?<Link href={mentorRiskReadinessHref({...data.query,page:data.page-1})}
            className="text-sm text-primary-text underline">Previous</Link>:null}
          {data.page<data.totalPages?<Link href={mentorRiskReadinessHref({...data.query,page:data.page+1})}
            className="text-sm text-primary-text underline">Next</Link>:null}
        </div>
      </nav>
    </>}
    <p className="text-xs leading-5 text-muted-foreground">
      No speculative task assignments, effort, velocity, risk forecasts or pre-migration
      activity are counted. All mutations remain in the existing authorized workspace.
    </p>
  </div>;
}
