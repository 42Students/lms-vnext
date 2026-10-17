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
  from,
  reason,
}: {
  projectId: string;
  section: string;
  basePath: string;
  from?: string;
  reason?: string;
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

  const safeFrom = from === "at-risk" || from === "submissions" ? from : "workspaces";
  const backHref = safeFrom === "workspaces" ? basePath : basePath + "/" + safeFrom;
  const backLabel = safeFrom === "at-risk" ? "Back to at-risk projects" : safeFrom === "submissions" ? "Back to submissions" : "Projects";
  const safeReason = reason && /^(STALLED|BLOCKER|REVIEW)$/i.test(reason) ? reason.toUpperCase() : null;
  const linkParams = new URLSearchParams();
  if (safeFrom !== "workspaces") linkParams.set("from",safeFrom);
  if (safeReason) linkParams.set("reason",safeReason);
  const sectionQuerySuffix = linkParams.size ? "?" + linkParams.toString() : "";

  return (
    <ProjectWorkspace
      workspace={workspace}
      backHref={backHref}
      backLabel={backLabel}
      riskReason={safeReason}
      sectionQuerySuffix={sectionQuerySuffix}
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
