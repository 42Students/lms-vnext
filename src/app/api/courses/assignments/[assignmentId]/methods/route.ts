import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getLearnerAssignmentMethods} from "@/modules/courses/learner-assignment-methods-service";

export const runtime="nodejs";
export async function GET(request:Request,{params}:{
 params:Promise<{assignmentId:string}>
}){
 try{
  const {assignmentId}=await params;
  const deliveryId=new URL(request.url).searchParams.get("deliveryId");
  const context=await getCurrentRequestContext();
  const methods=await getLearnerAssignmentMethods(context,assignmentId,deliveryId);
  return Response.json({methods},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
