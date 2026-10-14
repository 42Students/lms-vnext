import Link from "next/link";
import { TenantDirectoryCsvControl } from "@/components/admin/tenant-directory-csv-control";
import { tenantDirectoryExportHref } from "@/modules/colleges/admin-tenant-export-model";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { tenantLifecycleQuerySchema, tenantLifecycleHref } from "@/modules/colleges/admin-tenant-lifecycle-model";
import { getSuperAdminTenantLifecycleDirectory } from "@/modules/colleges/admin-tenant-lifecycle-service";
export default async function TenantDirectory({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}) {
 const raw=await searchParams;
 const parsed=tenantLifecycleQuerySchema.safeParse({q:raw.q,organizationId:raw.organizationId,status:raw.status,page:raw.page});
 if(!parsed.success) return <div className="space-y-4">
  <PageHeader eyebrow="Super Admin" title="Tenant directory" />
  <ErrorState title="Invalid tenant filters" description="Search, organization or page is invalid."
   action={<Link href="/admin/tenants" className="font-semibold text-primary-text">Clear filters</Link>}/>
 </div>;
 const data=await getSuperAdminTenantLifecycleDirectory(await getCurrentRequestContext(),parsed.data);
 const url=(page:number)=>tenantLifecycleHref({...data.query,page});
 const statuses = ["ACTIVE", "ARCHIVED", "ALL"] as const;
 return <div className="space-y-5">
  <PageHeader eyebrow="Super Admin · Platform" title="Tenant directory"
   description="Read-only active and archived colleges with explicit lifecycle state. The selected Super Admin safety scope always applies."
   actions={<TenantDirectoryCsvControl href={tenantDirectoryExportHref({q:data.query.q,organizationId:data.query.organizationId,status:data.query.status})} />} />
  <Link href="/admin/tenants/setup" className="inline-flex min-h-11 items-center rounded-md border border-border px-4 font-semibold text-primary-text">Tenant Setup · Create / Set up →</Link>
  <form className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 xl:grid-cols-4">
   <label className="grid gap-1 text-sm font-semibold text-body">College
    <input type="search" name="q" maxLength={100} defaultValue={data.query.q}
     className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
   </label>
   <label className="grid gap-1 text-sm font-semibold text-body">Organization
    <select name="organizationId" defaultValue={data.query.organizationId}
     className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
     <option value="">All permitted</option>
     {data.organizations.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
    </select>
   </label>
   <label className="grid gap-1 text-sm font-semibold text-body">College status
    <select name="status" defaultValue={data.query.status} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
     {statuses.map(status=><option key={status}>{status}</option>)}
    </select>
   </label>
   <button type="submit" className="min-h-11 self-end rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Filter</button>
  </form>
  <p className="text-xs text-muted-foreground">{data.total} matching colleges · page {data.query.page} of {data.totalPages}</p>
  {data.items.length?<div className="grid gap-3 md:grid-cols-2">
   {data.items.map(x=><article key={x.id} className="min-w-0 rounded-xl border border-border bg-surface p-4">
    <h2 className="m-0 break-words font-semibold text-foreground">{x.name}</h2>
    <p className="mt-1 text-sm text-body">{x.organizationName} · {x.code}</p>
    <div className="mt-2 flex flex-wrap gap-2"><StatusBadge tone={x.status==="ACTIVE"?"success":"neutral"}>College {x.status}</StatusBadge>
     <StatusBadge tone={x.organizationStatus==="ACTIVE"?"success":"neutral"}>Organization {x.organizationStatus}</StatusBadge></div>
    <p className="mt-2 text-xs text-muted-foreground">{[x.city,x.state,x.country].filter(Boolean).join(", ")||"Location not recorded"}</p>
    <Link href={`/admin/colleges/${encodeURIComponent(x.id)}`}
     className="mt-3 inline-flex min-h-10 items-center font-semibold text-primary-text">Tenant details →</Link>
   </article>)}
  </div>:<EmptyState title="No matching tenants" description="No colleges in the current scope match these lifecycle filters."/>}
  <nav className="flex gap-3 text-sm" aria-label="Tenant pages">
   {data.query.page>1?<Link href={url(data.query.page-1)} className="font-semibold text-primary-text">Previous</Link>:null}
   {data.query.page<data.totalPages?<Link href={url(data.query.page+1)} className="font-semibold text-primary-text">Next</Link>:null}
  </nav>
 </div>;
}
