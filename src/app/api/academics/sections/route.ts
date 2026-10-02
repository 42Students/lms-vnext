import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createSection,
  listSections,
} from "@/modules/academics/section-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const url = new URL(request.url);
    const sections = await listSections(
      context,
      url.searchParams.get("cohortId") ?? "",
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
    const body = await request.json();
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
