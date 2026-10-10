import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  ProjectAdminFilters,
  ProjectAdminPagination,
  type ProjectAdminCollectionQuery,
} from "@/components/projects/project-admin-collection-controls";
import { CreateProjectControl } from "@/components/projects/project-create-control";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import { ProjectAdminWorkspaceList } from "@/components/projects/project-admin-workspace-list";
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

export default async function CollegeProjectsPage({
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
  const membership = context.membership;
  if (!membership) {
    redirect("/dashboard");
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
      membership.collegeId,
      query,
    ),
    listAssignedProjectTemplates(
      context,
      membership.collegeId,
    ),
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

      <ProjectAdminFilters query={query} />

      <ProjectAdminWorkspaceList
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
        basePath="/college/projects"
        emptyTitle="No Projects match these filters"
        emptyDescription="Clear the filters, or create a Project from an assigned published template."
      />

      <ProjectAdminPagination
        basePath="/college/projects"
        query={query}
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
      />
    </div>
  );
}
