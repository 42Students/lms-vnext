import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  ProjectAdminFilters,
  ProjectAdminPagination,
  type ProjectAdminCollectionQuery,
} from "@/components/projects/project-admin-collection-controls";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import { ProjectMentorReassignment } from "@/components/projects/project-mentor-reassignment";
import { PageHeader } from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";
import {parseProjectAdminReassignMentorQuery,projectAdminReassignMentorHref} from "@/modules/projects/admin-reassign-mentor-query-model";
import { listProjectMentorCandidates } from "@/modules/projects/member-service";
import { listCollegeProjectMentorWorkload, listCollegeReassignmentWorkspaces } from "@/modules/projects/mentor-reassignment-workload-service";
import Link from "next/link";
import { isProjectMentorOverloaded } from "@/modules/projects/mentor-overload-model";

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
  const parsed=parseProjectAdminReassignMentorQuery(searchParams);
  if(!parsed.success)return <div className="space-y-6">
    <PageHeader eyebrow={eyebrow} title="Bulk mentor reassignment"/>
    <ErrorState title="Invalid mentor reassignment filters"
      description="Check the mentor, workspace, search, status, page and rows filters, or clear them to continue."
      action={<Link href={basePath+"/reassign-mentor"}
        className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Clear filters</Link>}/>
  </div>;
  const {fromMentorId,projectId:initialProjectId,mentorSearch,...filters}=parsed.data;
  const query:ProjectAdminCollectionQuery={...filters,fromMentorId};
  const context=await getCurrentRequestContext();

  // The roster, eligible mentors and workload must all be verified before
  // presenting mutation controls. A failed dependency is not an empty list.
  const [projectsRead,mentorsRead,workloadRead]=await Promise.allSettled([
    listCollegeReassignmentWorkspaces(context,collegeId,query),
    listProjectMentorCandidates(context,collegeId,{q:mentorSearch,limit:100}),
    listCollegeProjectMentorWorkload(context,collegeId),
  ]);
  if(projectsRead.status==="rejected"||
     mentorsRead.status==="rejected"||workloadRead.status==="rejected")
    return <div className="space-y-6">
      <ProjectAdminNav basePath={basePath} active="workspaces"/>
      <PageHeader eyebrow={eyebrow} title="Bulk mentor reassignment"/>
      <ErrorState title="Mentor reassignment unavailable"
        description="The workspace, mentor or workload details could not be verified. No reassignment action is available."
        action={<Link href={projectAdminReassignMentorHref(basePath,parsed.data)}
          className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Retry loading mentor reassignment</Link>}/>
    </div>;
  const projects=projectsRead.value;
  const mentors=mentorsRead.value;
  const workload=workloadRead.value;

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
        actions={<Link href={basePath}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3.5 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9">Back to workspaces</Link>}
      />
      <section className="border-b border-border pb-5">
        <h2 className="text-base font-semibold">Mentor workload</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {workload.map(row => {
            const mentor = mentors.find(person => person.membershipId === row.mentorMembershipId);
            const filter = row.mentorMembershipId ?? "UNASSIGNED";
            return <Link key={filter}
              href={basePath + "/reassign-mentor?fromMentorId=" + encodeURIComponent(filter)}
              className="block min-h-11 rounded-lg border border-border p-3 hover:border-[var(--lms-teal-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">
              <p className="font-semibold">{row.mentorName ?? mentor?.displayName ?? mentor?.email ?? (row.mentorMembershipId?"Mentor":"Unassigned")}</p>
              <p className="text-sm">{row.activeWorkspaces} active workspaces</p>
              <p className="text-sm">{row.atRisk} at risk</p>
              {row.mentorMembershipId && isProjectMentorOverloaded(row.activeWorkspaces, mentorCounts) ?
                <span className="text-xs font-semibold text-warning-text">Overloaded</span> : null}
            </Link>;
          })}
        </div>
      </section>
      <form method="get" className="flex flex-wrap items-end gap-3 border-b border-border pb-4"
        aria-label="Search all eligible mentors">
        {query.q?<Input type="hidden" name="q" value={query.q}/>:null}
        {query.status?<Input type="hidden" name="status" value={query.status}/>:null}
        {query.fromMentorId?<Input type="hidden" name="fromMentorId" value={query.fromMentorId}/>:null}
        <Input type="hidden" name="pageSize" value={query.pageSize}/>
        <label className="grid flex-1 gap-1 text-sm font-semibold">
          Search eligible mentors by name or email (across the college)
          <Input type="search" name="mentorSearch" maxLength={100} defaultValue={mentorSearch}
            placeholder="Enter mentor name or email" className="w-full"/>
        </label>
        <Button type="submit" className="">Find mentor</Button>
        {mentorSearch?<Link href={basePath+"/reassign-mentor"} className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle">Clear mentor search</Link>:null}
        <p className="w-full text-xs text-muted-foreground">Showing up to 100 matching eligible mentors. Narrow the search to reach any mentor beyond the first page.</p>
      </form>
      <ProjectAdminFilters query={query} />
      <form method="get" className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
        {query.q ? <Input type="hidden" name="q" value={query.q} /> : null}
        {query.status ? <Input type="hidden" name="status" value={query.status} /> : null}
        {query.pageSize ? <Input type="hidden" name="pageSize" value={query.pageSize} /> : null}
        <label className="grid gap-1 text-sm font-semibold">
          Filter by current mentor
          <Select name="fromMentorId" defaultValue={fromMentorId ?? ""}
            className="w-full">
            <option value="">All mentors</option>
            <option value="UNASSIGNED">Unassigned</option>
            {mentors.map(mentor => <option key={mentor.membershipId} value={mentor.membershipId}>
              {mentor.displayName ?? mentor.email ?? "Mentor"}
            </option>)}
          </Select>
        </label>
        <Button type="submit" className="">
          Apply mentor filter
        </Button>
      </form>
      <ProjectMentorReassignment
        collegeId={collegeId}
        initialProjectId={initialProjectId}
        matchingWorkspaces={projects.matchingWorkspaces}
        matchingCapped={projects.matchingCapped}
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
