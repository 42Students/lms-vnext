import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {createLearnerAssignmentResourceReadGrant}
 from "@/modules/courses/learner-assignment-materials-service";
import { secured } from "@/security/secure-handler";

export const runtime="nodejs";
type Params={params:Promise<{deliveryId:string;assignmentId:string;resourceId:string}>};
async function handleGET(_request:Request,{params}:Params){
 try{
  const {deliveryId,assignmentId,resourceId}=await params;
  const grant=await createLearnerAssignmentResourceReadGrant(
   await getCurrentRequestContext(),assignmentId,deliveryId,resourceId);
  return NextResponse.json(grant,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export const GET = secured(handleGET);
