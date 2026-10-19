import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
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
 if(!query.success)return <div className="min-w-0 space-y-5">
  <PageHeader eyebrow="Super Admin · Projects" title="Templates" />
  <ErrorState title="Invalid template filters" description="Check search, status and page."
   action={<Link href="/admin/projects/templates" className="font-semibold text-primary-text">Clear filters</Link>}/>
 </div>;
 const context=await getCurrentRequestContext();
 if(!can(context,"project-template.read"))
  return <div className="min-w-0 space-y-5">
   <ProjectAdminNav basePath="/admin/projects" active="templates"/>
   <PageHeader eyebrow="Super Admin · Projects" title="Project templates"/>
   <ErrorState title="Project templates access denied"
    description="This account cannot read the global project template catalogue. Check the active Super Admin session."
    action={<Link href="/dashboard" className="font-semibold text-primary-text">Return to dashboard</Link>}/>
  </div>;
 let data:Awaited<ReturnType<typeof listSuperAdminTemplateDirectory>>;
 try {
  data=await listSuperAdminTemplateDirectory(context,query.data);
 } catch {
  return <div className="min-w-0 space-y-5">
   <ProjectAdminNav basePath="/admin/projects" active="templates"/>
   <PageHeader eyebrow="Super Admin · Projects" title="Project templates"/>
   <ErrorState title="Project templates unavailable"
    description="The template catalogue could not be loaded. Your search and status filters are unchanged; try again."
    action={<Link href={templateDirectoryHref(query.data)} className="font-semibold text-primary-text">Retry loading templates</Link>}/>
  </div>;
 }
 return <div className="min-w-0 space-y-5">
  <ProjectAdminNav basePath="/admin/projects" active="templates"/>
  <PageHeader eyebrow="Super Admin · Projects" title="Project templates"
   description="A single catalog every college draws from — college-admin can use these but not edit them."
   actions={can(context,"project-template.manage")?<Link href="/admin/projects/templates/new" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-primary bg-primary px-3.5 text-sm font-semibold text-on-primary hover:bg-primary-hover sm:min-h-9">New template →</Link>:undefined}/>
  <form method="get" className="grid min-w-0 grid-cols-1 gap-3 border-b border-border pb-4 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
   <label className="grid gap-1 text-sm font-semibold text-body">Template title or slug
    <Input type="search" name="q" maxLength={100} defaultValue={data.query.q}
     className="w-full"/>
   </label>
   <label className="grid gap-1 text-sm font-semibold text-body">Status
    <Select name="status" defaultValue={data.query.status} className="w-full">
     {statuses.map(x=><option key={x} value={x}>{x}</option>)}
    </Select>
   </label>
   <Button type="submit" className="self-end">Filter</Button>
  </form>
  <ListToolbar label="Global project templates" viewCount={data.total}
    exportAction={<SuperAdminTemplatePageExport items={data.items}/>} />
  <p className="text-xs text-muted-foreground">{data.total} templates · page {data.query.page} of {data.totalPages} · assignment counts: {data.assignmentScope.toLowerCase()} scope</p>
  {data.items.length?<div className="grid gap-4 md:grid-cols-2">
   {data.items.map(item=><article key={item.id} className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
    <div className="flex flex-wrap items-start justify-between gap-2">
     <h2 className="m-0 break-words text-base font-semibold text-foreground">{item.title}</h2>
     <StatusBadge tone={tone(item.status)}>{item.status}</StatusBadge>
    </div>
    <p className="mt-1 text-xs text-muted-foreground">{item.slug}</p>
    {item.summary?<p className="mt-2 text-sm text-body">{item.summary}</p>:null}
    {item.sectionCounts?<div className="mt-3 flex flex-wrap gap-2 text-xs text-body">
      <Badge tone="info">Overview</Badge>
      <Badge tone="info">Sprints {item.sectionCounts.sprints}</Badge>
      <Badge tone="info">Tasks {item.sectionCounts.tasks}</Badge>
      <Badge tone="info">Resources {item.sectionCounts.resources}</Badge>
    </div>:null}
    <p className="mt-3 text-sm text-body">Version {item.currentVersion} · published {item.publishedVersion??"Not yet"} · {item.activeAssignments} active assignments in scope</p>
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <Link href={`/admin/projects/templates/${encodeURIComponent(item.id)}`}
       className="inline-flex min-h-11 items-center font-semibold text-primary-text">Inspect template →</Link>
      {can(context,"project-template.manage")?<SuperAdminTemplateArchiveControl
        templateId={item.id} title={item.title} status={item.status}/>:null}
    </div>
   </article>)}
  </div>:<EmptyState title="No matching templates" description="No global template metadata matches these filters."/>}
  <Pagination page={data.query.page} pageCount={data.totalPages} hrefForPage={page=>templateDirectoryHref({...data.query,page})} label="Template pages" />
 </div>;
}
