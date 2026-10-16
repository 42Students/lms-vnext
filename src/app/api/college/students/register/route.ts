import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { registerCollegeStudent } from "@/modules/people/college-student-registration-service";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try {
    const context = await getCurrentRequestContext();
    const result = await registerCollegeStudent(context,await request.json());
    return NextResponse.json(result,{status:result.status==="REGISTERED"?201:207});
  } catch (error) { return apiErrorResponse(error); }
}
