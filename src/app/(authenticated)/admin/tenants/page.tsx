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
import { DataTable } from "@/components/ui/data-table";
import { parseTenantLifecycleSearchParams, tenantLifecycleHref } from "@/modules/colleges/admin-tenant-lifecycle-model";
import { getSuperAdminTenantLifecycleDirectory } from "@/modules/colleges/admin-tenant-lifecycle-service";
export default async function TenantDirectory({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}) {
 const context=await getCurrentRequestContext();
 if(!isSuperAdmin(context)||!can(context,"admin-scope.select"))
  return <div className="min-w-0 space-y-4">
   <PageHeader title="Tenant Setup"/>
   <ErrorState title="Tenant directory access denied"
    description="Your account cannot view platform tenant records."
    action={<Link href="/dashboard" className="font-semibold text-primary-text underline">Back to dashboard</Link>}/>
  </div>;
 const raw=await searchParams;
 const parsed=parseTenantLifecycleSearchParams(raw);
 if(!parsed) return <div className="space-y-4">
  <PageHeader title="Tenant Setup" />
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
   <PageHeader title="Tenant Setup"/>
   <ErrorState title="Tenant directory unavailable"
    description="Colleges and organizations could not be loaded. Try again with the same filters."
    action={<Link href={tenantLifecycleHref(parsed)} className="font-semibold text-primary-text">Retry tenant directory</Link>}/>
  </div>;
 }
 const url=(page:number)=>tenantLifecycleHref({...data.query,page});
 const statuses = ["ACTIVE", "ARCHIVED", "ALL"] as const;
 return <div className="min-w-0 space-y-5">
  <PageHeader title="Tenant Setup"
   description="Read-only active and archived colleges with explicit lifecycle state. The selected Super Admin safety scope always applies."
   actions={<div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
    <TenantDirectoryCsvControl href={tenantDirectoryExportHref({q:data.query.q,organizationId:data.query.organizationId,status:data.query.status})} />
    <Link href="/admin/tenants/create"
      className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] bg-primary px-3.5 text-sm font-semibold text-on-primary hover:bg-primary-hover ">
      Create an organization and its colleges
    </Link>
   </div>} />
  <Link href="/admin/domains" className="inline-flex min-h-11 sm:min-h-9  items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] px-4 text-sm font-semibold text-primary-text">Domains</Link>
  <div className="flex flex-wrap gap-3">
   <Link href="/admin/tenants/setup" className="inline-flex min-h-11 sm:min-h-9  items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] px-4 text-sm font-semibold text-primary-text">Get this college ready to go live</Link>
  </div>
  <form className="grid gap-3 border-b border-border pb-4 sm:grid-cols-2 xl:grid-cols-4 print:hidden">
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
  <DataTable<(typeof data.items)[number]> caption="Tenant directory" rows={data.items}
   getRowKey={row=>row.id}
   empty={<EmptyState title="No matching tenants" description="No colleges in the current scope match these lifecycle filters."/>}
   columns={[
    {key:"name",header:"College",mobilePriority:"primary",cell:row=><div className="min-w-0">
     <Link href={`/admin/colleges/${encodeURIComponent(row.id)}`} className="break-words font-semibold text-primary-text underline-offset-4 hover:underline">{row.name}</Link>
     <p className="mt-1 text-xs text-body">{row.organizationName} · {row.code}</p>
    </div>},
    {key:"status",header:"Status",mobilePriority:"secondary",cell:row=><div className="flex flex-wrap items-center gap-2">
     <StatusBadge tone={row.status==="ACTIVE"?"success":"neutral"}>College {row.status}</StatusBadge>
     <StatusBadge tone={row.organizationStatus==="ACTIVE"?"success":"neutral"}>Organization {row.organizationStatus}</StatusBadge>
    </div>},
    {key:"location",header:"Location",mobilePriority:"secondary",cell:row=>[row.city,row.state,row.country].filter(Boolean).join(", ")||"Location not recorded"},
    {key:"actions",header:"Details",mobilePriority:"action",cell:row=><Link href={`/admin/colleges/${encodeURIComponent(row.id)}`}
     className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 sm:min-h-9">Tenant details →</Link>},
   ]}/>
  <Pagination page={data.query.page} pageCount={data.totalPages} hrefForPage={url} label="Tenant pages" />
 </div>;
}
