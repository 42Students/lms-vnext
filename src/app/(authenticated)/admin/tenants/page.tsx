import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { can } from "@/modules/permissions/policy";
import { isSuperAdmin } from "@/modules/identity/context";
import { ErrorState } from "@/components/ui/error-state";
import SuperAdminTenantSetup from "./setup/page";
import TenantDirectory from "./directory/page";

/** Preserve filtered directory deep links and keep the domain management
 * route discoverable from the consolidated tenant landing page.
 */
export default async function SuperAdminTenantLanding({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const context=await getCurrentRequestContext();
 if(!isSuperAdmin(context)||!can(context,"admin-scope.select"))
  return <ErrorState title="Tenant setup access denied"
   description="Your account cannot configure Super Admin tenants."/>;
 const raw=await searchParams;
 const directoryRequest=Object.keys(raw).some(key=>
  ["q","status","organizationId","page"].includes(key)) ||
  raw["tab"]==="directory";
 return <div className="min-w-0 space-y-4">
  <nav aria-label="Tenant management related pages" className="flex flex-wrap gap-4 text-sm">
   <Link href="/admin/tenants/setup">Tenant setup</Link>
   <Link href="/admin/tenants/directory">Tenant directory</Link>
   <Link href="/admin/domains">Domains</Link>
  </nav>
  {directoryRequest
   ? <TenantDirectory searchParams={Promise.resolve(raw)}/>
   : <SuperAdminTenantSetup searchParams={Promise.resolve(raw)}/>}
 </div>;
}
