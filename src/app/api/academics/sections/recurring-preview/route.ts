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
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const payload: unknown = await request.json();
    const result = await previewCollegeRecurringSchedule(context, payload);
    return NextResponse.json(result);
  },
);
