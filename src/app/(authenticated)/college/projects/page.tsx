import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ProjectList } from "@/components/projects/project-list";
import { CreateProjectControl } from "@/components/projects/project-create-control";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import { listProjectInstances } from "@/modules/projects/instance-service";
import { listAssignedProjectTemplates } from "@/modules/projects/template-service";

export default async function CollegeProjectsPage() {
  const context = await getCurrentRequestContext();
  const membership = context.membership;
  if (!membership) {
    redirect("/dashboard");
  }

  const [projects, templates] = await Promise.all([
    listProjectInstances(context, membership.collegeId),
    listAssignedProjectTemplates(context, membership.collegeId),
  ]);

  return (
    <div className="space-y-6">
      <ProjectAdminNav
        basePath="/college/projects"
        active="workspaces"
      />
      <PageHeader
        eyebrow="College Admin"
        title="Projects"
        description="College Project workspaces, execution state, teams, delivery and review."
        actions={
          <CreateProjectControl
            collegeId={membership.collegeId}
            basePath="/college/projects"
            templates={templates.map((template) => ({
              templateId: template.templateId,
              title: template.title,
              version: template.version,
              summary: template.summary,
            }))}
          />
        }
      />
      <ProjectList
        items={projects.map((project) => ({
          id: project.id,
          title: project.title,
          summary: project.summary,
          status: project.status,
          updatedAt: project.updatedAt,
        }))}
        basePath="/college/projects"
        emptyTitle="No Projects yet"
        emptyDescription="Create a Project from an assigned published template to start a team workspace."
      />
    </div>
  );
}
