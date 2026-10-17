import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {listOwnLearnerAssignmentMaterialLinks,commandFacultyAssignmentMaterialLink}
 from "@/modules/courses/learner-assignment-materials-service";
export const runtime="nodejs";
type Params={params:Promise<{deliveryId:string;assignmentId:string}>};
export async function GET(_request:Request,{params}:Params){
 try{
  const {deliveryId,assignmentId}=await params;
  const result=await listOwnLearnerAssignmentMaterialLinks(
   await getCurrentRequestContext(),assignmentId,deliveryId);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
async function change(request:Request,params:Params["params"]){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {deliveryId,assignmentId}=await params;
  const input=await request.json();
  const result=await commandFacultyAssignmentMaterialLink(
   await getCurrentRequestContext(),assignmentId,deliveryId,input);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export async function POST(request:Request,{params}:Params){
 return change(request,params);
}
export async function DELETE(request:Request,{params}:Params){
 return change(request,params);
}
