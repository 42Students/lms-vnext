import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ProjectWorkspace } from "@/components/projects/project-workspace";
import { requireProjectReadAccess } from "@/modules/projects/access";
import { getProjectWorkspaceView } from "@/modules/projects/workspace-view-service";

export default async function MentorProjectPage({
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

  if (access.access !== "MENTOR") {
    redirect("/mentor/projects");
  }

  const workspace =
    await getProjectWorkspaceView(
      context,
      projectId,
    );

  return (
    <ProjectWorkspace
      workspace={workspace}
      backHref="/mentor/projects"
      backLabel="Mentoring Projects"
      eyebrow="Mentor Project"
      mode="MENTOR"
    />
  );
}
