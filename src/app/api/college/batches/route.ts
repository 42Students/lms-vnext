import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  CollegeCohortMutationError, createCollegeCohort,
} from "@/modules/academics/college-cohort-mutation-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const body: unknown = await request.json();
    const cohort = await createCollegeCohort(context, body);
    return NextResponse.json({ success: true, message: "Batch created successfully", cohort }, { status: 201 });
  } catch (error) {
    if (error instanceof CollegeCohortMutationError) {
      return NextResponse.json({ error: error.code }, {
        status: error.code.endsWith("NOT_FOUND") ? 404 : 409,
      });
    }
    return apiErrorResponse(error);
  }
}
