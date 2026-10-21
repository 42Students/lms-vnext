import Link from "next/link";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {ProjectAdminNav} from "@/components/projects/project-admin-nav";
import {ProjectTemplateView} from "@/components/projects/project-template-view";
import {Alert} from "@/components/ui/alert";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {EmptyState} from "@/components/ui/empty-state";
import {ErrorState} from "@/components/ui/error-state";
import {PageHeader} from "@/components/ui/page-header";
import {AuthorizationError} from "@/modules/permissions/policy";
import {getProjectAdminCollegeId} from "@/modules/projects/admin-college-scope";
import {ProjectsServiceError} from "@/modules/projects/errors";
import {getAssignedProjectTemplateDetail} from "@/modules/projects/template-service";
import {publishableProjectTemplateBlueprintSchema} from "@/modules/projects/validation";

const subtitle="Maintained by 42Students — use this template to start a workspace.";
const backHref="/college/projects/templates";
const backAction=<Link href={backHref}
 className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-body hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">
 Back to templates
</Link>;

export default async function CollegeProjectTemplateDetailPage({
 params,
}:{params:Promise<{templateId:string}>}){
 const context=await getCurrentRequestContext();
 const collegeId=getProjectAdminCollegeId(context);
 const {templateId}=await params;
 const header=(useAction:boolean)=> <PageHeader title="Project template"
  description={subtitle}
  actions={<div className="flex min-w-0 flex-wrap gap-2">
   {backAction}
   {useAction?<Link href={"/college/projects/create?templateId="+encodeURIComponent(templateId)}
    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--lms-control-radius)] border border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
    Use this template
   </Link>:<Button disabled aria-label="Use this template unavailable"
    className="min-h-11 gap-2 md:min-h-9">
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
    Use this template
   </Button>}
  </div>}/>;
 if(!collegeId)return <div className="min-w-0 space-y-4">
  <ProjectAdminNav basePath="/college/projects" active="templates"/>
  {header(false)}
  <Alert tone="warning" title="Admin not assigned to a college">
   You must be assigned to a college to view project templates.
  </Alert>
 </div>;
 const detailResult=await getAssignedProjectTemplateDetail(context,collegeId,templateId)
  .then(value=>({kind:"ok" as const,value}))
  .catch((error:unknown)=>{
   if(error instanceof AuthorizationError ||
    error instanceof ProjectsServiceError&&error.code==="PROJECT_ACCESS_DENIED")throw error;
   if(error instanceof ProjectsServiceError&&["PROJECT_TEMPLATE_NOT_ASSIGNED",
    "PROJECT_TEMPLATE_NOT_FOUND","PROJECT_TEMPLATE_VERSION_NOT_FOUND"].includes(error.code) ||
    error instanceof z.ZodError)return {kind:"missing" as const};
   return {kind:"error" as const};
  });
 if(detailResult.kind!=="ok")return <div className="min-w-0 space-y-4">
  <ProjectAdminNav basePath="/college/projects" active="templates"/>
  {header(false)}
  {detailResult.kind==="missing"?
   <EmptyState title="Template not found" description="This published template is not assigned to the selected college."
    action={<Link href={backHref} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Back to templates</Link>}/>:
   <ErrorState title="Template could not be loaded" description="Failed to load template. Your selection was not changed."
    action={<Link href={"/college/projects/templates/"+encodeURIComponent(templateId)}
     className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Retry</Link>}/>}
 </div>;
 const detail=detailResult.value;
 const ready=detail.template.status==="PUBLISHED"&&
  publishableProjectTemplateBlueprintSchema.safeParse(detail.version.blueprint).success;
 const publication=detail.template.currentVersion===detail.template.publishedVersion&&
  detail.version.version===detail.template.publishedVersion
  ?detail.template.updatedAt:null;
 const publishedAt=publication?publication.toLocaleString("en-IN",{
  timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
 }):"—";
 return <div className="min-w-0 space-y-4 md:space-y-6">
  <ProjectAdminNav basePath="/college/projects" active="templates"/>
  {header(ready)}
  <section aria-label="Template information" className="min-w-0 space-y-3 rounded-[8px] border border-[var(--lms-canvas-border)] bg-surface p-4">
   <div className="flex flex-wrap items-center gap-2">
    <Badge tone={detail.template.status==="PUBLISHED"?"success":"neutral"}>{detail.template.status==="PUBLISHED"?"Published":"Draft"}</Badge>
    <Badge tone="neutral">
     <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 4h7a4 4 0 0 1 4 4v12a4 4 0 0 0-4-4H4zM20 4h-4a4 4 0 0 0-4 4v12a4 4 0 0 1 4-4h4z"/>
     </svg>
     Version {detail.version.version}
    </Badge>
   </div>
   <h2 className="text-lg font-semibold text-[var(--lms-heading)]">{detail.version.title||detail.template.title||"Template"}</h2>
   <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{detail.version.summary?.trim()||"—"}</p>
   <p className="text-xs text-muted-foreground">Published at: {publishedAt}</p>
  </section>
  {!ready?<Alert tone="warning" title="Template unavailable for workspace creation">
   This published template must have valid releases, sprints and tasks before it can be used.
  </Alert>:null}
  <ProjectTemplateView blueprint={detail.version.blueprint}/>
 </div>;
}
