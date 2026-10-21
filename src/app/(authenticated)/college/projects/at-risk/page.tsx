import {ProjectAdminMissingCollege} from "@/components/projects/project-admin-missing-college";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ProjectAdminAtRiskPage } from "@/components/projects/project-admin-at-risk-page";
import { getProjectAdminCollegeId } from "@/modules/projects/admin-college-scope";

export default async function CollegeProjectAtRiskRoute({
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
    return <ProjectAdminMissingCollege variant="at-risk"/>;
  }

  return (
    <ProjectAdminAtRiskPage
      collegeId={collegeId}
      basePath="/college/projects"
      searchParams={await searchParams}
    />
  );
}
