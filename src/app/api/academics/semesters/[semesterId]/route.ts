import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { departments, programTerms, programs } from "@/db/schema";
import { resolveActingCollege } from "@/modules/permissions/acting-college";
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

async function scopedSemester(requestContext: Awaited<ReturnType<typeof getCurrentRequestContext>>, semesterId: string) {
  if (!z.string().uuid().safeParse(semesterId).success) return null;
  const college = await resolveActingCollege(requestContext, "academics.read");
  const [term] = await getDb().select({
    id: programTerms.id, programId: programTerms.programId, name: programTerms.name,
    termNumber: programTerms.termNumber, totalCredits: programTerms.totalCredits,
    isActive: programTerms.isActive, updatedAt: programTerms.updatedAt,
  }).from(programTerms)
    .innerJoin(programs, eq(programs.id, programTerms.programId))
    .innerJoin(departments, and(eq(departments.id, programs.departmentId),
      eq(departments.collegeId, college.collegeId)))
    .where(eq(programTerms.id, semesterId)).limit(1);
  return term ?? null;
}

function handledError(error: unknown) {
  if (error instanceof SemesterMutationError) {
    return NextResponse.json({ error: error.code,
      message: error.code === "SEMESTER_NOT_FOUND" || error.code === "PROGRAM_NOT_FOUND"
        ? "Program structure not found." : error.message }, {
      status: error.code === "SEMESTER_NOT_FOUND" || error.code === "PROGRAM_NOT_FOUND" ? 404 :
        error.code === "SEMESTER_OUTSIDE_PROGRAM_DURATION" ? 400 : 409,
    });
  }
  return apiErrorResponse(error);
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { semesterId } = await params;
    const context = await getCurrentRequestContext();
    const semester = await scopedSemester(context, semesterId);
    if (!semester) return NextResponse.json({
      error: "SEMESTER_NOT_FOUND", message: "Program structure not found.",
    }, { status: 404 });
    return NextResponse.json({ status: "OK", message: "OK", data: semester, semester });
  } catch (error) { return handledError(error); }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const { semesterId } = await params;
    const context = await getCurrentRequestContext();
    const url = new URL(request.url);
    const statusType = url.searchParams.get("statusType");
    // Legacy updateStatus accepted programId/id/statusType in the URL. Resolve
    // the scoped row and its optimistic token server-side; do not trust caller
    // supplied name, program or timestamps for a status-only operation.
    if (statusType !== null) {
      if (statusType !== "ACTIVE" && statusType !== "INACTIVE") {
        return NextResponse.json({ error: "BAD_REQUEST", message: "Invalid status type." }, { status: 400 });
      }
      const previous = await scopedSemester(context, semesterId);
      if (!previous) return NextResponse.json({ error: "SEMESTER_NOT_FOUND",
        message: "Program structure not found." }, { status: 404 });
      const requestedProgram = url.searchParams.get("programId");
      if (requestedProgram && requestedProgram !== previous.programId) {
        return NextResponse.json({ error: "PROGRAM_NOT_FOUND", message: "Program structure not found." }, { status: 404 });
      }
      const semester = await updateCollegeSemester(context, semesterId, {
        name: previous.name, totalCredits: previous.totalCredits,
        isActive: statusType === "ACTIVE",
        expectedUpdatedAt: previous.updatedAt.toISOString(), confirm: true,
      });
      return NextResponse.json({ status: "OK", message: "Status updated successfully.",
        data: semester, semester });
    }
    const body: unknown = await request.json();
    const semester = await updateCollegeSemester(context, semesterId, body);
    return NextResponse.json({ status: "OK", message: "OK", data: semester, semester });
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
    return NextResponse.json({ status: "OK", message: "Deleted successfully.", data: result, result });
  } catch (error) {
    return handledError(error);
  }
}
