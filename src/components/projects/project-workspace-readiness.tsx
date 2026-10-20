import { MetricBar } from "@/components/ui/metric-bar";
import styles from "./project-workspace-readiness.module.css";
import {getCurrentRequestContext} from "@/auth/request-context";
import {requireProjectManageAccess} from "@/modules/projects/access";
import {getProjectReadiness} from "@/modules/projects/readiness-service";
import {projectReadinessLegacyCopy as copy} from "@/modules/projects/readiness-override-copy";
import {ProjectReadinessOverrideForm} from "./project-readiness-override-form";
import {PageHeader} from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import {ErrorState} from "@/components/ui/error-state";
import {formatProjectAdminActivityDateIst} from "@/modules/projects/project-admin-date-model";
import {z} from "zod";
import {ProjectAdminNav} from "./project-admin-nav";
import { Tabs } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
export async function ProjectWorkspaceReadiness({projectId,basePath}:{projectId:string;basePath:string}){
  // A forged project UUID, expired role or interrupted DB read must never
  // produce a raw server error or expose another college's readiness values.
  if(!z.string().uuid().safeParse(projectId).success)
    return <div className="space-y-6">
      <PageHeader title={copy.title} eyebrow="Projects"/>
      <ErrorState title="Workspace readiness unavailable"
        description="Return to workspaces and open an authorized workspace to try again."
        action={<PageBackLink href={basePath} label="Back to workspaces" />}/>
    </div>;
  const context=await getCurrentRequestContext();
  const result=await (async()=>{
    await requireProjectManageAccess(context,projectId);
    return getProjectReadiness(context,projectId);
  })().then(value=>({ok:true as const,value})).catch(()=>({ok:false as const}));
  if(!result.ok)
    return <div className="space-y-6">
      <PageHeader title={copy.title} eyebrow="Projects"/>
      <ErrorState title="Workspace readiness unavailable"
        description="Return to workspaces and open an authorized workspace to try again."
        action={<PageBackLink href={basePath} label="Back to workspaces" />}/>
    </div>;
  const readiness=result.value;
  return <div className="space-y-6">
    <ProjectAdminNav basePath={basePath} active="readiness" />
    <PageHeader title={copy.title} eyebrow="Projects"
      description="Task and sprint completion are separate measures; the readiness verdict above is decided server-side."
      actions={<PageBackLink href={basePath} label="Back to workspaces" />} />
    <Tabs ariaLabel="Workspace sections" renderPanel={false} value="readiness"
      items={([
        ["summary","Summary"], ["overview","Overview"], ["team","Team"], ["sprints","Sprints"],
        ["tasks","Tasks"], ["resources","Resources"], ["meetings","Meetings"],
        ["readiness","Readiness"], ["delivery","Delivery"], ["audit","Audit"],
      ] as const).map(([segment,label]) => ({
        value: segment, label, href: basePath+"/"+projectId+"/"+segment,
      }))} />
    <section className="border-b border-border py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-base font-semibold leading-6 text-[var(--lms-heading)]">Current readiness</h2>
        <StatusBadge tone={readiness.finalSubmission.canSubmitDraft?"success":"warning"}>
          {readiness.finalSubmission.canSubmitDraft?"Ready":"Not ready"}
        </StatusBadge>
      </div>
      <dl className="mt-4 grid min-w-0 divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)] text-[14px] leading-5 min-[768px]:grid-cols-3 min-[768px]:divide-x min-[768px]:divide-y-0">
        <div className="min-w-0 px-4 py-3"><dt className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">State</dt><dd className="mt-2 break-words text-[var(--lms-body-text)]">{readiness.readinessOverride.state??"Automatic"}</dd></div>
        <div className="min-w-0 px-4 py-3"><dt className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Reason</dt><dd className="mt-2 whitespace-pre-wrap break-words text-[var(--lms-body-text)]">{readiness.readinessOverride.note??
          (readiness.execution.complete?"All execution items completed":"Incomplete tasks, sprints or releases")}</dd></div>
        <div className="min-w-0 px-4 py-3"><dt className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Submission status</dt>
          <dd className="mt-2 break-words text-[var(--lms-body-text)]">{readiness.finalSubmission.latest?.status??"Not submitted"}</dd></div>
      </dl>
      {readiness.readinessOverride.overriddenBy ? <p className="mt-3 text-xs text-muted-foreground">Overridden by {readiness.readinessOverride.overriddenBy}</p> : null}
      {readiness.readinessOverride.occurredAt?<p className="mt-3 text-xs text-muted-foreground">
        Override recorded {formatProjectAdminActivityDateIst(readiness.readinessOverride.occurredAt)}
      </p>:null}
      {([
        {name:"Tasks",done:readiness.execution.tasks.done,total:readiness.execution.tasks.total},
        {name:"Sprints",done:readiness.execution.sprints.completed,total:readiness.execution.sprints.total},
        {name:"Releases",done:readiness.execution.releases.shipped,total:readiness.execution.releases.total},
      ]).map(item=><div key={item.name} className={styles.progress}>
       <div className={styles.label}>
        <span>{item.name}</span><span className={styles.amount}>{item.done}/{item.total}</span>
       </div>
       <MetricBar className={styles.track} role="progressbar" label={item.name+" completed"}
        value={item.done} maximum={item.total||1} />
      </div>)}
    </section>
    <div className="grid min-w-0 divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)] min-[768px]:grid-cols-3 min-[768px]:divide-x min-[768px]:divide-y-0">
      <p className="px-4 py-3 text-[14px] leading-5 text-[var(--lms-body-text)]">Tasks completed: {readiness.execution.tasks.done}/{readiness.execution.tasks.total}</p>
      <p className="px-4 py-3 text-[14px] leading-5 text-[var(--lms-body-text)]">Sprints completed: {readiness.execution.sprints.completed}/{readiness.execution.sprints.total}</p>
      <p className="px-4 py-3 text-[14px] leading-5 text-[var(--lms-body-text)]">Releases shipped: {readiness.execution.releases.shipped}/{readiness.execution.releases.total}</p>
    </div>
    <ProjectReadinessOverrideForm projectId={projectId} initialState={readiness.readinessOverride.state} initialNote={readiness.readinessOverride.note}
      hasSubmission={readiness.finalSubmission.latest!==null}/>
  </div>;
}
