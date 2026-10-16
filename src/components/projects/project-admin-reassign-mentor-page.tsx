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
import { listCollegeProjectMentorWorkload } from "@/modules/projects/mentor-reassignment-workload-service";
import Link from "next/link";

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

  const [projects, mentors, workload] =
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
      listCollegeProjectMentorWorkload(context, collegeId),
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
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold">Mentor workload</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {workload.map(row => {
            const mentor = mentors.find(person => person.membershipId === row.mentorMembershipId);
            const filter = row.mentorMembershipId ?? "UNASSIGNED";
            return <Link key={filter}
              href={basePath + "/reassign-mentor?fromMentorId=" + encodeURIComponent(filter)}
              className="rounded-lg border border-border p-3 hover:border-primary">
              <p className="font-semibold">{mentor?.displayName ?? mentor?.email ?? "Unassigned"}</p>
              <p className="text-sm">{row.activeWorkspaces} active workspaces</p>
              <p className="text-sm">{row.atRisk} at risk</p>
              {row.activeWorkspaces >= 8 && row.mentorMembershipId ?
                <span className="text-xs font-semibold text-warning-text">Overloaded</span> : null}
            </Link>;
          })}
        </div>
      </section>
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
