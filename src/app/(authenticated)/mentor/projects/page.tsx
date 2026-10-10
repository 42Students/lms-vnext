import Link from "next/link";
import { MentorProjectsUnavailable } from "@/components/projects/mentor-projects-unavailable";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ProjectList } from "@/components/projects/project-list";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { listMyProjectInstances } from "@/modules/projects/member-service";

export default async function MentorProjectsPage() {
  const context = await getCurrentRequestContext();
  if (!hasMembershipRole(context, "MENTOR")) {
    redirect("/dashboard");
  }

  const available = await resolveOptionalModuleAccess(context).catch(() => null);
  if (available?.projects.enabled !== true) return <MentorProjectsUnavailable />;

  const rows = (
    await listMyProjectInstances(context)
  ).filter(
    (row) => row.memberRole === "MENTOR",
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Mentor"
        title="Mentoring Projects"
        description="Projects where you are responsible for execution guidance, review and final evaluation."
        actions={<div className="flex flex-wrap gap-2">
          <Link href="/mentor/calendar"
            className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-primary-text">
            Meetings
          </Link>
          <Link href="/mentor/notifications"
            className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-primary-text">
            Notifications
          </Link>
        </div>}
      />
      <ProjectList
        items={rows.map((row) => ({
          id: row.project.id,
          title: row.project.title,
          summary: row.project.summary,
          status: row.project.status,
          updatedAt: row.project.updatedAt,
          participation: row.isPrimaryMentor
            ? "Primary mentor"
            : "Mentor",
        }))}
        basePath="/mentor/projects"
        emptyTitle="No mentoring Projects"
        emptyDescription="Projects appear here when a College Admin assigns your Mentor membership to the team."
      />
    </div>
  );
}
