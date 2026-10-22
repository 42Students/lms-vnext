import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {addDescriptiveAssignmentPoints} from "@/modules/courses/assignment-submission-service";
import {descriptiveAssignmentPointsSchema} from "@/modules/courses/assignment-descriptive-points-model";

export const runtime="nodejs";
type Params={params:Promise<{submissionId:string}>};
export async function POST(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {submissionId}=await params;
  const input=descriptiveAssignmentPointsSchema.parse(await request.json());
  const submission=await addDescriptiveAssignmentPoints(
   await getCurrentRequestContext(),submissionId,input,
  );
  return NextResponse.json({submission},{headers:{"Cache-Control":"no-store"}});
 }catch(error){
  if(error instanceof RangeError)
   return NextResponse.json({error:"ASSIGNMENT_GRADE_INVALID",
    message:"Descriptive points exceed the assignment maximum."},
    {status:400,headers:{"Cache-Control":"no-store"}});
  return apiErrorResponse(error);
 }
}
