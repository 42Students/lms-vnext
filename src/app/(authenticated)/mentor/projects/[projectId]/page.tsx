import { MentorProjectsUnavailable } from "@/components/projects/mentor-projects-unavailable";
import { Disclosure } from "@/components/ui/disclosure";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ProjectWorkspace } from "@/components/projects/project-workspace";
import {MentorTaskAllocation} from "@/components/projects/mentor-task-allocation";
import {MentorLaneBoard} from "@/components/projects/mentor-lane-board";
import {MentorProductBacklog} from "@/components/projects/mentor-product-backlog";
import { MentorProjectTabs } from "@/components/projects/mentor-project-tabs";
import {MentorProjectSectionCache} from "@/components/projects/mentor-project-section-cache";
import {MentorProjectUpdateComposer} from "@/components/projects/mentor-project-update-composer";
import {MentorPrototypeSprintPlan,MentorPrototypeTeamOverview,MentorPrototypePerformance,MentorPrototypeActivitySummary,MentorPrototypeDeliveryEvidence,MentorPrototypeProjectOverview} from "@/components/projects/mentor-prototype-project-summaries";
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
  if (available?.projects.enabled !== true) return <MentorProjectsUnavailable loadFailed={available===null} />;
  const { projectId } = await params;
  const { tab } = await searchParams;
  const selectedTab = (tab === "tasks" ? "board" : tab === "meetings" ? "team" : tab) ?? "overview";
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
    overview: "Overview", team: "Team & meetings", sprints: "Sprints & releases",
    board: "Board", performance: "Performance", resources: "Resources", delivery: "Overview",
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
  // The prototype's shared detail header is reused for Overview, Board,
  // Sprints & releases, Team & meetings, Performance, Resources and Activity.
  // Only actual persisted sprints become segments; 16 is NOT hard-coded.
  const timeline = [...workspace.sprints].sort((a,b) => a.sequence - b.sequence);
  const currentSprint = timeline.find(sprint => sprint.status === "ACTIVE");
  const completedSprints = timeline.filter(sprint => sprint.status === "COMPLETED").length;
  const studentCount = workspace.members.filter(member => member.role === "LEARNER").length;
  const mentorBase = "/mentor/projects/" + encodeURIComponent(projectId);
  const projectStatus = workspace.project.status === "ACTIVE" ? "In progress" :
    workspace.project.status === "COMPLETED" ? "Completed" :
    workspace.project.status === "ARCHIVED" ? "Archived" : "Planned";

  return (
    <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
      <div className="prototype-mentor-project-heading">
        <Link href="/mentor/projects" className="prototype-mentor-back">‹ Projects</Link>
        <div className="prototype-mentor-title-line">
          <span className="prototype-mentor-team-avatar" aria-hidden="true">
            {workspace.project.title.trim().slice(0,2).toUpperCase() || "42"}
          </span>
          <div className="min-w-0">
            <h1>{workspace.project.title}</h1>
            <p>{workspace.project.courseLabel || "Project"} · {studentCount} {studentCount===1?"student":"students"} · <strong>{projectStatus}</strong></p>
          </div>
          <div className="prototype-mentor-header-actions">
            {access.access === "MENTOR" && workspace.project.status === "ACTIVE"
              ? <Link href={mentorBase + "?tab=team"}>Schedule a meeting</Link>
              : null}
            {access.access === "MENTOR" && workspace.project.status !== "ARCHIVED" && workspace.project.status !== "COMPLETED" ? (
              <Link href={mentorBase + "?tab=board"}>+ Task</Link>
            ) : null}
          </div>
        </div>
        {timeline.length > 0 ? (
          <section className="prototype-mentor-sprint-ribbon" aria-label="Project sprints">
            <div className="prototype-mentor-sprint-facts">
              <span><strong>{currentSprint ? "Sprint " + currentSprint.sequence : completedSprints + " completed sprints"}</strong> of {timeline.length} · {workspace.project.courseLabel || "Project"}</span>
              <Link href={mentorBase + "?tab=sprints"}>{workspace.releases.length} {workspace.releases.length===1?"release":"releases"} · Open timeline</Link>
            </div>
            <div className="prototype-mentor-sprint-track">
              {timeline.map(sprint => (
                <Link key={sprint.id} href={mentorBase+"?tab=sprints"} title={"Sprint "+sprint.sequence+" · "+sprint.status}
                  aria-label={"Sprint "+sprint.sequence+" · "+sprint.status}
                  className={"prototype-mentor-sprint-segment prototype-mentor-sprint-"+(
                    sprint.status === "COMPLETED" ? "done" :
                    sprint.status === "ACTIVE" ? "current" : "planned"
                  )} />
              ))}
            </div>
            {currentSprint ? (
              <div className="prototype-mentor-sprint-next">
                <span><strong>Current sprint:</strong> Sprint {currentSprint.sequence} · {currentSprint.title}</span>
                <Link href={mentorBase+"?tab=sprints"}>View sprint</Link>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
      <MentorProjectTabs projectId={projectId}/>
      {tab && !(selectedTab in subtitles)
        ? <p role="status" className="border-b border-border py-3 text-sm text-muted-foreground">
            No project content available for this section.
            <Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"?tab=overview"}
              className="ml-2 inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Overview</Link>
          </p>
        : <section aria-label="Current project section" className="sr-only">
            <h2>{breadcrumbTab[selectedTab??"overview"]??"Overview"}</h2>
            <p>{subtitles[selectedTab??"overview"]}</p>
          </section>}
      {selectedTab==="overview" ? <MentorPrototypeProjectOverview workspace={workspace} /> : null}
      {selectedTab==="sprints" ? <MentorPrototypeSprintPlan workspace={workspace} readOnly={access.access!=="MENTOR"||workspace.project.status!=="ACTIVE"} /> : null}
      {selectedTab==="team" ? <MentorPrototypeTeamOverview workspace={workspace} /> : null}
      {selectedTab==="performance" ? <MentorPrototypePerformance workspace={workspace} /> : null}
      {selectedTab==="activity" ? <>
        <MentorProjectUpdateComposer projectId={projectId}
          readOnly={access.access!=="MENTOR"||workspace.project.status!=="ACTIVE"} />
        <MentorPrototypeActivitySummary workspace={workspace} />
      </> : null}
      {selectedTab==="delivery" ? <MentorPrototypeDeliveryEvidence workspace={workspace} /> : null}
      <MentorProjectSectionCache key={projectId} projectId={projectId}
        section={selectedTab??"overview"}>
      {/* Keep previous project tabs mounted when navigating within this workspace. */}
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
      </MentorProjectSectionCache>
      {access.access === "MENTOR" ? <section className="min-w-0 border-b border-border pb-4"><Disclosure title="Additional project tools" className="min-w-0 [&>summary]:text-link"><div className="mt-3 grid min-w-0 gap-x-4 gap-y-1 sm:grid-cols-2 xl:grid-cols-3">
        <Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"/board-review"}
          className="inline-flex min-h-11 min-w-0 items-center break-words text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-teal-deep)]">
          Task board status
        </Link>
        <Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"/risk-readiness"}
          className="inline-flex min-h-11 min-w-0 items-center break-words text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-teal-deep)]">
          At-risk &amp; readiness
        </Link>
        <Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"/review-overview"}
          className="inline-flex min-h-11 min-w-0 items-center break-words text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-teal-deep)]">
          Delivery review summary
        </Link>
        <Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"/resources-directory"}
          className="inline-flex min-h-11 min-w-0 items-center break-words text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-teal-deep)]">
          Resource link directory
        </Link>
        <Link
          href={"/mentor/projects/" + encodeURIComponent(projectId) + "/timeline"}
          className="inline-flex min-h-11 min-w-0 items-center break-words text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-teal-deep)]"
        >
          Release &amp; Sprint timeline
        </Link>
        <Link
          href={"/mentor/projects/" + encodeURIComponent(projectId) + "/team-meetings"}
          className="inline-flex min-h-11 min-w-0 items-center break-words text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-teal-deep)]"
        >
          Team &amp; meeting log
        </Link>
        <Link
          href={"/mentor/projects/" + encodeURIComponent(projectId) + "/team-history"}
          className="inline-flex min-h-11 min-w-0 items-center break-words text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-teal-deep)]"
        >
          Team membership history
        </Link>
        <Link
          href={"/mentor/projects/" + encodeURIComponent(projectId) + "/closeout"}
          className="inline-flex min-h-11 min-w-0 items-center break-words text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-teal-deep)]"
        >
          Project closeout checklist
        </Link>
        <Link
          href={"/mentor/projects/" + encodeURIComponent(projectId) + "/review-completeness"}
          className="inline-flex min-h-11 min-w-0 items-center break-words text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-teal-deep)]"
        >
          Delivery review completeness
        </Link>
        <Link
          href={"/mentor/projects/" + encodeURIComponent(projectId) + "/activity-history"}
          className="inline-flex min-h-11 min-w-0 items-center break-words text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-teal-deep)]"
        >
          Recorded project activity →
        </Link>
      </div></Disclosure></section> : null}
    </div>
  );
}
