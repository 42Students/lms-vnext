import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  transitionSectionEnrollment,
} from "@/modules/academics/roster-service";

export const runtime = "nodejs";

export const PATCH = route(
  { auth: "user", permission: "academics.manage" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { sectionEnrollmentId } = params;
    const body = await boundedRequestJson(request);
    const enrollment =
      await transitionSectionEnrollment(
        context,
        sectionEnrollmentId,
        body,
      );
    return NextResponse.json({ enrollment });
  },
);
