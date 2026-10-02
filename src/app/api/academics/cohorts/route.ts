import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createCohort,
  listCohorts,
} from "@/modules/academics/cohort-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const programId =
      new URL(request.url).searchParams.get(
        "programId",
      ) ?? "";
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
    const body = await request.json();
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
