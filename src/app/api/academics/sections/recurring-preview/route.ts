import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  previewCollegeRecurringSchedule, RecurringPreviewNotFoundError,
} from "@/modules/academics/college-recurring-preview-service";

export const runtime = "nodejs";
export const POST = route(
  { auth: "user", permission: "academics.manage" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    try {
const payload: unknown = await boundedRequestJson(request);
const result = await previewCollegeRecurringSchedule(context, payload);
return NextResponse.json(result);
} catch (error) {
    if (error instanceof RecurringPreviewNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return apiErrorResponse(error);
  }
  },
);
