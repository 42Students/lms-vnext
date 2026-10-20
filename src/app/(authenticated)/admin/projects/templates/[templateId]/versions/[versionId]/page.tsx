import { PageBackLink } from "@/components/ui/page-back-link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Banner } from "@/components/ui/banner";
import { ProjectTemplateView } from "@/components/projects/project-template-view";
import {SuperAdminTemplateRollbackControl} from "@/components/projects/super-admin-template-rollback-control";
import {can} from "@/modules/permissions/policy";
import { ProjectsServiceError } from "@/modules/projects/errors";
import { templateVersionComparisonParamsSchema } from "@/modules/projects/template-version-comparison-model";
import { getSuperAdminTemplateVersionComparison } from "@/modules/projects/template-version-comparison-service";

export default async function TemplateVersionComparisonPage({ params }: {
  params: Promise<{ templateId: string; versionId: string }>;
}) {
  const context = await getCurrentRequestContext();
  const ids = templateVersionComparisonParamsSchema.safeParse(await params);
  if (!ids.success) notFound();
  if (!can(context,"project-template.read")) {
    return <div className="min-w-0 space-y-5">
      <PageHeader title="Template version comparison"/>
      <ErrorState title="Template history access denied"
        description="Only an authorized administrator can read global template version snapshots."
        action={<PageBackLink href="/admin/projects/templates" label="Template catalogue" />}/>
    </div>;
  }
  let detail;
  try { detail = await getSuperAdminTemplateVersionComparison(context, ids.data); }
  catch (error) {
    if (error instanceof ProjectsServiceError &&
      (error.code === "PROJECT_TEMPLATE_NOT_FOUND" || error.code === "PROJECT_TEMPLATE_VERSION_NOT_FOUND")) notFound();
    return <div className="min-w-0 space-y-5">
      <PageHeader title="Template version comparison"/>
      <ErrorState title="Template history unavailable"
        description="The version comparison could not be loaded. No private version content is shown."
        action={<PageBackLink href={"/admin/projects/templates/"+encodeURIComponent(ids.data.templateId)+"/versions"} label="Back to version history" />}/>
    </div>;
  }
  return <div className="min-w-0 space-y-6">
    <PageHeader title={detail.template.title}
      description={`Version ${detail.selected.version} compared with current version ${detail.current.version}. Existing workspaces retain their pinned snapshots.`}
      actions={<PageBackLink href={`/admin/projects/templates/${encodeURIComponent(detail.template.id)}/versions`} label="Version history" />} />
    <Banner tone="info">This snapshot is read-only. Publication state and college assignments are managed separately.</Banner>
    {detail.changes.length ? <section aria-label="Changed fields" className="space-y-4">
      {detail.changes.map(change => <article key={change.label} className="min-w-0 border-b border-border py-4">
        <h2 className="text-base font-semibold text-foreground">{change.label}</h2>
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          {[{ label: "Current", value: change.current }, { label: "Selected version", value: change.selected }].map(value =>
            <div key={value.label} className="min-w-0"><h3 className="text-sm font-semibold text-body">{value.label}</h3>
              <pre role="region" aria-label={`${change.label} ${value.label} version content`} tabIndex={0} className="max-h-80 overflow-y-auto overscroll-contain whitespace-pre-wrap break-all rounded-[var(--lms-canvas-radius)] bg-muted p-3 text-xs text-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{value.value}</pre></div>)}
        </div>
      </article>)}
    </section> : <EmptyState title="No content differences" description="No content differences from the current version."/>}
    {can(context,"project-template.manage")?<SuperAdminTemplateRollbackControl
      templateId={detail.template.id} selectedVersion={{
        id:detail.selected.id,version:detail.selected.version,title:detail.selected.title,
      }} currentVersion={detail.template.currentVersion} status={detail.template.status}/>:null}
    <section aria-label="Selected version snapshot"><h2 className="text-lg font-semibold text-foreground">Version {detail.selected.version} snapshot</h2>
      <ProjectTemplateView blueprint={detail.selected.blueprint} />
    </section>
  </div>;
}
