import { getCurrentRequestContext } from "@/auth/request-context";
import { ProjectWorkspace } from "@/components/projects/project-workspace";
import { requireProjectManageAccess } from "@/modules/projects/access";
import { getProjectWorkspaceView } from "@/modules/projects/workspace-view-service";

export default async function CollegeProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const context = await getCurrentRequestContext();
  const { projectId } = await params;
  await requireProjectManageAccess(
    context,
    projectId,
  );
  const workspace =
    await getProjectWorkspaceView(
      context,
      projectId,
    );

  return (
    <ProjectWorkspace
      workspace={workspace}
      backHref="/college/projects"
      backLabel="Projects"
      eyebrow="College Admin Project"
    />
  );
}
