import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readBoundedJsonBody } from "@/lib/bounded-json-body";
import {
  assignLearnerToSection,
  listLearnerSectionHistory,
  listSectionRoster,
} from "@/modules/academics/roster-service";
import { route } from "@/security/route";

import { CACHE } from "@/security/responses";
export const runtime = "nodejs";

async function handleGET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const url = new URL(request.url);
    const query = url.searchParams;
    if (["sectionId", "learnerEnrollmentId"].some(key => query.getAll(key).length > 1) ||
        (query.has("sectionId") && query.has("learnerEnrollmentId")))
      return NextResponse.json({ error: "AMBIGUOUS_ENROLLMENT_SCOPE" }, {
        status: 400, headers: { "Cache-Control": CACHE.PRIVATE },
      });
    const sectionId =
      url.searchParams.get("sectionId");
    const learnerEnrollmentId =
      url.searchParams.get("learnerEnrollmentId");

    if (sectionId) {
      const enrollments = await listSectionRoster(
        context,
        sectionId,
      );
      return NextResponse.json({ enrollments });
    }

    const enrollments =
      await listLearnerSectionHistory(
        context,
        learnerEnrollmentId ?? "",
      );
    return NextResponse.json({ enrollments });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  ({ request }) => handleGET(request as Parameters<typeof handleGET>[0]),
);

async function handlePOST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const parsedBody = await readBoundedJsonBody(request, 16_384);
    if (parsedBody.kind !== "OK") return NextResponse.json({ error: "INVALID_REQUEST" }, {
      status: parsedBody.kind === "TOO_LARGE" ? 413 : 400,
      headers: { "Cache-Control": CACHE.PRIVATE },
    });
    const body = parsedBody.value;
    const enrollment =
      await assignLearnerToSection(
        context,
        body,
      );

    return NextResponse.json(
      { enrollment },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
