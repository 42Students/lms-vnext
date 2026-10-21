import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  getCollegeAttendancePolicy,
  updateCollegeAttendancePolicy,
  updateCollegeAttendancePolicyField,
} from "@/modules/attendance/policy-service";

export const runtime = "nodejs";

/**
 * Both policy fields are updated together.
 * Origin protection is mandatory because this
 * route changes state using a browser session.
 */
export async function PUT(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context =
      await getCurrentRequestContext();
    const body = await request.json();

    const policy =
      await updateCollegeAttendancePolicy(
        context,
        body,
      );

    return NextResponse.json({ policy });
  } catch (error) {
    return apiErrorResponse(error);
  }
}


/** Authenticated policy read for independent field reload and provenance. */
export async function GET(request: Request) {
  try {
    const context=await getCurrentRequestContext();
    const collegeId=new URL(request.url).searchParams.get("collegeId")??"";
    const {policy,hasCollegeOverride,maxCorrectionHours}=await getCollegeAttendancePolicy(context,collegeId);
    return NextResponse.json({policy,hasCollegeOverride,maxCorrectionHours});
  } catch(error){return apiErrorResponse(error);}
}

/** Compare-and-set only the chosen field; never overwrite a second unsaved draft. */
export async function PATCH(request:Request){
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const context=await getCurrentRequestContext();
    return NextResponse.json(await updateCollegeAttendancePolicyField(context,await request.json()));
  }catch(error){return apiErrorResponse(error);}
}
