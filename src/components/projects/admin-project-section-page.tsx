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
import {ProjectAdminNav} from "./project-admin-nav";
import {ProjectsServiceError} from "@/modules/projects/errors";

function workspaceRecoveryPanel({
 projectId,section,basePath,title,description,
}:{
 projectId:string;section:string;basePath:string;
 title:string;description:string;
}){
 const retry=basePath+"/"+encodeURIComponent(projectId)+"/"+encodeURIComponent(section);
 return <section className="min-w-0 space-y-4" role="alert">
  <ProjectAdminNav basePath={basePath} active="workspaces"/>
  <ErrorState title={title} description={description}
    action={<div className="flex flex-wrap gap-3">
      <Link href={retry} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
        Retry workspace
      </Link>
      <Link href={basePath} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
        Back to workspaces
      </Link>
    </div>}/>
 </section>;
}


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
    return <section className="min-w-0 space-y-4">
      <ProjectAdminNav basePath={basePath} active="workspaces"/>
      <ErrorState title="Admin not assigned to a college"
        description="You must be assigned to a college to view project workspaces. Select a college in the header to continue."
        action={<Link href={basePath} className="inline-flex min-h-11 items-center text-link underline md:min-h-9">
          Back to workspaces
        </Link>}/>
    </section>;
  }
  // A soft-deleted workspace may be inspected and recovered from Summary only.
  // Every other section and all ordinary manage mutations remain inaccessible.
  try{
    await requireProjectManageAccess(
      context,projectId,
      {includeDeleted:section==="summary"},
    );
  }catch(error){
    const missing=error instanceof ProjectsServiceError&&
      ["PROJECT_NOT_FOUND","PROJECT_ACCESS_DENIED","PROJECT_INVALID_STATE"].includes(error.code);
    return workspaceRecoveryPanel({
      projectId,section,basePath,
      title:missing?"Workspace not found":"Workspace could not be loaded",
      description:missing?
        "This workspace does not exist in the selected college, or you cannot access it.":
        "Workspace access could not be verified. Refresh the page and retry.",
    });
  }
  let workspace: Awaited<ReturnType<typeof getProjectWorkspaceView>>;
  try {
    workspace = await getProjectWorkspaceView(context, projectId);
  } catch (error) {
    // A summary/snapshot outage must not take away the entire Audit workspace.
    // The project management permission and tenant scope were checked above.
    if(section!=="audit"){
      return workspaceRecoveryPanel({
        projectId,section,basePath,title:"Workspace could not be loaded",
        description:"Project workspace details are unavailable. Your navigation and selected college have been preserved. Retry loading the workspace.",
      });
    }
    let events: Awaited<ReturnType<typeof listProjectActivity>> = [];
    let activityUnavailable = false;
    try {
      events = await listProjectActivity(context, projectId);
    } catch {
      activityUnavailable = true;
    }
    return <section className="min-w-0 space-y-4">
      <div role="alert" className="border-l-[3px] border-warning-border bg-warning-subtle px-4 py-3 text-sm">
        <p className="font-semibold">Workspace summary could not be loaded</p>
        <p className="mt-1 text-body">
          The workspace summary is unavailable, but the project audit can still be reviewed.
        </p>
        <Link href={basePath + "/" + encodeURIComponent(projectId) + "/audit?retry=1"}
          className="mt-2 inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
          Retry workspace
        </Link>
      </div>
      {activityUnavailable ? <ErrorState title="Project activity could not be loaded"
        description="Retry the workspace to load its audit events."/> :
        <ProjectActivityFilteredList projectId={projectId} events={events}
          now={new Date().toISOString()}/>}
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
