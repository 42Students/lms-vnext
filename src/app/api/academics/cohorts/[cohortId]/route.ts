import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { readBoundedJsonBody } from "@/lib/bounded-json-body";
import {
  transitionCohort,
  updateCohort,
} from "@/modules/academics/cohort-service";

export const runtime = "nodejs";

export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { cohortId } = params;
    const parsedBody = await readBoundedJsonBody(request, 16_384);
    if (parsedBody.kind !== "OK") return NextResponse.json({ error: "INVALID_REQUEST" }, {
      status: parsedBody.kind === "TOO_LARGE" ? 413 : 400,
      headers: { "Cache-Control": "private, no-store" },
    });
    const body = parsedBody.value;
    const cohort =
      body &&
      typeof body === "object" &&
      "action" in body
        ? await transitionCohort(
            context,
            cohortId,
            body,
          )
        : await updateCohort(
            context,
            cohortId,
            body,
          );
    return NextResponse.json({ cohort });
  },
);
