import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {reopenApprovedProjectDelivery} from "@/modules/projects/delivery-reopen-service";
export const runtime="nodejs";
type RouteContext={params:Promise<{projectId:string;submissionId:string}>};
export async function POST(request:Request,{params}:RouteContext){
  if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const context=await getCurrentRequestContext();
    const {projectId,submissionId}=await params;
    const result=await reopenApprovedProjectDelivery(context,projectId,submissionId,await request.json());
    return NextResponse.json(result);
  }catch(error){return apiErrorResponse(error);}
}
