import { z } from "zod";
import Link from "next/link";
import { Banner } from "@/components/ui/banner";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  ProjectParticipantListControls,
  ProjectParticipantPagination,
  type ProjectParticipantListQuery,
} from "@/components/projects/project-participant-list-controls";
import { ProjectList } from "@/components/projects/project-list";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import { listMyLearnerProjectPageAttention } from "@/modules/projects/learner-attention-service";
import { listMyLearnerProjectPage } from "@/modules/projects/member-service";
import { listMyLearnerProjectTeams } from "@/modules/projects/learner-project-team-service";
import { listMyLearnerProjectProgress } from "@/modules/projects/learner-project-progress-service";
import { listMyLearnerProjectDueStates } from "@/modules/projects/learner-project-due-service";
import { learnerProjectListEmptyState } from "@/modules/projects/learner-project-list-empty-model";
import { learnerProjectArchiveState } from "@/modules/projects/learner-project-archive-model";
import { learnerProjectHasBlockedTasks } from "@/modules/projects/learner-project-work-model";

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
  const parsed = z.coerce.number().int().min(0).max(100000).safeParse(value);
  // The old LMS used zero-based pagination; page=0 is its bookmarked first page.
  return parsed.success ? Math.max(1,parsed.data) : 1;
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
    return <section className="min-w-0 space-y-4" role="status">
      <PageHeader title="Projects" description="This module is currently disabled for your college." />
      <p className="text-sm text-body">This module is currently disabled for your college.</p>
    </section>;
  }

  const params = await searchParams;
  const allowedKeys=["search","status","attention","work","sort","page","pageSize"];
  const invalidFilters=Object.keys(params).some(key=>!allowedKeys.includes(key)) ||
    Object.values(params).some(Array.isArray) ||
    (params["search"]!==undefined&&!searchSchema.safeParse(one(params["search"])).success) ||
    (params["status"]!==undefined&&!statusSchema.safeParse(one(params["status"])).success) ||
    (params["attention"]!==undefined&&!attentionSchema.safeParse(one(params["attention"])).success) ||
    (params["work"]!==undefined&&!workSchema.safeParse(one(params["work"])).success) ||
    (params["sort"]!==undefined&&!sortSchema.safeParse(one(params["sort"])).success) ||
    (params["page"]!==undefined&&!z.coerce.number().int().min(0).max(100000).safeParse(one(params["page"])).success) ||
    (params["pageSize"]!==undefined&&!z.coerce.number().int().safeParse(one(params["pageSize"])).success) ||
    (params["pageSize"]!==undefined&&![10,25,50].includes(Number(one(params["pageSize"]))));
  const status = one(params["status"]);
  const attention = one(params["attention"]);
  const work = one(params["work"]);
  const parsedSearch=searchSchema.safeParse(one(params["search"]));
  const parsedStatus=statusSchema.safeParse(status);
  const parsedAttention=attentionSchema.safeParse(attention);
  const parsedWork=workSchema.safeParse(work);
  const parsedSort=sortSchema.safeParse(one(params["sort"]));
  const query: ProjectParticipantListQuery = {
    ...(parsedSearch.success && parsedSearch.data ? {search:parsedSearch.data} : {}),
    ...(parsedStatus.success ? {status:parsedStatus.data} : {}),
    ...(parsedAttention.success ? {attention:parsedAttention.data} : {}),
    ...(parsedWork.success ? {work:parsedWork.data} : {}),
    ...(parsedSort.success ? {sort:parsedSort.data} : {}),
    page: parsePage(one(params["page"])),
    pageSize: parsePageSize(one(params["pageSize"])),
  };

  const directory = await listMyLearnerProjectPage(context,query);
  const {rows,total,page,totalPages} = directory;
  const pageProjectIds=rows.map(row=>row.project.id);
  const [attentionRows,teamSummaries,projectProgress,dueStates]=await Promise.all([
    listMyLearnerProjectPageAttention(context,pageProjectIds),
    listMyLearnerProjectTeams(context,pageProjectIds),
    listMyLearnerProjectProgress(context,pageProjectIds),
    listMyLearnerProjectDueStates(context,pageProjectIds),
  ]);
  const teamsByProject=new Map(teamSummaries.map(row=>[row.projectId,row]));
  const progressByProject=new Map(projectProgress.map(row=>[row.projectId,row]));
  const dueByProject=new Map(dueStates.map(row=>[row.projectId,row]));
  const attentionByProject=new Map<string,"CHANGES_REQUESTED"|"DRAFT">(
    attentionRows.map(item=>[item.projectId,item.kind]),
  );
  const emptyState=learnerProjectListEmptyState(directory.assignedCount,total);

  return (
    <section role="region" aria-label="Projects workspace" aria-live="polite"
      className="min-w-0 space-y-5 rounded-[var(--lms-canvas-radius)] bg-surface p-4 md:p-[var(--lms-canvas-padding)]">
      <PageHeader title="Projects" description="Choose a project to open its workspace." />
      {invalidFilters ? <Banner tone="warning" role="status">
        Some project filters were invalid and have been reset to safe defaults.
        <Link href="/learn/projects" className="ml-2 inline-flex min-h-9 items-center font-semibold text-primary-text underline">
          Clear filters
        </Link>
      </Banner> : null}
      {query.page!==page ? <Banner tone="info" role="status">
        That project page is no longer available. Showing page {page} instead.
      </Banner> : null}

      <div className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-border p-3 sm:p-4">
        <ProjectParticipantListControls basePath="/learn/projects"
          query={{...query,page}} learner/>
      </div>

      <ProjectList
        items={rows.map((row) => {
          const archived = row.project.status === "ARCHIVED";
          const projectAttention = archived ? undefined : attentionByProject.get(row.project.id);
          const blocked = !archived && (Boolean(row.project.blocker?.trim()) ||
            learnerProjectHasBlockedTasks(row.project.status, progressByProject.get(row.project.id)));
          const progress = progressByProject.get(row.project.id);
          const team = teamsByProject.get(row.project.id);
          const due = dueByProject.get(row.project.id);
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
            ...(team?.memberCount !== undefined ? {memberCount:team.memberCount} : {}),
            ...((progress?.percentage ?? row.project.progressPercent) != null ? {progressPercent: progress?.percentage ?? row.project.progressPercent} : {}),
            ...(due?.state !== undefined ? {dueState:due.state} : {}),
            ...(due?.date !== undefined ? {dueDate:due.date} : {}),
            ...(progress ? {progressDetail: "Task completion " + String(progress.completedTasks) + "/" + String(progress.totalTasks) + " tasks"} : row.project.progressPercent!==null ? {progressDetail:"Admin-reported progress / Manual estimate"} : {}),
            actionLine: archived ? "Archived · view only" :
              projectAttention === "CHANGES_REQUESTED" ? "Update your submission" :
              projectAttention === "DRAFT" ? "Finish your draft submission" :
              blocked ? "Open blocked work" : row.project.nextAction?.trim() || "Open workspace",
            ...(blocked ? {blockedHref: "/learn/projects/" + row.project.id + "?tab=board&lane=Blocked"} : {}),
            ...(row.project.blocker?.trim() ? {blockerText:row.project.blocker.trim()} : {}),
            attention:
              archived ? [] : projectAttention === "CHANGES_REQUESTED"
                ? ["Changes requested"]
                : projectAttention === "DRAFT"
                  ? ["Draft submission"]
                  : blocked ? ["Blocked"] : [],
            href:
              "/learn/projects/" +
              row.project.id +
              (archived ? "" : projectAttention ? "?tab=delivery" : blocked ? "?tab=board&lane=Blocked" : ""),
          };
        })}
        basePath="/learn/projects"
        emptyTitle={emptyState.title}
        emptyDescription={emptyState.description}
      />

      <div className="min-w-0 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:justify-center min-[768px]:[&_a]:min-h-9">
        <ProjectParticipantPagination
          basePath="/learn/projects"
          query={query}
          page={page}
          totalPages={totalPages}
          total={total}
        />
      </div>


    </section>
  );
}
