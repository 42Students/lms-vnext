import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {searchOrganizationPlacementJobs} from "@/modules/placements/organization-job-search-service";

export const runtime="nodejs";
export const dynamic="force-dynamic";

/** Read-only Super Admin job search. The requested organization is always
 * checked against the selected tenant (or an explicitly unscoped platform
 * admin), and neither legacy numeric IDs nor slug text grant write access.
 */
export async function GET(request:Request){
 try{
  const url=new URL(request.url);
  const query:Record<string,string>={};
  for(const [key,value] of url.searchParams){
   if(Object.hasOwn(query,key))
    return NextResponse.json({error:"INVALID_SEARCH_FILTERS"},{status:400});
   query[key]=value;
  }
  const context=await getCurrentRequestContext();
  const result=await searchOrganizationPlacementJobs(context,query);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  return apiErrorResponse(error);
 }
}
