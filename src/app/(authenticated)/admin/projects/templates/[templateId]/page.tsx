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
import { getProjectTemplateDetail,resolveLegacyProjectTemplateBookmark } from "@/modules/projects/template-service";
import { can } from "@/modules/permissions/policy";
import {redirect} from "next/navigation";
import {getDb} from "@/db/client";
import {colleges} from "@/db/schema";
import {eq} from "drizzle-orm";
import { SuperAdminTemplatePreviewControl } from "@/components/admin/super-admin-template-preview-control";

export default async function SuperAdminProjectTemplateDetailPage({
  params,searchParams,
}: {
  params: Promise<{ templateId: string }>;
  searchParams?: Promise<Record<string,string|string[]|undefined>>;
}) {
  const context = await getCurrentRequestContext();
  const { templateId } = await params;
  const id = projectTemplateIdSchema.safeParse(templateId);
  if(!id.success&&can(context,"project-template.read")){
    const resolved=await resolveLegacyProjectTemplateBookmark(context,templateId);
    if(resolved){
      const paramsValue=await searchParams;
      const safe=new URLSearchParams();
      // Old bookmarked template query state stays local to the authorized
      // project-template route; never forward arbitrary URLs or origin keys.
      for(const key of ["tab","view","version"]){
        const value=paramsValue?.[key];
        if(typeof value==="string"&&/^[a-zA-Z0-9_-]{1,64}$/.test(value))safe.set(key,value);
      }
      redirect("/admin/projects/templates/"+encodeURIComponent(resolved)+(safe.size?"?"+safe:""));
    }
  }
  if (!id.success) return <div className="min-w-0 space-y-5">
    <PageHeader title="Project template"/>
    <ErrorState title="No template in this link"
     description="The URL is missing a template id. Open the template from the Templates list instead."
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

  const selectedCollegeName=context.adminScope?.collegeId?
    (await getDb().select({name:colleges.name}).from(colleges)
      .where(eq(colleges.id,context.adminScope.collegeId)).limit(1))[0]?.name??null:null;
  return (
    <div className="min-w-0 space-y-4 md:space-y-5">
      <ProjectAdminNav
        basePath="/admin/projects"
        active="templates"
      />
      <PageBackLink href="/admin/projects/templates" label="Back to templates" />
      <PageHeader
        title={detail.template.title}
        description="Identity, lifecycle and the overview content mentors and students read."
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
            {can(context,"activity.read")?<Link
              href={"/admin/projects/audit?subjectType=project_template&subjectId="+encodeURIComponent(detail.template.id)}
              className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">
              Audit trail</Link>:null}
            {detail.currentVersion?
              <SuperAdminTemplatePreviewControl title={detail.template.title} blueprint={detail.currentVersion.blueprint}/> :
              <span role="status" className="text-xs text-muted-foreground">No preview available</span>}
            {detail.template.status==="PUBLISHED"&&context.adminScope?.collegeId&&
             detail.assignments.some(a=>a.collegeId===context.adminScope?.collegeId)?
             <Link href={"/admin/projects/workspaces/new?templateId="+encodeURIComponent(detail.template.id)}
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] bg-[var(--lms-button-primary)] px-3 text-sm font-semibold text-on-primary md:min-h-9 hover:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-primary">
              Create workspace</Link>:
             <span role="status" className="text-xs text-muted-foreground">
              {context.adminScope?.collegeId?"Assign a published template to this college to create workspaces.":"Choose a college to use this template."}
             </span>}
            {can(context, "project-template.manage") && detail.template.status === "DRAFT" && detail.currentVersion ?
              <TemplateMetadataEditControl templateId={detail.template.id} title={detail.template.title}
                summary={detail.template.summary} currentVersion={detail.template.currentVersion}
                updatedAt={detail.template.updatedAt.toISOString()}
                slug={detail.template.slug} blueprint={detail.currentVersion!.blueprint} /> : null}
            {can(context, "project-template.manage") || context.adminScope?.collegeId ? (
            <ProjectTemplateActions
              templateId={detail.template.id}
              title={detail.template.title}
              status={detail.template.status}
              selectedCollegeId={
                context.adminScope?.collegeId ?? null
              }
              selectedCollegeName={selectedCollegeName}
              allowGlobalActions={can(context, "project-template.manage")}
              blueprint={detail.currentVersion?.blueprint}
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
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,10fr)_minmax(0,14fr)] lg:gap-6">
        <section aria-labelledby="template-basic-info" className="min-w-0 rounded-lg border border-[var(--lms-canvas-border)] p-4 sm:p-5">
          <h2 id="template-basic-info" className="text-base font-semibold text-[var(--lms-heading)]">Basic info</h2>
          <dl className="mt-3 divide-y divide-[var(--lms-canvas-border)] text-sm">
            {([["Name",detail.template.title],["Slug",detail.template.slug],
              ["Summary",detail.template.summary??"Not given"],
              ["Course",detail.template.legacyCourseLabel??"Not given"]] as const).map(([label,value])=>
              <div key={label} className="grid min-w-0 gap-1 py-3 sm:grid-cols-[110px_minmax(0,1fr)]">
                <dt className="font-semibold text-body">{label}</dt>
                <dd className="min-w-0 break-words text-body">{value}</dd>
              </div>)}
          </dl>
        </section>
        <section aria-labelledby="template-lifecycle" className="min-w-0 rounded-lg border border-[var(--lms-canvas-border)] p-4 sm:p-5">
          <h2 id="template-lifecycle" className="text-base font-semibold text-[var(--lms-heading)]">Lifecycle settings</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge tone={detail.template.status==="PUBLISHED"?"success":detail.template.status==="ARCHIVED"?"neutral":"warning"}>{detail.template.status}</StatusBadge>
            <StatusBadge>Version {detail.template.currentVersion}</StatusBadge>
          </div>
          <dl className="mt-2 divide-y divide-[var(--lms-canvas-border)] text-sm">
            {([
              ["Published version",detail.template.publishedVersion!==null?"Version "+detail.template.publishedVersion:"Not published"],
              ["Published at","Not recorded"],
              ["Archived at",detail.template.archivedAt?new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(detail.template.archivedAt)+" IST":"Not archived"],
              ["Created at",new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(detail.template.createdAt)+" IST"],
              ["Last updated",new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(detail.template.updatedAt)+" IST"],
            ] as const).map(([label,value])=>
              <div key={label} className="grid min-w-0 gap-1 py-2 sm:grid-cols-[135px_minmax(0,1fr)]">
                <dt className="font-semibold text-body">{label}</dt>
                <dd className="min-w-0 break-words text-body">{value}</dd>
              </div>)}
          </dl>
          <p className="mt-2 text-xs text-muted-foreground">Publication time is not stored in the current template record; no timestamp is inferred from the version date.</p>
        </section>
      </div>
      <section aria-labelledby="template-overview-content" className="min-w-0 space-y-3">
        <h2 id="template-overview-content" className="text-base font-semibold text-[var(--lms-heading)]">Overview content</h2>
        {detail.currentVersion ? <ProjectTemplateView blueprint={detail.currentVersion.blueprint}/> :
          <div role="status" className="border-b border-border py-5 text-sm text-muted-foreground">
            No preview available. The current template version could not be resolved.
          </div>}
      </section>
      <section aria-labelledby="template-submission" className="border-b border-[var(--lms-canvas-border)] pb-4">
        <h2 id="template-submission" className="text-base font-semibold text-[var(--lms-heading)]">Submission</h2>
        <p className="mt-2 text-sm text-body">Submission requirements and deliverables are shown with the authorized current version above. Existing workspaces keep their materialized version.</p>
      </section>
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
