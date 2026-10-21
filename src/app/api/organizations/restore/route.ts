import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {restoreArchivedEntity} from "@/modules/organizations/service";

export const runtime="nodejs";

/** Legacy POST /restore compatibility for ORGANIZATION and COLLEGE only.
 * Other archived entities retain their role-specific recovery flow. */
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  const body:unknown=await request.json();
  const result=await restoreArchivedEntity(context,body);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
