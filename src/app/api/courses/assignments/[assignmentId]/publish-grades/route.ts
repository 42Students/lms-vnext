import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {publishAssignmentGradeBatch} from "@/modules/courses/assignment-bulk-grade-publish-service";

export const runtime="nodejs";

type RouteContext={params:Promise<{assignmentId:string}>};

export async function POST(request:Request,{params}:RouteContext){
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const context=await getCurrentRequestContext();
    const {assignmentId}=await params;
    const body=await request.json();
    const receipt=await publishAssignmentGradeBatch(context,assignmentId,body);
    return NextResponse.json(receipt,{headers:{"Cache-Control":"private, no-store"}});
  }catch(error){
    return apiErrorResponse(error);
  }
}
