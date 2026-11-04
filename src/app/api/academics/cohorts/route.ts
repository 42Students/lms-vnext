import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readBoundedJsonBody } from "@/lib/bounded-json-body";
import {
  createCohort,
  listCohorts,
} from "@/modules/academics/cohort-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams;
    if (query.getAll("programId").length > 1) return NextResponse.json({
      error: "INVALID_FILTERS",
    }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
    const context = await getCurrentRequestContext();
    const programId = query.get("programId") ?? "";
    const cohorts = await listCohorts(
      context,
      programId,
    );

    return NextResponse.json({ cohorts });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
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
    const cohort = await createCohort(
      context,
      body,
    );

    return NextResponse.json(
      { cohort },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
