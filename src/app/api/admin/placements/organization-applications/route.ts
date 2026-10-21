import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {searchOrganizationPlacementApplications,getOrganizationApplicationStats} from "@/modules/placements/organization-application-search-service";

export const runtime="nodejs";
export const dynamic="force-dynamic";

/** Exact organization is the one selected by Super Admin's college switcher. */
export async function GET(request:Request){
 try{
  const query=Object.fromEntries(new URL(request.url).searchParams.entries());
  const data=await searchOrganizationPlacementApplications(await getCurrentRequestContext(),query);
  return NextResponse.json(data,{headers:{"Cache-Control":"private, no-store"}});
 }catch(problem){return apiErrorResponse(problem);}
}

/** Compatibility for legacy refresh: no cache exists to invalidate.
 * This still authenticates and verifies the current organization scope.
 */
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const input:unknown=await request.json().catch(()=>({}));
  const stats=await getOrganizationApplicationStats(await getCurrentRequestContext(),input);
  return NextResponse.json({...stats,refreshed:false,
   reason:"Applications are read directly from the database; no refresh is required."},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(problem){return apiErrorResponse(problem);}
}
