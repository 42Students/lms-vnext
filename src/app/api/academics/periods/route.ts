import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readBoundedJsonBody } from "@/lib/bounded-json-body";
import {
  createAcademicPeriod,
  listAcademicPeriods,
} from "@/modules/academics/period-service";
import { route } from "@/security/route";

export const runtime = "nodejs";

async function handleGET(request: Request) {
  try {
    const query = new URL(request.url).searchParams;
    if (query.getAll("collegeId").length > 1) return NextResponse.json({
      error: "INVALID_FILTERS",
    }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
    const context = await getCurrentRequestContext();
    const collegeId = query.get("collegeId") ?? "";
    const periods = await listAcademicPeriods(
      context,
      collegeId,
    );

    return NextResponse.json({ periods });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const GET = route(
  { auth: "user", permission: "service-enforced", repeatableQuery: ["collegeId"] },
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
    const parsed = await readBoundedJsonBody(request, 16_384);
    if (parsed.kind !== "OK") return NextResponse.json({ error: "INVALID_REQUEST" }, {
      status: parsed.kind === "TOO_LARGE" ? 413 : 400,
      headers: { "Cache-Control": "private, no-store" },
    });
    const body = parsed.value;
    const period = await createAcademicPeriod(
      context,
      body,
    );

    return NextResponse.json(
      { period },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const POST = route(
  { auth: "user", permission: "service-enforced", repeatableQuery: ["collegeId"] },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
