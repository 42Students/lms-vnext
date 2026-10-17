import {getCurrentRequestContext} from "@/auth/request-context";
import {requireProjectManageAccess} from "@/modules/projects/access";
import {getProjectReadiness} from "@/modules/projects/readiness-service";
import {projectReadinessLegacyCopy as copy} from "@/modules/projects/readiness-override-copy";
import {ProjectReadinessOverrideForm} from "./project-readiness-override-form";
import {PageHeader} from "@/components/ui/page-header";
import Link from "next/link";
import {ProjectAdminNav} from "./project-admin-nav";
export async function ProjectWorkspaceReadiness({projectId,basePath}:{projectId:string;basePath:string}){
  const context=await getCurrentRequestContext();
  await requireProjectManageAccess(context,projectId);
  const readiness=await getProjectReadiness(context,projectId);
  return <div className="space-y-6">
    <ProjectAdminNav basePath={basePath} active="readiness" />
    <Link href={basePath} className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">← Back to workspaces</Link>
    <nav aria-label="Workspace sections" className="flex flex-wrap gap-2 rounded-lg border border-border bg-surface p-2">
      {([
        ["summary","Summary"], ["overview","Overview"], ["team","Team"], ["sprints","Sprints"],
        ["tasks","Tasks"], ["resources","Resources"], ["meetings","Meetings"],
        ["readiness","Readiness"], ["delivery","Delivery"], ["audit","Audit"],
      ] as const).map(([segment, title]) => (
        <Link key={segment} href={basePath+"/"+projectId+"/"+segment}
          aria-current={segment==="readiness"?"page":undefined}
          className={"rounded-md px-3 py-2 text-sm font-semibold "+(segment==="readiness"?"bg-primary text-primary-foreground":"text-body hover:bg-muted")}>
          {title}
        </Link>
      ))}
    </nav>
    <PageHeader title={copy.title} eyebrow="Projects" description="Task and sprint completion are separate measures; the readiness verdict above is decided server-side." />
    <section className="rounded-xl border border-border bg-surface p-5">
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
      {readiness.readinessOverride.occurredAt?<p className="mt-3 text-xs text-muted-foreground">
        Override recorded {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"})
          .format(readiness.readinessOverride.occurredAt)}
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
