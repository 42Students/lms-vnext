import { MentorProjectsUnavailable } from "@/components/projects/mentor-projects-unavailable";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ProjectWorkspace } from "@/components/projects/project-workspace";
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
  const activeSection =
    tab === "board" || tab === "performance"
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

  if (access.access !== "MENTOR") {
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
      {tab === "performance" ? (
        <section className="rounded-xl border border-warning-border bg-warning-subtle p-4 text-sm leading-6 text-body">
          Legacy Task Allocation includes persisted task assignees and workload balancing.
          DB07 vNext does not yet persist task assignee fields, so the task execution view
          is available here but reassignment is intentionally not fabricated.
        </section>
      ) : null}
      <ProjectWorkspace
        workspace={workspace}
        backHref="/mentor/projects"
        backLabel="Mentoring Projects"
        eyebrow="Mentor Project"
        mode="MENTOR"
        currentMembershipId={
          context.membership?.id ?? null
        }
        activeSection={activeSection}
      />
    </div>
  );
}
