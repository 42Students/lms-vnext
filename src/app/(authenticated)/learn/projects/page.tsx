import { z } from "zod";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  ProjectParticipantListControls,
  ProjectParticipantPagination,
  type ProjectParticipantListQuery,
} from "@/components/projects/project-participant-list-controls";
import { ProjectList } from "@/components/projects/project-list";
import { LearnerProjectMobileFilters } from "@/components/projects/learner-project-mobile-filters";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import { listMyLearnerProjectAttention } from "@/modules/projects/learner-attention-service";
import { listMyProjectInstances } from "@/modules/projects/member-service";
import { listMyLearnerProjectTeams } from "@/modules/projects/learner-project-team-service";
import { listMyLearnerProjectProgress } from "@/modules/projects/learner-project-progress-service";
import { listMyLearnerProjectDueStates } from "@/modules/projects/learner-project-due-service";
import { learnerProjectListEmptyState } from "@/modules/projects/learner-project-list-empty-model";
import { learnerProjectArchiveState } from "@/modules/projects/learner-project-archive-model";
import { learnerProjectMatchesSearch } from "@/modules/projects/learner-project-search-model";
import { learnerProjectHasBlockedTasks, learnerProjectHasNoTrackedTasks } from "@/modules/projects/learner-project-work-model";
import { sortLearnerProjectRows } from "@/modules/projects/learner-project-sort-model";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const searchSchema = z.string().trim().max(100);
const statusSchema = z.enum(["CURRENT", "PLANNED", "ACTIVE", "COMPLETED", "ARCHIVED","IN_PROGRESS","READY","BLOCKED"]);
const attentionSchema = z.enum(["LEARNER_ACTION","BLOCKED"]);
const workSchema = z.enum(["BLOCKED","NO_TASKS"]);
const sortSchema = z.enum(["RECENT", "TITLE", "PROGRESS"]);

function parsePageSize(value: string | undefined) {
  const parsed = z.coerce.number().int().safeParse(value);
  return parsed.success && (parsed.data === 10 || parsed.data === 50)
    ? parsed.data : 25;
}

function parsePage(value: string | undefined) {
  const parsed = z.coerce.number().int().min(1).max(100000).safeParse(value);
  return parsed.success ? parsed.data : 1;
}

export default async function LearnerProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if (!hasMembershipRole(context, "LEARNER")) {
    redirect("/dashboard");
  }

  // LEARNER-projects-24/25: deny bookmark/direct-route access if disabled.
  if (!(await resolveOptionalModuleAccess(context)).projects.enabled) {
    return <section className="space-y-3" role="status">
      <PageHeader title="Projects" description="This module is currently disabled for your college." />
      <p className="text-sm text-body">This module is currently disabled for your college.</p>
    </section>;
  }

  const params = await searchParams;
  const status = one(params.status);
  const attention = one(params.attention);
  const work = one(params.work);
  const query: ProjectParticipantListQuery = {
    search: searchSchema.safeParse(one(params.search)).data || undefined,
    status: statusSchema.safeParse(status).data,
    attention: attentionSchema.safeParse(attention).data,
    work: workSchema.safeParse(work).data,
    sort: sortSchema.safeParse(one(params.sort)).data,
    page: parsePage(one(params.page)),
    pageSize: parsePageSize(one(params.pageSize)),
  };

  const [allRows, attentionRows] = await Promise.all([
    listMyProjectInstances(context),
    listMyLearnerProjectAttention(context),
  ]);
  const teamSummaries = await listMyLearnerProjectTeams(
    context,
    allRows.filter(row => row.memberRole === "LEARNER").map(row => row.project.id),
  );
  const teamsByProject = new Map(teamSummaries.map(row => [row.projectId, row]));
  const projectProgress = await listMyLearnerProjectProgress(
    context,
    allRows.filter(row => row.memberRole === "LEARNER").map(row => row.project.id),
  );
  const progressByProject = new Map(projectProgress.map(row => [row.projectId, row]));
  const dueStates = await listMyLearnerProjectDueStates(context, allRows.filter(row => row.memberRole === "LEARNER").map(row => row.project.id));
  const dueByProject = new Map(dueStates.map(row => [row.projectId, row]));

  const attentionByProject = new Map<
    string,
    "CHANGES_REQUESTED" | "DRAFT"
  >(attentionRows.map((item) => [item.projectId, item.kind]));

  const filtered = sortLearnerProjectRows(allRows
    .filter((row) => row.memberRole === "LEARNER")
    .filter((row) => learnerProjectMatchesSearch(
      row.project, teamsByProject.get(row.project.id)?.mentorName ?? null, query.search,
    ))
    .filter((row) => {
      if (!query.status) return true;
      if (query.status === "CURRENT") {
        return row.project.status !== "ARCHIVED" &&
          row.project.status !== "COMPLETED";
      }
      if(query.status==="IN_PROGRESS")return row.project.status==="ACTIVE"&&
        (progressByProject.get(row.project.id)?.completedTasks??0)>0;
      if(query.status==="READY")return row.project.status==="COMPLETED";
      if(query.status==="BLOCKED")return Boolean(row.project.blocker?.trim())||
        learnerProjectHasBlockedTasks(row.project.status,progressByProject.get(row.project.id));
      return row.project.status === query.status;
    })
    .filter((row) =>
      query.attention !== "LEARNER_ACTION" ||
      attentionByProject.has(row.project.id),
    )
    .filter((row)=>query.attention!=="BLOCKED"||
      Boolean(row.project.blocker?.trim())||
      learnerProjectHasBlockedTasks(row.project.status,progressByProject.get(row.project.id)))
    .filter((row) => query.work !== "BLOCKED" || learnerProjectHasBlockedTasks(
      row.project.status, progressByProject.get(row.project.id),
    ))
    .filter((row) => query.work !== "NO_TASKS" || learnerProjectHasNoTrackedTasks(
      row.project.status, progressByProject.get(row.project.id),
    ))
    ,query.sort ?? "RECENT",progressByProject);

  const total = filtered.length;
  const emptyState = learnerProjectListEmptyState(
    allRows.filter(row => row.memberRole === "LEARNER").length, total,
  );
  const size = query.pageSize ?? 25;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const page = Math.min(query.page ?? 1, totalPages);
  const rows = filtered.slice((page - 1) * size, page * size);

  return (
    <div className="space-y-6">
      <PageHeader title="Projects" description="Choose a project to open its workspace." />

      <LearnerProjectMobileFilters query={{ ...query, page }} />
      <div className="hidden sm:block">
        <ProjectParticipantListControls
          basePath="/learn/projects"
          query={{ ...query, page }}
          learner
        />
      </div>

      <ProjectList
        items={rows.map((row) => {
          const projectAttention = attentionByProject.get(row.project.id);
          const blocked = Boolean(row.project.blocker?.trim()) ||
            learnerProjectHasBlockedTasks(row.project.status, progressByProject.get(row.project.id));
          return {
            id: row.project.id,
            title: row.project.title,
            summary: row.project.summary,
            status: row.project.status,
            readOnlyLabel: learnerProjectArchiveState(row.project.status).label,
            updatedAt: row.project.updatedAt,
            participation: "Learner",
            mentorName: teamsByProject.get(row.project.id)?.mentorName ?? null,
            courseLabel: row.project.courseLabel,
            phase: row.project.phase,
            dueLabel: row.project.dueLabel,
            memberCount: teamsByProject.get(row.project.id)?.memberCount,
            progressPercent: progressByProject.get(row.project.id)?.percentage ?? row.project.progressPercent ?? undefined,
            dueState: dueByProject.get(row.project.id)?.state,
            dueDate: dueByProject.get(row.project.id)?.date,
            progressDetail: progressByProject.has(row.project.id)
              ? "Task completion " + String(progressByProject.get(row.project.id)!.completedTasks) +
                "/" + String(progressByProject.get(row.project.id)!.totalTasks) + " tasks"
              : row.project.progressPercent!==null?"Admin-reported progress / Manual estimate":undefined,
            actionLine: projectAttention === "CHANGES_REQUESTED" ? "Update your submission" :
              projectAttention === "DRAFT" ? "Finish your draft submission" :
              blocked ? "Open blocked work" : row.project.nextAction?.trim() || "Open workspace",
            blockedHref: blocked ? "/learn/projects/" + row.project.id + "?tab=board&taskStatus=BLOCKED" : undefined,
            attention:
              projectAttention === "CHANGES_REQUESTED"
                ? ["Changes requested"]
                : projectAttention === "DRAFT"
                  ? ["Draft submission"]
                  : blocked ? ["Blocked"] : [],
            href:
              "/learn/projects/" +
              row.project.id +
              (projectAttention ? "?tab=delivery" : blocked ? "?tab=board&taskStatus=BLOCKED" : ""),
          };
        })}
        basePath="/learn/projects"
        emptyTitle={emptyState.title}
        emptyDescription={emptyState.description}
      />

      <div className="[&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:justify-center">
        <ProjectParticipantPagination
          basePath="/learn/projects"
          query={query}
          page={page}
          totalPages={totalPages}
          total={total}
        />
      </div>


    </div>
  );
}
