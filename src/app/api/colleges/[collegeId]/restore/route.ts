import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {restoreCollege} from "@/modules/colleges/service";
export const runtime="nodejs";
/** SA-tenants-modules-R02: same-origin, actor-scoped, audited restore. */
export async function POST(request:Request,{params}:{params:Promise<{collegeId:string}>}){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  const {collegeId}=await params;
  const college=await restoreCollege(context,collegeId);
  return NextResponse.json({college});
 }catch(error){
  return apiErrorResponse(error);
 }
}
