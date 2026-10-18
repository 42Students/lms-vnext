import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getFacultyAssignmentMethods} from "@/modules/courses/faculty-assignment-authoring-service";
import {parseFacultyAssignmentMethodsQuery} from "@/modules/courses/faculty-assignment-methods-query";

export const runtime="nodejs";
export async function GET(request:Request,{params}:{
 params:Promise<{deliveryId:string}>
}){
 try{
  const {deliveryId}=await params;
  const {assignmentId}=parseFacultyAssignmentMethodsQuery(request.url);
  const context=await getCurrentRequestContext();
  const methods=await getFacultyAssignmentMethods(context,{deliveryId},assignmentId);
  return Response.json({methods},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
