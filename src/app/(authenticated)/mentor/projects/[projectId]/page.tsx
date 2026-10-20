import { MentorProjectsUnavailable } from "@/components/projects/mentor-projects-unavailable";
import { Disclosure } from "@/components/ui/disclosure";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ProjectWorkspace, ProjectWorkspaceHeader } from "@/components/projects/project-workspace";
import {MentorTaskAllocation} from "@/components/projects/mentor-task-allocation";
import {MentorLaneBoard} from "@/components/projects/mentor-lane-board";
import {MentorProductBacklog} from "@/components/projects/mentor-product-backlog";
import { MentorProjectTabs } from "@/components/projects/mentor-project-tabs";
import { requireProjectReadAccess } from "@/modules/projects/access";
import { getProjectWorkspaceView } from "@/modules/projects/workspace-view-service";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";


export default async function MentorProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const context = await getCurrentRequestContext();
  const available = await resolveOptionalModuleAccess(context).catch(() => null);
  if (available?.projects.enabled !== true) return <MentorProjectsUnavailable loadFailed={available===null} />;
  const { projectId } = await params;
  const { tab } = await searchParams;
  const selectedTab = tab === "tasks" ? "board" : tab === "meetings" ? "team" : tab;
  const breadcrumbTab: Record<string, string> = {
    overview: "Overview", team: "People & Meetings", sprints: "Releases and Sprints",
    board: "Board", performance: "Task Allocation", resources: "Resources", delivery: "Delivery",
    activity: "Activity",
  };
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
            ? selectedTab
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
    <div className="min-w-0 max-w-full space-y-6">
      <Breadcrumbs items={[{label:"Projects",href:"/mentor/projects"},{label:breadcrumbTab[selectedTab ?? "overview"] ?? "Overview"}]} />
      <ProjectWorkspaceHeader workspace={workspace} mode="MENTOR" />
      <MentorProjectTabs projectId={projectId}/>
      {access.access === "MENTOR" ? <section className="min-w-0 border-b border-border pb-4"><Disclosure title="Additional project tools" className="min-w-0 [&>summary]:text-link"><div className="mt-3 flex flex-wrap gap-3">
        <Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"/board-review"}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface min-[768px]:min-h-[var(--lms-control-height)] px-4 text-sm font-semibold text-link hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Task board status
        </Link>
        <Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"/risk-readiness"}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface min-[768px]:min-h-[var(--lms-control-height)] px-4 text-sm font-semibold text-link hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          At-risk &amp; readiness
        </Link>
        <Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"/review-overview"}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface min-[768px]:min-h-[var(--lms-control-height)] px-4 text-sm font-semibold text-link hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Delivery review summary
        </Link>
        <Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"/resources-directory"}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface min-[768px]:min-h-[var(--lms-control-height)] px-4 text-sm font-semibold text-link hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Resource link directory
        </Link>
        <Link
          href={"/mentor/projects/" + encodeURIComponent(projectId) + "/timeline"}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface min-[768px]:min-h-[var(--lms-control-height)] px-4 text-sm font-semibold text-link hover:border-primary hover:bg-primary-subtle hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Release &amp; Sprint timeline
        </Link>
        <Link
          href={"/mentor/projects/" + encodeURIComponent(projectId) + "/team-meetings"}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface min-[768px]:min-h-[var(--lms-control-height)] px-4 text-sm font-semibold text-link hover:border-primary hover:bg-primary-subtle hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Team &amp; meeting log
        </Link>
        <Link
          href={"/mentor/projects/" + encodeURIComponent(projectId) + "/team-history"}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface min-[768px]:min-h-[var(--lms-control-height)] px-4 text-sm font-semibold text-link hover:border-primary hover:bg-primary-subtle hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Team membership history
        </Link>
        <Link
          href={"/mentor/projects/" + encodeURIComponent(projectId) + "/closeout"}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface min-[768px]:min-h-[var(--lms-control-height)] px-4 text-sm font-semibold text-link hover:border-primary hover:bg-primary-subtle hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Project closeout checklist
        </Link>
        <Link
          href={"/mentor/projects/" + encodeURIComponent(projectId) + "/review-completeness"}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface min-[768px]:min-h-[var(--lms-control-height)] px-4 text-sm font-semibold text-link hover:border-primary hover:bg-primary-subtle hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Delivery review completeness
        </Link>
        <Link
          href={"/mentor/projects/" + encodeURIComponent(projectId) + "/activity-history"}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface min-[768px]:min-h-[var(--lms-control-height)] px-4 text-sm font-semibold text-link hover:border-primary hover:bg-primary-subtle hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Recorded project activity →
        </Link>
      </div></Disclosure></section> : null}
      {selectedTab==="board"?<div className="space-y-5">
        <MentorProductBacklog projectId={projectId} tasks={workspace.tasks}
          sprints={workspace.sprints}
          readOnly={access.access==="OBSERVER"||workspace.project.status==="ARCHIVED"||workspace.project.status==="COMPLETED"}/>
        <MentorLaneBoard projectId={projectId}
          initialTasks={workspace.tasks} sprints={workspace.sprints} releases={workspace.releases}
          members={workspace.members} taskSubmissions={workspace.taskSubmissions}
          taskActivity={workspace.activity} readOnly={access.access==="OBSERVER"||
            workspace.project.status==="COMPLETED"||workspace.project.status==="ARCHIVED"}/>
      </div>:
      selectedTab==="performance"?<MentorTaskAllocation
        projectId={projectId} initialTasks={workspace.tasks}
        members={workspace.members} sprints={workspace.sprints} releases={workspace.releases}
        readOnly={access.access==="OBSERVER"||workspace.project.status==="ARCHIVED"||workspace.project.status==="COMPLETED"}/>:
      <ProjectWorkspace
        workspace={workspace}
        backHref="/mentor/projects"
        backLabel="Projects"


        mode="MENTOR"
        hidePageHeader
        readOnlyOverride={access.access === "OBSERVER"}
        currentMembershipId={
          context.membership?.id ?? null
        }
        activeSection={activeSection}
      />}
    </div>
  );
}
