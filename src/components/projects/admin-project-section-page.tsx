import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import {ProjectsServiceError} from "@/modules/projects/errors";
import {
  PROJECT_WORKSPACE_SECTIONS,
  ProjectWorkspace,
  type ProjectWorkspaceSection,
} from "@/components/projects/project-workspace";
import { requireProjectManageAccess } from "@/modules/projects/access";
import { getProjectWorkspaceView } from "@/modules/projects/workspace-view-service";
import { getProjectAdminCollegeId } from "@/modules/projects/admin-college-scope";
import { listProjectActivity } from "@/modules/projects/activity-service";
import { ProjectActivityFilteredList } from "@/components/projects/project-activity-filtered-list";
import { ErrorState } from "@/components/ui/error-state";

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
  polishAdminSection=false,
}: {
  projectId: string;
  section: string;
  basePath: string;
  from?: string;
  reason?: string;
  polishAdminSection?: boolean;
}) {
  if (!isProjectWorkspaceSection(section)) {
    notFound();
  }

  const context = await getCurrentRequestContext();
  if (!getProjectAdminCollegeId(context)) {
    return <ErrorState title="Admin not assigned to a college"
      description="You must be assigned to a college to view project workspaces. Choose a college in the header to continue."
      action={<Link href={basePath} className="inline-flex min-h-11 items-center text-link underline md:min-h-9">
        Back to workspaces
      </Link>} />;
  }
  // Read failures never disclose a foreign-college workspace; only in-scope
  // misses and unexpected load errors get the legacy recoverable inline state.
  let workspace: Awaited<ReturnType<typeof getProjectWorkspaceView>>;
  try {
    await requireProjectManageAccess(context,projectId,{
      includeDeleted:section==="summary",
    });
    workspace=await getProjectWorkspaceView(context,projectId);
  } catch(error) {
    if(section!=="delivery"||error instanceof ProjectsServiceError&&
      error.code!=="PROJECT_NOT_FOUND")throw error;
    const missing=error instanceof ProjectsServiceError&&error.code==="PROJECT_NOT_FOUND";
    return <section role="alert" className="space-y-3 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] p-4">
      <h2 className="font-semibold">{missing?"Workspace not found":"Workspace could not be loaded"}</h2>
      {!missing?<p>Could not load workspace delivery. No changes were made.</p>:null}
      <Link href={basePath+"/"+encodeURIComponent(projectId)+"/delivery"}
        className="inline-flex min-h-9 items-center font-semibold text-link underline">Retry</Link>
    </section>;
  }

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
      polishAdminSection={polishAdminSection}
      sectionBaseHref={
        basePath + "/" + projectId
      }
    />
  );
}
