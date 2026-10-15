import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {commandFacultyQuiz} from "@/modules/courses/faculty-quiz-authoring-service";
import {readFacultyQuizCommandBody,FacultyQuizBodyError} from "@/modules/courses/faculty-quiz-request-body";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{deliveryId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  const {deliveryId}=await params;
  const body=await readFacultyQuizCommandBody(request);
  const quiz=await commandFacultyQuiz(context,{deliveryId},body);
  return NextResponse.json({quiz});
 }catch(error){
  if(error instanceof FacultyQuizBodyError)
   return NextResponse.json({error:error.code},{status:error.status});
  return apiErrorResponse(error);
 }
}
