import { MetricBar } from "@/components/ui/metric-bar";
import {getCurrentRequestContext} from "@/auth/request-context";
import {requireProjectManageAccess} from "@/modules/projects/access";
import {getProjectReadiness} from "@/modules/projects/readiness-service";
import {projectReadinessLegacyCopy as copy} from "@/modules/projects/readiness-override-copy";
import { effectiveProjectSubmissionReady } from "@/modules/projects/readiness-override-model";
import {ProjectReadinessOverrideForm} from "./project-readiness-override-form";
import {PageHeader} from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import {ErrorState} from "@/components/ui/error-state";
import {formatProjectAdminActivityDateIst} from "@/modules/projects/project-admin-date-model";
import {z} from "zod";
import {ProjectAdminNav} from "./project-admin-nav";
import { Tabs } from "@/components/ui/tabs";
import { Disclosure } from "@/components/ui/disclosure";
import { StatusBadge } from "@/components/ui/status-badge";
import Link from "next/link";
export async function ProjectWorkspaceReadiness({projectId,basePath}:{projectId:string;basePath:string}){
  // A forged project UUID, expired role or interrupted DB read must never
  // produce a raw server error or expose another college's readiness values.
  if(!z.string().uuid().safeParse(projectId).success)
    return <div className="min-w-0 space-y-4">
      <PageHeader title={copy.title} eyebrow="Projects"/>
      <ErrorState title="Workspace not found"
        description="Check the workspace link or return to your workspaces."
        action={<PageBackLink href={basePath} label="Back to workspaces" />}/>
    </div>;
  const context=await getCurrentRequestContext();
  const result=await (async()=>{
    await requireProjectManageAccess(context,projectId);
    return getProjectReadiness(context,projectId);
  })().then(value=>({ok:true as const,value})).catch(()=>({ok:false as const}));
  if(!result.ok)
    return <div className="min-w-0 space-y-4">
      <PageHeader title={copy.title} eyebrow="Projects"/>
      <ErrorState title="Workspace could not be loaded"
        description="The workspace may be unavailable or your access may have changed."
        action={<div className="flex flex-wrap gap-4">
          <Link href={basePath+"/"+encodeURIComponent(projectId)+"/readiness"}
            className="inline-flex min-h-11 items-center font-semibold text-link underline">Retry</Link>
          <PageBackLink href={basePath} label="Back to workspaces" />
        </div>}/>
    </div>;
  const readiness=result.value;
  const hasFinalSubmission=Boolean(readiness.finalSubmission.latest &&
    readiness.finalSubmission.latest.status!=="DRAFT");
  const isReady=readiness.projectStatus!=="ARCHIVED"&&
    effectiveProjectSubmissionReady(readiness.execution.complete,
      readiness.readinessOverride.state,hasFinalSubmission);
  const total=readiness.execution.tasks.total+readiness.execution.sprints.total;
  const complete=readiness.execution.tasks.done+readiness.execution.sprints.completed;
  const overall=total?Math.min(100,Math.max(0,Math.round(100*complete/total))):0;
  const taskPercent=readiness.execution.tasks.total?
    Math.round(100*readiness.execution.tasks.done/readiness.execution.tasks.total):0;
  const sprintPercent=readiness.execution.sprints.total?
    Math.round(100*readiness.execution.sprints.completed/readiness.execution.sprints.total):0;
  const override=readiness.readinessOverride;
  const overrideDate=override.occurredAt && Number.isFinite(new Date(override.occurredAt).getTime())
    ?formatProjectAdminActivityDateIst(override.occurredAt):"—";
  return <div className="min-w-0 space-y-4">
    <ProjectAdminNav basePath={basePath} active="readiness" />
    <div className="min-w-0">
      <PageBackLink href={basePath} label="Back to workspaces" />
      <PageHeader title={copy.title} eyebrow="Projects"
        description="Releases are informational. Task and sprint completion and the audited manual override determine submission readiness."
        actions={<div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={isReady?"success":"warning"}>{isReady?"Ready":"Not ready"}</StatusBadge>
          <Link href="#manage-readiness-override"
            className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-link hover:border-primary md:min-h-9">
            Manage override
          </Link>
        </div>} />
    </div>
    <Tabs ariaLabel="Workspace sections" renderPanel={false} value="readiness"
      items={([
        ["summary","Summary"], ["overview","Overview"], ["team","Team"], ["sprints","Sprints"],
        ["tasks","Tasks"], ["resources","Resources"], ["meetings","Meetings"],
        ["readiness","Readiness"], ["delivery","Delivery"], ["audit","Audit"],
      ] as const).map(([segment,label]) => ({
        value: segment, label, href: basePath+"/"+projectId+"/"+segment,
      }))} />
    <section className="space-y-4 rounded-[12px] border border-border bg-surface p-4 sm:p-6"
      aria-labelledby="workspace-readiness-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current readiness</p>
          <h2 id="workspace-readiness-title" className="mt-1 text-lg font-semibold text-[var(--lms-heading)]">
            {isReady?"This workspace is ready to submit":"This workspace still has readiness gaps"}
          </h2>
        </div>
        <StatusBadge tone={isReady?"success":"warning"}>{isReady?"Ready":"Not ready"}</StatusBadge>
      </div>
      {hasFinalSubmission?<p role="status" className="text-xs text-muted-foreground">
        An existing final submission takes precedence over manual readiness overrides.
      </p>:null}
      <div className="space-y-2 border-b border-border pb-4">
        <div className="flex items-center justify-between gap-2 text-sm font-semibold">
          <span>Overall project progress</span>
          <span className="tabular-nums">{overall}%</span>
        </div>
        <MetricBar label="Overall project progress" value={overall} maximum={100}
          role="progressbar" />
      </div>
      <div className="grid min-w-0 gap-4 border-b border-border pb-4 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="flex justify-between gap-3 text-sm font-semibold"><span>Task completion</span><span className="tabular-nums">{taskPercent}%</span></p>
          <MetricBar label="Task completion" value={taskPercent} maximum={100} role="progressbar"/>
        </div>
        <div className="space-y-2">
          <p className="flex justify-between gap-3 text-sm font-semibold"><span>Sprint completion</span><span className="tabular-nums">{sprintPercent}%</span></p>
          <MetricBar label="Sprint completion" value={sprintPercent} maximum={100} role="progressbar"/>
        </div>
      </div>
      <dl className="grid min-w-0 grid-cols-2 gap-3 text-sm lg:grid-cols-4">
        <div className="min-w-0 rounded-[8px] border border-border p-3">
          <dt className="text-xs text-muted-foreground">Tasks complete</dt>
          <dd className="mt-2 text-lg font-semibold tabular-nums">{readiness.execution.tasks.done} / {readiness.execution.tasks.total}</dd>
        </div>
        <div className="min-w-0 rounded-[8px] border border-border p-3">
          <dt className="text-xs text-muted-foreground">Sprints complete</dt>
          <dd className="mt-2 text-lg font-semibold tabular-nums">{readiness.execution.sprints.completed} / {readiness.execution.sprints.total}</dd>
        </div>
        <div className="min-w-0 rounded-[8px] border border-border p-3">
          <dt className="text-xs text-muted-foreground">Proof coverage</dt>
          <dd className="mt-2 text-sm font-semibold">
            {readiness.execution.tasks.done>0?
              `${readiness.execution.tasks.proofCovered} / ${readiness.execution.tasks.done} completed tasks`:
              "No completed tasks yet"}
          </dd>
        </div>
        <div className="min-w-0 rounded-[8px] border border-border p-3">
          <dt className="text-xs text-muted-foreground">Submission</dt>
          <dd className="mt-2 text-sm font-semibold">{readiness.finalSubmission.latest?
            readiness.finalSubmission.latest.status||"—":"Not submitted"}</dd>
        </div>
      </dl>
      <section className="overflow-x-auto" aria-label="Readiness detail">
        <table className="w-full min-w-[420px] border-collapse text-left text-sm">
          <caption className="pb-2 text-left font-semibold text-[var(--lms-heading)]">Readiness details</caption>
          <tbody className="divide-y divide-border">
            <tr><th scope="row" className="py-2 pr-4 font-medium">Tasks</th>
              <td className="py-2">{readiness.execution.tasks.done} / {readiness.execution.tasks.total} complete · {taskPercent}%</td></tr>
            <tr><th scope="row" className="py-2 pr-4 font-medium">Sprints</th>
              <td className="py-2">{readiness.execution.sprints.completed} / {readiness.execution.sprints.total} complete · {sprintPercent}%</td></tr>
            <tr><th scope="row" className="py-2 pr-4 font-medium">Releases</th>
              <td className="py-2">{readiness.execution.releases.shipped} / {readiness.execution.releases.total} shipped (informational)</td></tr>
            <tr><th scope="row" className="py-2 pr-4 font-medium">Final submission</th>
              <td className="py-2">{hasFinalSubmission?"Exists":"Not submitted"} · {readiness.finalSubmission.latest?.status??"—"}</td></tr>
            <tr><th scope="row" className="py-2 pr-4 font-medium">Workspace state</th>
              <td className="py-2">{readiness.projectStatus} · {readiness.execution.complete?"Complete":"Incomplete"}</td></tr>
            <tr><th scope="row" className="py-2 pr-4 font-medium">Override</th>
              <td className="py-2">{override.state??"None"} · {override.note??"No override reason"}</td></tr>
            <tr><th scope="row" className="py-2 pr-4 font-medium">Override set by / at</th>
              <td className="py-2">{override.overriddenBy??"—"} · {overrideDate}</td></tr>
            <tr><th scope="row" className="py-2 pr-4 font-medium">Effective readiness</th>
              <td className="py-2">{isReady?"Ready":"Not ready"} · {readiness.projectStatus==="ARCHIVED"?"Archived workspaces cannot submit":hasFinalSubmission?"Final submission takes precedence":"Tasks, sprints and override policy apply"}</td></tr>
          </tbody>
        </table>
      </section>
    </section>
    <section aria-label="Manual readiness override" className="rounded-[8px] border border-border bg-surface p-4">
      {override.state ? <>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <strong className="text-sm font-semibold">Manual readiness override</strong>
          <StatusBadge tone={override.state==="FORCE_UNLOCK"?"success":"error"}>
            {override.state==="FORCE_UNLOCK"?"↗ Force unlocked":"⊘ Force blocked"}
          </StatusBadge>
        </div>
        <dl className="grid min-w-0 gap-3 text-sm sm:grid-cols-3">
          <div><dt className="text-xs text-muted-foreground">Reason</dt>
            <dd className="mt-1 whitespace-pre-wrap break-words">{override.note||"—"}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Set by</dt>
            <dd className="mt-1 break-words">{override.overriddenBy||"—"}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Set at</dt>
            <dd className="mt-1">{overrideDate}</dd></div>
        </dl>
      </> : <p className="text-sm text-body">
        No manual readiness override is active. The status above is based on workspace progress and submission rules.
      </p>}
    </section>
    <div id="manage-readiness-override" className="scroll-mt-20">
    <Disclosure title={copy.overrideTitle} defaultOpen={Boolean(readiness.readinessOverride.state)}
      className="border-b border-[var(--lms-canvas-border)]"
      summaryClassName="min-h-11" contentClassName="pt-2">
      <ProjectReadinessOverrideForm projectId={projectId} initialState={readiness.readinessOverride.state} initialNote={readiness.readinessOverride.note}
        hasSubmission={readiness.finalSubmission.latest!==null} compactLayout />
    </Disclosure>
    </div>
  </div>;
}
