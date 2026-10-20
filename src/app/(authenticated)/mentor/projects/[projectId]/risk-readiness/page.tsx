import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {EmptyState} from "@/components/ui/empty-state";
import {getMentorRiskReadiness} from "@/modules/projects/mentor-risk-readiness-service";
import {mentorRiskReadinessHref,mentorRiskReadinessQuerySchema}
  from "@/modules/projects/mentor-risk-readiness-model";

type Search={focus?:string|string[];taskPriority?:string|string[];page?:string|string[]};
const first=(v:string|string[]|undefined)=>Array.isArray(v)?v[0]:v;

export default async function MentorRiskReadinessPage({params,searchParams}:{
  params:Promise<{projectId:string}>;searchParams:Promise<Search>;
}){
  const [{projectId},raw]=await Promise.all([params,searchParams]);
  // Repeated URL parameters are ambiguous and cannot be reduced to the first.
  const parsed=mentorRiskReadinessQuerySchema.safeParse(
    Object.values(raw).some(Array.isArray)?null:{
      projectId,focus:first(raw.focus)??undefined,
      taskPriority:first(raw.taskPriority)??undefined,page:first(raw.page)??undefined,
    },
  );
  if(!parsed.success)return <section role="alert">
    <PageHeader title={"Invalid risk/readiness filters"} />
    <Link href="/mentor/projects" className="inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lms-inline-link">Projects</Link>
  </section>;
  const data=await getMentorRiskReadiness(await getCurrentRequestContext(),parsed.data);
  const base="/mentor/projects/"+encodeURIComponent(projectId);
  const metrics=[
    ["Blocked tasks",data.counts.blockedTasks],
    ["Awaiting task review",data.counts.reviewTasks],
    ["Requested meetings",data.counts.pendingMeetings],
    ["Past scheduled / unclosed",data.counts.scheduledPastDay],
    ["Tasks not Done",data.counts.incompleteTasks],
  ] as const;
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader eyebrow="Mentor · Project" title="At-risk & readiness drill-in"
      description={data.enabled?data.projectTitle+" · "+data.projectStatus:"Projects are disabled. No private task, meeting or delivery evidence was loaded."}
      actions={<Link data-unskin="" href={base}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-[650] text-[var(--lms-body-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9 bg-white hover:bg-[rgba(38,186,199,0.05)] hover:border-[var(--lms-primary)] hover:text-[var(--lms-primary)] transition-colors duration-150 motion-reduce:transition-none">
        Full project workspace
      </Link>}/>
    {!data.enabled?<section role="status" className="border-b border-border pb-4">
      Projects are disabled. No private task, meeting or delivery evidence was loaded.
    </section>:<>
      <section aria-label="Recorded workflow signals" className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label,value])=>
          <article key={label} className="rounded-xl border border-border bg-surface p-4">
            <h2 className="text-xs font-semibold text-muted-foreground">{label}</h2>
            <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
          </article>)}
      </section>
      <p className="text-sm text-body">{data.riskCount} recorded attention items ·
        {" "}{data.readinessGapCount} outstanding readiness checkpoints</p>
      <p className="text-xs text-muted-foreground">
        Signals are persisted workflow states, not a failure prediction or readiness score.
        Priority filters affect task drill-ins only; project totals and non-task signals stay unchanged.
        A project without tasks is never assumed complete.
      </p>
      <form method="get" action={base+"/risk-readiness"}
        className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
        <label className="grid gap-1 text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">Show
          <Select name="focus" defaultValue={data.query.focus}
            className="min-h-11 md:min-h-9 border border-[var(--lms-canvas-border)] px-3">
            <option value="ALL">All evidence</option><option value="RISK">Attention only</option>
            <option value="READINESS">Readiness gaps only</option>
          </Select>
        </label>
        <label className="grid gap-1 text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">Task priority
          <Select name="taskPriority" defaultValue={data.query.taskPriority}
            className="min-h-11 md:min-h-9 border border-[var(--lms-canvas-border)] px-3">
            <option value="ALL">All task priorities</option>
            <option value="CRITICAL">Critical</option><option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option><option value="LOW">Low</option>
          </Select>
        </label>
        <Button type="submit" variant="primary" className="min-h-11 md:min-h-9">
          Filter
        </Button>
        <Link href={base+"/risk-readiness"}
          className="inline-flex min-h-11 items-center text-sm text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Clear</Link>
      </form>
      {data.items.length===0?<EmptyState title="No recorded items for this filter"
        description="No matching stored signals were found. This is not a certificate of project safety or completeness."/>:
      <ol className="divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">{data.items.map(row=>
        <li key={row.key} className="py-[var(--lms-space-3)]">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="break-words font-semibold text-foreground">{row.title}</h2>
            <span className="text-xs font-semibold text-body">
              {row.category==="RISK"?"Attention":"Readiness"}
            </span>
          </div>
          <p className="mt-2 break-words text-sm text-body">{row.detail}</p>
          <Link href={row.href}
            className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            Open exact project workspace →
          </Link>
        </li>)}</ol>}
      <Pagination label="Risk and readiness pages" page={data.page} pageCount={data.totalPages} hrefForPage={page=>mentorRiskReadinessHref({...data.query,page})}/>
    </>}
    <p className="text-xs leading-5 text-muted-foreground">
      No speculative task assignments, effort, velocity, risk forecasts or pre-migration
      activity are counted. All mutations remain in the existing authorized workspace.
    </p>
  </div>;
}
