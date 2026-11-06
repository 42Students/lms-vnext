import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import {searchOrganizationPlacementApplications,getOrganizationApplicationStats} from "@/modules/placements/organization-application-search-service";
import { secured } from "@/security/secure-handler";

export const runtime="nodejs";
export const dynamic="force-dynamic";

/** Exact organization is the one selected by Super Admin's college switcher. */
async function handleGET(request:Request){
 try{
  const query=Object.fromEntries(new URL(request.url).searchParams.entries());
  const data=await searchOrganizationPlacementApplications(await getCurrentRequestContext(),query);
  return NextResponse.json(data,{headers:{"Cache-Control":"private, no-store"}});
 }catch(problem){return apiErrorResponse(problem);}
}
export const GET = secured(handleGET);

/** Compatibility for legacy refresh: no cache exists to invalidate.
 * This still authenticates and verifies the current organization scope.
 */
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const _p=await readBoundedJsonRequest(request,8192);
  if(!_p.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  const input:unknown=_p.value;
  const stats=await getOrganizationApplicationStats(await getCurrentRequestContext(),input);
  return NextResponse.json({...stats,refreshed:false,
   reason:"Applications are read directly from the database; no refresh is required."},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(problem){return apiErrorResponse(problem);}
}
export const POST = secured(handlePOST, { csrf: "enforce" });
