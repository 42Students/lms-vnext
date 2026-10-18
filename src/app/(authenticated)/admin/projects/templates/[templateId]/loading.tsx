import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";

/** Bounded, retryable loading state with the existing project navigation. */
export default function SuperAdminTemplateDetailLoading() {
  return <div className="min-w-0 space-y-6">
    <ProjectAdminNav basePath="/admin/projects" active="templates" />
    <PageHeader eyebrow="Super Admin · Projects" title="Project Template" description="Loading template information…" />
    <GracefulPageLoading label="Loading template section…" />
  </div>;
}
