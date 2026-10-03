import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ProjectList } from "@/components/projects/project-list";
import { PageHeader } from "@/components/ui/page-header";
import { listProjectInstances } from "@/modules/projects/instance-service";

export default async function CollegeProjectsPage() {
  const context = await getCurrentRequestContext();
  const membership = context.membership;
  if (!membership) {
    redirect("/dashboard");
  }

  const projects = await listProjectInstances(
    context,
    membership.collegeId,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="College Admin"
        title="Projects"
        description="College Project workspaces, execution state, teams, delivery and review."
      />
      <ProjectList
        items={projects.map((project) => ({
          id: project.id,
          title: project.title,
          summary: project.summary,
          status: project.status,
          updatedAt: project.updatedAt,
        }))}
        basePath="/college/projects"
        emptyTitle="No Projects yet"
        emptyDescription="Create a Project from an assigned published template to start a team workspace."
      />
    </div>
  );
}
