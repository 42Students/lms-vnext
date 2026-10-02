import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createProgram,
  listPrograms,
} from "@/modules/academics/program-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const url = new URL(request.url);
    const programs = await listPrograms(
      context,
      url.searchParams.get("collegeId") ?? "",
      url.searchParams.get("departmentId"),
    );

    return NextResponse.json({ programs });
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
    const program = await createProgram(
      context,
      body,
    );

    return NextResponse.json(
      { program },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
