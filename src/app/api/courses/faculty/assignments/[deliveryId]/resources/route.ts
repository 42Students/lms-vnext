import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {
 readFacultyAssignmentCommandBody,FacultyAssignmentBodyError,
} from "@/modules/courses/faculty-assignment-request-body";
import {
 listFacultyAssignmentResources,presignFacultyAssignmentResource,
} from "@/modules/courses/faculty-assignment-resource-service";

export const runtime="nodejs";
type Params={params:Promise<{deliveryId:string}>};

/** Return resources only after checking persisted teaching scope and the
 * assignment's exact delivery. Never send a signed object URL in a listing. */
export async function GET(request:Request,{params}:Params){
 try{
  const {deliveryId}=await params;
  const assignmentId=new URL(request.url).searchParams.get("assignmentId")??"";
  const result=await listFacultyAssignmentResources(
   await getCurrentRequestContext(),deliveryId,assignmentId);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}

/** A private presigned PUT is only an upload grant. The assignment command
 * verifies college/membership ownership and scanner CLEAN attestation before
 * persisting any PDF or FILE resource. */
export async function POST(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {deliveryId}=await params;
  const body=await readFacultyAssignmentCommandBody(request);
  const grant=await presignFacultyAssignmentResource(
   await getCurrentRequestContext(),deliveryId,body);
  return NextResponse.json({grant},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof FacultyAssignmentBodyError)
   return NextResponse.json({error:error.code},{
    status:error.status,headers:{"Cache-Control":"private, no-store"}});
  return apiErrorResponse(error);
 }
}
