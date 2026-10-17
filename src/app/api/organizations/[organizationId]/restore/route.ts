import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {restoreOrganization} from "@/modules/organizations/service";
export const runtime="nodejs";
/** SA-tenants-modules-R02: same-origin, actor-scoped, audited restore. */
export async function POST(request:Request,{params}:{params:Promise<{organizationId:string}>}){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  const {organizationId}=await params;
  const organization=await restoreOrganization(context,organizationId);
  return NextResponse.json({organization});
 }catch(error){
  return apiErrorResponse(error);
 }
}
