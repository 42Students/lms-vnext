import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { requirePermission } from "@/modules/permissions/policy";
import { parseTenantLifecycleSearchParams } from "@/modules/colleges/admin-tenant-lifecycle-model";
import { ErrorState } from "@/components/ui/error-state";
import SuperAdminTenantSetup from "./setup/page";
import TenantDirectory from "./directory/page";

/** Keep the legacy filtered directory deep links, but authorize the
 * request before examining untrusted query parameters or rendering recovery. */
export default async function SuperAdminTenantLanding({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const context=await getCurrentRequestContext();
 requirePermission(context,"admin-scope.select");
 const raw=await searchParams;
 const directoryRequest=Object.keys(raw).some(key=>
  ["q","status","organizationId","page"].includes(key)) ||
  raw.tab==="directory";
 if(directoryRequest){
  const directoryRaw={...raw};
  delete directoryRaw.tab;
  const parsed=parseTenantLifecycleSearchParams(directoryRaw);
  if(!parsed)return <ErrorState title="Invalid tenant filters"
   description="Search, organization or page is invalid."
   action={<Link href="/admin/tenants/directory">Clear filters</Link>}/>;
  return <TenantDirectory searchParams={Promise.resolve(directoryRaw)}/>;
 }
 return <SuperAdminTenantSetup searchParams={Promise.resolve(raw)}/>;
}
