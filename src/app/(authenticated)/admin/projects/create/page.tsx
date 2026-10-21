import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CreateProjectControl } from "@/components/projects/project-create-control";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { listAssignedProjectTemplates } from "@/modules/projects/template-service";
import { requireTeamCreationAuthority } from "@/modules/projects/class-team-roster-service";

/** The single-workspace equivalent of the legacy Super Admin create form. */
export default async function AdminCreateProjectPage(){
  const context=await getCurrentRequestContext();
  const collegeId=context.adminScope?.collegeId;
  if(!collegeId)return <ErrorState title="Select a college"
    description="Choose an active college in the admin scope switcher before creating a workspace."
    action={<Link href="/admin/projects" className="text-link underline">Back to workspaces</Link>}/>;
  await requireTeamCreationAuthority(context,collegeId);
  const templates=await listAssignedProjectTemplates(context,collegeId);
  return <div className="min-w-0 space-y-5">
    <PageHeader title="Create workspace" description="Start a single workspace from a published template."
      actions={<Link href="/admin/projects" className="inline-flex min-h-11 items-center text-link underline md:min-h-9">
        Back to workspaces
      </Link>}/>
    <CreateProjectControl standalone collegeId={collegeId} basePath="/admin/projects"
      templates={templates.map(template=>({
        templateId:template.templateId,title:template.title,
        version:template.version,summary:template.summary,
      }))}/>
  </div>;
}
