import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { PageBackLink } from "@/components/ui/page-back-link";
import { getProjectAdminCollegeId } from "@/modules/projects/admin-college-scope";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ProjectAdminReassignMentorPage } from "@/components/projects/project-admin-reassign-mentor-page";

export default async function CollegeProjectReassignMentorRoute({
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
  const collegeId = getProjectAdminCollegeId(context);
  if (!collegeId) return <div className="min-w-0 space-y-4">
    <PageHeader title="Bulk mentor reassignment" actions={<PageBackLink href="/college/projects" label="Back to workspaces"/>}/>
    <Alert tone="warning" title="Admin not assigned to a college">You must be assigned to a college before reassigning mentors.</Alert>
  </div>;

  return (
    <ProjectAdminReassignMentorPage
      collegeId={collegeId}
      basePath="/college/projects"
      searchParams={await searchParams}
    />
  );
}
