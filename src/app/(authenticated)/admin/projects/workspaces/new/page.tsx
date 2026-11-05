import { PageBackLink } from "@/components/ui/page-back-link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ClassTeamWorkspaceCreator } from "@/components/projects/class-team-workspace-creator";
import { CreateProjectControl } from "@/components/projects/project-create-control";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Banner } from "@/components/ui/banner";
import { ErrorState } from "@/components/ui/error-state";
import { ProjectsServiceError } from "@/modules/projects/errors";
import { listAssignedProjectTemplates } from "@/modules/projects/template-service";
import { requireTeamCreationAuthority } from "@/modules/projects/class-team-roster-service";
import { TextLink } from "@/components/ui/text-link";

export default async function AdminClassProjectWorkspacePage({searchParams}:{
 searchParams:Promise<{templateId?:string|string[];mode?:string|string[]}>;
}) {
  const context = await getCurrentRequestContext();
  const collegeId = context.adminScope?.collegeId;
  if (!collegeId) return <div className="min-w-0 space-y-5"><PageBackLink href="/admin/projects" label="Back to workspaces"/><PageHeader title="Create workspaces from a class" description="Choose a college safety scope before creating Project workspaces."/><EmptyState title="Select a college" description="Use the admin scope selector to choose an active college."/></div>;
  let templates: Awaited<ReturnType<typeof listAssignedProjectTemplates>>;
  try {
    // Do not fetch or show template details until the selected college scope
    // is authorized. Revocation and DB outages must render safe recovery.
    await requireTeamCreationAuthority(context, collegeId);
    templates = await listAssignedProjectTemplates(context, collegeId);
  } catch (error) {
    const denied = error instanceof ProjectsServiceError && error.code === "PROJECT_ACCESS_DENIED";
    return <div className="min-w-0 space-y-5">
      <PageBackLink href="/admin/projects" label="Back to workspaces"/>
      <PageHeader title="Create project workspace"/>
      <ErrorState title={denied ? "Project creation access denied" : "Project setup unavailable"}
        description={denied
          ? "Your selected college cannot be used to create workspaces. Select an authorized college and try again."
          : "The college and template catalogue could not be loaded. No workspace was created."}
        action={<TextLink href="/admin/projects/workspaces/new" className="inline-flex min-h-11 items-center w-full md:w-auto md:min-h-9">Retry opening workspace creator</TextLink>}/>
    </div>;
  }
  const selectedQuery = await searchParams;
  const requested=selectedQuery.templateId;
  const mode = selectedQuery.mode === "teams" ? "teams" : "single";
  // An old numeric template identifier is not a grant. Only a template that
  // is assigned to the currently selected admin college can be preselected.
  const selected=typeof requested==="string"&&templates.some(t=>t.templateId===requested)?requested:null;
  const unrecognizedTemplate=requested!==undefined&&!selected;
  return <div className="min-w-0 max-w-full space-y-4 md:space-y-5">
    <PageHeader title="Create project workspace"
      description="Every workspace starts from a template — pick one below."
      actions={<PageBackLink href="/admin/projects" label="Back to workspaces" />} />
    {unrecognizedTemplate?<Banner tone="warning">
      The linked template is not assigned to the selected college or is an old template identifier.
      Choose an available template below; no workspace has been created.
    </Banner>:null}
    <nav aria-label="Workspace creation mode" className="flex flex-wrap gap-2 border-b border-border pb-3">
      <TextLink variant="bare" href={"/admin/projects/workspaces/new"+(selected?"?templateId="+encodeURIComponent(selected):"")}
        aria-current={mode==="single"?"page":undefined}
        className={"inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border px-4 font-semibold focus-ring "+(mode==="single"?"border-primary bg-primary-subtle text-primary-text":"border-border text-body")}>
        Single workspace
      </TextLink>
      <TextLink variant="bare" href={"/admin/projects/workspaces/new?mode=teams"+(selected?"&templateId="+encodeURIComponent(selected):"")}
        aria-current={mode==="teams"?"page":undefined}
        className={"inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border px-4 font-semibold focus-ring "+(mode==="teams"?"border-primary bg-primary-subtle text-primary-text":"border-border text-body")}>
        Class / team workspaces
      </TextLink>
    </nav>
    {templates.length === 0 ? <EmptyState title="No assigned templates" description="Assign a published Project template to this college first."
      action={<TextLink href="/admin/projects/templates" className="inline-flex min-h-11 items-center w-full md:w-auto md:min-h-9">Project templates</TextLink>}/> :
      mode==="single" ? <CreateProjectControl key={context.user.id+":"+collegeId+":single"} standalone collegeId={collegeId} basePath="/admin/projects" templates={templates.map(t=>({templateId:t.templateId,title:t.title,version:t.version,summary:t.summary}))}/> :
      <ClassTeamWorkspaceCreator key={context.user.id+":"+collegeId+":"+(context.adminScope?.organizationId??"")} collegeId={collegeId} userId={context.user.id} basePath="/admin/projects" initialTemplateId={selected} templates={templates.map(t => ({templateId:t.templateId,title:t.title,version:t.version,summary:t.summary}))}/>}
  </div>;
}