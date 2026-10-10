import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  PROJECT_WORKSPACE_SECTIONS,
  ProjectWorkspace,
  type ProjectWorkspaceSection,
} from "@/components/projects/project-workspace";
import { requireProjectManageAccess } from "@/modules/projects/access";
import { getProjectWorkspaceView } from "@/modules/projects/workspace-view-service";

function isProjectWorkspaceSection(
  value: string,
): value is ProjectWorkspaceSection {
  return (
    PROJECT_WORKSPACE_SECTIONS as readonly string[]
  ).includes(value);
}

export async function AdminProjectSectionPage({
  projectId,
  section,
  basePath,
  eyebrow,
}: {
  projectId: string;
  section: string;
  basePath: string;
  eyebrow: string;
}) {
  if (!isProjectWorkspaceSection(section)) {
    notFound();
  }

  const context = await getCurrentRequestContext();
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
      backHref={basePath}
      backLabel="Projects"
      eyebrow={eyebrow}
      mode="ADMIN"
      currentMembershipId={
        context.membership?.id ?? null
      }
      activeSection={section}
      sectionBaseHref={
        basePath + "/" + projectId
      }
    />
  );
}
