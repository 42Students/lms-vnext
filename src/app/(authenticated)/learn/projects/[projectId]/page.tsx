import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { LearnerProjectTabs } from "@/components/projects/learner-project-tabs";
import { ProjectWorkspace } from "@/components/projects/project-workspace";
import { requireProjectReadAccess } from "@/modules/projects/access";
import { getProjectWorkspaceView } from "@/modules/projects/workspace-view-service";

export default async function LearnerProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const context = await getCurrentRequestContext();
  const { projectId } = await params;
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

  return (
    <div className="space-y-6">
      <LearnerProjectTabs projectId={projectId} />
      <ProjectWorkspace
      workspace={workspace}
      backHref="/learn/projects"
      backLabel="Projects"
      eyebrow="Learner Project"
      mode="LEARNER"
      currentMembershipId={
        context.membership?.id ?? null
      }
      />
    </div>
  );
}
