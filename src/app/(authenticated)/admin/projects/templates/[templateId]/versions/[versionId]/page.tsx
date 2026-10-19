import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
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
      <PageHeader eyebrow="Super Admin · Projects" title="Template version comparison"/>
      <ErrorState title="Template history access denied"
        description="Only an authorized administrator can read global template version snapshots."
        action={<Link href="/admin/projects/templates" className="font-semibold text-primary-text">Back to template catalogue</Link>}/>
    </div>;
  }
  let detail;
  try { detail = await getSuperAdminTemplateVersionComparison(context, ids.data); }
  catch (error) {
    if (error instanceof ProjectsServiceError &&
      (error.code === "PROJECT_TEMPLATE_NOT_FOUND" || error.code === "PROJECT_TEMPLATE_VERSION_NOT_FOUND")) notFound();
    return <div className="min-w-0 space-y-5">
      <PageHeader eyebrow="Super Admin · Projects" title="Template version comparison"/>
      <ErrorState title="Template history unavailable"
        description="The version comparison could not be loaded. No private version content is shown."
        action={<Link href={"/admin/projects/templates/"+encodeURIComponent(ids.data.templateId)+"/versions"}
          className="font-semibold text-primary-text">Back to version history</Link>}/>
    </div>;
  }
  return <div className="min-w-0 space-y-6">
    <PageHeader eyebrow="Super Admin · Read-only version comparison" title={detail.template.title}
      description={`Version ${detail.selected.version} compared with current version ${detail.current.version}. Existing workspaces retain their pinned snapshots.`}
      actions={<Link href={`/admin/projects/templates/${encodeURIComponent(detail.template.id)}/versions`}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3.5 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9">← Version history</Link>} />
    <p className="text-sm text-muted-foreground">This snapshot is read-only. Publication state and college assignments are managed separately.</p>
    {detail.changes.length ? <section aria-label="Changed fields" className="space-y-4">
      {detail.changes.map(change => <article key={change.label} className="min-w-0 border-b border-border py-4">
        <h2 className="text-base font-semibold text-foreground">{change.label}</h2>
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          {[{ label: "Current", value: change.current }, { label: "Selected version", value: change.selected }].map(value =>
            <div key={value.label} className="min-w-0"><h3 className="text-sm font-semibold text-body">{value.label}</h3>
              <pre role="region" aria-label={`${change.label} ${value.label} version content`} tabIndex={0} className="max-h-80 overflow-y-auto overscroll-contain [mask-image:linear-gradient(to_bottom,black_85%,transparent_100%)] whitespace-pre-wrap break-all rounded-[var(--lms-canvas-radius)] bg-muted p-3 text-xs text-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{value.value}</pre></div>)}
        </div>
      </article>)}
    </section> : <p className="border-b border-border py-4 text-sm text-body">No content differences from the current version.</p>}
    {can(context,"project-template.manage")?<SuperAdminTemplateRollbackControl
      templateId={detail.template.id} selectedVersion={{
        id:detail.selected.id,version:detail.selected.version,title:detail.selected.title,
      }} currentVersion={detail.template.currentVersion} status={detail.template.status}/>:null}
    <section aria-label="Selected version snapshot"><h2 className="text-lg font-semibold text-foreground">Version {detail.selected.version} snapshot</h2>
      <ProjectTemplateView blueprint={detail.selected.blueprint} />
    </section>
  </div>;
}
