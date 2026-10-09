import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  getCompanyVisibilitySettings,
  saveCompanyVisibilitySettings,
} from "@/modules/placements/tpo-policy-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const collegeId = new URL(request.url).searchParams.get("collegeId") ?? "";
    const visibility = await getCompanyVisibilitySettings(context, collegeId);
    return NextResponse.json({ visibility });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }

  try {
    const context = await getCurrentRequestContext();
    const input = await request.json();
    const result = await saveCompanyVisibilitySettings(context, input);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }
    return NextResponse.json({ visibility: result.visibility });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
