import {PageHeader} from "@/components/ui/page-header";
import {Alert} from "@/components/ui/alert";
import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getProjectAdminCollegeId} from "@/modules/projects/admin-college-scope";
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
  if(!getProjectAdminCollegeId(context))return <div className="min-w-0 space-y-4">
    <PageHeader title="Project audit" description="Who changed what, and when — check daily for anything unexpected." />
    <Alert tone="warning" role="status" title="Select a college to continue">
      Choose a college in the header above to see its project audit.
    </Alert>
    <Link href="/college/projects" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
      Back to project workspaces
    </Link>
   </div>;
  return (
    <ProjectAdminAuditPage
      basePath="/college/projects"
      searchParams={await searchParams}
    />
  );
}
