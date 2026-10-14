import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  CollegeSectionError, createCollegeSection,
} from "@/modules/academics/college-section-mutation-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const body: unknown = await request.json();
    const section = await createCollegeSection(context, body);
    return NextResponse.json({ section }, { status: 201 });
  } catch (error) {
    if (error instanceof CollegeSectionError) {
      return NextResponse.json({ error: error.code }, {
        status: error.code === "CLASS_COHORT_NOT_FOUND" ? 404 : 409,
      });
    }
    return apiErrorResponse(error);
  }
}
