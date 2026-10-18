import { getCurrentRequestContext } from "@/auth/request-context";
import { ProjectAdminReassignMentorPage } from "@/components/projects/project-admin-reassign-mentor-page";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { can } from "@/modules/permissions/policy";
import Link from "next/link";
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
      <div className="min-w-0 space-y-6">
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

  if(!can(context,"projects.manage",{
    organizationId:context.adminScope?.organizationId??null,
    collegeId,
  })){
    return <div className="min-w-0 space-y-6">
      <ProjectAdminNav basePath="/admin/projects" active="workspaces"/>
      <PageHeader eyebrow="Super Admin Projects" title="Bulk mentor reassignment"/>
      <ErrorState title="Mentor reassignment access denied"
        description="This account cannot manage projects in the selected college."
        action={<Link href="/admin/projects" className="font-semibold text-[var(--lms-teal-deep)]">Back to projects</Link>}/>
    </div>;
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
