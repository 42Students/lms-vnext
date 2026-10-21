import Link from "next/link";
import { ProjectAdminMissingCollege } from "@/components/projects/project-admin-missing-college";
import { getProjectAdminCollegeId } from "@/modules/projects/admin-college-scope";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ClassTeamWorkspaceCreator } from "@/components/projects/class-team-workspace-creator";
import { PageHeader } from "@/components/ui/page-header";
import { Banner } from "@/components/ui/banner";
import { ErrorState } from "@/components/ui/error-state";
import { listAssignedProjectTemplates } from "@/modules/projects/template-service";
import { requireTeamCreationAuthority } from "@/modules/projects/class-team-roster-service";

export default async function CollegeClassProjectWorkspacePage() {
  const context = await getCurrentRequestContext();
  const collegeId = getProjectAdminCollegeId(context);
  if (!collegeId) return <ProjectAdminMissingCollege/>;
  await requireTeamCreationAuthority(context, collegeId);
  const templatesResult = await listAssignedProjectTemplates(context, collegeId)
    .then(value=>({ok:true as const,value}))
    .catch(()=>({ok:false as const}));
  if(!templatesResult.ok)return <div className="min-w-0 space-y-6">
    <PageHeader title="Create workspaces from a class" description="Split active learners into balanced teams, review assignments, or add the whole class to a single Project workspace."/>
    <ErrorState title="Project templates unavailable"
      description="Assigned project templates could not be loaded. No workspace was created."
      action={<Link href="/college/projects/workspaces/new" className="md:min-h-9 inline-flex min-h-11 items-center font-semibold text-link underline">Retry loading templates</Link>}/>
  </div>;
  const templates = templatesResult.value;
  return (
    <div className="w-full min-w-0 space-y-6">
      <PageHeader title="Create workspaces from a class" description="Split active learners into balanced teams, review assignments, or add the whole class to a single Project workspace." />
      {templates.length === 0 ? <Banner tone="warning"
        action={<Link href="/college/projects/templates" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9 lms-inline-link">Project templates</Link>}>
        No published Project template is assigned to this college.
      </Banner> :
        <ClassTeamWorkspaceCreator collegeId={collegeId} userId={context.user.id} basePath="/college/projects" templates={templates.map(t => ({ templateId:t.templateId, title:t.title, version:t.version, summary:t.summary }))} />}
    </div>
  );
}