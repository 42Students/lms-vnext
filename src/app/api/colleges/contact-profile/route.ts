import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  CollegeContactProfileError,
  updateOwnCollegeContactProfile,
} from "@/modules/colleges/college-contact-profile-service";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    let raw: unknown;
    try { raw = await request.json(); }
    catch { return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 }); }
    const saved = await updateOwnCollegeContactProfile(context, raw);
    return NextResponse.json({ profile: saved });
  } catch (error) {
    if (error instanceof CollegeContactProfileError) {
      return NextResponse.json({ error: error.code }, {
        status: error.code === "COLLEGE_NOT_FOUND" ? 404 : 409,
      });
    }
    return apiErrorResponse(error);
  }
}
