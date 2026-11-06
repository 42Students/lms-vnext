import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  previewCollegeRecurringSchedule, RecurringPreviewNotFoundError,
} from "@/modules/academics/college-recurring-preview-service";
import { secured } from "@/security/secure-handler";

export const runtime = "nodejs";
async function handlePOST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const payload: unknown = await request.json();
    const result = await previewCollegeRecurringSchedule(context, payload);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof RecurringPreviewNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return apiErrorResponse(error);
  }
}
export const POST = secured(handlePOST, { csrf: "enforce" });
