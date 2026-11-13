import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  bulkUpdateTpoAfterCollege, BulkAfterCollegeError,
} from "@/modules/placements/tpo-after-college-bulk-service";

import { privateJson } from "@/security/responses";
export const runtime = "nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    try {
const result = await bulkUpdateTpoAfterCollege(context, await boundedRequestJson(request, 8 * 1024 * 1024));
return privateJson(result);
} catch (error) {
    if (error instanceof BulkAfterCollegeError)
      return NextResponse.json({ error: error.code }, {
        status: error.code === "AFTER_COLLEGE_STALE" ? 409 :
          error.code === "AFTER_COLLEGE_PENDING" ? 503 : 400,
      });
    return apiErrorResponse(error);
  }
  },
);
