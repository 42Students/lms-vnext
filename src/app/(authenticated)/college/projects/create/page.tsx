import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {CreateProjectControl} from "@/components/projects/project-create-control";
import {ProjectAdminNav} from "@/components/projects/project-admin-nav";
import {PageHeader} from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";
import {listAssignedProjectTemplates} from "@/modules/projects/template-service";
import {getProjectAdminCollegeId} from "@/modules/projects/admin-college-scope";

export default async function CollegeCreateProjectPage() {
  const context=await getCurrentRequestContext();
  const collegeId=getProjectAdminCollegeId(context);
  if(!collegeId)return <div className="min-w-0 space-y-4">
    <PageHeader title="Create workspace" description="Select a college to continue."/>
    <ErrorState title="No college selected"
      description="Choose a college from the account switcher before creating a workspace."
      action={<Link href="/college/projects" className="text-link underline lms-inline-link">Back to workspaces</Link>}/>
  </div>;
  const templates=await listAssignedProjectTemplates(context,collegeId);
  return <div className="min-w-0 space-y-6">
    <ProjectAdminNav basePath="/college/projects" active="workspaces"/>
    <PageHeader title="Create workspace"
      description="Choose the published template and learners for this workspace."
      actions={<Link href="/college/projects" className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline lms-inline-link md:min-h-9">Back to workspaces</Link>} />
    <CreateProjectControl standalone collegeId={collegeId} basePath="/college/projects"
      templates={templates.map(template=>({
        templateId:template.templateId,title:template.title,version:template.version,summary:template.summary,
      }))}/>
  </div>;
}
