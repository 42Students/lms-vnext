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
import { PageBackLink } from "@/components/ui/page-back-link";
import {ErrorState} from "@/components/ui/error-state";
import {StatusBadge} from "@/components/ui/status-badge";
import { Disclosure } from "@/components/ui/disclosure";
import {parseProjectAdminReassignMentorQuery,projectAdminReassignMentorHref,
 resolveLegacyReassignMentorBookmark} from "@/modules/projects/admin-reassign-mentor-query-model";
import {findLegacyReassignmentMentorMembership} from "@/modules/projects/mentor-reassignment-legacy-lookup-service";
import { listProjectMentorCandidates } from "@/modules/projects/member-service";
import { listCollegeProjectMentorWorkload, listCollegeReassignmentWorkspaces } from "@/modules/projects/mentor-reassignment-workload-service";
import Link from "next/link";
import { isProjectMentorOverloaded } from "@/modules/projects/mentor-overload-model";

export async function ProjectAdminReassignMentorPage({
  collegeId,
  basePath,
  searchParams,
}: {
  collegeId: string;
  basePath: string;
  eyebrow?: string;
  searchParams: Record<
    string,
    string | string[] | undefined
  >;
}) {
  const context=await getCurrentRequestContext();
  let recovered:Awaited<ReturnType<typeof resolveLegacyReassignMentorBookmark>>;
  try{
   recovered=await resolveLegacyReassignMentorBookmark(searchParams,id=>
     findLegacyReassignmentMentorMembership(context,collegeId,id));
  }catch{
   return <ErrorState title="Mentor bookmark could not be resolved"
     description="The selected college's mentor identity mapping is unavailable. Retry before changing the mentor filter."
     action={<Link href={basePath+"/reassign-mentor"}
      className="text-link underline">Open mentor directory</Link>}/>;
  }
  if(!recovered.ok)return <div className="min-w-0 space-y-4">
   <PageHeader title="Bulk mentor reassignment"/>
   <ErrorState title="Mentor bookmark could not be resolved"
    description="This historic mentor ID has no active, verified match in the selected college. Choose a mentor from the current directory."
    action={<Link href={basePath+"/reassign-mentor"}
      className="text-link underline">Choose a current mentor</Link>}/>
  </div>;
  const parsed=parseProjectAdminReassignMentorQuery(recovered.params);
  if(!parsed.success)return <div className="min-w-0 space-y-[16px]">
    <PageHeader title="Bulk mentor reassignment" actions={<PageBackLink href={basePath} label="Project workspaces" />}/>
    <ProjectAdminNav basePath={basePath} active="workspaces" />
    <ErrorState title="Invalid mentor reassignment filters"
      description="Check the mentor, workspace, search, status, page and rows filters, or clear them to continue."
      action={<Link href={basePath+"/reassign-mentor"}
        className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-link-text)] underline md:min-h-[var(--lms-control-height)]">Clear filters</Link>}/>
  </div>;
  const {fromMentorId,projectId:initialProjectId,mentorSearch,...filters}=parsed.data;
  const query:ProjectAdminCollectionQuery={...filters,fromMentorId};
  // The roster, eligible mentors and workload must all be verified before
  // presenting mutation controls. A failed dependency is not an empty list.
  const [projectsRead,mentorsRead,workloadRead]=await Promise.allSettled([
    listCollegeReassignmentWorkspaces(context,collegeId,query),
    listProjectMentorCandidates(context,collegeId,{q:mentorSearch,limit:100}),
    listCollegeProjectMentorWorkload(context,collegeId),
  ]);
  if(projectsRead.status==="rejected"||
     mentorsRead.status==="rejected"||workloadRead.status==="rejected")
    return <div className="min-w-0 space-y-[16px]">
      <PageHeader title="Bulk mentor reassignment" actions={<PageBackLink href={basePath} label="Project workspaces" />}/>
      <ProjectAdminNav basePath={basePath} active="workspaces"/>
      <ErrorState title={projectsRead.status==="rejected"?"Failed to load project workspaces":mentorsRead.status==="rejected"?"Mentor options could not be loaded":"Mentor workload could not be loaded"}
        description="The workspace, mentor or workload details could not be verified. No reassignment action is available."
        action={<Link href={projectAdminReassignMentorHref(basePath,parsed.data)}
          className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-link-text)] underline md:min-h-[var(--lms-control-height)]">{mentorsRead.status==="rejected"?"Retry mentors":"Retry loading mentor reassignment"}</Link>}/>
    </div>;
  const projects=projectsRead.value;
  const mentors=mentorsRead.value;
  const workload=workloadRead.value;

  const sortedWorkload = [...workload].sort((left, right) =>
    right.activeWorkspaces - left.activeWorkspaces ||
    (left.mentorName ?? "").localeCompare(right.mentorName ?? "", "en-IN"),
  );
  const mentorCounts = sortedWorkload.filter(row => row.mentorMembershipId !== null).map(row => row.activeWorkspaces);
  return (
    <div className="min-w-0 space-y-[16px]">
      <div className="min-w-0">
        <PageBackLink href={basePath} label="Back to workspaces" />
        <PageHeader title="Bulk mentor reassignment"
          description="Move multiple active workspaces to a new mentor at once" />
      </div>
      <ProjectAdminNav basePath={basePath} active="workspaces" />
      <Disclosure title="Mentor workload" defaultOpen className="border-b border-border pb-4" contentClassName="pt-2">
        <p className="mb-2 text-xs text-muted-foreground">
          Active workspaces shows current assignments. At-risk counts workspaces needing attention.
          A mentor is Overloaded when their active count is unusually high.
        </p>
        {sortedWorkload.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">No project workspaces available for this college</p>
        ) : (
          <div className="min-w-0 overflow-x-auto">
            <table className="w-full min-w-[440px] border-collapse text-left text-sm">
              <caption className="sr-only">Mentor workload sorted by active workspaces, highest first</caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="px-3 py-2 font-semibold">Mentor</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold" title="Active workspaces currently assigned">Active workspaces</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold" title="Workspaces at risk">At-risk</th>
                </tr>
              </thead>
              <tbody>
                {sortedWorkload.map(row => {
                  const mentor = mentors.find(person => person.membershipId === row.mentorMembershipId);
                  const filter = row.mentorMembershipId ?? "UNASSIGNED";
                  return (
                    <tr key={filter} className="border-b border-border hover:bg-primary-subtle">
                      <td className="px-3 py-3">
                        <Link href={basePath + "/reassign-mentor?fromMentorId=" + encodeURIComponent(filter)}
                          className="font-semibold text-[var(--lms-link-text)] underline-offset-2 hover:underline">
                          {row.mentorName ?? mentor?.displayName ?? mentor?.email ?? (row.mentorMembershipId ? "Mentor" : "Unassigned")}
                        </Link>
                        {row.mentorMembershipId && isProjectMentorOverloaded(row.activeWorkspaces, mentorCounts) ?
                          <span className="ml-2 inline-flex"><StatusBadge tone="warning">Overloaded</StatusBadge></span> : null}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{row.activeWorkspaces}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{row.atRisk}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Disclosure>
      <Disclosure title="Filter by current mentor" className="border-b border-border pb-4" contentClassName="space-y-4 pt-3" defaultOpen>
      <form method="get" className="grid min-w-0 grid-cols-1 items-end gap-3 border-b border-border pb-4 md:grid-cols-[minmax(0,1fr)_auto_auto]"
        aria-label="Search all eligible mentors">
        {query.q?<Input type="hidden" name="q" value={query.q}/>:null}
        {query.status?<Input type="hidden" name="status" value={query.status}/>:null}
        {query.fromMentorId?<Input type="hidden" name="fromMentorId" value={query.fromMentorId}/>:null}
        <Input type="hidden" name="pageSize" value={query.pageSize}/>
        <label className="grid flex-1 gap-[6px] text-[var(--lms-font-sm)] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
          Search eligible mentors by name or email (across the college)
          <Input type="search" name="mentorSearch" maxLength={100} defaultValue={mentorSearch}
            placeholder="Enter mentor name or email" className="w-full"/>
        </label>
        <Button type="submit" className="min-h-11 w-full md:min-h-9">Find mentor</Button>
        {mentorSearch?<Link href={basePath+"/reassign-mentor"} className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-3 text-sm font-[650] text-[var(--lms-link-text)] hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:underline">Clear mentor search</Link>:null}
        <p className="min-w-0 text-xs text-muted-foreground md:col-span-full leading-[20px]">Showing up to 100 matching eligible mentors. Narrow the search to reach any mentor beyond the first page.</p>
      </form>
      <div className="min-w-0"><ProjectAdminFilters query={query} /></div>
      <form method="get" className="grid min-w-0 grid-cols-1 items-end gap-3 border-b border-border pb-4 md:grid-cols-[minmax(0,1fr)_auto_auto]">
        {query.q ? <Input type="hidden" name="q" value={query.q} /> : null}
        {query.status ? <Input type="hidden" name="status" value={query.status} /> : null}
        {query.pageSize ? <Input type="hidden" name="pageSize" value={query.pageSize} /> : null}
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
          Current mentor
          <Select name="fromMentorId" defaultValue={fromMentorId ?? ""}
            className="w-full min-w-[240px]">
            <option value="">Any mentor — search by name</option>
            <option value="UNASSIGNED">Unassigned</option>
            {mentors.map(mentor => <option key={mentor.membershipId} value={mentor.membershipId}>
              {mentor.displayName ?? mentor.email ?? "Mentor"}
            </option>)}
          </Select>
        </label>
        <Button type="submit" className="min-h-11 w-full md:min-h-9">Apply mentor filter</Button>
        {fromMentorId ? <Link href={basePath + "/reassign-mentor"} className="text-sm font-semibold underline">Clear current mentor</Link> : null}
      </form>
      </Disclosure>
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
            roleLabel:project.roleLabel,
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
