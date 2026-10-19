import {getCurrentRequestContext} from "@/auth/request-context";
import {requireProjectManageAccess} from "@/modules/projects/access";
import {getProjectReadiness} from "@/modules/projects/readiness-service";
import {projectReadinessLegacyCopy as copy} from "@/modules/projects/readiness-override-copy";
import {ProjectReadinessOverrideForm} from "./project-readiness-override-form";
import {PageHeader} from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";
import {formatProjectAdminActivityDateIst} from "@/modules/projects/project-admin-date-model";
import {z} from "zod";
import Link from "next/link";
import {ProjectAdminNav} from "./project-admin-nav";
export async function ProjectWorkspaceReadiness({projectId,basePath}:{projectId:string;basePath:string}){
  // A forged project UUID, expired role or interrupted DB read must never
  // produce a raw server error or expose another college's readiness values.
  if(!z.string().uuid().safeParse(projectId).success)
    return <div className="space-y-6">
      <PageHeader title={copy.title} eyebrow="Projects"/>
      <ErrorState title="Workspace readiness unavailable"
        description="Return to workspaces and open an authorized workspace to try again."
        action={<Link href={basePath}
          className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Back to workspaces</Link>}/>
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
        action={<Link href={basePath}
          className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Back to workspaces</Link>}/>
    </div>;
  const readiness=result.value;
  return <div className="space-y-6">
    <ProjectAdminNav basePath={basePath} active="readiness" />
    <PageHeader title={copy.title} eyebrow="Projects"
      description="Task and sprint completion are separate measures; the readiness verdict above is decided server-side."
      actions={<Link href={basePath} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9">← Back to workspaces</Link>} />
    <nav aria-label="Workspace sections" className="flex min-w-0 flex-wrap gap-2 border-b border-border">
      {([
        ["summary","Summary"], ["overview","Overview"], ["team","Team"], ["sprints","Sprints"],
        ["tasks","Tasks"], ["resources","Resources"], ["meetings","Meetings"],
        ["readiness","Readiness"], ["delivery","Delivery"], ["audit","Audit"],
      ] as const).map(([segment, title]) => (
        <Link key={segment} href={basePath+"/"+projectId+"/"+segment}
          aria-current={segment==="readiness"?"page":undefined}
          className={"inline-flex min-h-11 items-center border-b-[3px] px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary "+(segment==="readiness"?"border-primary text-primary-text":"border-transparent text-body hover:text-primary-text")}>
          {title}
        </Link>
      ))}
    </nav>
    <section className="border-b border-border py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Current readiness</h2>
        <span className={readiness.finalSubmission.canSubmitDraft?"font-semibold text-success":"font-semibold text-warning-text"}>
          {readiness.finalSubmission.canSubmitDraft?"Ready":"Not ready"}
        </span>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div><dt className="font-semibold">State</dt><dd>{readiness.readinessOverride.state??"Automatic"}</dd></div>
        <div><dt className="font-semibold">Reason</dt><dd className="whitespace-pre-wrap">{readiness.readinessOverride.note??
          (readiness.execution.complete?"All execution items completed":"Incomplete tasks, sprints or releases")}</dd></div>
        <div><dt className="font-semibold">Submission status</dt>
          <dd>{readiness.finalSubmission.latest?.status??"Not submitted"}</dd></div>
      </dl>
      {readiness.readinessOverride.overriddenBy ? <p className="mt-3 text-xs text-muted-foreground">Overridden by {readiness.readinessOverride.overriddenBy}</p> : null}
      {readiness.readinessOverride.occurredAt?<p className="mt-3 text-xs text-muted-foreground">
        Override recorded {formatProjectAdminActivityDateIst(readiness.readinessOverride.occurredAt)}
      </p>:null}
      {([
        {name:"Tasks",done:readiness.execution.tasks.done,total:readiness.execution.tasks.total},
        {name:"Sprints",done:readiness.execution.sprints.completed,total:readiness.execution.sprints.total},
        {name:"Releases",done:readiness.execution.releases.shipped,total:readiness.execution.releases.total},
      ]).map(item=><div key={item.name} className="mt-3 space-y-1">
       <div className="flex justify-between text-xs font-semibold">
        <span>{item.name}</span><span>{item.done}/{item.total}</span>
       </div>
       <div role="progressbar" aria-label={item.name+" completed"} aria-valuemin={0} aria-valuemax={item.total||1}
         aria-valuenow={item.done} className="h-2 overflow-hidden rounded bg-muted">
        <div className="h-full bg-primary" style={{width:(item.total?100*item.done/item.total:0)+"%"}}/>
       </div>
      </div>)}
    </section>
    <div className="grid gap-3 sm:grid-cols-3">
      <p>Tasks completed: {readiness.execution.tasks.done}/{readiness.execution.tasks.total}</p>
      <p>Sprints completed: {readiness.execution.sprints.completed}/{readiness.execution.sprints.total}</p>
      <p>Releases shipped: {readiness.execution.releases.shipped}/{readiness.execution.releases.total}</p>
    </div>
    <ProjectReadinessOverrideForm projectId={projectId} initialState={readiness.readinessOverride.state} initialNote={readiness.readinessOverride.note}
      hasSubmission={readiness.finalSubmission.latest!==null}/>
  </div>;
}
