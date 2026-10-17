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
import { hasMembershipRole } from "@/modules/identity/context";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import { listMyMentorProjectAttention } from "@/modules/projects/mentor-attention-service";
import { listMyProjectInstances } from "@/modules/projects/member-service";

export default async function MentorProjectsPage({
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
    return <section role="alert" className="space-y-3">
      <h1 className="text-xl font-semibold">Invalid Project filters</h1>
      <Link href="/mentor/projects" className="text-primary-text underline">Clear filters</Link>
    </section>;
  }
  const query = parsed.data;

  const [allRows, attentionRows] =
    await Promise.all([
      listMyProjectInstances(
        context,
      ),
      listMyMentorProjectAttention(
        context,
      ),
    ]);

  const [workCounts, teamSizes] = await Promise.all([
    getMentorProjectWorkCounts(context), getMentorProjectTeamSizes(context),
  ]);
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

  const total = filtered.length;
  const totalPages = Math.max(
    1,
    Math.ceil(
      total /
        (query.pageSize ?? 25),
    ),
  );
  const page = Math.min(
    query.page ?? 1,
    totalPages,
  );
  const start =
    (page - 1) *
    (query.pageSize ?? 25);
  const rows = filtered.slice(
    start,
    start +
      (query.pageSize ?? 25),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Choose a project to open its workspace."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/mentor/reviews"
              className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-primary-text">
              Review queue
            </Link>
            <Link href="/mentor/sprint-progress"
              className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-primary-text">
              Sprint progress
            </Link>
            <Link href="/mentor/task-reviews"
              className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-primary-text">
              Task reviews
            </Link>
            <Link href="/mentor/reports"
              className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-primary-text">
              Reports
            </Link>
            <Link href="/mentor/activity"
              className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-primary-text">
              Activity
            </Link>
            <Link
              href="/mentor/calendar"
              className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-primary-text"
            >
              Meetings
            </Link>
            <Link
              href="/mentor/notifications"
              className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-primary-text"
            >
              Notifications
            </Link>
          </div>
        }
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
            dueLabel:row.project.dueLabel || row.project.endDate,
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


    </div>
  );
}
