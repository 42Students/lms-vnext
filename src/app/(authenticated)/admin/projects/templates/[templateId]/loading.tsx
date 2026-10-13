import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";

export default function SuperAdminTemplateDetailLoading() {
  return (
    <div className="space-y-6">
      <ProjectAdminNav
        basePath="/admin/projects"
        active="templates"
      />

      <PageHeader
        eyebrow="Super Admin · Projects"
        title="Project Template"
        description="Loading template information…"
      />

      <LoadingState label="Loading template section…" />
    </div>
  );
}
