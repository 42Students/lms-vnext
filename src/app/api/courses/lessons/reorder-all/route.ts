import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {reorderCollegeCourseLessons} from "@/modules/courses/lesson-service";

export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  const moved=await reorderCollegeCourseLessons(context,await request.json());
  return NextResponse.json({moved});
 }catch(error){return apiErrorResponse(error);}
}
