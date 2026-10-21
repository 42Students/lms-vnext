import { PageBackLink } from "@/components/ui/page-back-link";
import Link from "next/link";

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
import { SuperAdminTemplatePreviewControl } from "@/components/admin/super-admin-template-preview-control";

export default async function SuperAdminProjectTemplateDetailPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const context = await getCurrentRequestContext();
  const { templateId } = await params;
  const id = projectTemplateIdSchema.safeParse(templateId);
  if (!id.success) return <div className="min-w-0 space-y-5">
    <PageHeader title="Project template"/>
    <ErrorState title="No template in this link"
     description="This template identifier is not supported. Choose a template from the directory. Legacy numeric and slug identifiers require a verified migration mapping."
     action={<PageBackLink href="/admin/projects/templates" label="Back to templates"/>}/>
   </div>;
  if (!can(context,"project-template.read")) {
    return <div className="min-w-0 space-y-5">
      <PageHeader title="Project template"/>
      <ErrorState title="Project template access denied"
        description="The active administrator does not have permission to view global project templates."
        action={<PageBackLink href="/admin/projects/templates" label="Back to templates" />}/>
    </div>;
  }
  let detail: Awaited<ReturnType<typeof getProjectTemplateDetail>>;
  try {
    detail = await getProjectTemplateDetail(context, id.data);
  } catch (error) {
    if (error instanceof ProjectsServiceError && error.code === "PROJECT_TEMPLATE_NOT_FOUND")
      return <div className="min-w-0 space-y-5">
       <PageHeader title="Project template"/>
       <ErrorState title="Template not found"
        description="No template is available for this link. Choose a valid template from the directory."
        action={<PageBackLink href="/admin/projects/templates" label="Back to templates"/>}/>
      </div>;
    return <div className="min-w-0 space-y-5">
      <PageHeader title="Project template"/>
      <ErrorState title="Failed to load template"
        description="This template could not be loaded. Check your active scope and retry; no version or college assignment details are shown."
        action={<Link href={"/admin/projects/templates/"+encodeURIComponent(id.data)}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] w-full md:w-auto">Retry template details</Link>}/>
    </div>;
  }

  return (
    <div className="min-w-0 space-y-4 md:space-y-5">
      <ProjectAdminNav
        basePath="/admin/projects"
        active="templates"
      />
      <PageBackLink href="/admin/projects/templates" label="Back to templates" />
      <PageHeader
        title={detail.template.title}
        description={
          detail.template.summary ??
          "Global project template."
        }
        actions={
          <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center">
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
            {detail.currentVersion?
              <SuperAdminTemplatePreviewControl title={detail.template.title} blueprint={detail.currentVersion.blueprint}/> : null}
            {can(context,"activity.read")?<Link
              href={"/admin/projects/audit?subjectType=project_template&subjectId="+encodeURIComponent(detail.template.id)}
              className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">
              Audit trail</Link>:null}
            {detail.template.status==="PUBLISHED"&&context.adminScope?.collegeId&&
             detail.assignments.some(a=>a.collegeId===context.adminScope?.collegeId)?
             <Link href={"/admin/projects/workspaces/new?templateId="+encodeURIComponent(detail.template.id)}
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] bg-[var(--lms-button-primary)] px-3 text-sm font-semibold text-on-primary md:min-h-9 hover:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-primary">
              Use this template</Link>:
             <span role="status" className="text-xs text-muted-foreground">
              {context.adminScope?.collegeId?"Assign a published template to this college to create workspaces.":"Choose a college to use this template."}
             </span>}
            {can(context, "project-template.manage") && detail.template.status === "DRAFT" ?
              <TemplateMetadataEditControl templateId={detail.template.id} title={detail.template.title}
                summary={detail.template.summary} currentVersion={detail.template.currentVersion}
                slug={detail.template.slug}
                courseLabel={detail.currentVersion?.blueprint.overview.courseLabel??detail.template.legacyCourseLabel??""}
                phase={detail.currentVersion?.blueprint.overview.phase??detail.template.legacyPhase??""}
                overview={{
                  goal:detail.currentVersion?.blueprint.overview.goal??"",
                  description:detail.currentVersion?.blueprint.overview.description??"",
                  deliverables:detail.currentVersion?.blueprint.overview.deliverables??[],
                  definitionOfDone:detail.currentVersion?.blueprint.overview.definitionOfDone??[],
                  personas:detail.currentVersion?.blueprint.overview.personas??[],
                  submissionInstructions:detail.currentVersion?.blueprint.overview.submissionInstructions??"",
                }}
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
        <h2 className="m-0 font-semibold text-[18px] leading-[1.4] text-[var(--lms-heading)]">
          Version history
        </h2>
        <div className="mt-3 space-y-2">
          {detail.versions.length === 0 ? <p className="text-sm text-muted-foreground">No version history recorded.</p> : null}
          {detail.versions.map((version) => (
            <div
              key={version.id}
              className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-border py-3 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="m-0 break-words text-sm font-semibold text-foreground">
                  Version {version.version} · {version.title}
                </p>
                <p className="mt-1 break-words text-xs text-muted-foreground">
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
