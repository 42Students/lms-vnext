import { getCurrentRequestContext } from "@/auth/request-context";
import { ClassTeamWorkspaceCreator } from "@/components/projects/class-team-workspace-creator";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ProjectsServiceError } from "@/modules/projects/errors";
import Link from "next/link";
import { listAssignedProjectTemplates } from "@/modules/projects/template-service";
import { requireTeamCreationAuthority } from "@/modules/projects/class-team-roster-service";

export default async function AdminClassProjectWorkspacePage({searchParams}:{
 searchParams:Promise<{templateId?:string|string[]}>;
}) {
  const context = await getCurrentRequestContext();
  const collegeId = context.adminScope?.collegeId;
  if (!collegeId) return <div className="min-w-0 space-y-5"><PageHeader eyebrow="Super Admin · Projects" title="Create workspaces from a class" description="Choose a college safety scope before creating Project workspaces."/><EmptyState title="Select a college" description="Use the admin scope selector to choose an active college."/></div>;
  let templates: Awaited<ReturnType<typeof listAssignedProjectTemplates>>;
  try {
    // Do not fetch or show template details until the selected college scope
    // is authorized. Revocation and DB outages must render safe recovery.
    await requireTeamCreationAuthority(context, collegeId);
    templates = await listAssignedProjectTemplates(context, collegeId);
  } catch (error) {
    const denied = error instanceof ProjectsServiceError && error.code === "PROJECT_ACCESS_DENIED";
    return <div className="min-w-0 space-y-5">
      <PageHeader eyebrow="Super Admin · Projects" title="Create project workspace"/>
      <ErrorState title={denied ? "Project creation access denied" : "Project setup unavailable"}
        description={denied
          ? "Your selected college cannot be used to create workspaces. Select an authorized college and try again."
          : "The college and template catalogue could not be loaded. No workspace was created."}
        action={<Link href="/admin/projects/workspaces/new" className="font-semibold text-primary-text">Retry opening workspace creator</Link>}/>
    </div>;
  }
  const requested=(await searchParams).templateId;
  const selected=typeof requested==="string"&&templates.some(t=>t.templateId===requested)?requested:null;
  return <div className="w-full min-w-0 space-y-6">
    <PageHeader eyebrow="Super Admin · Projects" title="Create project workspace"
      description="Every workspace starts from a template — pick one below."
      actions={<Link href="/admin/projects" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3.5 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9">← Project workspaces</Link>} />
    {templates.length === 0 ? <EmptyState title="No assigned templates" description="Assign a published Project template to this college first."/> :
      <ClassTeamWorkspaceCreator collegeId={collegeId} basePath="/admin/projects" initialTemplateId={selected} templates={templates.map(t => ({templateId:t.templateId,title:t.title,version:t.version,summary:t.summary}))}/>}
  </div>;
}