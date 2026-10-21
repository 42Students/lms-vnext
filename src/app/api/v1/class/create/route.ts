import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  CollegeSectionError, createCollegeSection,
} from "@/modules/academics/college-section-mutation-service";

export const runtime = "nodejs";

/**
 * Legacy POST /api/v1/class/create compatibility. All writes still use
 * persisted tenant-scoped UUID membership authorization. No numeric legacy
 * class/college ID is trusted or mapped from the request body.
 */
export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const context = await getCurrentRequestContext();
    const body: unknown = await request.json();
    const section = await createCollegeSection(context, body);
    return NextResponse.json({ status: "OK", message: "OK", data: section },
      { status: 200, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof CollegeSectionError) {
      return NextResponse.json({ status: "ERROR", message: error.code, data: null },
        { status: error.code === "CLASS_COHORT_NOT_FOUND" ? 404 : 409,
          headers: { "Cache-Control": "private, no-store" } });
    }
    return apiErrorResponse(error);
  }
}
