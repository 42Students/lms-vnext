import { getProjectActivityPage } from "@/modules/projects/activity-service";
import { parseLearnerProjectActivityFilters } from "@/modules/projects/learner-project-activity-filter-model";
import { LearnerProjectActivity } from "@/components/projects/learner-project-activity";
import { notFound, redirect } from "next/navigation";
import { projectInstanceIdSchema } from "@/modules/projects/validation";
import { ProjectsServiceError } from "@/modules/projects/errors";
import { learnerProjectReadFailureDisposition } from "@/modules/projects/learner-project-detail-error-model";
import { getCurrentRequestContext } from "@/auth/request-context";
import {getDb} from "@/db/client";
import {projectInstances,projectMembers} from "@/db/schema";
import {and,eq,isNull} from "drizzle-orm";
import { LearnerProjectTabs } from "@/components/projects/learner-project-tabs";
import { ProjectWorkspace } from "@/components/projects/project-workspace";
import { LearnerProjectBoardSearch } from "@/components/projects/learner-project-board-search";
import { learnerBoardStatusCounts } from "@/modules/projects/learner-board-summary-model";
import { learnerBoardPriorityCounts } from "@/modules/projects/learner-board-priority-model";
import { learnerBoardSortSchema,sortLearnerBoardTasks } from "@/modules/projects/learner-board-sort-model";
import { LearnerBoardInteractive } from "@/components/projects/learner-board-interactive";
import {LearnerAddOwnTask} from "@/components/projects/learner-own-task-controls";
import { LearnerProjectGoals } from "@/components/projects/learner-project-goals";
import { getLearnerProjectGoals } from "@/modules/projects/learner-project-goals-service";
import { LearnerBoardTaskDetailDialog } from "@/components/projects/learner-board-task-detail-dialog";
import { findOwnLearnerBoardTask } from "@/modules/projects/learner-board-task-detail-model";
import { learnerBoardTaskSelectionNotice } from "@/modules/projects/learner-board-selection-notice-model";
import Link from "next/link";
import {ErrorState} from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Banner } from "@/components/ui/banner";
import { learnerBoardTaskHref } from "@/modules/projects/learner-board-task-detail-model";
import { filterLearnerBoardTasks, learnerBoardSearchSchema, learnerBoardPrioritySchema, learnerBoardStatusSchema, learnerBoardSprintSchema, learnerBoardReleaseSchema } from "@/modules/projects/learner-project-board-model";
import { requireProjectReadAccess } from "@/modules/projects/access";
import { getProjectWorkspaceView } from "@/modules/projects/workspace-view-service";

export default async function LearnerProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ tab?: string; taskSearch?: string; priority?: string; taskStatus?: string; taskSort?: string; sprintId?: string; releaseId?: string; assignee?: string; taskId?: string; activityCategory?: string | string[]; activityFrom?: string | string[]; activityTo?: string | string[]; activityBeforeTime?: string | string[]; activityBeforeId?: string | string[] }>;
}) {
  const context = await getCurrentRequestContext();
  const { projectId } = await params;
  if (!projectInstanceIdSchema.safeParse(projectId).success) {
    // Old LMS project links used integer IDs. Imported projects retain the
    // original integer, but only a live member of this college can resolve it.
    if (!/^[1-9]\d{0,9}$/.test(projectId) || Number(projectId)>2147483647 ||
        !context.membership || context.membership.status!=="ACTIVE") notFound();
    const [legacy]=await getDb().select({id:projectInstances.id})
      .from(projectInstances)
      .innerJoin(projectMembers,eq(projectMembers.projectId,projectInstances.id))
      .where(and(eq(projectInstances.legacyProjectId,Number(projectId)),
        eq(projectInstances.collegeId,context.membership.collegeId),
        eq(projectMembers.membershipId,context.membership.id),
        eq(projectMembers.role,"LEARNER"),isNull(projectMembers.endedAt)))
      .limit(1);
    if(!legacy)notFound();
    await requireProjectReadAccess(context,legacy.id).catch(()=>notFound());
    const original=await searchParams;
    const retained=new URLSearchParams();
    for(const [key,value] of Object.entries(original)){
      if(typeof value==="string"&&value.length<=100)retained.set(key,value);
    }
    const suffix=retained.toString();
    redirect("/learn/projects/"+encodeURIComponent(legacy.id)+(suffix?"?"+suffix:""));
  }
  const { tab, taskSearch, priority: priorityInput, taskStatus: taskStatusInput, taskSort: taskSortInput, sprintId: sprintInput, releaseId: releaseInput, assignee: assigneeInput, taskId, activityCategory, activityFrom, activityTo, activityBeforeTime, activityBeforeId } = await searchParams;
  const activeSection =
    tab === "board" || tab === "tasks" || tab === "performance"
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

  // Keep the audit tab independent of the eight-read workspace aggregation.
  // Changing audit filters only fetches the currently authorized activity page,
  // rather than reloading board, goals, sprints and submission state.
  if(activeSection==="audit"){
    const parsed=parseLearnerProjectActivityFilters({
      category:activityCategory,from:activityFrom,to:activityTo,
      beforeTime:activityBeforeTime,beforeId:activityBeforeId,
    });
    const result=parsed.success
      ? await getProjectActivityPage(context,projectId,parsed.data)
      : null;
    return <div className="min-w-0 max-w-full space-y-4 md:space-y-5">
      <PageHeader title={access.project.title}
        description="Project activity · recent updates from your team"/>
      <LearnerProjectTabs projectId={projectId}/>
      {result?<LearnerProjectActivity projectId={projectId}
        events={result.events} hasMore={result.hasMore}
        categoryInput={activityCategory} fromInput={activityFrom} toInput={activityTo}
        beforeTimeInput={activityBeforeTime} beforeIdInput={activityBeforeId}/>:
       <ErrorState title="Invalid activity filters"
        description="Clear the selected activity filter or page cursor to continue."
        action={<Link href={"/learn/projects/"+encodeURIComponent(projectId)+"?tab=activity"}
         className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Clear activity filters</Link>}/>}
    </div>;
  }

  // Malformed/stale Board filters must not silently become "show every task".
  // Resolve the project grant first so foreign identifiers never reveal detail.
  const invalidBoardFilters = activeSection === "tasks" && [
    taskSearch !== undefined && (typeof taskSearch !== "string" || taskSearch.length > 100),
    priorityInput !== undefined && priorityInput !== "" && !learnerBoardPrioritySchema.safeParse(priorityInput).success,
    taskStatusInput !== undefined && taskStatusInput !== "" && !learnerBoardStatusSchema.safeParse(taskStatusInput).success,
    taskSortInput !== undefined && !learnerBoardSortSchema.safeParse(taskSortInput).success,
    sprintInput !== undefined && sprintInput !== "" && !learnerBoardSprintSchema.safeParse(sprintInput).success,
    releaseInput !== undefined && releaseInput !== "" && !learnerBoardReleaseSchema.safeParse(releaseInput).success,
    assigneeInput !== undefined && assigneeInput !== "" && assigneeInput !== "mine",
  ].some(Boolean);
  if (invalidBoardFilters) {
    return <div className="min-w-0 space-y-6">
      <PageHeader title="Project board" />
      <LearnerProjectTabs projectId={projectId}/>
      <ErrorState title="Invalid Board filters"
        description="One or more Board filters are no longer valid. Clear filters to see current tasks."
        action={<Link href={"/learn/projects/"+encodeURIComponent(projectId)+"?tab=board"}
          className="inline-flex min-h-11 min-[768px]:min-h-9 items-center font-semibold text-primary-text">
          Clear filters
        </Link>}/>
    </div>;
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
  const mine = assigneeInput === "mine";
  const sprintReleaseById = new Map(workspace.sprints.map(sprint => [sprint.id,sprint.releaseId]));
  const boardTasks = activeSection === "tasks"
    ? sortLearnerBoardTasks(filterLearnerBoardTasks(workspace.tasks, search, {priority,status,sprintId,releaseId,sprintReleaseById,mineMembershipId:mine ? context.membership?.id ?? "__missing__" : undefined}),taskSort)
    : workspace.tasks;
  const selectedTask=activeSection==="tasks"
    ? findOwnLearnerBoardTask(boardTasks,taskId)
    : null;
  const boardFilters={taskSearch:search,priority,status,sprintId,releaseId,taskSort,mine};
  const selectionNotice = activeSection === "tasks"
    ? learnerBoardTaskSelectionNotice(taskId, Boolean(selectedTask)) : null;
  const shownWorkspace = activeSection === "tasks"
    ? { ...workspace, tasks: boardTasks }
    : workspace;

  return (
    <div className="min-w-0 max-w-full space-y-4 md:space-y-5">
      <div className="flex min-w-0 flex-col gap-3 border-b border-[var(--lms-canvas-border)] pb-2 sm:flex-row sm:items-center sm:justify-between">
       <LearnerProjectTabs projectId={projectId} />
       {activeSection==="overview"?<Link href={"/learn/projects/"+encodeURIComponent(projectId)+"?tab=delivery"}
        className="inline-flex min-h-11 shrink-0 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text md:min-h-9">
         Final delivery
       </Link>:null}
      </div>

      {activeSection === "tasks" ? (
        <LearnerProjectBoardSearch projectId={projectId} search={search} priority={priority} status={status} taskSort={taskSort} mine={mine} sprintId={sprintId} sprints={workspace.sprints} releaseId={releaseId} releases={workspace.releases}
          shown={boardTasks.length} total={workspace.tasks.length} statusCounts={learnerBoardStatusCounts(workspace.tasks)} priorityCounts={learnerBoardPriorityCounts(workspace.tasks)} />
      ) : null}
      {activeSection === "tasks" && workspace.project.status==="ACTIVE" ? (
        <LearnerAddOwnTask projectId={projectId} sprints={workspace.sprints}/>
      ) : null}
      {activeSection === "tasks" ? <section className="flex flex-wrap items-center gap-3">
        {workspace.readiness.finalSubmission.canSubmitDraft?
          <Link href={"/learn/projects/"+encodeURIComponent(projectId)+"?tab=delivery"}
            className="inline-flex min-h-11 min-[768px]:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] px-4 text-sm font-semibold text-primary-text">
            Submit final work
          </Link>:
          <p className="text-xs text-[var(--lms-muted-text)] leading-5">Submission available after completion</p>}
      </section>:null}
      {activeSection === "tasks" ? (
        <LearnerBoardInteractive projectId={projectId} initialTasks={boardTasks}
          filters={boardFilters} sprints={workspace.sprints}
          membershipId={context.membership?.id??null}
          readOnly={workspace.project.status!=="ACTIVE"}/>
      ) : null}
      {selectionNotice ? (
        <Banner tone="info">
          <span>{selectionNotice}</span>
          <Link href={learnerBoardTaskHref(projectId, boardFilters)}
            className="inline-flex min-h-11 min-[768px]:min-h-[var(--lms-control-height)] items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Return to Board</Link>
        </Banner>
      ) : null}
      {selectedTask ? (
        <LearnerBoardTaskDetailDialog projectId={projectId} filters={boardFilters}
          projectStatus={workspace.project.status} task={selectedTask}
          commentCount={workspace.taskCommentCounts.find(row=>row.taskId===selectedTask.id)?.total??0}
          submissionUrl={workspace.taskSubmissions.filter(row=>row.taskId===selectedTask.id).at(-1)?.submissionUrl??null}
          assigneeName={workspace.members.find(member =>
            member.membershipId===selectedTask.assigneeMembershipId)?.displayName??null}
          currentMembershipId={context.membership?.id??null}
          sprintTitle={workspace.sprints.find(sprint=>sprint.id===selectedTask.sprintId)?.title??null}
          activityEvents={workspace.activity.filter(event=>event.subjectId===selectedTask.id)
            .map(event=>({summary:event.summary,actorDisplayName:event.actorDisplayName,
              occurredAt:event.occurredAt}))} />
      ) : null}
      {goals ? <LearnerProjectGoals overview={goals} /> : null}
      {activeSection === "audit" ? <LearnerProjectActivity projectId={projectId}
        events={filteredActivity.events} hasMore={filteredActivity.hasMore} categoryInput={activityCategory}
        fromInput={activityFrom} toInput={activityTo}
        beforeTimeInput={activityBeforeTime} beforeIdInput={activityBeforeId} /> : <ProjectWorkspace
      workspace={shownWorkspace}
      backHref="/learn/projects"
      backLabel="Projects"


      mode="LEARNER"
      currentMembershipId={
        context.membership?.id ?? null
      }
      activeSection={activeSection}
      />}
    </div>
  );
}
