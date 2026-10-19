import Link from "next/link";
import { ProjectAdminMissingCollege } from "@/components/projects/project-admin-missing-college";
import { getProjectAdminCollegeId } from "@/modules/projects/admin-college-scope";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ClassTeamWorkspaceCreator } from "@/components/projects/class-team-workspace-creator";
import { PageHeader } from "@/components/ui/page-header";
import { listAssignedProjectTemplates } from "@/modules/projects/template-service";
import { requireTeamCreationAuthority } from "@/modules/projects/class-team-roster-service";

export default async function CollegeClassProjectWorkspacePage() {
  const context = await getCurrentRequestContext();
  const collegeId = getProjectAdminCollegeId(context);
  if (!collegeId) return <ProjectAdminMissingCollege/>;
  await requireTeamCreationAuthority(context, collegeId);
  const templates = await listAssignedProjectTemplates(context, collegeId);
  return (
    <div className="w-full min-w-0 space-y-6">
      <PageHeader eyebrow="College Admin · Projects" title="Create workspaces from a class" description="Split active learners into balanced teams, review assignments, or add the whole class to a single Project workspace." />
      {templates.length === 0 ? <div role="status" className="space-y-3 border-l-2 border-border py-2 pl-4">
        <p className="text-sm text-body">No published Project template is assigned to this college.</p>
        <Link href="/college/projects/templates" className="inline-flex min-h-[var(--lms-control-height)] items-center font-semibold text-link underline">Project templates</Link>
      </div> :
        <ClassTeamWorkspaceCreator collegeId={collegeId} basePath="/college/projects" templates={templates.map(t => ({ templateId:t.templateId, title:t.title, version:t.version, summary:t.summary }))} />}
    </div>
  );
}