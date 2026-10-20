import { PageBackLink } from "@/components/ui/page-back-link";
import {ProjectAdminMissingCollege} from "@/components/projects/project-admin-missing-college";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getProjectAdminCollegeId } from "@/modules/projects/admin-college-scope";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import { ProjectTemplateView } from "@/components/projects/project-template-view";
import { Badge } from "@/components/ui/badge";
import { getAssignedProjectTemplateDetail } from "@/modules/projects/template-service";

export default async function CollegeProjectTemplateDetailPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const context = await getCurrentRequestContext();
  const collegeId = getProjectAdminCollegeId(context);
  if (!collegeId) return <ProjectAdminMissingCollege/>;
  const { templateId } = await params;
  const detail =
    await getAssignedProjectTemplateDetail(
      context,
      collegeId,
      templateId,
    );

  return (
    <div className="min-w-0 space-y-[16px]">
      <ProjectAdminNav
        basePath="/college/projects"
        active="templates"
      />
      <PageHeader
        title={detail.version.title}
        description={
          detail.version.summary ??
          "Published template assigned to this college."
        }
        actions={<div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
          <PageBackLink href="/college/projects/templates" label="Template catalogue" />
          <Badge tone="success">Version {detail.version.version}</Badge>
        </div>}
      />
      <section aria-label="Template sections" className="min-w-0">
        <ProjectTemplateView blueprint={detail.version.blueprint} />
      </section>
    </div>
  );
}
