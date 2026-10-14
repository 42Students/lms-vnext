import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {decideMentorFinalDelivery} from "@/modules/projects/mentor-final-delivery-decision-service";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{
 params:Promise<{projectId:string;submissionId:string}>,
}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {projectId,submissionId}=await params;
  return NextResponse.json(await decideMentorFinalDelivery(await getCurrentRequestContext(),
   projectId,submissionId,await request.json()));
 }catch(error){return apiErrorResponse(error);}
}
