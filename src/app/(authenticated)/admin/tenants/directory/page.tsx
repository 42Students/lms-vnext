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
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
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
   action={<TextLink href="/admin/tenants/directory" className="inline-flex min-h-11 items-center md:min-h-9 w-full md:w-auto">Clear filters</TextLink>}/>
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
    action={<TextLink href={tenantLifecycleHref(parsed)} className="inline-flex min-h-11 items-center md:min-h-9 w-full md:w-auto">Retry tenant directory</TextLink>}/>
  </div>;
 }
 const url=(page:number)=>tenantLifecycleHref({...data.query,page});
 const statuses = ["ACTIVE", "ARCHIVED", "ALL"] as const;
 return <div className="min-w-0 space-y-4 md:space-y-6">
  <PageHeader title="Tenant Setup"
   description="Read-only active and archived colleges with explicit lifecycle state. The selected Super Admin safety scope always applies."
   actions={<div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
    <ButtonLink variant="primary" href="/admin/domains"
      className="w-full sm:w-auto">Domains</ButtonLink>
    <ButtonLink variant="primary" href="/admin/tenants/setup"
      className="w-full sm:w-auto">Get this college ready to go live</ButtonLink>
    <TenantDirectoryCsvControl organizations={data.organizations} href={tenantDirectoryExportHref({q:data.query.q,organizationId:data.query.organizationId,status:data.query.status})} />
    <ButtonLink variant="primary" href="/admin/tenants/create"
      className="w-full sm:w-auto">
      Create an organization and its colleges
    </ButtonLink>
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
  <form className="grid gap-[var(--lms-space-2)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] md:grid-cols-2 xl:grid-cols-4">
   <Label stack>Search college, code, city or organization
    <Input type="search" name="q" maxLength={100} defaultValue={data.query.q}
     className="min-h-11 md:min-h-9"/>
   </Label>
   <Label stack>Organization
    <Select name="organizationId" defaultValue={data.query.organizationId}
     className="min-h-11 md:min-h-9">
     <option value="">All permitted</option>
     {data.organizations.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
    </Select>
   </Label>
   <Label stack>College status
    <Select name="status" defaultValue={data.query.status} className="min-h-11 md:min-h-9">
     {statuses.map(status=><option key={status}>{status}</option>)}
    </Select>
   </Label>
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
        <TextLink href={"/admin/colleges/"+encodeURIComponent(tenant.id)}
          className="inline-flex min-h-11 min-w-0 items-center break-words md:min-h-9">
          {tenant.name}
        </TextLink>
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
        <TextLink href={"/admin/colleges/"+encodeURIComponent(tenant.id)}
          className="inline-flex min-h-11 items-center md:min-h-9">Manage →</TextLink>},
    ]}
    empty={<EmptyState title="No matching tenants" description="No colleges in the current scope match these lifecycle filters."
      action={<TextLink href="/admin/tenants" className="inline-flex min-h-11 items-center w-full md:w-auto md:min-h-9">Clear filters</TextLink>}/>}
  />
  <Pagination page={data.query.page} pageCount={data.totalPages} hrefForPage={url} label="Tenant pages" />
 </div>;
}
