import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  bulkUpdateTpoAfterCollege, BulkAfterCollegeError,
} from "@/modules/placements/tpo-after-college-bulk-service";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const context = await getCurrentRequestContext();
    const result = await bulkUpdateTpoAfterCollege(context, await request.json());
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof BulkAfterCollegeError)
      return NextResponse.json({ error: error.code }, {
        status: error.code === "AFTER_COLLEGE_STALE" ? 409 :
          error.code === "AFTER_COLLEGE_PENDING" ? 503 : 400,
      });
    return apiErrorResponse(error);
  }
}
