import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { LearnerProjectTabs } from "@/components/projects/learner-project-tabs";
import { ProjectWorkspace } from "@/components/projects/project-workspace";
import { LearnerProjectBoardSearch } from "@/components/projects/learner-project-board-search";
import { filterLearnerBoardTasks, learnerBoardSearchSchema, learnerBoardPrioritySchema } from "@/modules/projects/learner-project-board-model";
import { requireProjectReadAccess } from "@/modules/projects/access";
import { getProjectWorkspaceView } from "@/modules/projects/workspace-view-service";

export default async function LearnerProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ tab?: string; taskSearch?: string; priority?: string }>;
}) {
  const context = await getCurrentRequestContext();
  const { projectId } = await params;
  const { tab, taskSearch, priority: priorityInput } = await searchParams;
  const activeSection =
    tab === "board"
      ? "tasks"
      : tab === "activity"
        ? "audit"
        : tab === "delivery"
          ? "delivery"
          : tab === "team" ||
              tab === "sprints" ||
              tab === "resources"
            ? tab
            : "overview";
  const access = await requireProjectReadAccess(
    context,
    projectId,
  );

  if (access.access !== "LEARNER") {
    redirect("/learn/projects");
  }

  const workspace =
    await getProjectWorkspaceView(
      context,
      projectId,
    );

  const search = learnerBoardSearchSchema.parse(taskSearch);
  const priority = learnerBoardPrioritySchema.safeParse(priorityInput).data ?? "";
  const boardTasks = activeSection === "tasks"
    ? filterLearnerBoardTasks(workspace.tasks, search, {priority})
    : workspace.tasks;
  const shownWorkspace = activeSection === "tasks"
    ? { ...workspace, tasks: boardTasks }
    : workspace;

  return (
    <div className="space-y-6">
      <LearnerProjectTabs projectId={projectId} />
      {activeSection === "tasks" ? (
        <LearnerProjectBoardSearch projectId={projectId} search={search} priority={priority}
          shown={boardTasks.length} total={workspace.tasks.length} />
      ) : null}
      <ProjectWorkspace
      workspace={shownWorkspace}
      backHref="/learn/projects"
      backLabel="Projects"
      eyebrow="Learner Project"
      mode="LEARNER"
      currentMembershipId={
        context.membership?.id ?? null
      }
      activeSection={activeSection}
      />
    </div>
  );
}
