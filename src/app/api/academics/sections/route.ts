import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createSection,
  listSections,
} from "@/modules/academics/section-service";

export const runtime = "nodejs";

/**
 * vNext section CRUD is intentionally NOT a drop-in for legacy /api/v2/classes.
 * Legacy /search, /popular, /program, /category, /exists, /select and /refresh
 * need a separately permissioned/versioned discovery adapter. In particular,
 * POST here must never record a selection or invoke a cache refresh: it
 * persists a real section and requires the same-origin mutation policy.
 */

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const url = new URL(request.url);
    const cohortId = url.searchParams.get("cohortId");
    if (!cohortId) {
      return NextResponse.json({
        error: "COHORT_SCOPE_REQUIRED",
        message: "Choose a batch to view its classes.",
        fieldErrors: { cohortId: "Choose a batch to view its classes." },
      }, { status: 400 });
    }
    const sections = await listSections(
      context,
      cohortId,
      url.searchParams.get("academicPeriodId"),
    );

    return NextResponse.json({ sections });
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
    const body: unknown = await request.json();
    // Do not interpret the old no-body refresh or click/select actions as a
    // section create. A typed create payload remains mandatory.
    if (!body || typeof body !== "object" || Array.isArray(body) ||
        ("action" in body && (
          body.action === "REFRESH" || body.action === "SELECT"
        ))) {
      return NextResponse.json({
        error: "INVALID_SECTION_CREATE",
        message: "Enter section details before creating a class.",
      }, { status: 400 });
    }
    const section = await createSection(
      context,
      body,
    );

    return NextResponse.json(
      { section },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
