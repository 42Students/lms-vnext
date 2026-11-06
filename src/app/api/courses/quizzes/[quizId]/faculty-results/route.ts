import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {commandFacultyQuizResults} from "@/modules/courses/faculty-quiz-results-command-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handlePOST(request:Request,{params}:{params:Promise<{quizId:string}>}){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {quizId}=await params;
  const quiz=await commandFacultyQuizResults(await getCurrentRequestContext(),
   quizId,await request.json());
  return NextResponse.json({quiz});
 }catch(error){return apiErrorResponse(error);}
}
export const POST = secured(handlePOST, { csrf: "enforce" });
