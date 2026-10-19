import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectsServiceError } from "@/modules/projects/errors";
import { projectTemplateIdSchema } from "@/modules/projects/validation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import { SuperAdminTemplateTabs } from "@/components/projects/super-admin-template-tabs";
import { countTemplateBlueprintItems } from "@/modules/projects/template-subview-model";
import { ProjectTemplateView } from "@/components/projects/project-template-view";
import { TemplateMetadataEditControl } from "@/components/projects/template-metadata-edit-control";
import { ProjectTemplateActions } from "@/components/projects/project-template-controls";
import { StatusBadge } from "@/components/ui/status-badge";
import { getProjectTemplateDetail } from "@/modules/projects/template-service";
import { can } from "@/modules/permissions/policy";

export default async function SuperAdminProjectTemplateDetailPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const context = await getCurrentRequestContext();
  const { templateId } = await params;
  const id = projectTemplateIdSchema.safeParse(templateId);
  if (!id.success) notFound();
  if (!can(context,"project-template.read")) {
    return <div className="min-w-0 space-y-5">
      <PageHeader eyebrow="Super Admin · Projects" title="Project template"/>
      <ErrorState title="Project template access denied"
        description="The active administrator does not have permission to view global project templates."
        action={<Link href="/admin/projects/templates" className="font-semibold text-primary-text">Back to template catalogue</Link>}/>
    </div>;
  }
  let detail: Awaited<ReturnType<typeof getProjectTemplateDetail>>;
  try {
    detail = await getProjectTemplateDetail(context, id.data);
  } catch (error) {
    if (error instanceof ProjectsServiceError && error.code === "PROJECT_TEMPLATE_NOT_FOUND") notFound();
    return <div className="min-w-0 space-y-5">
      <PageHeader eyebrow="Super Admin · Projects" title="Project template"/>
      <ErrorState title="Project template unavailable"
        description="This template could not be loaded. No version or college assignment details are shown."
        action={<Link href={"/admin/projects/templates/"+encodeURIComponent(id.data)}
          className="font-semibold text-primary-text">Retry template details</Link>}/>
    </div>;
  }

  return (
    <div className="min-w-0 space-y-6">
      <ProjectAdminNav
        basePath="/admin/projects"
        active="templates"
      />
      <PageHeader
        eyebrow="Global Project Template"
        title={detail.template.title}
        description={
          detail.template.summary ??
          "Global project template."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/projects/templates"
              className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3.5 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9">
              ← Template catalogue
            </Link>
            <StatusBadge
              tone={
                detail.template.status === "PUBLISHED"
                  ? "success"
                  : detail.template.status === "ARCHIVED"
                    ? "neutral"
                    : "warning"
              }
            >
              {detail.template.status}
            </StatusBadge>
            {can(context, "project-template.manage") && detail.template.status === "DRAFT" ?
              <TemplateMetadataEditControl templateId={detail.template.id} title={detail.template.title}
                summary={detail.template.summary} currentVersion={detail.template.currentVersion}
                updatedAt={detail.template.updatedAt.toISOString()} /> : null}
            {can(context, "project-template.manage") || context.adminScope?.collegeId ? (
            <ProjectTemplateActions
              templateId={detail.template.id}
              title={detail.template.title}
              status={detail.template.status}
              selectedCollegeId={
                context.adminScope?.collegeId ?? null
              }
              allowGlobalActions={can(context, "project-template.manage")}
              assignedToSelectedCollege={
                Boolean(
                  context.adminScope?.collegeId &&
                    detail.assignments.some(
                      (assignment) =>
                        assignment.collegeId ===
                        context.adminScope?.collegeId,
                    ),
                )
              }
            />
            ) : <span className="text-xs text-muted-foreground">Clear admin scope for global template edits.</span>}
          </div>
        }
      />
      <SuperAdminTemplateTabs
        templateId={detail.template.id}
        active="overview"
        counts={{
          ...(detail.currentVersion ? countTemplateBlueprintItems(detail.currentVersion.blueprint) : {}),
          colleges:detail.assignments.length,
          versions:detail.versions.length,
        }}
      />
      {detail.currentVersion ? (
        <ProjectTemplateView
          blueprint={detail.currentVersion.blueprint}
        />
      ) : (
        <section className="border-b border-border py-5 text-sm text-muted-foreground">
          The current template version could not be resolved.
        </section>
      )}
      <section className="border-b border-border py-5">
        <h2 className="m-0 text-base font-semibold text-foreground">
          Version history
        </h2>
        <div className="mt-3 space-y-2">
          {detail.versions.map((version) => (
            <div
              key={version.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3 last:border-0"
            >
              <div>
                <p className="m-0 text-sm font-semibold text-foreground">
                  Version {version.version} · {version.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {version.changeNote ||
                    "No change note recorded."}
                </p>
              </div>
              {detail.template.publishedVersion ===
              version.version ? (
                <StatusBadge tone="success">
                  Published
                </StatusBadge>
              ) : null}
            </div>
          ))}
        </div>
        <p className="mb-0 mt-4 text-xs text-muted-foreground">
          Active college assignments in {context.adminScope?.collegeId ? "selected college" : context.adminScope?.organizationId ? "selected organization" : "global"} scope: {detail.assignments.length}
        </p>
      </section>
    </div>
  );
}
