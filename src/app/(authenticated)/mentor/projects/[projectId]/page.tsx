import { MentorProjectsUnavailable } from "@/components/projects/mentor-projects-unavailable";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ProjectWorkspace } from "@/components/projects/project-workspace";
import {MentorTaskAllocation} from "@/components/projects/mentor-task-allocation";
import {MentorLaneBoard} from "@/components/projects/mentor-lane-board";
import {MentorProductBacklog} from "@/components/projects/mentor-product-backlog";
import { MentorProjectTabs } from "@/components/projects/mentor-project-tabs";
import { requireProjectReadAccess } from "@/modules/projects/access";
import { getProjectWorkspaceView } from "@/modules/projects/workspace-view-service";

export default async function MentorProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const context = await getCurrentRequestContext();
  const available = await resolveOptionalModuleAccess(context).catch(() => null);
  if (available?.projects.enabled !== true) return <MentorProjectsUnavailable />;
  const { projectId } = await params;
  const { tab } = await searchParams;
  const selectedTab = tab === "tasks" ? "board" : tab === "meetings" ? "team" : tab;
  const activeSection =
    selectedTab === "board" || selectedTab === "performance"
      ? "tasks"
      : selectedTab === "activity"
        ? "audit"
        : selectedTab === "delivery"
          ? "delivery"
          : selectedTab === "team" ||
              selectedTab === "sprints" ||
              selectedTab === "resources"
            ? tab
            : "overview";
  const access = await requireProjectReadAccess(
    context,
    projectId,
  );

  if (access.access !== "MENTOR" && !(access.access === "OBSERVER" && access.member?.role === "MENTOR")) {
    redirect("/mentor/projects");
  }

  const workspace =
    await getProjectWorkspaceView(
      context,
      projectId,
    );

  return (
    <div className="space-y-6">
      <MentorProjectTabs
        projectId={projectId}
      />
      {access.access === "MENTOR" ? <div className="flex flex-wrap gap-3">
        <Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"/board-review"}
          className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text">
          Task board status
        </Link>
        <Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"/risk-readiness"}
          className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text">
          At-risk &amp; readiness
        </Link>
        <Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"/review-overview"}
          className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text">
          Delivery review summary
        </Link>
        <Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"/resources-directory"}
          className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text">
          Resource link directory
        </Link>
        <Link
          href={"/mentor/projects/" + encodeURIComponent(projectId) + "/timeline"}
          className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:underline"
        >
          Release &amp; Sprint timeline
        </Link>
        <Link
          href={"/mentor/projects/" + encodeURIComponent(projectId) + "/team-meetings"}
          className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:underline"
        >
          Team &amp; meeting log
        </Link>
        <Link
          href={"/mentor/projects/" + encodeURIComponent(projectId) + "/team-history"}
          className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:underline"
        >
          Team membership history
        </Link>
        <Link
          href={"/mentor/projects/" + encodeURIComponent(projectId) + "/closeout"}
          className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:underline"
        >
          Project closeout checklist
        </Link>
        <Link
          href={"/mentor/projects/" + encodeURIComponent(projectId) + "/review-completeness"}
          className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:underline"
        >
          Delivery review completeness
        </Link>
        <Link
          href={"/mentor/projects/" + encodeURIComponent(projectId) + "/activity-history"}
          className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:underline"
        >
          Recorded project activity →
        </Link>
      </div> : null}
      {selectedTab==="board"?<div className="space-y-5">
        <MentorProductBacklog projectId={projectId} tasks={workspace.tasks}
          sprints={workspace.sprints}
          readOnly={access.access==="OBSERVER"}/>
        <MentorLaneBoard projectId={projectId}
          initialTasks={workspace.tasks} sprints={workspace.sprints} releases={workspace.releases}
          members={workspace.members} taskSubmissions={workspace.taskSubmissions}
          taskActivity={workspace.activity} readOnly={access.access==="OBSERVER"||
            workspace.project.status==="COMPLETED"||workspace.project.status==="ARCHIVED"}/>
      </div>:
      selectedTab==="performance"?<MentorTaskAllocation
        projectId={projectId} initialTasks={workspace.tasks}
        members={workspace.members} sprints={workspace.sprints} releases={workspace.releases}
        readOnly={access.access==="OBSERVER"}/>:
      <ProjectWorkspace
        workspace={workspace}
        backHref="/mentor/projects"
        backLabel="Projects"


        mode="MENTOR"
        readOnlyOverride={access.access === "OBSERVER"}
        currentMembershipId={
          context.membership?.id ?? null
        }
        activeSection={activeSection}
      />}
    </div>
  );
}
