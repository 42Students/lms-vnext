import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {previewTenantHostResolutionWithRuntime} from "@/modules/tenant-domains/runtime";
import {PageHeader} from "@/components/ui/page-header";
import {PageBackLink} from "@/components/ui/page-back-link";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";

export const dynamic="force-dynamic";

export default async function TenantResolvePreviewPage({
 searchParams,
}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const context=await getCurrentRequestContext();
 const globalScope=isSuperAdmin(context)&&can(context,"admin-scope.select")&&
  !context.adminScope?.organizationId&&!context.adminScope?.collegeId;
 const params=await searchParams;
 const valid=Object.keys(params).every(key=>key==="host")&&
  (params.host===undefined||typeof params.host==="string");
 const host=valid&&typeof params.host==="string"?params.host.trim():"";
 let result:Awaited<ReturnType<typeof previewTenantHostResolutionWithRuntime>>|null=null;
 let failed=false;
 if(globalScope&&host&&host.length<=253){
  try{result=await previewTenantHostResolutionWithRuntime(context,host);}
  catch{failed=true;}
 }
 return <section className="min-w-0 space-y-5">
  <PageBackLink href="/admin/tenants/setup" label="Tenant Setup"/>
  <PageHeader title="Host resolution preview"
   description="Check which verified active college a hostname resolves to. This read-only preview never performs a DNS lookup."/>
  {!globalScope?<Alert tone="warning">
    Select the global Super Admin scope to preview host resolution. Organization and college safety scopes cannot inspect other tenants.
  </Alert>:<>
   <form method="get" action="/admin/tenants/resolve-preview" className="grid min-w-0 gap-3 border-b border-border pb-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
    <label className="grid min-w-0 gap-2 text-sm font-semibold text-foreground">
     Hostname
     <Input type="text" name="host" defaultValue={host} maxLength={253}
      autoComplete="off" placeholder="college.example.edu" required/>
    </label>
    <Button type="submit">Preview</Button>
   </form>
   {!valid||params.host!==undefined&&!host||host.length>253||failed?
    <Alert tone="error" title="Unable to preview this host">
     Enter a valid fully qualified hostname, with no protocol, port or path. No tenant data was returned.
    </Alert>:result?.status==="TENANT_NOT_FOUND"?
    <Alert tone="info" title="No verified tenant found">
     The host is not currently registered to an active and verified college.
    </Alert>:result?.status==="TENANT"?
    <section aria-label="Resolved tenant" className="space-y-3 border-t border-border pt-4">
     <h2 className="font-semibold text-foreground">Verified host resolves to a college</h2>
     <dl className="grid min-w-0 gap-2 text-sm text-body">
      <div><dt className="font-semibold">Host</dt><dd className="break-all">{result.tenant.host}</dd></div>
      <div><dt className="font-semibold">College ID</dt><dd className="break-all">{result.tenant.collegeId}</dd></div>
      <div><dt className="font-semibold">Canonical host</dt><dd className="break-all">{result.canonicalHost}</dd></div>
      <div><dt className="font-semibold">Redirect required</dt><dd>{result.shouldRedirect?"Yes":"No"}</dd></div>
     </dl>
    </section>:null}
  </>}
  <Link href="/admin/tenants/setup" className="inline-flex min-h-9 items-center text-sm font-semibold text-link underline">
   Return to Tenant Setup
  </Link>
 </section>;
}
