import { ProjectAdminMissingCollege } from "@/components/projects/project-admin-missing-college";
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
  if (!collegeId) return <ProjectAdminMissingCollege/>;

  return (
    <ProjectAdminReassignMentorPage
      collegeId={collegeId}
      basePath="/college/projects"
      searchParams={await searchParams}
    />
  );
}
