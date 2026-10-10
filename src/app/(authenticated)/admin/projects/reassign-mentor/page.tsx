import { getCurrentRequestContext } from "@/auth/request-context";
import { ProjectAdminReassignMentorPage } from "@/components/projects/project-admin-reassign-mentor-page";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";

export default async function SuperAdminProjectReassignMentorRoute({
  searchParams,
}: {
  searchParams: Promise<
    Record<
      string,
      string | string[] | undefined
    >
  >;
}) {
  const context = await getCurrentRequestContext();
  const collegeId =
    context.adminScope?.collegeId ?? null;

  if (!collegeId) {
    return (
      <div className="space-y-6">
        <ProjectAdminNav
          basePath="/admin/projects"
          active="workspaces"
        />
        <PageHeader
          eyebrow="Super Admin Projects"
          title="Bulk mentor reassignment"
          description="A selected college scope is required."
        />
        <EmptyState
          title="Select a college scope"
          description="Choose a college before reassigning project mentors."
        />
      </div>
    );
  }

  return (
    <ProjectAdminReassignMentorPage
      collegeId={collegeId}
      basePath="/admin/projects"
      eyebrow="Super Admin Projects"
      searchParams={await searchParams}
    />
  );
}
