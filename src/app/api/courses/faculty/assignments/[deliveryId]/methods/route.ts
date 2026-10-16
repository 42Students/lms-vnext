import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getFacultyAssignmentMethods} from "@/modules/courses/faculty-assignment-authoring-service";

export const runtime="nodejs";
export async function GET(request:Request,{params}:{
 params:Promise<{deliveryId:string}>
}){
 try{
  if(process.env.DB06_MULTIPART_SUBMISSIONS_READY!=="DB06_VERIFIED")
   return Response.json({error:"METHODS_NOT_READY"},{status:503});
  const {deliveryId}=await params;
  const assignmentId=new URL(request.url).searchParams.get("assignmentId");
  const context=await getCurrentRequestContext();
  const methods=await getFacultyAssignmentMethods(context,{deliveryId},assignmentId);
  return Response.json({methods},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
