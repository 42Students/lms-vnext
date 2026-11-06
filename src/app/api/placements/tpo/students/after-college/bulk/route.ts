import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  bulkUpdateTpoAfterCollege, BulkAfterCollegeError,
} from "@/modules/placements/tpo-after-college-bulk-service";

export const runtime = "nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const result = await bulkUpdateTpoAfterCollege(context, await request.json());
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  },
);
