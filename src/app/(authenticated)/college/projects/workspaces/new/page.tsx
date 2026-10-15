import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ClassTeamWorkspaceCreator } from "@/components/projects/class-team-workspace-creator";
import { PageHeader } from "@/components/ui/page-header";
import { listAssignedProjectTemplates } from "@/modules/projects/template-service";
import { requireTeamCreationAuthority } from "@/modules/projects/class-team-roster-service";

export default async function CollegeClassProjectWorkspacePage() {
  const context = await getCurrentRequestContext();
  if (!context.membership) redirect("/college/projects");
  const collegeId = context.membership.collegeId;
  await requireTeamCreationAuthority(context, collegeId);
  const templates = await listAssignedProjectTemplates(context, collegeId);
  return (
    <main className="mx-auto w-full min-w-0 max-w-5xl space-y-6 px-3 py-4 sm:px-6">
      <PageHeader eyebrow="College Admin · Projects" title="Create workspaces from a class" description="Split active learners into balanced teams, review assignments, or add the whole class to a single Project workspace." />
      {templates.length === 0 ? <p role="status">No published Project template is assigned to this college.</p> :
        <ClassTeamWorkspaceCreator collegeId={collegeId} basePath="/college/projects" templates={templates.map(t => ({ templateId:t.templateId, title:t.title, version:t.version, summary:t.summary }))} />}
    </main>
  );
}