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
  const {fromMentorId,projectId:initialProjectId,mentorSearch,mentorPage,...filters}=parsed.data;
  const query:ProjectAdminCollectionQuery={...filters,fromMentorId};
  // The roster, eligible mentors and workload must all be verified before
  // presenting mutation controls. A failed dependency is not an empty list.
  const [projectsRead,mentorsRead,workloadRead]=await Promise.allSettled([
    listCollegeReassignmentWorkspaces(context,collegeId,query),
    listProjectMentorCandidates(context,collegeId,{q:mentorSearch,limit:100,
      offset:(mentorPage-1)*100}),
    listCollegeProjectMentorWorkload(context,collegeId),
  ]);
  if(projectsRead.status==="rejected"||workloadRead.status==="rejected")
    return <div className="min-w-0 space-y-[16px]">
      <PageHeader title="Bulk mentor reassignment" actions={<PageBackLink href={basePath} label="Project workspaces" />}/>
      <ProjectAdminNav basePath={basePath} active="workspaces"/>
      <ErrorState title={projectsRead.status==="rejected"?"Failed to load project workspaces":"Mentor workload could not be loaded"}
        description="The workspace, mentor or workload details could not be verified. No reassignment action is available."
        action={<Link href={projectAdminReassignMentorHref(basePath,parsed.data)}
          className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-link-text)] underline md:min-h-[var(--lms-control-height)]">Retry loading mentor reassignment</Link>}/>
    </div>;
  const projects=projectsRead.value;
  const mentors=mentorsRead.status==="fulfilled"?mentorsRead.value:[];
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
      {mentorsRead.status==="rejected"?<ErrorState
        title="Mentor options could not be loaded"
        description="The workspace list and workload are available, but reassignment is disabled until current mentor permissions can be verified."
        action={<Link className="font-semibold text-link underline"
          href={projectAdminReassignMentorHref(basePath,parsed.data)}>Retry mentors</Link>}/>:null}
      <Disclosure title="Mentor workload" className="border-b border-border pb-4" contentClassName="pt-2">
        <div className="mt-2 grid min-w-0 gap-x-4 gap-y-0 md:grid-cols-2">
          {workload.map(row => {
            const mentor = mentors.find(person => person.membershipId === row.mentorMembershipId);
            const filter = row.mentorMembershipId ?? "UNASSIGNED";
            return <Link key={filter}
              href={basePath + "/reassign-mentor?fromMentorId=" + encodeURIComponent(filter)}
              className="block min-h-11 min-w-0 border-b border-border px-2 py-3 break-words hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-[var(--lms-control-height)]">
              <p className="font-semibold">{row.mentorName ?? mentor?.displayName ?? mentor?.email ?? (row.mentorMembershipId?"Mentor":"Unassigned")}</p>
              <p className="text-sm leading-[22px]">{row.activeWorkspaces} active workspaces</p>
              <p className="text-sm leading-[22px]">{row.atRisk} at risk</p>
              {row.mentorMembershipId && isProjectMentorOverloaded(row.activeWorkspaces, mentorCounts) ?
                <StatusBadge tone="warning">Overloaded</StatusBadge> : null}
            </Link>;
          })}
        </div>
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
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground md:col-span-full">
          <span>Mentors · page {mentorPage} · {mentors.length} result{mentors.length===1?"":"s"} on this page</span>
          <nav className="flex flex-wrap gap-3" aria-label="Eligible mentor pages">
            {mentorPage>1?<Link className="font-semibold text-link underline"
              href={projectAdminReassignMentorHref(basePath,{...parsed.data,mentorPage:mentorPage-1})}>
                Previous mentors</Link>:null}
            {mentors.length===100&&mentorPage<1000?<Link
              className="font-semibold text-link underline"
              href={projectAdminReassignMentorHref(basePath,{...parsed.data,mentorPage:mentorPage+1})}>
                Next mentors</Link>:null}
          </nav>
        </div>
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
      {mentorsRead.status==="fulfilled"?<ProjectMentorReassignment
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
      />:<p role="alert" className="border-t border-border py-3 text-sm text-body">
        Mentor assignments are read-only until the eligible mentor directory loads.
      </p>}
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
