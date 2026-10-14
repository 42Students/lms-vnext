import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  deleteCollegeSemester,
  SemesterMutationError,
  updateCollegeSemester,
} from "@/modules/academics/semester-mutation-service";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ semesterId: string }> };

function handledError(error: unknown) {
  if (error instanceof SemesterMutationError) {
    return NextResponse.json({ error: error.code }, {
      status: error.code === "SEMESTER_NOT_FOUND" ? 404 : 409,
    });
  }
  return apiErrorResponse(error);
}

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const { semesterId } = await params;
    const body: unknown = await request.json();
    const context = await getCurrentRequestContext();
    const semester = await updateCollegeSemester(context, semesterId, body);
    return NextResponse.json({ semester });
  } catch (error) {
    return handledError(error);
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const { semesterId } = await params;
    const body: unknown = await request.json();
    const context = await getCurrentRequestContext();
    const result = await deleteCollegeSemester(context, semesterId, body);
    return NextResponse.json({ result });
  } catch (error) {
    return handledError(error);
  }
}
