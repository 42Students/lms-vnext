import { getCurrentRequestContext } from "@/auth/request-context";
import { ProjectList } from "@/components/projects/project-list";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { listProjectInstances } from "@/modules/projects/instance-service";

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

  const projects = await listProjectInstances(
    context,
    collegeId,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Projects"
        description="Project workspaces inside the selected college safety scope."
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
