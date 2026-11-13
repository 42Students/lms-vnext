import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  archiveCourseOffering,
  updateCourseOffering,
} from "@/modules/courses/offering-service";

export const runtime = "nodejs";

export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { offeringId } = params;
    const body = await boundedRequestJson(request);
    const offering = await updateCourseOffering(
      context,
      offeringId,
      body,
    );
    return NextResponse.json({ offering });
  },
);

export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { offeringId } = params;
    const offering = await archiveCourseOffering(
      context,
      offeringId,
    );
    return NextResponse.json({ offering });
  },
);
