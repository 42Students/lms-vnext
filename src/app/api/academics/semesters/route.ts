import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { createCollegeSemester, SemesterMutationError } from "@/modules/academics/semester-mutation-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const body: unknown = await request.json();
    const semester = await createCollegeSemester(context, body);
    return NextResponse.json({ semester }, { status: 201 });
  } catch (error) {
    if (error instanceof SemesterMutationError) {
      return NextResponse.json({ error: error.code }, {
        status: error.code === "PROGRAM_NOT_FOUND" ? 404 : 409,
      });
    }
    return apiErrorResponse(error);
  }
}
