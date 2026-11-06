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

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ periodId: string }>;
};

export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { periodId } = params;
    const parsedBody = await readBoundedJsonBody(request, 16_384);
    if (parsedBody.kind !== "OK") return NextResponse.json({ error: "INVALID_REQUEST" }, {
      status: parsedBody.kind === "TOO_LARGE" ? 413 : 400,
      headers: { "Cache-Control": "private, no-store" },
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
  },
);
