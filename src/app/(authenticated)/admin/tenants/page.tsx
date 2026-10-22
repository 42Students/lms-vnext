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
 const raw=await searchParams;
 const directoryRequest=Object.keys(raw).some(key=>
  ["q","status","organizationId","page"].includes(key)) ||
  raw["tab"]==="directory";
 if(directoryRequest)return <TenantDirectory searchParams={Promise.resolve(raw)}/>;
 return <SuperAdminTenantSetup searchParams={Promise.resolve(raw)}/>;
}
