import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getFacultyAssignmentMethods} from "@/modules/courses/faculty-assignment-authoring-service";

export const runtime="nodejs";
export async function GET(request:Request,{params}:{
 params:Promise<{deliveryId:string}>
}){
 try{
  const {deliveryId}=await params;
  const assignmentId=new URL(request.url).searchParams.get("assignmentId");
  const context=await getCurrentRequestContext();
  const methods=await getFacultyAssignmentMethods(context,{deliveryId},assignmentId);
  return Response.json({methods},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
