import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readBoundedJsonBody } from "@/lib/bounded-json-body";
import { CollegePeriodLifecycleError } from "@/modules/academics/college-period-lifecycle-service";
import {
  transitionAcademicPeriod,
  updateAcademicPeriod,
} from "@/modules/academics/period-service";

import { CACHE } from "@/security/responses";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ periodId: string }>;
};

export const PATCH = route(
  { auth: "user", permission: "academics.manage" },
  async ({ request, context: __actor, params }) => {
    const context = __actor!;
    try {
const { periodId } = params;
const parsedBody = await readBoundedJsonBody(request, 16_384);
if (parsedBody.kind !== "OK") return NextResponse.json({ error: "INVALID_REQUEST" }, {
      status: parsedBody.kind === "TOO_LARGE" ? 413 : 400,
      headers: { "Cache-Control": CACHE.PRIVATE },
    });
const body = parsedBody.value;
const period =
      body &&
      typeof body === "object" &&
      "action" in body
        ? await transitionAcademicPeriod(
            context,
            periodId,
            body,
          )
        : await updateAcademicPeriod(
            context,
            periodId,
            body,
          );
return NextResponse.json({ period });
} catch (error) {
    if (error instanceof CollegePeriodLifecycleError) {
      return NextResponse.json({ error: error.code }, {
        status: error.code === "PERIOD_NOT_FOUND" ? 404 : 409,
      });
    }
    return apiErrorResponse(error);
  }
  },
);
