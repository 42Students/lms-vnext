import {getCurrentRequestContext} from "@/auth/request-context";
import {requireProjectManageAccess} from "@/modules/projects/access";
import {getProjectReadiness} from "@/modules/projects/readiness-service";
import {projectReadinessLegacyCopy as copy} from "@/modules/projects/readiness-override-copy";
import {ProjectReadinessOverrideForm} from "./project-readiness-override-form";
import {PageHeader} from "@/components/ui/page-header";
import {ProjectAdminNav} from "./project-admin-nav";
export async function ProjectWorkspaceReadiness({projectId,basePath}:{projectId:string;basePath:string}){
  const context=await getCurrentRequestContext();
  await requireProjectManageAccess(context,projectId);
  const readiness=await getProjectReadiness(context,projectId);
  return <div className="space-y-6">
    <ProjectAdminNav basePath={basePath} active="readiness" />
    <PageHeader title={copy.title} eyebrow="Projects" description="Task and sprint completion are separate measures; the readiness verdict above is decided server-side." />
    <div className="grid gap-3 sm:grid-cols-3">
      <p>Tasks completed: {readiness.execution.tasks.done}/{readiness.execution.tasks.total}</p>
      <p>Sprints completed: {readiness.execution.sprints.completed}/{readiness.execution.sprints.total}</p>
      <p>Releases shipped: {readiness.execution.releases.shipped}/{readiness.execution.releases.total}</p>
    </div>
    <ProjectReadinessOverrideForm projectId={projectId} initialState={readiness.readinessOverride.state} initialNote={readiness.readinessOverride.note}/>
  </div>;
}
