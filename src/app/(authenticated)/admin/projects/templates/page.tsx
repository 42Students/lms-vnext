import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import {SuperAdminTemplatePageExport} from "@/components/projects/super-admin-template-page-export";

import { can } from "@/modules/permissions/policy";
import { templateDirectoryHref, templateDirectoryQuerySchema } from "@/modules/projects/super-admin-template-directory-model";
import { listSuperAdminTemplateDirectory } from "@/modules/projects/super-admin-template-directory-service";
const statuses=["ALL","DRAFT","PUBLISHED","ARCHIVED"] as const;
function tone(status:string){
 return status==="PUBLISHED"?"success" as const:status==="ARCHIVED"?"neutral" as const:"warning" as const;
}
export default async function SuperAdminProjectTemplatesPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const raw=await searchParams;
 const query=templateDirectoryQuerySchema.safeParse({q:raw.q,status:raw.status,page:raw.page});
 if(!query.success)return <div className="space-y-5">
  <PageHeader eyebrow="Super Admin · Projects" title="Templates" />
  <ErrorState title="Invalid template filters" description="Check search, status and page."
   action={<Link href="/admin/projects/templates" className="font-semibold text-primary-text">Clear filters</Link>}/>
 </div>;
 const context=await getCurrentRequestContext();
 const data=await listSuperAdminTemplateDirectory(context,query.data);
 return <div className="space-y-5">
  <ProjectAdminNav basePath="/admin/projects" active="templates"/>
  <PageHeader eyebrow="Super Admin · Projects" title="Template catalogue"
   description="Global template metadata with active college-assignment counts limited to your current administrative scope. No publishing or editing when scoped."
   actions={can(context,"project-template.manage")?<Link href="/admin/projects/templates/new" className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">New template →</Link>:undefined}/>
  <form method="get" className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[1fr_auto_auto]">
   <label className="grid gap-1 text-sm font-semibold text-body">Template title or slug
    <input type="search" name="q" maxLength={100} defaultValue={data.query.q}
     className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
   </label>
   <label className="grid gap-1 text-sm font-semibold text-body">Status
    <select name="status" defaultValue={data.query.status} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
     {statuses.map(x=><option key={x} value={x}>{x}</option>)}
    </select>
   </label>
   <button type="submit" className="min-h-11 self-end rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Filter</button>
  </form>
  <SuperAdminTemplatePageExport items={data.items}/>
  <p className="text-xs text-muted-foreground">{data.total} templates · page {data.query.page} of {data.totalPages} · assignment counts: {data.assignmentScope.toLowerCase()} scope</p>
  {data.items.length?<div className="grid gap-4 md:grid-cols-2">
   {data.items.map(item=><article key={item.id} className="min-w-0 rounded-xl border border-border bg-surface p-5">
    <div className="flex flex-wrap items-start justify-between gap-2">
     <h2 className="m-0 break-words text-base font-semibold text-foreground">{item.title}</h2>
     <StatusBadge tone={tone(item.status)}>{item.status}</StatusBadge>
    </div>
    <p className="mt-1 text-xs text-muted-foreground">{item.slug}</p>
    {item.summary?<p className="mt-2 text-sm text-body">{item.summary}</p>:null}
    {item.sectionCounts?<div className="mt-3 flex flex-wrap gap-2 text-xs text-body">
      <span className="rounded border border-border px-2 py-1">Overview</span>
      <span className="rounded border border-border px-2 py-1">Sprints {item.sectionCounts.sprints}</span>
      <span className="rounded border border-border px-2 py-1">Tasks {item.sectionCounts.tasks}</span>
      <span className="rounded border border-border px-2 py-1">Resources {item.sectionCounts.resources}</span>
    </div>:null}
    <p className="mt-3 text-sm text-body">Version {item.currentVersion} · published {item.publishedVersion??"Not yet"} · {item.activeAssignments} active assignments in scope</p>
    <Link href={`/admin/projects/templates/${encodeURIComponent(item.id)}`}
     className="mt-3 inline-flex min-h-10 items-center font-semibold text-primary-text">Inspect template →</Link>
   </article>)}
  </div>:<EmptyState title="No matching templates" description="No global template metadata matches these filters."/>}
  <nav aria-label="Template pages" className="flex flex-wrap gap-3 text-sm">
   {data.query.page>1?<Link href={templateDirectoryHref({...data.query,page:data.query.page-1})} className="font-semibold text-primary-text">Previous</Link>:null}
   {data.query.page<data.totalPages?<Link href={templateDirectoryHref({...data.query,page:data.query.page+1})} className="font-semibold text-primary-text">Next</Link>:null}
  </nav>
 </div>;
}
