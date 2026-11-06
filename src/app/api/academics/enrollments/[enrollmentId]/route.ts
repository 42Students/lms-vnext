import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { readBoundedJsonBody } from "@/lib/bounded-json-body";
import {
  transitionLearnerProgramEnrollment,
} from "@/modules/academics/enrollment-service";

export const runtime = "nodejs";

export const PATCH = route(
  { auth: "user", permission: "academics.manage" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { enrollmentId } = params;
    const parsedBody = await readBoundedJsonBody(request, 16_384);
    if (parsedBody.kind !== "OK") return NextResponse.json({ error: "INVALID_REQUEST" }, {
      status: parsedBody.kind === "TOO_LARGE" ? 413 : 400,
      headers: { "Cache-Control": "private, no-store" },
    });
    const body = parsedBody.value;
    const enrollment =
      await transitionLearnerProgramEnrollment(
        context,
        enrollmentId,
        body,
      );
    return NextResponse.json({ enrollment });
  },
);
