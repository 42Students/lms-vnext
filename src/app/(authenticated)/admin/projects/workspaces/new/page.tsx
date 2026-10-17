import { getCurrentRequestContext } from "@/auth/request-context";
import { ClassTeamWorkspaceCreator } from "@/components/projects/class-team-workspace-creator";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { listAssignedProjectTemplates } from "@/modules/projects/template-service";
import { requireTeamCreationAuthority } from "@/modules/projects/class-team-roster-service";

export default async function AdminClassProjectWorkspacePage({searchParams}:{
 searchParams:Promise<{templateId?:string|string[]}>;
}) {
  const context = await getCurrentRequestContext();
  const collegeId = context.adminScope?.collegeId;
  if (!collegeId) return <main className="space-y-5"><PageHeader eyebrow="Super Admin · Projects" title="Create workspaces from a class" description="Choose a college safety scope before creating Project workspaces."/><EmptyState title="Select a college" description="Use the admin scope selector to choose an active college."/></main>;
  await requireTeamCreationAuthority(context, collegeId);
  const templates = await listAssignedProjectTemplates(context, collegeId);
  const requested=(await searchParams).templateId;
  const selected=typeof requested==="string"&&templates.some(t=>t.templateId===requested)?requested:null;
  return <main className="mx-auto w-full min-w-0 max-w-5xl space-y-6 px-3 py-4 sm:px-6">
    <PageHeader eyebrow="Super Admin · Projects" title="Create workspaces from a class" description="Scope is locked to the selected college. Review balanced teams before saving." />
    {templates.length === 0 ? <EmptyState title="No assigned templates" description="Assign a published Project template to this college first."/> :
      <ClassTeamWorkspaceCreator collegeId={collegeId} basePath="/admin/projects" initialTemplateId={selected} templates={templates.map(t => ({templateId:t.templateId,title:t.title,version:t.version,summary:t.summary}))}/>}
  </main>;
}