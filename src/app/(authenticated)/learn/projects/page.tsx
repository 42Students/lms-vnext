import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ProjectList } from "@/components/projects/project-list";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { listMyProjectInstances } from "@/modules/projects/member-service";

export default async function LearnerProjectsPage() {
  const context = await getCurrentRequestContext();
  if (!hasMembershipRole(context, "LEARNER")) {
    redirect("/dashboard");
  }

  const rows = (
    await listMyProjectInstances(context)
  ).filter(
    (row) => row.memberRole === "LEARNER",
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learner"
        title="Projects"
        description="Your active Project workspaces, team responsibilities and final delivery progress."
      />
      <ProjectList
        items={rows.map((row) => ({
          id: row.project.id,
          title: row.project.title,
          summary: row.project.summary,
          status: row.project.status,
          updatedAt: row.project.updatedAt,
          participation: "Learner",
        }))}
        basePath="/learn/projects"
        emptyTitle="No Projects yet"
        emptyDescription="Projects will appear here after your college assigns you to a Project team."
      />
    </div>
  );
}
