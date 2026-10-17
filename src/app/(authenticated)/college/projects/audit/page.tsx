import {ProjectAdminMissingCollege} from "@/components/projects/project-admin-missing-college";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import { ProjectAdminAuditPage } from "@/components/projects/project-admin-audit-page";

export default async function CollegeProjectAuditPage({
  searchParams,
}: {
  searchParams: Promise<
    Record<
      string,
      string | string[] | undefined
    >
  >;
}) {
  const context=await getCurrentRequestContext();
  if(!context.membership && !isSuperAdmin(context))return <ProjectAdminMissingCollege/>;
  return (
    <ProjectAdminAuditPage
      basePath="/college/projects"
      searchParams={await searchParams}
    />
  );
}
