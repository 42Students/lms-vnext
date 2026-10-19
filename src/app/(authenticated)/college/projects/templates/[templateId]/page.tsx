import Link from "next/link";
import {ProjectAdminMissingCollege} from "@/components/projects/project-admin-missing-college";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getProjectAdminCollegeId } from "@/modules/projects/admin-college-scope";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import { ProjectTemplateView } from "@/components/projects/project-template-view";
import { StatusBadge } from "@/components/ui/status-badge";
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
    <div className="space-y-6">
      <ProjectAdminNav
        basePath="/college/projects"
        active="templates"
      />
      <Link
        href="/college/projects/templates"
        className="inline-flex min-h-[var(--lms-control-height)] items-center text-sm font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        ← Template catalogue
      </Link>
      <PageHeader
        eyebrow="Assigned Project Template"
        title={detail.version.title}
        description={
          detail.version.summary ??
          "Published template assigned to this college."
        }
        actions={
          <StatusBadge tone="success">
            Version {detail.version.version}
          </StatusBadge>
        }
      />
      <section aria-label="Template sections" className="min-w-0">
        <ProjectTemplateView blueprint={detail.version.blueprint} />
      </section>
    </div>
  );
}
