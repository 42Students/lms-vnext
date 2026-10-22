import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {relinkDraftPlacementCompany} from "@/modules/placements/job-service";

export const runtime="nodejs";
type RouteContext={params:Promise<{jobId:string}>};
export async function PATCH(request:Request,{params}:RouteContext){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  const {jobId}=await params;
  const input:unknown=await request.json();
  const result=await relinkDraftPlacementCompany(context,jobId,input);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
