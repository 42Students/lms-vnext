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
import {previewProjectTemplateRollbackImpact} from "@/modules/projects/template-rollback-service";

export default async function TemplateVersionComparisonPage({ params,searchParams }: {
  params: Promise<{ templateId: string; versionId: string }>;
  searchParams: Promise<{from?:string;page?:string}>;
}) {
  const context = await getCurrentRequestContext();
  const ids = templateVersionComparisonParamsSchema.safeParse(await params);
  if (!ids.success) notFound();
  const navigation=await searchParams;
  const historicPage=typeof navigation.page==="string"&&/^[1-9]\d{0,5}$/.test(navigation.page)
    ?Number(navigation.page):null;
  const versionHistoryHref="/admin/projects/templates/"+encodeURIComponent(ids.data.templateId)+
    "/versions"+(historicPage?"?page="+historicPage:"")+
    "#version-"+encodeURIComponent(ids.data.versionId);
  if (!can(context,"project-template.read")) {
    return <div className="min-w-0 space-y-6">
      <PageHeader title="Template version comparison"/>
      <ErrorState title="Template history access denied"
        description="Only an authorized administrator can read global template version snapshots."
        action={<PageBackLink href="/admin/projects/templates" label="Back to templates" />}/>
    </div>;
  }
  let detail;
  try { detail = await getSuperAdminTemplateVersionComparison(context, ids.data); }
  catch (error) {
    if (error instanceof ProjectsServiceError &&
      (error.code === "PROJECT_TEMPLATE_NOT_FOUND" || error.code === "PROJECT_TEMPLATE_VERSION_NOT_FOUND")) notFound();
    return <div className="min-w-0 space-y-6">
      <PageHeader title="Template version comparison"/>
      <ErrorState title="Template history unavailable"
        description={error instanceof SyntaxError || error instanceof TypeError
          ? "Version snapshot could not be read. Do not roll back without a verified diff."
          : "The version comparison could not be loaded. No private version content is shown and rollback is disabled."}
        action={<PageBackLink href={versionHistoryHref} label="Back to version history" />}/>
    </div>;
  }
  const canManage=can(context,"project-template.manage");
  const impact=canManage?await previewProjectTemplateRollbackImpact(context,detail.template.id)
    .catch(()=>null):null;
  return <div className="min-w-0 space-y-4 md:space-y-6">
    <PageBackLink href={versionHistoryHref} label="Version history" />
    <PageHeader title={detail.template.title}
      description={`Version ${detail.selected.version} compared with current version ${detail.current.version}. Existing workspaces retain their pinned snapshots.`}
    />
    <Banner tone="info">This snapshot is read-only. Publication, deletion/archive state and college assignments are managed separately. Rolling back creates a new blueprint version; it does not restore legacy lifecycle fields.</Banner>
    {detail.changes.length ? <section aria-label="Changed fields" className="max-w-[860px] space-y-4">
      {detail.changes.map(change => <article key={change.label} className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
        <h2 className="m-0 break-words text-[18px] font-semibold leading-[1.4] text-[var(--lms-heading)]">{change.label}</h2>
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          {[{ label: "Current", value: change.current }, { label: "Selected version", value: change.selected }].map(value =>
            <div key={value.label} className="min-w-0"><h3 className="font-semibold text-[16px] leading-[1.4] text-[var(--lms-heading)]">{value.label}</h3>
              <pre role="region" aria-label={`${change.label} ${value.label} version content`} tabIndex={0} className="max-h-[220px] min-w-0 overflow-y-auto overscroll-contain whitespace-pre-wrap break-words border-y border-[var(--lms-canvas-border)] bg-surface py-[var(--lms-space-3)] text-xs text-body focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">{value.value}</pre></div>)}
        </div>
      </article>)}
    </section> : <EmptyState title="No content differences" description="No content differences from the current version."/>}
    {canManage&&impact?<SuperAdminTemplateRollbackControl
      impact={impact}
      key={detail.template.id+":"+detail.selected.id+":"+detail.template.currentVersion}
      templateId={detail.template.id} selectedVersion={{
        id:detail.selected.id,version:detail.selected.version,title:detail.selected.title,
      }} currentVersion={detail.template.currentVersion} status={detail.template.status}/>:null}
    {canManage&&!impact?<Banner tone="warning">
      Rollback impact could not be checked. Refresh comparison before restoring a version.
    </Banner>:null}
    <section aria-label="Selected version snapshot" className="min-w-0 border-t border-border pt-[var(--lms-space-4)]"><h2 className="font-semibold text-[18px] leading-[1.4] text-[var(--lms-heading)]">Version {detail.selected.version} snapshot</h2>
      <ProjectTemplateView blueprint={detail.selected.blueprint} />
    </section>
  </div>;
}
