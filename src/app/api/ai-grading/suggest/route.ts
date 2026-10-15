import {NextResponse} from "next/server";
import {ZodError} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {
 readFacultyAiGradingJson,FacultyAiGradingBodyTooLarge,FacultyAiGradingBadMediaType,
} from "@/modules/courses/faculty-ai-grading-request";
import {getFacultyAiGradingSuggestion} from "@/modules/courses/faculty-ai-grading-suggestion-service";
import {AiGradingProviderDisabled} from "@/modules/courses/faculty-ai-grading-provider";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  let body:unknown;
  try{body=await readFacultyAiGradingJson(request);}catch(error){
   if(error instanceof FacultyAiGradingBadMediaType)
    return NextResponse.json({error:"JSON_REQUIRED"},{status:415});
   if(error instanceof FacultyAiGradingBodyTooLarge)
    return NextResponse.json({error:"REQUEST_TOO_LARGE"},{status:413});
   return NextResponse.json({error:"INVALID_JSON"},{status:400});
  }
  const result=await getFacultyAiGradingSuggestion(context,body);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof AiGradingProviderDisabled)
   return NextResponse.json({error:"AI_PROVIDER_DISABLED",
    message:"AI assistance is unavailable until the college approves a provider."},
    {status:503,headers:{"Cache-Control":"private, no-store"}});
  if(error instanceof ZodError)return NextResponse.json({error:"INVALID_GRADING_REQUEST"},{status:400});
  return apiErrorResponse(error);
 }
}
