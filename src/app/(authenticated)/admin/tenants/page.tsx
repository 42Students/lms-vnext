import SuperAdminTenantSetup from "./setup/page";
import TenantDirectory from "./directory/page";

/** Old Tenant Setup lands in the two-step structure/launch workspace.
 * The independent college directory remains reachable as a secondary route.
 * Keep existing filtered directory deep links working after the route split.
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
