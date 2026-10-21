import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { programs, departments } from "@/db/schema";
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
    return NextResponse.json({ error: error.code, message:error.message }, {
      status: error.code === "PROGRAM_NOT_FOUND" ? 404 : 409,
    });
  }
  return apiErrorResponse(error);
}

/** Legacy program detail lookup. Read scope is validated before any details leave the DB. */
export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { programId: rawId } = await params;
    const programId=z.string().uuid().safeParse(rawId);
    // Numeric imported IDs are never read as UUIDs; a scoped migration
    // crosswalk must explicitly resolve any legacy bookmark first.
    if(!programId.success)return NextResponse.json({
      error:"PROGRAM_NOT_FOUND",message:"Program not found.",
    },{status:404});
    const context = await getCurrentRequestContext();
    const scope = await loadProgramScope(programId.data, true);
    requirePermission(context, "academics.read", {
      organizationId: scope.organizationId,
      collegeId: scope.collegeId,
    });
    const [program] = await getDb().select({
      id: programs.id, departmentId: programs.departmentId,
      name: programs.name, code: programs.code,
      durationTerms: programs.durationTerms, status: programs.status,
      legacyProgramId:programs.legacyProgramId,
      departmentName:departments.name,
    }).from(programs).innerJoin(departments,eq(departments.id,programs.departmentId))
      .where(eq(programs.id,programId.data)).limit(1);
    if (!program) return NextResponse.json({ error: "PROGRAM_NOT_FOUND" }, { status: 404 });
    return NextResponse.json({
      status:"OK",message:"OK",program,
      data:{...program, durationYears:program.durationTerms%2===0?
        program.durationTerms/2:null,
        // Old model used numeric program IDs; UUID is authoritative.
        id:program.id,departmentId:program.departmentId},
    },{headers:{"Cache-Control":"private, no-store"}});
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
