import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {lockMentorFinalDelivery} from "@/modules/projects/mentor-delivery-lock-service";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{
 params:Promise<{projectId:string;submissionId:string}>;
}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {projectId,submissionId}=await params;
  const submission=await lockMentorFinalDelivery(await getCurrentRequestContext(),projectId,
   submissionId,await request.json());
  return NextResponse.json({submission});
 }catch(error){return apiErrorResponse(error);}
}
