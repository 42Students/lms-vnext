import { FilterBar } from "@/components/ui/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {getCurrentRequestContext} from "@/auth/request-context";
import {EmptyState} from "@/components/ui/empty-state";
import {getMentorRiskReadiness} from "@/modules/projects/mentor-risk-readiness-service";
import {mentorRiskReadinessHref,mentorRiskReadinessQuerySchema}
  from "@/modules/projects/mentor-risk-readiness-model";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";

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
    <TextLink href="/mentor/projects" className="inline-flex min-h-11 items-center">Projects</TextLink>
  </section>;
  const data=await getMentorRiskReadiness(await getCurrentRequestContext(),parsed.data);
  const base="/mentor/projects/"+encodeURIComponent(projectId);
  const filtered=data.query.focus!=="ALL"||data.query.taskPriority!=="ALL";
  const metrics=[
    ["Blocked tasks",data.counts.blockedTasks],
    ["Awaiting task review",data.counts.reviewTasks],
    ["Requested meetings",data.counts.pendingMeetings],
    ["Past scheduled / unclosed",data.counts.scheduledPastDay],
    ["Tasks not Done",data.counts.incompleteTasks],
  ] as const;
  return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
    <PageHeader eyebrow="Mentor · Project" title="At-risk & readiness drill-in"
      description={data.enabled?data.projectTitle+" · "+data.projectStatus:"Projects are disabled. No private task, meeting or delivery evidence was loaded."}
      actions={<TextLink data-unskin="" href={base}
        className="inline-flex min-h-11 items-center text-sm md:min-h-9">
        Full project workspace
      </TextLink>}/>
    {!data.enabled?<section role="status" className="border-b border-border pb-4">
      Projects are disabled. No private task, meeting or delivery evidence was loaded.
    </section>:<>
      <section aria-label="Recorded workflow signals" className="grid min-w-0 gap-x-4 gap-y-1 border-y border-[var(--lms-canvas-border)] md:grid-cols-2 lg:grid-cols-5">
        {metrics.map(([label,value])=>
          <article key={label} className="min-w-0 border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-3)] md:border-b-0">
            <p className="m-0 text-xs font-semibold text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
          </article>)}
      </section>
      <p className="text-sm text-body leading-[22px]">{data.riskCount} recorded attention items ·
        {" "}{data.readinessGapCount} outstanding readiness checkpoints</p>
      <p className="text-xs text-muted-foreground leading-5">
        Signals are persisted workflow states, not a failure prediction or readiness score.
        Priority filters affect task drill-ins only; project totals and non-task signals stay unchanged.
        A project without tasks is never assumed complete.
      </p>
      <FilterBar title="Filters"><form method="get" action={base+"/risk-readiness"} role="search" aria-label="Risk readiness filters"
        className="grid min-w-0 items-end gap-[8px] border-b border-border pb-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
        <Label stack>Show
          <Select name="focus" defaultValue={data.query.focus}
            className="min-h-11 md:min-h-9 border border-[var(--lms-canvas-border)] px-3">
            <option value="ALL">All evidence</option><option value="RISK">Attention only</option>
            <option value="READINESS">Readiness gaps only</option>
          </Select>
        </Label>
        <Label stack>Task priority
          <Select name="taskPriority" defaultValue={data.query.taskPriority}
            className="min-h-11 md:min-h-9 border border-[var(--lms-canvas-border)] px-3">
            <option value="ALL">All task priorities</option>
            <option value="CRITICAL">Critical</option><option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option><option value="LOW">Low</option>
          </Select>
        </Label>
        <Button type="submit" variant="primary" className="min-h-11 w-full md:min-h-9 md:w-auto">
          Filter
        </Button>
        {filtered?<TextLink href={base+"/risk-readiness"}
          className="inline-flex min-h-11 items-center text-sm">Clear</TextLink>:null}
      </form></FilterBar>
      {data.items.length===0?<EmptyState title="No recorded items for this filter"
        description="No matching stored signals were found. This is not a certificate of project safety or completeness." action={filtered?<TextLink href={base+"/risk-readiness"} className="inline-flex min-h-11 items-center md:min-h-9">Clear</TextLink>:<TextLink href={base} className="inline-flex min-h-11 items-center md:min-h-9">Full project workspace</TextLink>}/>:
      <ol className="divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">{data.items.map(row=>
        <li key={row.key} className="py-[var(--lms-space-3)]">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <Heading level={2} size="base" className="m-0 break-words leading-6 text-[var(--lms-heading)]">{row.title}</Heading>
            <span className="text-xs font-semibold text-body">
              {row.category==="RISK"?"Attention":"Readiness"}
            </span>
          </div>
          <p className="mt-2 break-words text-sm text-body leading-[22px]">{row.detail}</p>
          <TextLink href={row.href}
            className="mt-3 inline-flex min-h-11 items-center text-sm">
            Open exact project workspace →
          </TextLink>
        </li>)}</ol>}
      {data.totalPages>1?<Pagination label="Risk and readiness pages" page={data.page} pageCount={data.totalPages} hrefForPage={page=>mentorRiskReadinessHref({...data.query,page})}/>:null}
    </>}
    <p className="text-xs leading-5 text-muted-foreground">
      No speculative task assignments, effort, velocity, risk forecasts or pre-migration
      activity are counted. All mutations remain in the existing authorized workspace.
    </p>
  </div>;
}
