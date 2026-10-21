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
    const partial=result.status==="PARTIAL";
    // A partial identity has already been provisioned; never imply that
    // resubmitting a create call will repair a failed enrollment.
    return NextResponse.json({...result,requiresFollowUp:partial,
      message:partial?"Student account created. Complete the outstanding enrollment or profile steps; do not register the student again.":"Student registered."},
      {status:partial?207:201,headers:{"Cache-Control":"private, no-store"}});
  } catch (error) { return apiErrorResponse(error); }
}
