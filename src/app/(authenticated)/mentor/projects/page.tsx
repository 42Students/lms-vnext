import { Suspense } from "react";
import { getMentorProjectTeamSizes } from "@/modules/projects/mentor-project-team-size-service";
import {getMentorPrototypeSprintSummaries} from "@/modules/projects/mentor-prototype-sprint-summary-service";
import {getMentorStudentWatch} from "@/modules/projects/mentor-student-watch-service";
import { getMentorProjectWorkCounts } from "@/modules/projects/mentor-project-work-service";
import { mentorTaskProgress, matchesMentorProjectWork } from "@/modules/projects/mentor-project-work-model";
import { mentorProjectListQuerySchema } from "@/modules/projects/mentor-project-list-query";
import { singleValueMentorFilters } from "@/modules/projects/mentor-filter-query";
import { compareMentorProjects, compareMentorProjectsByMostProgress, compareMentorProjectsByOpenTasks, compareMentorProjectsByTeamSize, compareMentorProjectsByProgress } from "@/modules/projects/mentor-project-order-model";
import { matchesMentorProjectAssignment } from "@/modules/projects/mentor-project-assignment-filter-model";
import { matchesMentorProjectAttention } from "@/modules/projects/mentor-project-attention-filter-model";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { MentorProjectsUnavailable } from "@/components/projects/mentor-projects-unavailable";
import {
  ProjectParticipantListControls,
  ProjectParticipantPagination,
} from "@/components/projects/project-participant-list-controls";
import { MentorPrototypeHome } from "@/components/projects/mentor-prototype-home";
import { ProjectList } from "@/components/projects/project-list";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { Disclosure } from "@/components/ui/disclosure";
import { ErrorState } from "@/components/ui/error-state";
import { hasMembershipRole } from "@/modules/identity/context";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import { listMyMentorProjectAttention } from "@/modules/projects/mentor-attention-service";
import { listMyProjectInstances } from "@/modules/projects/member-service";
import {listPagedMentorProjects} from "@/modules/projects/mentor-paged-project-list-service";
import {canPageMentorProjectList} from "@/modules/projects/mentor-paged-project-list-model";

function MentorProjectsLoading() {
  return <div className="min-w-0 space-y-4" aria-busy="true" aria-label="Checking Projects access">
    <PageHeader title="Projects" description="Checking Projects access…"/>
    <LoadingState label="Checking Projects access"/>
  </div>;
}
type MentorProjectParams=Record<string,string|string[]|undefined>;
export default function MentorProjectsPage({searchParams}:{searchParams:Promise<MentorProjectParams>}) {
  return <Suspense fallback={<MentorProjectsLoading/>}>
    <MentorProjectsContent searchParams={searchParams}/>
  </Suspense>;
}
export async function MentorProjectsContent({
  searchParams,
}: {
  searchParams: Promise<
    Record<
      string,
      string | string[] | undefined
    >
  >;
}) {
  const context =
    await getCurrentRequestContext();
  if (
    !hasMembershipRole(
      context,
      "MENTOR",
    )
  ) {
    redirect("/dashboard");
  }

  const available =
    await resolveOptionalModuleAccess(
      context,
    ).catch(() => null);
  if (
    available?.projects.enabled !== true
  ) {
    return <MentorProjectsUnavailable loadFailed={available===null} />;
  }

  const params = await searchParams;
  const parsed = mentorProjectListQuerySchema.safeParse(
    singleValueMentorFilters(params),
  );
  if (!parsed.success) {
    return <div className="min-w-0 space-y-6">
      <PageHeader title="Projects" />
      <ErrorState title="Invalid Project filters" description="Review the project search, attention, status and page filters."
        retryHref="/mentor/projects" retryLabel="Clear filters"/>
    </div>;
  }
  const query = parsed.data;

  // MEN-projects-meetings-10: common filters are paged and counted in SQL.
  // Nontrivial attention/task ranking keeps the legacy full-set path.
  const canPageInSql=canPageMentorProjectList(query);
  // A list failure belongs next to this page, not to a route-level error that
  // loses the current filter controls. Never infer an empty list from a failed read.
  const loaded=await (async()=>{
    const paged=canPageInSql?await listPagedMentorProjects(context,query):null;
    const allRows=paged?.items??await listMyProjectInstances(context);
    if(!Array.isArray(allRows))throw new Error("INVALID_PROJECT_RECORDS");
    const [attentionRows,workCounts,teamSizes,sprintSummaries,studentWatch]=await Promise.all([
      listMyMentorProjectAttention(context,new Date(),paged?allRows:undefined),
      getMentorProjectWorkCounts(context,paged?allRows:undefined),
      getMentorProjectTeamSizes(context,paged?allRows:undefined),
      getMentorPrototypeSprintSummaries(context,paged?allRows:undefined),
      getMentorStudentWatch(context,paged?allRows:undefined),
    ]);
    return {paged,allRows,attentionRows,workCounts,teamSizes,sprintSummaries,studentWatch};
  })().catch(error=>({
    failure:error instanceof Error&&error.message==="INVALID_PROJECT_RECORDS"
      ?"The projects page did not return a valid records array."
      :"Projects could not be loaded",
  }));
  if("failure" in loaded)return <div className="min-w-0 space-y-4">
    <PageHeader title="Projects" description="Choose a project to open its workspace."/>
    <ErrorState title={loaded.failure}
      description="Check your connection, then try again. Your project data has not been changed."
      action={<Link href={"/mentor/projects?"+new URLSearchParams(
        Object.entries(params).filter((item):item is [string,string]=>
          typeof item[1]==="string"&&item[1].length<=120)
      ).toString()} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Retry</Link>}/>
  </div>;
  const {paged,allRows,attentionRows,workCounts,teamSizes,sprintSummaries,studentWatch}=loaded;
  const alerts = new Map<
    string,
    Set<string>
  >();
  const kinds = new Map<
    string,
    Set<string>
  >();
  for (const item of attentionRows) {
    const labels =
      alerts.get(item.projectId) ??
      new Set<string>();
    const projectKinds =
      kinds.get(item.projectId) ??
      new Set<string>();

    projectKinds.add(item.kind);
    if (item.kind === "REVIEW") {
      labels.add("Needs review");
    } else if (
      item.kind === "STALLED"
    ) {
      labels.add("Stalled");
    } else if (
      item.kind === "REQUESTED"
    ) {
      labels.add("Meeting request");
    } else if (
      item.kind === "MEETING_SOON"
    ) {
      labels.add("Meeting soon");
    }

    alerts.set(
      item.projectId,
      labels,
    );
    kinds.set(
      item.projectId,
      projectKinds,
    );
  }

  const normalizedSearch =
    query.search?.toLowerCase();
  const filtered = allRows
    .filter(
      (row) =>
        row.memberRole === "MENTOR",
    )
    .filter(row => matchesMentorProjectAssignment(query.assignment, row.isPrimaryMentor))
    .filter(row => matchesMentorProjectWork(query.work, workCounts?.get(row.project.id)))
    .filter((row) => {
      if (!normalizedSearch) {
        return true;
      }
      return [
        row.project.title,
        row.project.slug,
        row.project.courseLabel ?? "",
        row.project.summary ?? "",
      ].some((value) =>
        value
          .toLowerCase()
          .includes(
            normalizedSearch,
          ),
      );
    })
    .filter((row) => {
      if (!query.status) {
        return true;
      }
      if (query.status === "BLOCKED") {
        return Boolean(row.project.blocker?.trim()) ||
          Boolean(kinds.get(row.project.id)?.has("STALLED"));
      }
      if (query.status === "IN_PROGRESS") {
        const facts = workCounts.get(row.project.id);
        return row.project.status === "ACTIVE" && (facts?.open ?? 0) > 0;
      }
      if (query.status === "READY") {
        const facts = workCounts.get(row.project.id);
        return row.project.status === "COMPLETED" ||
          Boolean(facts && facts.total > 0 && facts.open === 0);
      }
      if (
        query.status === "CURRENT"
      ) {
        return (
          row.project.status !==
            "ARCHIVED"
        );
      }
      return (
        row.project.status ===
        query.status
      );
    })
    .filter((row) => query.attention==="BLOCKED"?
      (Boolean(row.project.blocker?.trim())||
        Boolean(kinds.get(row.project.id)?.has("STALLED"))):
      matchesMentorProjectAttention(query.attention, kinds.get(row.project.id)))
    .sort((a,b) => query.sort === "PROGRESS"
      ? compareMentorProjectsByProgress(a.project,b.project,
          mentorTaskProgress(workCounts.get(a.project.id),a.project.progressPercent)?.percent,
          mentorTaskProgress(workCounts.get(b.project.id),b.project.progressPercent)?.percent)
      : query.sort === "PROGRESS_DESC"
      ? compareMentorProjectsByMostProgress(a.project,b.project,
          mentorTaskProgress(workCounts.get(a.project.id),a.project.progressPercent)?.percent,
          mentorTaskProgress(workCounts.get(b.project.id),b.project.progressPercent)?.percent)
      : query.sort === "OPEN_TASKS"
      ? compareMentorProjectsByOpenTasks(a.project,b.project,
          workCounts.get(a.project.id)?.open ?? 0, workCounts.get(b.project.id)?.open ?? 0)
      : query.sort === "TEAM_SIZE_DESC"
      ? compareMentorProjectsByTeamSize(a.project,b.project,
          teamSizes.get(a.project.id) ?? 0, teamSizes.get(b.project.id) ?? 0,"LARGEST")
      : query.sort === "TEAM_SIZE_ASC"
      ? compareMentorProjectsByTeamSize(a.project,b.project,
          teamSizes.get(a.project.id) ?? 0, teamSizes.get(b.project.id) ?? 0,"SMALLEST")
      : compareMentorProjects(a.project,b.project,query.sort));

  const total = paged?.total??filtered.length;
  const totalPages = paged?.totalPages??Math.max(
    1,
    Math.ceil(
      total /
        (query.pageSize ?? 25),
    ),
  );
  const page = paged?.page??Math.min(
    query.page ?? 1,
    totalPages,
  );
  const start =
    (page - 1) *
    (query.pageSize ?? 25);
  const rows = paged?filtered:filtered.slice(
    start,
    start +
      (query.pageSize ?? 25),
  );
  const controlQuery = {
    sort: query.sort,
    pageSize: query.pageSize,
    page,
    ...(query.search !== undefined ? { search: query.search } : {}),
    ...(query.status !== undefined ? { status: query.status } : {}),
    ...(query.assignment !== undefined ? { assignment: query.assignment } : {}),
    ...(query.attention !== undefined ? { attention: query.attention } : {}),
    ...(query.work !== undefined ? { work: query.work } : {}),
  };

  return (
    <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
      <MentorPrototypeHome
        scope={context.user.id}
        attention={attentionRows}
        studentWatch={studentWatch}
        teamCount={allRows.filter(row=>row.memberRole==="MENTOR").length}
        membershipCount={Array.from(teamSizes.values()).reduce((sum,count)=>sum+count,0)}
      />

      <ProjectParticipantListControls
        basePath="/mentor/projects"
        query={controlQuery}
        mentor
      />

      <ProjectList
        items={rows.map((row) => {
          const projectAlerts =
            [...(
              alerts.get(
                row.project.id,
              ) ?? []
            )];
          const projectKinds =
            kinds.get(
              row.project.id,
            );
          const directTab =
            projectKinds?.has("REVIEW")
              ? "delivery"
              : projectKinds?.has(
                    "REQUESTED",
                  ) ||
                  projectKinds?.has(
                    "MEETING_SOON",
                  )
                ? "team"
                : null;

          const progress = mentorTaskProgress(workCounts.get(row.project.id), row.project.progressPercent);
          const nextAction = row.project.status === "ARCHIVED" ? undefined :
            projectKinds?.has("REVIEW") ? "Review submission" : row.project.nextAction?.trim() ||
            (row.project.blocker?.trim() ? "Open blocked work" : "Open workspace");
          const blockedHref = row.project.status !== "ARCHIVED" && row.project.blocker?.trim()
            ? "/mentor/projects/" + row.project.id + "?tab=board&lane=BLOCKED" : undefined;
          return {
            id: row.project.id,
            title: row.project.title,
            summary:
              row.project.summary,
            status:
              row.project.status,
            updatedAt:
              row.project.updatedAt,
            memberCount: teamSizes.get(row.project.id) ?? 0,
            ...(workCounts.has(row.project.id) ? {
              taskTotal:workCounts.get(row.project.id)!.total,
              taskDone:Math.max(0,workCounts.get(row.project.id)!.total-workCounts.get(row.project.id)!.open),
            } : {}),
            ...(sprintSummaries.has(row.project.id) ? {
              sprintTotal:sprintSummaries.get(row.project.id)!.total,
              sprintCompleted:sprintSummaries.get(row.project.id)!.completed,
              sprintActiveSequence:sprintSummaries.get(row.project.id)!.activeSequence,
              sprintSegments:sprintSummaries.get(row.project.id)!.segments,
            } : {}),
            ...(progress?.percent !== undefined ? { progressPercent: progress.percent } : {}),
            ...(progress?.label !== undefined ? { progressDetail: progress.label } : {}),
            readOnlyLabel: row.project.status === "ARCHIVED" ? "Read-only" : null,
            courseLabel:row.project.courseLabel,
            phase:row.project.phase,
            phaseLabel:row.project.phase?.trim() || "In progress",
            dueLabel:row.project.dueLabel || row.project.endDate,
            ...(nextAction !== undefined ? { actionLine: nextAction } : {}),
            ...(blockedHref !== undefined ? { blockedHref } : {}),
            participation:
              row.isPrimaryMentor
                ? "Primary mentor"
                : "Mentor",
            attention:row.project.blocker?.trim()?[...projectAlerts,"Blocked"]:projectAlerts,
            href:"/mentor/projects/"+row.project.id+
              (row.project.blocker?.trim()?"?tab=board&lane=BLOCKED":directTab?"?tab="+directTab:""),
          };
        })}
        basePath="/mentor/projects"
        emptyTitle={
          query.search ||
          query.status ||
          query.attention || query.assignment || query.work
            ? "No projects match these filters."
            : "No projects assigned yet."
        }
        emptyDescription={
          query.search ||
          query.status ||
          query.attention || query.assignment || query.work
            ? "Clear or change the filters to see other assigned Projects."
            : "Projects appear here when a College Admin assigns your Mentor membership to the team."
        }
      />

      <ProjectParticipantPagination
        basePath="/mentor/projects"
        query={controlQuery}
        page={page}
        totalPages={totalPages}
        total={total}
      />
      <Disclosure title="More project links" className="min-w-0 border-b border-border" contentClassName="min-w-0 py-3">
        <div className="grid min-w-0 gap-x-4 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/mentor/reviews"
              className="inline-flex min-h-11 min-w-0 items-center text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-teal-deep)]">
              Review queue
            </Link>
            <Link href="/mentor/sprint-progress"
              className="inline-flex min-h-11 min-w-0 items-center text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-teal-deep)]">
              Sprint progress
            </Link>
            <Link href="/mentor/task-reviews"
              className="inline-flex min-h-11 min-w-0 items-center text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-teal-deep)]">
              Task reviews
            </Link>
            <Link href="/mentor/reports"
              className="inline-flex min-h-11 min-w-0 items-center text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-teal-deep)]">
              Reports
            </Link>
            <Link href="/mentor/activity"
              className="inline-flex min-h-11 min-w-0 items-center text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-teal-deep)]">
              Activity
            </Link>
            <Link
              href="/mentor/calendar"
              className="inline-flex min-h-11 min-w-0 items-center text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-teal-deep)]"
            >
              Meetings
            </Link>
            <Link
              href="/mentor/notifications"
              className="inline-flex min-h-11 min-w-0 items-center text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-teal-deep)]"
            >
              Notifications
            </Link>
          </div>
      </Disclosure>


    </div>
  );
}
