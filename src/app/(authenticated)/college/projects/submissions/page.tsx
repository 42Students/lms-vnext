import {ProjectAdminMissingCollege} from "@/components/projects/project-admin-missing-college";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ProjectAdminSubmissionsPage } from "@/components/projects/project-admin-submissions-page";
import { getProjectAdminCollegeId } from "@/modules/projects/admin-college-scope";

export default async function CollegeProjectSubmissionsRoute({
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
    getProjectAdminCollegeId(context);

  if (!collegeId) {
    return <ProjectAdminMissingCollege/>;
  }

  return (
    <ProjectAdminSubmissionsPage
      collegeId={collegeId}
      basePath="/college/projects"
      eyebrow="College Admin Projects"
      searchParams={await searchParams}
    />
  );
}
