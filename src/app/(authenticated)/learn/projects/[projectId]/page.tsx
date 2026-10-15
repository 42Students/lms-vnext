import { getProjectActivityPage } from "@/modules/projects/activity-service";
import { parseLearnerProjectActivityFilters } from "@/modules/projects/learner-project-activity-filter-model";
import { LearnerProjectActivity } from "@/components/projects/learner-project-activity";
import { notFound, redirect } from "next/navigation";
import { projectInstanceIdSchema } from "@/modules/projects/validation";
import { ProjectsServiceError } from "@/modules/projects/errors";
import { learnerProjectReadFailureDisposition } from "@/modules/projects/learner-project-detail-error-model";
import { getCurrentRequestContext } from "@/auth/request-context";
import { LearnerProjectTabs } from "@/components/projects/learner-project-tabs";
import { ProjectWorkspace } from "@/components/projects/project-workspace";
import { LearnerProjectBoardSearch } from "@/components/projects/learner-project-board-search";
import { learnerBoardStatusCounts } from "@/modules/projects/learner-board-summary-model";
import { learnerBoardPriorityCounts } from "@/modules/projects/learner-board-priority-model";
import { learnerBoardSortSchema,sortLearnerBoardTasks } from "@/modules/projects/learner-board-sort-model";
import { LearnerBoardTaskIndex } from "@/components/projects/learner-board-task-index";
import { LearnerProjectGoals } from "@/components/projects/learner-project-goals";
import { getLearnerProjectGoals } from "@/modules/projects/learner-project-goals-service";
import { LearnerBoardTaskDetailDialog } from "@/components/projects/learner-board-task-detail-dialog";
import { findOwnLearnerBoardTask } from "@/modules/projects/learner-board-task-detail-model";
import { learnerBoardTaskSelectionNotice } from "@/modules/projects/learner-board-selection-notice-model";
import Link from "next/link";
import { learnerBoardTaskHref } from "@/modules/projects/learner-board-task-detail-model";
import { filterLearnerBoardTasks, learnerBoardSearchSchema, learnerBoardPrioritySchema, learnerBoardStatusSchema, learnerBoardSprintSchema, learnerBoardReleaseSchema } from "@/modules/projects/learner-project-board-model";
import { requireProjectReadAccess } from "@/modules/projects/access";
import { getProjectWorkspaceView } from "@/modules/projects/workspace-view-service";

export default async function LearnerProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ tab?: string; taskSearch?: string; priority?: string; taskStatus?: string; taskSort?: string; sprintId?: string; releaseId?: string; taskId?: string; activityCategory?: string | string[]; activityFrom?: string | string[]; activityTo?: string | string[]; activityBeforeTime?: string | string[]; activityBeforeId?: string | string[] }>;
}) {
  const context = await getCurrentRequestContext();
  const { projectId } = await params;
  if (!projectInstanceIdSchema.safeParse(projectId).success) notFound();
  const { tab, taskSearch, priority: priorityInput, taskStatus: taskStatusInput, taskSort: taskSortInput, sprintId: sprintInput, releaseId: releaseInput, taskId, activityCategory, activityFrom, activityTo, activityBeforeTime, activityBeforeId } = await searchParams;
  const activeSection =
    tab === "board" || tab === "tasks"
      ? "tasks"
      : tab === "activity"
        ? "audit"
        : tab === "delivery"
          ? "delivery"
          : tab === "team" ||
              tab === "meetings" ||
              tab === "sprints" ||
              tab === "resources"
            ? (tab === "meetings" ? "team" : tab)
            : "overview";
  const access = await requireProjectReadAccess(
    context,
    projectId,
  ).catch(error => {
    if (error instanceof ProjectsServiceError &&
        learnerProjectReadFailureDisposition(error.code) === "NOT_FOUND") {
      notFound();
    }
    throw error;
  });

  if (access.access !== "LEARNER") {
    redirect("/learn/projects");
  }

  const workspace = await getProjectWorkspaceView(
    context,
    projectId,
  ).catch(error => {
    if (error instanceof ProjectsServiceError &&
        learnerProjectReadFailureDisposition(error.code) === "NOT_FOUND") {
      notFound();
    }
    throw error;
  });

  const parsedActivity = parseLearnerProjectActivityFilters({
    category: activityCategory, from: activityFrom, to: activityTo,
    beforeTime: activityBeforeTime, beforeId: activityBeforeId,
  });
  const filteredActivity = activeSection === "audit" && parsedActivity.success
    ? await getProjectActivityPage(context, projectId, parsedActivity.data) : { events: [], hasMore: false };

  const goals = activeSection === "overview"
    ? await getLearnerProjectGoals(context,projectId)
    : null;
  const search = learnerBoardSearchSchema.parse(taskSearch);
  const priority = learnerBoardPrioritySchema.safeParse(priorityInput).data ?? "";
  const status = learnerBoardStatusSchema.safeParse(taskStatusInput).data ?? "";
  const taskSort=learnerBoardSortSchema.catch("DEFAULT").parse(taskSortInput??"DEFAULT");
  const sprintId = learnerBoardSprintSchema.safeParse(sprintInput).data ?? "";
  const releaseId = learnerBoardReleaseSchema.safeParse(releaseInput).data ?? "";
  const sprintReleaseById = new Map(workspace.sprints.map(sprint => [sprint.id,sprint.releaseId]));
  const boardTasks = activeSection === "tasks"
    ? sortLearnerBoardTasks(filterLearnerBoardTasks(workspace.tasks, search, {priority,status,sprintId,releaseId,sprintReleaseById}),taskSort)
    : workspace.tasks;
  const selectedTask=activeSection==="tasks"
    ? findOwnLearnerBoardTask(boardTasks,taskId)
    : null;
  const boardFilters={taskSearch:search,priority,status,sprintId,releaseId,taskSort};
  const selectionNotice = activeSection === "tasks"
    ? learnerBoardTaskSelectionNotice(taskId, Boolean(selectedTask)) : null;
  const shownWorkspace = activeSection === "tasks"
    ? { ...workspace, tasks: boardTasks }
    : workspace;

  return (
    <div className="space-y-6">
      <LearnerProjectTabs projectId={projectId} />
      {activeSection === "tasks" ? (
        <LearnerProjectBoardSearch projectId={projectId} search={search} priority={priority} status={status} taskSort={taskSort} sprintId={sprintId} sprints={workspace.sprints} releaseId={releaseId} releases={workspace.releases}
          shown={boardTasks.length} total={workspace.tasks.length} statusCounts={learnerBoardStatusCounts(workspace.tasks)} priorityCounts={learnerBoardPriorityCounts(workspace.tasks)} />
      ) : null}
      {activeSection === "tasks" ? (
        <LearnerBoardTaskIndex projectId={projectId} tasks={boardTasks} filters={boardFilters} sprints={workspace.sprints} />
      ) : null}
      {selectionNotice ? (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-subtle p-4 text-sm text-body">
          <span>{selectionNotice}</span>
          <Link href={learnerBoardTaskHref(projectId, boardFilters)}
            className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Return to Board</Link>
        </div>
      ) : null}
      {selectedTask ? (
        <LearnerBoardTaskDetailDialog projectId={projectId} filters={boardFilters}
          task={selectedTask}
          sprintTitle={workspace.sprints.find(sprint=>sprint.id===selectedTask.sprintId)?.title??null} />
      ) : null}
      {goals ? <LearnerProjectGoals overview={goals} /> : null}
      {activeSection === "audit" ? <LearnerProjectActivity projectId={projectId}
        events={filteredActivity.events} hasMore={filteredActivity.hasMore} categoryInput={activityCategory}
        fromInput={activityFrom} toInput={activityTo}
        beforeTimeInput={activityBeforeTime} beforeIdInput={activityBeforeId} /> : <ProjectWorkspace
      workspace={shownWorkspace}
      backHref="/learn/projects"
      backLabel="Projects"
      eyebrow="Learner Project"
      mode="LEARNER"
      currentMembershipId={
        context.membership?.id ?? null
      }
      activeSection={activeSection}
      />}
    </div>
  );
}
