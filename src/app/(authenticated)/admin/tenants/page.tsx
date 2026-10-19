import Link from "next/link";
import { TenantDirectoryCsvControl } from "@/components/admin/tenant-directory-csv-control";
import { tenantDirectoryExportHref } from "@/modules/colleges/admin-tenant-export-model";
import { getCurrentRequestContext } from "@/auth/request-context";
import {can} from "@/modules/permissions/policy";
import {isSuperAdmin} from "@/modules/identity/context";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { parseTenantLifecycleSearchParams, tenantLifecycleHref } from "@/modules/colleges/admin-tenant-lifecycle-model";
import { getSuperAdminTenantLifecycleDirectory } from "@/modules/colleges/admin-tenant-lifecycle-service";
export default async function TenantDirectory({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}) {
 const context=await getCurrentRequestContext();
 if(!isSuperAdmin(context)||!can(context,"admin-scope.select"))
  return <div className="min-w-0 space-y-4">
   <PageHeader eyebrow="Super Admin · Platform" title="Tenant Setup"/>
   <ErrorState title="Tenant directory access denied"
    description="Your account cannot view platform tenant records."
    action={<Link href="/dashboard" className="font-semibold text-primary-text underline">Back to dashboard</Link>}/>
  </div>;
 const raw=await searchParams;
 const parsed=parseTenantLifecycleSearchParams(raw);
 if(!parsed) return <div className="space-y-4">
  <PageHeader eyebrow="Super Admin" title="Tenant Setup" />
  <ErrorState title="Invalid tenant filters" description="Search, organization or page is invalid."
   action={<Link href="/admin/tenants" className="font-semibold text-primary-text">Clear filters</Link>}/>
 </div>;
 let data:Awaited<ReturnType<typeof getSuperAdminTenantLifecycleDirectory>>;
 try{
  data=await getSuperAdminTenantLifecycleDirectory(context,parsed);
 }catch{
  // A failed tenant directory read must not appear as an empty tenant list.
  // Preserve the validated filters so a retry cannot silently expand scope.
  return <div className="min-w-0 space-y-4">
   <PageHeader eyebrow="Super Admin · Platform" title="Tenant Setup"/>
   <ErrorState title="Tenant directory unavailable"
    description="Colleges and organizations could not be loaded. Try again with the same filters."
    action={<Link href={tenantLifecycleHref(parsed)} className="font-semibold text-primary-text">Retry tenant directory</Link>}/>
  </div>;
 }
 const url=(page:number)=>tenantLifecycleHref({...data.query,page});
 const statuses = ["ACTIVE", "ARCHIVED", "ALL"] as const;
 return <div className="min-w-0 space-y-5">
  <PageHeader eyebrow="Super Admin · Platform" title="Tenant Setup"
   description="Read-only active and archived colleges with explicit lifecycle state. The selected Super Admin safety scope always applies."
   actions={<div className="flex flex-wrap items-center justify-end gap-2">
    <TenantDirectoryCsvControl href={tenantDirectoryExportHref({q:data.query.q,organizationId:data.query.organizationId,status:data.query.status})} />
    <Link href="/admin/tenants/create"
      className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] bg-primary px-3.5 text-sm font-semibold text-on-primary hover:bg-primary-hover sm:min-h-9">
      Create an organization and its colleges
    </Link>
   </div>} />
  <Link href="/admin/domains" className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-border px-4 text-sm font-semibold text-primary-text">Domains</Link>
  <div className="flex flex-wrap gap-3">
   <Link href="/admin/tenants/setup" className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-border px-4 text-sm font-semibold text-primary-text">Get this college ready to go live</Link>
  </div>
  <form className="grid gap-3 border-b border-border pb-4 sm:grid-cols-2 xl:grid-cols-4">
   <label className="grid gap-1 text-sm font-semibold text-body">College
    <Input type="search" name="q" maxLength={100} defaultValue={data.query.q}
     className="min-h-11 sm:min-h-9"/>
   </label>
   <label className="grid gap-1 text-sm font-semibold text-body">Organization
    <Select name="organizationId" defaultValue={data.query.organizationId}
     className="min-h-11 sm:min-h-9">
     <option value="">All permitted</option>
     {data.organizations.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
    </Select>
   </label>
   <label className="grid gap-1 text-sm font-semibold text-body">College status
    <Select name="status" defaultValue={data.query.status} className="min-h-11 sm:min-h-9">
     {statuses.map(status=><option key={status}>{status}</option>)}
    </Select>
   </label>
   <Button type="submit" className="self-end">Filter</Button>
  </form>
  <p className="text-xs text-muted-foreground">{data.total} matching colleges · page {data.query.page} of {data.totalPages}</p>
  {data.items.length?<div className="grid gap-3 md:grid-cols-2">
   {data.items.map(x=><article key={x.id} className="min-w-0 rounded-[var(--lms-canvas-radius,12px)] border border-border bg-surface p-4">
    <h2 className="m-0 break-words font-semibold text-foreground">{x.name}</h2>
    <p className="mt-1 text-sm text-body">{x.organizationName} · {x.code}</p>
    <div className="mt-2 flex flex-wrap gap-2"><StatusBadge tone={x.status==="ACTIVE"?"success":"neutral"}>College {x.status}</StatusBadge>
     <StatusBadge tone={x.organizationStatus==="ACTIVE"?"success":"neutral"}>Organization {x.organizationStatus}</StatusBadge></div>
    <p className="mt-2 text-xs text-muted-foreground">{[x.city,x.state,x.country].filter(Boolean).join(", ")||"Location not recorded"}</p>
    <Link href={`/admin/colleges/${encodeURIComponent(x.id)}`}
     className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary-text">Tenant details →</Link>
   </article>)}
  </div>:<EmptyState title="No matching tenants" description="No colleges in the current scope match these lifecycle filters."/>}
  <Pagination page={data.query.page} pageCount={data.totalPages} hrefForPage={url} label="Tenant pages" />
 </div>;
}
