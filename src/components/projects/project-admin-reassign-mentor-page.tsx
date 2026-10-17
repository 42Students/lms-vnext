import { getCurrentRequestContext } from "@/auth/request-context";
import {
  ProjectAdminFilters,
  ProjectAdminPagination,
  type ProjectAdminCollectionQuery,
} from "@/components/projects/project-admin-collection-controls";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import { ProjectMentorReassignment } from "@/components/projects/project-mentor-reassignment";
import { PageHeader } from "@/components/ui/page-header";
import { z } from "zod";
import { listProjectMentorCandidates } from "@/modules/projects/member-service";
import { listCollegeProjectMentorWorkload, listCollegeReassignmentWorkspaces } from "@/modules/projects/mentor-reassignment-workload-service";
import Link from "next/link";
import { isProjectMentorOverloaded } from "@/modules/projects/mentor-overload-model";

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
  const fromMentorId = z.union([z.string().uuid(), z.literal("UNASSIGNED")]).safeParse(one(searchParams.fromMentorId)).data;
  const initialProjectId = z.string().uuid().safeParse(one(searchParams.projectId)).data;
  const mentorSearch=z.string().trim().max(100).safeParse(one(searchParams.mentorSearch)??"").data??"";
  const query: ProjectAdminCollectionQuery = {
    fromMentorId,
    q: one(searchParams.q),
    status: one(searchParams.status) as ProjectAdminCollectionQuery["status"],
    page: Number(one(searchParams.page) ?? 1),
    pageSize: Number(
      one(searchParams.pageSize) ?? 25,
    ),
  };

  const [projects, mentors, workload] =
    await Promise.all([
      listCollegeReassignmentWorkspaces(
        context,
        collegeId,
        query,
      ),
      listProjectMentorCandidates(
        context,
        collegeId,
        { q: mentorSearch, limit: 100 },
      ),
      listCollegeProjectMentorWorkload(context, collegeId),
    ]);

  const mentorCounts = workload.filter(row => row.mentorMembershipId !== null).map(row => row.activeWorkspaces);
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
      <Link className="inline-flex min-h-10 items-center rounded-md border border-border px-3 py-2 text-sm font-semibold" href={basePath}>Back to workspaces</Link>
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold">Mentor workload</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {workload.map(row => {
            const mentor = mentors.find(person => person.membershipId === row.mentorMembershipId);
            const filter = row.mentorMembershipId ?? "UNASSIGNED";
            return <Link key={filter}
              href={basePath + "/reassign-mentor?fromMentorId=" + encodeURIComponent(filter)}
              className="rounded-lg border border-border p-3 hover:border-primary">
              <p className="font-semibold">{row.mentorName ?? mentor?.displayName ?? mentor?.email ?? (row.mentorMembershipId?"Mentor":"Unassigned")}</p>
              <p className="text-sm">{row.activeWorkspaces} active workspaces</p>
              <p className="text-sm">{row.atRisk} at risk</p>
              {row.mentorMembershipId && isProjectMentorOverloaded(row.activeWorkspaces, mentorCounts) ?
                <span className="text-xs font-semibold text-warning-text">Overloaded</span> : null}
            </Link>;
          })}
        </div>
      </section>
      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4"
        aria-label="Search all eligible mentors">
        {query.q?<input type="hidden" name="q" value={query.q}/>:null}
        {query.status?<input type="hidden" name="status" value={query.status}/>:null}
        {query.fromMentorId?<input type="hidden" name="fromMentorId" value={query.fromMentorId}/>:null}
        <input type="hidden" name="pageSize" value={query.pageSize}/>
        <label className="grid flex-1 gap-1 text-sm font-semibold">
          Search eligible mentors by name or email (across the college)
          <input type="search" name="mentorSearch" maxLength={100} defaultValue={mentorSearch}
            placeholder="Enter mentor name or email" className="min-h-11 rounded-md border border-border p-3"/>
        </label>
        <button type="submit" className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary">Find mentor</button>
        {mentorSearch?<Link href={basePath+"/reassign-mentor"} className="min-h-11 rounded-md border px-4 py-3 text-sm">Clear mentor search</Link>:null}
        <p className="w-full text-xs text-muted-foreground">Showing up to 100 matching eligible mentors. Narrow the search to reach any mentor beyond the first page.</p>
      </form>
      <ProjectAdminFilters query={query} />
      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
        {query.q ? <input type="hidden" name="q" value={query.q} /> : null}
        {query.status ? <input type="hidden" name="status" value={query.status} /> : null}
        {query.pageSize ? <input type="hidden" name="pageSize" value={query.pageSize} /> : null}
        <label className="grid gap-1 text-sm font-semibold">
          Filter by current mentor
          <select name="fromMentorId" defaultValue={fromMentorId ?? ""}
            className="min-h-10 rounded-lg border border-border bg-background px-3 py-2">
            <option value="">All mentors</option>
            <option value="UNASSIGNED">Unassigned</option>
            {mentors.map(mentor => <option key={mentor.membershipId} value={mentor.membershipId}>
              {mentor.displayName ?? mentor.email ?? "Mentor"}
            </option>)}
          </select>
        </label>
        <button type="submit" className="min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
          Apply mentor filter
        </button>
      </form>
      <ProjectMentorReassignment
        collegeId={collegeId}
        initialProjectId={initialProjectId}
        matchingWorkspaces={projects.matchingWorkspaces}
        workspaces={projects.items
          .filter(
            (project) =>
              project.status !== "ARCHIVED",
          )
          .map((project) => ({
            id: project.id,
            title: project.title,
            status: project.status,
            mentorName: project.mentorName,
            mentorMembershipId: project.mentorMembershipId,
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
