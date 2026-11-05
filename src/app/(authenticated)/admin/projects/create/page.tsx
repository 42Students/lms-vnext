import { getCurrentRequestContext } from "@/auth/request-context";
import { CreateProjectControl } from "@/components/projects/project-create-control";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { listAssignedProjectTemplates } from "@/modules/projects/template-service";
import { requireTeamCreationAuthority } from "@/modules/projects/class-team-roster-service";
import { TextLink } from "@/components/ui/text-link";

/** The single-workspace equivalent of the legacy Super Admin create form. */
export default async function AdminCreateProjectPage(){
  const context=await getCurrentRequestContext();
  const collegeId=context.adminScope?.collegeId;
  if(!collegeId)return <ErrorState title="Select a college"
    description="Choose an active college in the admin scope switcher before creating a workspace."
    action={<TextLink href="/admin/projects">Back to workspaces</TextLink>}/>;
  await requireTeamCreationAuthority(context,collegeId);
  const templates=await listAssignedProjectTemplates(context,collegeId);
  return <div className="min-w-0 space-y-5">
    <PageHeader title="Create workspace" description="Start a single workspace from a published template."
      actions={<TextLink href="/admin/projects" className="inline-flex min-h-11 items-center md:min-h-9">
        Back to workspaces
      </TextLink>}/>
    <CreateProjectControl standalone collegeId={collegeId} basePath="/admin/projects"
      templates={templates.map(template=>({
        templateId:template.templateId,title:template.title,
        version:template.version,summary:template.summary,
      }))}/>
  </div>;
}
