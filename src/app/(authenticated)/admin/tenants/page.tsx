import Link from "next/link";
import { TenantDirectoryCsvControl } from "@/components/admin/tenant-directory-csv-control";
import { tenantDirectoryExportHref } from "@/modules/colleges/admin-tenant-export-model";
import { getCurrentRequestContext } from "@/auth/request-context";
import {can} from "@/modules/permissions/policy";
import {isSuperAdmin} from "@/modules/identity/context";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { Banner } from "@/components/ui/banner";
import { PageBackLink } from "@/components/ui/page-back-link";
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
    action={<PageBackLink href="/dashboard" label="Back to dashboard" />}/>
  </div>;
 const raw=await searchParams;
 const parsed=parseTenantLifecycleSearchParams(raw);
 if(!parsed) return <div className="min-w-0 space-y-4">
  <PageHeader title="Tenant Setup" />
  <ErrorState title="Invalid tenant filters" description="Search, organization or page is invalid."
   action={<Link href="/admin/tenants" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 hover:text-[var(--lms-primary-text)] md:min-h-9 active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto">Clear filters</Link>}/>
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
    action={<Link href={tenantLifecycleHref(parsed)} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 hover:text-[var(--lms-primary-text)] md:min-h-9 active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto">Retry tenant directory</Link>}/>
  </div>;
 }
 const url=(page:number)=>tenantLifecycleHref({...data.query,page});
 const statuses = ["ACTIVE", "ARCHIVED", "ALL"] as const;
 return <div className="min-w-0 space-y-4 md:space-y-6">
  <PageHeader title="Tenant Setup"
   description="Read-only active and archived colleges with explicit lifecycle state. The selected Super Admin safety scope always applies."
   actions={<div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
    <Link href="/admin/domains"
      className="inline-flex min-h-11 w-full items-center justify-center text-center rounded-[var(--lms-control-radius)] sm:w-auto border border-border bg-surface px-4 text-sm font-[650] text-primary-text md:min-h-9 hover:border-[var(--lms-button-primary)] hover:bg-[var(--lms-button-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Domains</Link>
    <Link href="/admin/tenants/setup"
      className="inline-flex min-h-11 w-full items-center justify-center text-center rounded-[var(--lms-control-radius)] sm:w-auto border border-border bg-surface px-4 text-sm font-[650] text-primary-text md:min-h-9 hover:border-[var(--lms-button-primary)] hover:bg-[var(--lms-button-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Get this college ready to go live</Link>
    <TenantDirectoryCsvControl organizations={data.organizations} href={tenantDirectoryExportHref({q:data.query.q,organizationId:data.query.organizationId,status:data.query.status})} />
    <Link href="/admin/tenants/create"
      className="inline-flex min-h-11 w-full items-center justify-center text-center rounded-[var(--lms-control-radius)] sm:w-auto border border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] px-4 text-sm font-[650] text-on-primary md:min-h-9 hover:border-[var(--lms-button-primary-hover)] hover:bg-[var(--lms-button-primary-hover)] active:bg-[var(--lms-button-primary-hover)] active:border-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
      Create an organization and its colleges
    </Link>
   </div>} />
  <Tabs ariaLabel="Tenant Setup stages" renderPanel={false} value="directory"
    items={[
      {value:"create",label:"Create organization and college",href:"/admin/tenants/create"},
      {value:"setup",label:"Launch setup",href:"/admin/tenants/setup"},
      {value:"directory",label:"Tenant directory",href:"/admin/tenants"},
    ]}/>
  <Banner tone="info" role="status">
    Tenant Setup has one connected workflow: create an organization, add a college,
    then configure its launch readiness. The directory below is for returning to
    existing or archived tenants. Creating a college automatically selects its
    permitted safety scope before opening Launch setup.
  </Banner>
  <form className="grid gap-[var(--lms-space-2)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] min-[768px]:grid-cols-2 xl:grid-cols-4">
   <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search college, code, city or organization
    <Input type="search" name="q" maxLength={100} defaultValue={data.query.q}
     className="min-h-11 md:min-h-9"/>
   </label>
   <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Organization
    <Select name="organizationId" defaultValue={data.query.organizationId}
     className="min-h-11 md:min-h-9">
     <option value="">All permitted</option>
     {data.organizations.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
    </Select>
   </label>
   <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">College status
    <Select name="status" defaultValue={data.query.status} className="min-h-11 md:min-h-9">
     {statuses.map(status=><option key={status}>{status}</option>)}
    </Select>
   </label>
   <Button type="submit" className="min-h-11 w-full self-end md:min-h-9 md:w-auto">Filter</Button>
  </form>
  <p className="m-0 break-words text-xs text-muted-foreground">
   {data.total.toLocaleString("en-IN")} matching colleges · 25 per page · page {data.query.page} of {data.totalPages}.
   Sorted by college name, then stable college identifier.
  </p>
  <DataTable<(typeof data.items)[number]>
    caption="Tenant directory"
    rows={data.items}
    getRowKey={tenant=>tenant.id}
    columns={[
      {key:"college",header:"College",mobilePriority:"primary",cell:tenant=><>
        <Link href={"/admin/colleges/"+encodeURIComponent(tenant.id)}
          className="inline-flex min-h-11 min-w-0 items-center break-words font-semibold text-primary-text underline md:min-h-9 underline-offset-4 hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          {tenant.name}
        </Link>
        <span className="mt-1 block break-all text-xs text-muted-foreground">{tenant.code}</span>
      </>},
      {key:"code",header:"Unique ID",mobilePriority:"secondary",cell:tenant=>tenant.uniqueId},
      {key:"organization",header:"Organization",mobilePriority:"secondary",cell:tenant=>tenant.organizationName},
      {key:"city",header:"City",mobilePriority:"secondary",cell:tenant=>tenant.city||"—"},
      {key:"status",header:"Lifecycle",mobilePriority:"secondary",cell:tenant=>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <StatusBadge tone={tenant.status==="ACTIVE"?"success":"neutral"}>College {tenant.status}</StatusBadge>
          <StatusBadge tone={tenant.organizationStatus==="ACTIVE"?"success":"neutral"}>Organization {tenant.organizationStatus}</StatusBadge>
        </div>},
      {key:"location",header:"Location",mobilePriority:"secondary",cell:tenant=>
        [tenant.city,tenant.state,tenant.country].filter(Boolean).join(", ")||"Location not recorded"},
      {key:"action",header:"Manage College",mobilePriority:"action",cell:tenant=>
        <Link href={"/admin/colleges/"+encodeURIComponent(tenant.id)}
          className="inline-flex min-h-11 items-center font-semibold text-primary-text underline-offset-2 hover:underline md:min-h-9 hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Manage →</Link>},
    ]}
    empty={<EmptyState title="No matching tenants" description="No colleges in the current scope match these lifecycle filters."
      action={<Link href="/admin/tenants" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto md:min-h-9">Clear filters</Link>}/>}
  />
  <Pagination page={data.query.page} pageCount={data.totalPages} hrefForPage={url} label="Tenant pages" />
 </div>;
}
