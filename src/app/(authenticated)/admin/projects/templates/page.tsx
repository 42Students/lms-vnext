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
 if(!query.success)return <div className="min-w-0 space-y-5">
  <PageHeader title="Templates" />
  <ErrorState title="Invalid template filters" description="Check search, status and page."
   action={<Link href="/admin/projects/templates" className="font-semibold text-primary-text">Clear filters</Link>}/>
 </div>;
 const context=await getCurrentRequestContext();
 if(!can(context,"project-template.read"))
  return <div className="min-w-0 space-y-5">
   <ProjectAdminNav basePath="/admin/projects" active="templates"/>
   <PageHeader title="Project templates"/>
   <ErrorState title="Project templates access denied"
    description="This account cannot read the global project template catalogue. Check the active Super Admin session."
    action={<PageBackLink href="/dashboard" label="Return to dashboard" />}/>
  </div>;
 let data:Awaited<ReturnType<typeof listSuperAdminTemplateDirectory>>;
 try {
  data=await listSuperAdminTemplateDirectory(context,query.data);
 } catch {
  return <div className="min-w-0 space-y-5">
   <ProjectAdminNav basePath="/admin/projects" active="templates"/>
   <PageHeader title="Project templates"/>
   <ErrorState title="Project templates unavailable"
    description="The template catalogue could not be loaded. Your search and status filters are unchanged; try again."
    action={<Link href={templateDirectoryHref(query.data)} className="font-semibold text-primary-text">Retry loading templates</Link>}/>
  </div>;
 }
 return <div className="min-w-0 space-y-5">
  <ProjectAdminNav basePath="/admin/projects" active="templates"/>
  <PageHeader title="Project templates"
   description="A single catalog every college draws from — college-admin can use these but not edit them."
   actions={can(context,"project-template.manage")?<Link href="/admin/projects/templates/new" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-primary bg-primary px-3.5 text-sm font-[650] text-on-primary hover:border-primary-hover hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">New template →</Link>:undefined}/>
  <form method="get" className="grid min-w-0 grid-cols-1 gap-3 border-b border-border pb-4 md:grid-cols-[minmax(0,1fr)_auto_auto]">
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
  <DataTable<(typeof data.items)[number]>
    caption="Global project template catalogue"
    rows={data.items}
    getRowKey={item=>item.id}
    columns={[
      {key:"template",header:"Template",mobilePriority:"primary",cell:item=><>
        <Link href={"/admin/projects/templates/"+encodeURIComponent(item.id)}
          className="break-words font-semibold text-primary-text underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{item.title}</Link>
        <span className="mt-1 block break-all text-xs text-muted-foreground">{item.slug}</span>
        {item.summary?<p className="mt-2 break-words text-sm text-body">{item.summary}</p>:null}
      </>},
      {key:"status",header:"Status",mobilePriority:"secondary",cell:item=>
        <StatusBadge tone={tone(item.status)}>{item.status}</StatusBadge>},
      {key:"sections",header:"Sections",mobilePriority:"secondary",cell:item=>item.sectionCounts?
        <div className="flex min-w-0 flex-wrap gap-1.5">
          <Badge tone="info">Overview</Badge>
          <Badge tone="info">Sprints {item.sectionCounts.sprints}</Badge>
          <Badge tone="info">Tasks {item.sectionCounts.tasks}</Badge>
          <Badge tone="info">Resources {item.sectionCounts.resources}</Badge>
        </div>:<span className="text-muted-foreground">Not configured</span>},
      {key:"version",header:"Versions",mobilePriority:"secondary",cell:item=>
        <span className="text-xs text-body">Version {item.currentVersion} · published {item.publishedVersion??"Not yet"}</span>},
      {key:"assignments",header:"Assignments",mobilePriority:"secondary",cell:item=>
        <span className="tabular-nums text-sm text-body">{item.activeAssignments} active in scope</span>},
      {key:"action",header:"Action",mobilePriority:"action",cell:item=>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Link href={"/admin/projects/templates/"+encodeURIComponent(item.id)}
            className="inline-flex min-h-11 items-center font-semibold text-primary-text underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Inspect template →</Link>
          {can(context,"project-template.manage")?<SuperAdminTemplateArchiveControl
            templateId={item.id} title={item.title} status={item.status}/>:null}
        </div>},
    ]}
    empty={<EmptyState title="No matching templates" description="No global template metadata matches these filters."/>}
  />
  <Pagination page={data.query.page} pageCount={data.totalPages} hrefForPage={page=>templateDirectoryHref({...data.query,page})} label="Template pages" />
 </div>;
}
