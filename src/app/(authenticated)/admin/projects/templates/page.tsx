import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable } from "@/components/ui/data-table";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import {SuperAdminTemplatePageExport} from "@/components/projects/super-admin-template-page-export";
import {SuperAdminTemplateArchiveControl} from "@/components/projects/super-admin-template-archive-control";

import { can } from "@/modules/permissions/policy";
import { templateDirectoryHref, parseSuperAdminTemplateDirectoryQuery } from "@/modules/projects/super-admin-template-directory-model";
import { listSuperAdminTemplateDirectory } from "@/modules/projects/super-admin-template-directory-service";
const statuses=["ALL","DRAFT","PUBLISHED","ARCHIVED"] as const;
function tone(status:string){
 return status==="PUBLISHED"?"success" as const:status==="ARCHIVED"?"neutral" as const:"warning" as const;
}
export default async function SuperAdminProjectTemplatesPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const raw=await searchParams;
 const query=parseSuperAdminTemplateDirectoryQuery(raw);
 const recoveryQ=typeof raw.q==="string"&&raw.q.length<=100?raw.q.trim():"";
 const recoveryHref="/admin/projects/templates"+(recoveryQ?"?q="+encodeURIComponent(recoveryQ):"");
 if(!query.success)return <div className="min-w-0 space-y-4 md:space-y-6">
  <PageHeader title="Project templates" />
  <ErrorState title="Invalid template filters" description="Check search, status and page."
   action={<Link href="/admin/projects/templates" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline min-[768px]:min-h-9 hover:text-[var(--lms-primary)] underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto md:min-h-9">Clear filters</Link>}/>
 </div>;
 const context=await getCurrentRequestContext();
 if(!can(context,"project-template.read"))
  return <div className="min-w-0 space-y-4 md:space-y-6">
   <PageHeader title="Project templates"/>
   <ProjectAdminNav basePath="/admin/projects" active="templates"/>
   <ErrorState title="Project templates access denied"
    description="This account cannot read the global project template catalogue. Check the active Super Admin session."
    action={<PageBackLink href="/dashboard" label="Return to dashboard" />}/>
  </div>;
 let data:Awaited<ReturnType<typeof listSuperAdminTemplateDirectory>>;
 try {
  data=await listSuperAdminTemplateDirectory(context,query.data);
 } catch {
  return <div className="min-w-0 space-y-4 md:space-y-6">
   <PageHeader title="Project templates"/>
   <ProjectAdminNav basePath="/admin/projects" active="templates"/>
   <ErrorState title="Templates could not be loaded"
    description="The template catalogue could not be loaded. Your search and status filters are unchanged; try again."
    action={<Link href={templateDirectoryHref(query.data)} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline min-[768px]:min-h-9 hover:text-[var(--lms-primary)] underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto md:min-h-9">Retry loading templates</Link>}/>
  </div>;
 }
 return <div className="min-w-0 space-y-4 md:space-y-6">
  <PageHeader title="Templates"
   description="A single catalog every college draws from — college-admin can use these but not edit them."
   actions={can(context,"project-template.manage")?<Link href="/admin/projects/templates/new" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] px-3.5 text-sm font-[650] text-on-primary hover:border-[var(--lms-button-primary)]-hover hover:bg-[var(--lms-button-primary)]-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 md:w-auto">Create template</Link>:undefined}/>
  <ProjectAdminNav basePath="/admin/projects" active="templates"/>
  <section aria-label="Templates" className="min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 md:p-6">
    <h2 className="text-lg font-semibold text-[var(--lms-heading)]">Templates</h2>
  <form method="get" className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-2)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] md:grid-cols-[minmax(0,1fr)_auto_auto]">
   <label className="grid gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">Template title or slug
    <Input type="search" name="q" maxLength={100} defaultValue={data.query.q}
     placeholder="Search title or slug" className="min-h-11 w-full min-w-0 md:min-h-9"/>
   </label>
   <label className="grid gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">Status
    <Select name="status" defaultValue={data.query.status} aria-label="Lifecycle status" className="min-h-11 w-full min-w-0 md:min-h-9">
     {statuses.map(x=><option key={x} value={x}>{x==="ALL"?"Lifecycle status":x[0]+x.slice(1).toLowerCase()}</option>)}
    </Select>
   </label>
   <Button type="submit" className="min-h-11 w-full self-end md:min-h-9 md:w-auto">Filter</Button>
  </form>
  <ListToolbar label="Global project templates" viewCount={data.total}
    exportAction={<SuperAdminTemplatePageExport items={data.items}/>} />
  <p className="m-0 text-xs text-muted-foreground">Export CSV downloads project-templates.csv (Title, Version, Lifecycle, Summary) for the current permissioned page, not every filtered template.</p>
  <p className="m-0 break-words text-xs text-muted-foreground">Page {data.query.page} of {data.totalPages} · assignment counts: {data.assignmentScope.toLowerCase()} scope</p>
  <DataTable<(typeof data.items)[number]>
    caption="Global project template catalogue"
    rows={data.items}
    getRowKey={item=>item.id}
    columns={[
      {key:"template",header:"Template",mobilePriority:"primary",cell:item=><>
        <Link href={"/admin/projects/templates/"+encodeURIComponent(item.id)+"/overview"}
          className="inline-flex items-center min-h-11 md:min-h-9 break-words font-semibold text-primary-text underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)]">{item.title}</Link>

      </>},
      {key:"version",header:"Version",mobilePriority:"secondary",cell:item=>item.currentVersion??"—"},
      {key:"status",header:"Lifecycle",mobilePriority:"secondary",cell:item=>
        <StatusBadge tone={tone(item.status)}>{item.status[0]+item.status.slice(1).toLowerCase()}</StatusBadge>},
      {key:"sections",header:"Sections",mobilePriority:"secondary",cell:item=>item.sectionCounts?
        <div className="flex min-w-0 flex-wrap gap-2">
          <Badge tone="info">Overview 1</Badge>
          <Badge tone="info">Sprints {item.sectionCounts.sprints}</Badge>
          <Badge tone="info">Tasks {item.sectionCounts.tasks}</Badge>
          <Badge tone="info">Resources {item.sectionCounts.resources}</Badge>
        </div>:<span className="text-muted-foreground">Not configured</span>},

      {key:"assignments",header:"Assignments",mobilePriority:"secondary",cell:item=>
        <span className="tabular-nums text-sm text-body">{item.activeAssignments} active in scope</span>},
      {key:"action",header:"Action",mobilePriority:"action",cell:item=>
        <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Link href={"/admin/projects/templates/"+encodeURIComponent(item.id)+"/overview"}
            className="inline-flex min-h-11 items-center font-semibold text-primary-text underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)]">Open</Link>
          {can(context,"project-template.manage")?<SuperAdminTemplateArchiveControl
            templateId={item.id} title={item.title} status={item.status}/>:null}
        </div>},
    ]}
    empty={<EmptyState title="No matching templates" description="No global template metadata matches these filters."
      action={<Link href="/admin/projects/templates" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary w-full md:w-auto md:min-h-9">Clear filters</Link>}/>}
  />
  <Pagination page={data.query.page} pageCount={data.totalPages} hrefForPage={page=>templateDirectoryHref({...data.query,page})} label="Template pages" />
  </section>
 </div>;
}
