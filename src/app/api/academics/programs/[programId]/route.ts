import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  archiveCollegeProgram,
  CollegeProgramMutationError,
  updateCollegeProgram,
  restoreCollegeProgram,
} from "@/modules/academics/college-program-mutation-service";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ programId: string }> };

function handledError(error: unknown) {
  if (error instanceof CollegeProgramMutationError) {
    return NextResponse.json({ error: error.code }, {
      status: error.code === "PROGRAM_NOT_FOUND" ? 404 : 409,
    });
  }
  return apiErrorResponse(error);
}

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const { programId } = await params;
    const context = await getCurrentRequestContext();
    const body: unknown = await request.json();
    const program = body && typeof body === "object" && "action" in body && body.action === "RESTORE"
      ? await restoreCollegeProgram(context, programId, body)
      : await updateCollegeProgram(context, programId, body);
    return NextResponse.json({ program });
  } catch (error) { return handledError(error); }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const { programId } = await params;
    const context = await getCurrentRequestContext();
    const body: unknown = await request.json();
    const program = await archiveCollegeProgram(context, programId, body);
    return NextResponse.json({ program });
  } catch (error) { return handledError(error); }
}
