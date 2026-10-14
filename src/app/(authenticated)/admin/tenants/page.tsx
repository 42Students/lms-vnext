import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { tenantReadQuerySchema } from "@/modules/colleges/super-admin-tenant-model";
import { getAdminTenantDirectory } from "@/modules/colleges/super-admin-directory-service";
export default async function TenantDirectory({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}) {
 const raw=await searchParams;
 const parsed=tenantReadQuerySchema.safeParse({q:raw.q,organizationId:raw.organizationId,page:raw.page});
 if(!parsed.success) return <div className="space-y-4">
  <PageHeader eyebrow="Super Admin" title="Tenant directory" />
  <ErrorState title="Invalid tenant filters" description="Search, organization or page is invalid."
   action={<Link href="/admin/tenants" className="font-semibold text-primary-text">Clear filters</Link>}/>
 </div>;
 const data=await getAdminTenantDirectory(await getCurrentRequestContext(),parsed.data);
 const url=(page:number)=>"/admin/tenants?"+new URLSearchParams({
  q:data.query.q,organizationId:data.query.organizationId,page:String(page)
 });
 return <div className="space-y-5">
  <PageHeader eyebrow="Super Admin · Platform" title="Tenant directory"
   description="Read-only active colleges and their organizations. The selected Super Admin safety scope always applies." />
  <Link href="/admin/tenants/setup" className="inline-flex min-h-11 items-center rounded-md border border-border px-4 font-semibold text-primary-text">Tenant Setup · Create / Set up →</Link>
  <form className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[1fr_auto_auto]">
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
   <button type="submit" className="min-h-11 self-end rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Filter</button>
  </form>
  <p className="text-xs text-muted-foreground">{data.total} matching active colleges · page {data.query.page} of {data.totalPages}</p>
  {data.items.length?<div className="grid gap-3 md:grid-cols-2">
   {data.items.map(x=><article key={x.id} className="min-w-0 rounded-xl border border-border bg-surface p-4">
    <h2 className="m-0 break-words font-semibold text-foreground">{x.name}</h2>
    <p className="mt-1 text-sm text-body">{x.organizationName} · {x.code}</p>
    <p className="mt-2 text-xs text-muted-foreground">{[x.city,x.state,x.country].filter(Boolean).join(", ")||"Location not recorded"}</p>
    <Link href={`/admin/colleges/${encodeURIComponent(x.id)}`}
     className="mt-3 inline-flex min-h-10 items-center font-semibold text-primary-text">Tenant details →</Link>
   </article>)}
  </div>:<EmptyState title="No matching tenants" description="No active colleges in the current scope match the filters."/>}
  <nav className="flex gap-3 text-sm" aria-label="Tenant pages">
   {data.query.page>1?<Link href={url(data.query.page-1)} className="font-semibold text-primary-text">Previous</Link>:null}
   {data.query.page<data.totalPages?<Link href={url(data.query.page+1)} className="font-semibold text-primary-text">Next</Link>:null}
  </nav>
 </div>;
}
