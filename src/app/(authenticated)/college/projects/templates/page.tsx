import Link from "next/link";
import {redirect} from "next/navigation";
import {AuthorizationError} from "@/modules/permissions/policy";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {ProjectAdminNav} from "@/components/projects/project-admin-nav";
import {ProjectAdminMissingCollege} from "@/components/projects/project-admin-missing-college";
import {StatusBadge} from "@/components/ui/status-badge";
import {EmptyState} from "@/components/ui/empty-state";
import {DataTable} from "@/components/ui/data-table";
import {ErrorState} from "@/components/ui/error-state";
import {listAssignedProjectTemplates} from "@/modules/projects/template-service";
import {getProjectAdminCollegeId} from "@/modules/projects/admin-college-scope";
import {ProjectTemplateCatalogueSearch} from "@/components/projects/project-template-catalogue-search";
import {ProjectTemplateCatalogueExport} from "@/components/projects/project-template-catalogue-export";
import {projectTemplateSectionCounts} from "@/modules/projects/project-template-catalogue-model";

const basePath="/college/projects/templates";
const pageSize=10;
const one=(value:string|string[]|undefined)=>
 Array.isArray(value)?value[0]:value;
function pageHref(query:string,page:number,from:string|null){
 const params=new URLSearchParams();
 if(query)params.set("q",query);
 if(from)params.set("from",from);
 if(page>1)params.set("page",String(page));
 return basePath+(params.size?"?"+params.toString():"");
}

export default async function CollegeProjectTemplatesPage({
 searchParams,
}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const context=await getCurrentRequestContext();
 const collegeId=getProjectAdminCollegeId(context);
 if(!collegeId)return <ProjectAdminMissingCollege variant="templates"/>;
 const params=await searchParams;
 const legacySearch=one(params.search);
 if(legacySearch!==undefined){
  // Canonicalize the old ?search= deep link without discarding the page
  // number or the project-list return context from a shared bookmark.
  const canonical=(one(params.q)??legacySearch).trim().slice(0,120);
  const legacyFrom=one(params.from);
  const retainedFrom=legacyFrom&&/^(workspaces|create|at-risk)$/.test(legacyFrom)?legacyFrom:null;
  const legacyPage=one(params.page)??"1";
  const retainedPage=/^[1-9]\d{0,5}$/.test(legacyPage)?Number(legacyPage):1;
  redirect(pageHref(canonical,retainedPage,retainedFrom));
 }
 const q=(one(params.q)??"").trim().slice(0,120);
 const from=one(params.from);
 const preservedFrom=from&&/^(workspaces|create|at-risk)$/.test(from)?from:null;
 const read=await listAssignedProjectTemplates(context,collegeId,q)
  .then(value=>({ok:true as const,value}))
  .catch((error:unknown)=>{
   if(error instanceof AuthorizationError)throw error;
   return {ok:false as const};
  });
 if(!read.ok)return <div className="min-w-0 space-y-4">
  <ProjectAdminNav basePath="/college/projects" active="templates"/>
  <PageHeader title="Project templates"
   description="Pick a template to start a new project workspace."/>
  <ErrorState title="Templates could not be loaded"
   description="The assigned template catalogue could not be loaded. Your search was not changed."
   action={<Link href={pageHref(q,1,preservedFrom)}
    className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
    Retry loading templates
   </Link>}/>
 </div>;
 const templates=read.value;
 const rawPage=one(params.page)??"1";
 const requestedPage=/^[1-9]\d{0,5}$/.test(rawPage)?Number(rawPage):1;
 const totalPages=Math.max(1,Math.ceil(templates.length/pageSize));
 const page=Math.min(Math.max(1,requestedPage),totalPages);
 const start=(page-1)*pageSize;
 const visible=templates.slice(start,start+pageSize);
 const rows=templates.map(template=>({
  templateId:template.templateId,
  title:template.title,
  summary:template.summary,
  version:template.version,
  sections:projectTemplateSectionCounts(template.blueprint),
 }));
 return <div className="min-w-0 space-y-5">
  <PageHeader title="Project templates"
   description="Pick a template to start a new project workspace."/>
  <ProjectAdminNav basePath="/college/projects" active="templates"/>
  <p role="status" className="border-l-[3px] border-info-border bg-info-subtle px-3 py-2 text-sm text-body">
   Published project templates are assigned to this college by a Super Admin.
   Pick a template to create a workspace for your learners.
  </p>
  <section aria-label="Templates" className="min-w-0 space-y-3">
   <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--lms-canvas-border)] pb-3">
    <h2 className="text-lg font-semibold text-foreground">Templates</h2>
    <div className="flex min-w-0 w-full flex-wrap items-center gap-2 sm:w-auto">
     <ProjectTemplateCatalogueSearch initialQuery={q}/>
     <ProjectTemplateCatalogueExport rows={rows}/>
    </div>
   </div>
   {visible.length? <DataTable
      caption="Assigned project templates"
      rows={visible}
      getRowKey={template=>template.assignmentId}
      empty={<EmptyState title="No templates are available to this college yet"/>}
      mobileMode="cards"
      columns={[
        {key:"template",header:"Template",mobileLabel:"Template",mobilePriority:"primary",
          cell:template=><div className="min-w-0 space-y-1">
            <p className="break-words font-semibold text-foreground">{template.title}</p>
            <p className="whitespace-pre-wrap break-words text-xs text-muted-foreground">{template.summary?.trim()||"—"}</p>
          </div>},
        {key:"version",header:"Version",mobileLabel:"Version",mobilePriority:"secondary",
          cell:template=>Number.isFinite(template.version)?String(template.version):"—"},
        {key:"sections",header:"Sections",mobileLabel:"Sections",mobilePriority:"secondary",
          cell:template=>{
            const counts=projectTemplateSectionCounts(template.blueprint);
            return <div className="flex min-w-0 flex-wrap gap-1.5">
              <StatusBadge tone="neutral">Overview {counts.overview}</StatusBadge>
              <StatusBadge tone="neutral">Sprints {counts.sprints}</StatusBadge>
              <StatusBadge tone="neutral">Tasks {counts.tasks}</StatusBadge>
              <StatusBadge tone="neutral">Resources {counts.resources}</StatusBadge>
            </div>;
          }},
        {key:"action",header:"Action",mobileLabel:"Action",mobilePriority:"action",
          cell:template=><Link href={basePath+"/"+encodeURIComponent(template.templateId)}
            className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            View &amp; use
          </Link>},
      ]}
    />:<EmptyState
    title={q?"No project templates match this search.":"No templates are available to this college yet"}
    description={q?"No templates match this search. Try another title or slug.":
     "No templates are available to this college yet. Ask a Super Admin to publish and assign one."}
    action={q?<Link href={basePath}
     className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
     Clear search
    </Link>:undefined}/>}
   <nav aria-label="Template catalogue pages"
    className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-sm text-body">
    <p role="status">Showing {templates.length?start+1:0}–{Math.min(start+pageSize,templates.length)}
     {" of "}{templates.length} templates</p>
    {totalPages>1?<div className="flex flex-wrap items-center gap-3">
     {page>1?<Link href={pageHref(q,page-1,preservedFrom)}
      className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
      Previous</Link>:<span aria-disabled="true" className="opacity-50">Previous</span>}
     <span className="tabular-nums">Page {page} of {totalPages}</span>
     {page<totalPages?<Link href={pageHref(q,page+1,preservedFrom)}
      className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
      Next</Link>:<span aria-disabled="true" className="opacity-50">Next</span>}
    </div>:null}
   </nav>
  </section>
 </div>;
}
