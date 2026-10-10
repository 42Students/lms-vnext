import { getCurrentRequestContext } from "@/auth/request-context";
import {
  ProjectAdminFilters,
  ProjectAdminPagination,
  type ProjectAdminCollectionQuery,
} from "@/components/projects/project-admin-collection-controls";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import { ProjectMentorReassignment } from "@/components/projects/project-mentor-reassignment";
import { PageHeader } from "@/components/ui/page-header";
import { listProjectAdminSnapshots } from "@/modules/projects/admin-insights-service";
import { listProjectMentorCandidates } from "@/modules/projects/member-service";

function one(
  value: string | string[] | undefined,
) {
  return Array.isArray(value)
    ? value[0]
    : value;
}

export async function ProjectAdminReassignMentorPage({
  collegeId,
  basePath,
  eyebrow,
  searchParams,
}: {
  collegeId: string;
  basePath: string;
  eyebrow: string;
  searchParams: Record<
    string,
    string | string[] | undefined
  >;
}) {
  const context = await getCurrentRequestContext();
  const query: ProjectAdminCollectionQuery = {
    q: one(searchParams.q),
    status: one(searchParams.status) as ProjectAdminCollectionQuery["status"],
    page: Number(one(searchParams.page) ?? 1),
    pageSize: Number(
      one(searchParams.pageSize) ?? 25,
    ),
  };

  const [projects, mentors] =
    await Promise.all([
      listProjectAdminSnapshots(
        context,
        collegeId,
        query,
      ),
      listProjectMentorCandidates(
        context,
        collegeId,
        { q: "", limit: 100 },
      ),
    ]);

  return (
    <div className="space-y-6">
      <ProjectAdminNav
        basePath={basePath}
        active="workspaces"
      />
      <PageHeader
        eyebrow={eyebrow}
        title="Bulk mentor reassignment"
        description="Move selected non-archived project workspaces to a new primary mentor."
      />
      <ProjectAdminFilters query={query} />
      <ProjectMentorReassignment
        collegeId={collegeId}
        workspaces={projects.items
          .filter(
            (project) =>
              project.status !== "ARCHIVED",
          )
          .map((project) => ({
            id: project.id,
            title: project.title,
            status: project.status,
            mentorName:
              project.mentorName,
          }))}
        mentors={mentors}
      />
      <ProjectAdminPagination
        basePath={basePath + "/reassign-mentor"}
        query={query}
        page={projects.page}
        totalPages={projects.totalPages}
        total={projects.total}
      />
    </div>
  );
}
