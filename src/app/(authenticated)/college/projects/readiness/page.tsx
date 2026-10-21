import {ProjectAdminMissingCollege} from "@/components/projects/project-admin-missing-college";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ProjectAdminReadinessPage } from "@/components/projects/project-admin-readiness-page";
import { getProjectAdminCollegeId } from "@/modules/projects/admin-college-scope";

export default async function CollegeProjectReadinessRoute({
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
    return <ProjectAdminMissingCollege variant="readiness"/>;
  }

  return (
    <ProjectAdminReadinessPage
      collegeId={collegeId}
      basePath="/college/projects"
      searchParams={await searchParams}
    />
  );
}
