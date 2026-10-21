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
  const subtitles:Record<string,string> = {
    overview:"Current status, scope, and project summary.",
    team:"People, roles, and scheduled meetings.",
    sprints:"Sprints, goals, and what ships when.",
    board:"Active work, task movement, and ownership.",
    performance:"Assign work and rebalance the team\u0027s load.",
    resources:"Files, links, and shared reference material.",
    activity:"Recent updates and history.",
    delivery:"Submission package, versions and review decisions.",
  };
  const breadcrumbTab: Record<string, string> = {
    overview: "Overview", team: "People & Meetings", sprints: "Releases and Sprints",
    board: "Board", performance: "Task Allocation", resources: "Resources", delivery: "Overview",
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

  if(tab==="tasks"||tab==="meetings")
    redirect("/mentor/projects/"+encodeURIComponent(projectId)+"?tab="+selectedTab);

  const workspace =
    await getProjectWorkspaceView(
      context,
      projectId,
    );

  return (
    <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
      <Breadcrumbs items={[{label:"Projects",href:"/mentor/projects"},{label:breadcrumbTab[selectedTab ?? "overview"] ?? "Overview"}]} />
      <ProjectWorkspaceHeader workspace={workspace} mode="MENTOR" />
      <MentorProjectTabs projectId={projectId}/>
      {tab && !(selectedTab in subtitles)
        ? <p role="status" className="border-b border-border py-3 text-sm text-muted-foreground">
            No project content available for this section.
            <Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"?tab=overview"}
              className="ml-2 font-semibold text-link underline">Overview</Link>
          </p>
        : <section aria-label="Current project section" className="min-w-0 space-y-1">
            <h2 className="sr-only">{breadcrumbTab[selectedTab??"overview"]??"Overview"}</h2>
            <p className="text-sm leading-[22px] text-muted-foreground">
              {subtitles[selectedTab??"overview"]}
            </p>
          </section>}
      {/* The delivery deep link keeps its section mounted so the one-time review dialog can open. */}
      {selectedTab==="board"?<div className="min-w-0 space-y-4 md:space-y-6">
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
      {access.access === "MENTOR" ? <section className="min-w-0 border-b border-border pb-4"><Disclosure title="Additional project tools" className="min-w-0 [&>summary]:text-link"><div className="mt-3 grid min-w-0 gap-x-4 gap-y-1 sm:grid-cols-2 xl:grid-cols-3">
        <Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"/board-review"}
          className="inline-flex min-h-11 min-w-0 items-center break-words text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          Task board status
        </Link>
        <Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"/risk-readiness"}
          className="inline-flex min-h-11 min-w-0 items-center break-words text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          At-risk &amp; readiness
        </Link>
        <Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"/review-overview"}
          className="inline-flex min-h-11 min-w-0 items-center break-words text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          Delivery review summary
        </Link>
        <Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"/resources-directory"}
          className="inline-flex min-h-11 min-w-0 items-center break-words text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          Resource link directory
        </Link>
        <Link
          href={"/mentor/projects/" + encodeURIComponent(projectId) + "/timeline"}
          className="inline-flex min-h-11 min-w-0 items-center break-words text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
        >
          Release &amp; Sprint timeline
        </Link>
        <Link
          href={"/mentor/projects/" + encodeURIComponent(projectId) + "/team-meetings"}
          className="inline-flex min-h-11 min-w-0 items-center break-words text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
        >
          Team &amp; meeting log
        </Link>
        <Link
          href={"/mentor/projects/" + encodeURIComponent(projectId) + "/team-history"}
          className="inline-flex min-h-11 min-w-0 items-center break-words text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
        >
          Team membership history
        </Link>
        <Link
          href={"/mentor/projects/" + encodeURIComponent(projectId) + "/closeout"}
          className="inline-flex min-h-11 min-w-0 items-center break-words text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
        >
          Project closeout checklist
        </Link>
        <Link
          href={"/mentor/projects/" + encodeURIComponent(projectId) + "/review-completeness"}
          className="inline-flex min-h-11 min-w-0 items-center break-words text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
        >
          Delivery review completeness
        </Link>
        <Link
          href={"/mentor/projects/" + encodeURIComponent(projectId) + "/activity-history"}
          className="inline-flex min-h-11 min-w-0 items-center break-words text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
        >
          Recorded project activity →
        </Link>
      </div></Disclosure></section> : null}
    </div>
  );
}
