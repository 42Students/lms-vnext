import { Suspense } from "react";
import { getMentorProjectTeamSizes } from "@/modules/projects/mentor-project-team-size-service";
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
import { ProjectList } from "@/components/projects/project-list";
import { PageHeader } from "@/components/ui/page-header";
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
    <div aria-hidden="true" className="space-y-4">{[1,2,3].map(id=><div key={id} className="rounded-lg border border-border p-5">
      <span className="block h-4 w-1/3 animate-pulse rounded bg-muted"/>
      <span className="mt-3 block h-5 w-1/2 animate-pulse rounded bg-muted"/>
      <span className="mt-3 block h-4 w-4/5 animate-pulse rounded bg-muted"/>
    </div>)}</div>
  </div>;
}
type MentorProjectParams=Record<string,string|string[]|undefined>;
export default function MentorProjectsPage({searchParams}:{searchParams:Promise<MentorProjectParams>}) {
  return <Suspense fallback={<MentorProjectsLoading/>}>
    <MentorProjectsContent searchParams={searchParams}/>
  </Suspense>;
}
async function MentorProjectsContent({
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
        action={<Link href="/mentor/projects" className="inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Clear filters</Link>}/>
    </div>;
  }
  const query = parsed.data;

  // MEN-projects-meetings-10: common filters are paged and counted in SQL.
  // Nontrivial attention/task ranking keeps the legacy full-set path.
  const retryLink = <Link href="/mentor/projects" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Retry</Link>;
  const readFailure = () => <div className="min-w-0 space-y-4">
    <PageHeader title="Projects"/>
    <ErrorState title="Projects could not be loaded"
      description="Couldn't refresh projects. Try again; your college and mentor access remain unchanged."
      action={retryLink}/>
  </div>;
  const canPageInSql=canPageMentorProjectList(query);
  const pagedResult = canPageInSql
    ? await Promise.allSettled([listPagedMentorProjects(context,query)])
    : null;
  if(pagedResult?.[0].status==="rejected")return readFailure();
  const paged=pagedResult?.[0].status==="fulfilled"?pagedResult[0].value:null;
  const allResult=paged ? null : await Promise.allSettled([listMyProjectInstances(context)]);
  if(allResult?.[0].status==="rejected")return readFailure();
  const allRows=paged?.items??(allResult?.[0].status==="fulfilled"?allResult[0].value:[]);
  const dependent=await Promise.allSettled([
    listMyMentorProjectAttention(context,new Date(),paged?allRows:undefined),
    getMentorProjectWorkCounts(context,paged?allRows:undefined),
    getMentorProjectTeamSizes(context,paged?allRows:undefined),
  ]);
  if(dependent.some(row=>row.status==="rejected"))return readFailure();
  const attentionRows=dependent[0].status==="fulfilled"?dependent[0].value:[];
  const workCounts=dependent[1].status==="fulfilled"?dependent[1].value:new Map();
  const teamSizes=dependent[2].status==="fulfilled"?dependent[2].value:new Map();
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
    .filter((row) => matchesMentorProjectAttention(query.attention, kinds.get(row.project.id)))
    .sort((a,b) => query.sort === "PROGRESS"
      ? compareMentorProjectsByProgress(a.project,b.project,
          mentorTaskProgress(workCounts.get(a.project.id))?.percent,
          mentorTaskProgress(workCounts.get(b.project.id))?.percent)
      : query.sort === "PROGRESS_DESC"
      ? compareMentorProjectsByMostProgress(a.project,b.project,
          mentorTaskProgress(workCounts.get(a.project.id))?.percent,
          mentorTaskProgress(workCounts.get(b.project.id))?.percent)
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

  return (
    <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
      <PageHeader
        title="Projects"
        description="Choose a project to open its workspace."
      />

      <ProjectParticipantListControls
        basePath="/mentor/projects"
        query={{
          ...query,
          page,
        }}
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
            progressPercent: mentorTaskProgress(workCounts.get(row.project.id))?.percent ?? undefined,
            progressDetail: mentorTaskProgress(workCounts.get(row.project.id))?.label,
            readOnlyLabel: row.project.status === "ARCHIVED" ? "Read-only" : null,
            courseLabel:row.project.courseLabel,
            phase:row.project.phase,
            phaseLabel:row.project.phase?.trim() || "In progress",
            dueLabel:row.project.dueLabel || row.project.endDate,
            dueState:(()=>{
              const raw=row.project.endDate;
              if(!raw)return "No due date";
              const parsed=Date.parse(/^\\d{4}-\\d{2}-\\d{2}$/.test(raw)?raw+"T23:59:59+05:30":raw);
              if(!Number.isFinite(parsed))return "Due";
              const days=Math.ceil((parsed-Date.now())/86_400_000);
              return days<0?"Overdue":days<=7?"Due soon":"Due";
            })(),
            actionLine:projectKinds?.has("REVIEW")?"Review submission":row.project.nextAction?.trim() || (row.project.blocker?.trim()?"Open blocked work":"Open workspace"),
            blockedHref:row.project.blocker?.trim()
              ? "/mentor/projects/"+row.project.id+"?tab=board&lane=BLOCKED" : undefined,
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
        query={query}
        page={page}
        totalPages={totalPages}
        total={total}
      />
      <Disclosure title="More project links" className="min-w-0 border-b border-border" contentClassName="min-w-0 py-3">
        <div className="grid min-w-0 gap-x-4 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/mentor/reviews"
              className="inline-flex min-h-11 min-w-0 items-center text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
              Review queue
            </Link>
            <Link href="/mentor/sprint-progress"
              className="inline-flex min-h-11 min-w-0 items-center text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
              Sprint progress
            </Link>
            <Link href="/mentor/task-reviews"
              className="inline-flex min-h-11 min-w-0 items-center text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
              Task reviews
            </Link>
            <Link href="/mentor/reports"
              className="inline-flex min-h-11 min-w-0 items-center text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
              Reports
            </Link>
            <Link href="/mentor/activity"
              className="inline-flex min-h-11 min-w-0 items-center text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
              Activity
            </Link>
            <Link
              href="/mentor/calendar"
              className="inline-flex min-h-11 min-w-0 items-center text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
            >
              Meetings
            </Link>
            <Link
              href="/mentor/notifications"
              className="inline-flex min-h-11 min-w-0 items-center text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
            >
              Notifications
            </Link>
          </div>
      </Disclosure>


    </div>
  );
}
