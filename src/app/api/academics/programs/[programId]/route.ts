import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { programs } from "@/db/schema";
import { requirePermission } from "@/modules/permissions/policy";
import { loadProgramScope } from "@/modules/academics/scope";
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

/** Legacy program detail lookup. Read scope is validated before any details leave the DB. */
export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { programId: rawId } = await params;
    const programId = z.string().uuid().parse(rawId);
    const context = await getCurrentRequestContext();
    const scope = await loadProgramScope(programId, true);
    requirePermission(context, "academics.read", {
      organizationId: scope.organizationId,
      collegeId: scope.collegeId,
    });
    const [program] = await getDb().select({
      id: programs.id, departmentId: programs.departmentId,
      name: programs.name, code: programs.code,
      durationTerms: programs.durationTerms, status: programs.status,
    }).from(programs).where(eq(programs.id, programId)).limit(1);
    if (!program) return NextResponse.json({ error: "PROGRAM_NOT_FOUND" }, { status: 404 });
    return NextResponse.json({ program, message: "OK" });
  } catch (error) { return handledError(error); }
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
    return NextResponse.json({ program, message: "OK" });
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
    // Soft archive is deliberate: unlike legacy hard delete, course and
    // cohort references, history and activity records remain recoverable.
    return NextResponse.json({ program, message: "Program archived",
      retention: "Historical academic records are retained. Restore remains possible when dependencies allow." });
  } catch (error) { return handledError(error); }
}
