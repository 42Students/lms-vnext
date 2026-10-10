import { getCurrentRequestContext } from "@/auth/request-context";
import { ProjectList } from "@/components/projects/project-list";
import { CreateProjectControl } from "@/components/projects/project-create-control";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import { listProjectInstances } from "@/modules/projects/instance-service";
import { listAssignedProjectTemplates } from "@/modules/projects/template-service";

export default async function SuperAdminProjectsPage() {
  const context = await getCurrentRequestContext();
  const collegeId =
    context.adminScope?.collegeId ?? null;

  if (!collegeId) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Super Admin"
          title="Projects"
          description="Project administration requires a college safety scope."
        />
        <EmptyState
          title="Select a college scope"
          description="Choose a college in the Super Admin scope selector before opening Project workspaces."
        />
      </div>
    );
  }

  const [projects, templates] = await Promise.all([
    listProjectInstances(context, collegeId),
    listAssignedProjectTemplates(context, collegeId),
  ]);

  return (
    <div className="space-y-6">
      <ProjectAdminNav
        basePath="/admin/projects"
        active="workspaces"
      />
      <PageHeader
        eyebrow="Super Admin"
        title="Projects"
        description="Project workspaces inside the selected college safety scope."
        actions={
          <CreateProjectControl
            collegeId={collegeId}
            basePath="/admin/projects"
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
        basePath="/admin/projects"
        emptyTitle="No Projects in this college"
        emptyDescription="Published templates can be assigned to this college and materialized into Project workspaces."
      />
    </div>
  );
}
