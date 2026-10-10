import { getCurrentRequestContext } from "@/auth/request-context";
import {
  ProjectAdminFilters,
  ProjectAdminPagination,
  type ProjectAdminCollectionQuery,
} from "@/components/projects/project-admin-collection-controls";
import { CreateProjectControl } from "@/components/projects/project-create-control";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import { ProjectList } from "@/components/projects/project-list";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { listProjectAdminSnapshots } from "@/modules/projects/admin-insights-service";
import { listAssignedProjectTemplates } from "@/modules/projects/template-service";

function one(
  value: string | string[] | undefined,
) {
  return Array.isArray(value)
    ? value[0]
    : value;
}

export default async function SuperAdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<
    Record<
      string,
      string | string[] | undefined
    >
  >;
}) {
  const context = await getCurrentRequestContext();
  const collegeId =
    context.adminScope?.collegeId ?? null;

  if (!collegeId) {
    return (
      <div className="space-y-6">
        <ProjectAdminNav
          basePath="/admin/projects"
          active="workspaces"
        />
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

  const params = await searchParams;
  const query: ProjectAdminCollectionQuery = {
    q: one(params.q),
    status: one(
      params.status,
    ) as ProjectAdminCollectionQuery["status"],
    page: Number(one(params.page) ?? 1),
    pageSize: Number(
      one(params.pageSize) ?? 25,
    ),
  };

  const [result, templates] = await Promise.all([
    listProjectAdminSnapshots(
      context,
      collegeId,
      query,
    ),
    listAssignedProjectTemplates(
      context,
      collegeId,
    ),
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

      <ProjectAdminFilters query={query} />

      <ProjectList
        items={result.items.map((project) => ({
          id: project.id,
          title: project.title,
          summary: project.summary,
          status: project.status,
          updatedAt: project.updatedAt,
          mentorName: project.mentorName,
          memberCount: project.memberCount,
          progressPercent:
            project.progressPercent,
        }))}
        basePath="/admin/projects"
        emptyTitle="No Projects match these filters"
        emptyDescription="Clear the filters, or create a Project from a published template assigned to this college."
      />

      <ProjectAdminPagination
        basePath="/admin/projects"
        query={query}
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
      />
    </div>
  );
}
