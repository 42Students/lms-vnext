import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { updateCollegeContentStudentVisibility } from "@/modules/courses/college-content-visibility-service";
export const runtime="nodejs";
export async function PATCH(request:Request){
  if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try {
    const context=await getCurrentRequestContext();
    return NextResponse.json(await updateCollegeContentStudentVisibility(context,await request.json()));
  }catch(error){return apiErrorResponse(error);}
}
