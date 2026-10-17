import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {CreateProjectControl} from "@/components/projects/project-create-control";
import {ProjectAdminNav} from "@/components/projects/project-admin-nav";
import {PageHeader} from "@/components/ui/page-header";
import {listAssignedProjectTemplates} from "@/modules/projects/template-service";

export default async function CollegeCreateProjectPage() {
  const context=await getCurrentRequestContext();
  if(!context.membership)return <main className="space-y-4">
    <PageHeader title="Create workspace" description="Select a college to continue."/>
    <p role="alert" className="rounded-xl border border-border bg-surface p-4 text-sm">
      Choose a college from the account switcher before creating a workspace.
    </p>
    <Link href="/college/projects" className="text-primary-text underline">Back to workspaces</Link>
  </main>;
  const collegeId=context.membership.collegeId;
  const templates=await listAssignedProjectTemplates(context,collegeId);
  return <main className="space-y-6">
    <ProjectAdminNav basePath="/college/projects" active="workspaces"/>
    <PageHeader eyebrow="College Admin · Projects" title="Create workspace"
      description="Choose the published template and learners for this workspace."/>
    <Link href="/college/projects" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">
      Back to workspaces
    </Link>
    <CreateProjectControl standalone collegeId={collegeId} basePath="/college/projects"
      templates={templates.map(template=>({
        templateId:template.templateId,title:template.title,version:template.version,summary:template.summary,
      }))}/>
  </main>;
}
