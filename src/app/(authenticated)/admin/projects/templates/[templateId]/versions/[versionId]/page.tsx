import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectTemplateView } from "@/components/projects/project-template-view";
import { ProjectsServiceError } from "@/modules/projects/errors";
import { templateVersionComparisonParamsSchema } from "@/modules/projects/template-version-comparison-model";
import { getSuperAdminTemplateVersionComparison } from "@/modules/projects/template-version-comparison-service";

export default async function TemplateVersionComparisonPage({ params }: {
  params: Promise<{ templateId: string; versionId: string }>;
}) {
  const context = await getCurrentRequestContext();
  const ids = templateVersionComparisonParamsSchema.safeParse(await params);
  if (!ids.success) notFound();
  let detail;
  try { detail = await getSuperAdminTemplateVersionComparison(context, ids.data); }
  catch (error) {
    if (error instanceof ProjectsServiceError &&
      (error.code === "PROJECT_TEMPLATE_NOT_FOUND" || error.code === "PROJECT_TEMPLATE_VERSION_NOT_FOUND")) notFound();
    throw error;
  }
  return <div className="min-w-0 space-y-6">
    <Link href={`/admin/projects/templates/${detail.template.id}/versions`}
      className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text">← Version history</Link>
    <PageHeader eyebrow="Super Admin · Read-only version comparison" title={detail.template.title}
      description={`Version ${detail.selected.version} compared with current version ${detail.current.version}. Existing workspaces retain their pinned snapshots.`} />
    <p className="text-sm text-muted-foreground">This snapshot is read-only. Publication state and college assignments are managed separately.</p>
    {detail.changes.length ? <section aria-label="Changed fields" className="space-y-4">
      {detail.changes.map(change => <article key={change.label} className="min-w-0 rounded-xl border border-border bg-surface p-4">
        <h2 className="text-base font-semibold text-foreground">{change.label}</h2>
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          {[{ label: "Current", value: change.current }, { label: "Selected version", value: change.selected }].map(value =>
            <div key={value.label} className="min-w-0"><h3 className="text-sm font-semibold text-body">{value.label}</h3>
              <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap break-all rounded-lg bg-muted p-3 text-xs text-body">{value.value}</pre></div>)}
        </div>
      </article>)}
    </section> : <p className="rounded-xl border border-border bg-surface p-4 text-sm text-body">No content differences from the current version.</p>}
    <section aria-label="Selected version snapshot"><h2 className="text-lg font-semibold text-foreground">Version {detail.selected.version} snapshot</h2>
      <ProjectTemplateView blueprint={detail.selected.blueprint} />
    </section>
  </div>;
}
