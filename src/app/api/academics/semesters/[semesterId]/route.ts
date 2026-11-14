import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z, ZodError } from "zod";
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

import { CACHE } from "@/security/responses";
import { zUuid } from "@/lib/schema-primitives";
export const runtime = "nodejs";
type RouteContext = { params: Promise<{ semesterId: string }> };
/** Legacy GET /programStructures/{id} -> GET here;
 * legacy updateStatus(id,programId,statusType) -> PATCH ?statusType=...
 * and update fields -> PATCH {name?,totalCredits?,isActive?,
 * expectedUpdatedAt,confirm:true}. Confirm/CAS are mandatory for changes;
 * DELETE additionally requires {confirm:true}. Program ID is never edited.
 */

async function scopedSemester(requestContext: Awaited<ReturnType<typeof getCurrentRequestContext>>, semesterId: string) {
  if (!zUuid.safeParse(semesterId).success) return null;
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
  if(error instanceof ZodError||error instanceof SyntaxError)
    return NextResponse.json({error:"INVALID_SEMESTER",message:"Check the semester fields and try again."},
      {status:400});
  if (error instanceof SemesterMutationError) {
    const message:Partial<Record<typeof error.code,string>>={
      SEMESTER_NOT_FOUND:"Program structure not found.",
      PROGRAM_NOT_FOUND:"Program structure not found.",
      SEMESTER_STALE:"This semester changed. Refresh its details and try again.",
      SEMESTER_ACTIVE_CURRICULUM:"This semester is in use by course mappings or current batches.",
      SEMESTER_HAS_COURSES:"Remove the semester's mapped courses before deleting it.",
      SEMESTER_HAS_ACTIVE_COHORTS:"This program has active batches. The semester cannot be deleted.",
      SEMESTER_COMPLETED_IMMUTABLE:"A completed historical semester cannot be reactivated.",
      SEMESTER_NUMBER_CONFLICT:"A semester with this number already exists for this program.",
      SEMESTER_OUTSIDE_PROGRAM_DURATION:"Semester number is outside the selected program duration.",
    };
    return NextResponse.json({ error: error.code,
      message:message[error.code]??error.message }, {
      status: error.code === "SEMESTER_NOT_FOUND" || error.code === "PROGRAM_NOT_FOUND" ? 404 :
        error.code === "SEMESTER_OUTSIDE_PROGRAM_DURATION" ? 400 : 409,
    });
  }
  return apiErrorResponse(error);
}

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const context = __actor!;
    try {
const { semesterId } = params;
const semester = await scopedSemester(context, semesterId);
if (!semester) return NextResponse.json({
      error: "SEMESTER_NOT_FOUND", message: "Program structure not found.",
    }, { status: 404 });
return NextResponse.json({ status: "OK", message: "OK", data: semester, semester },
      {headers:{"Cache-Control":CACHE.PRIVATE}});
} catch (error) { return handledError(error); }
  },
);

export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const context = __actor!;
    try {
const { semesterId } = params;
const url = new URL(request.url);
const statusType = url.searchParams.get("statusType");
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
      // Status-only mutation hydrates all omitted immutable fields within
      // the transaction lock. Supply only the desired status and CAS token.
      const semester = await updateCollegeSemester(context, semesterId, {
        isActive: statusType === "ACTIVE",
        expectedUpdatedAt: previous.updatedAt.toISOString(), confirm: true,
      });
      return NextResponse.json({ status: "OK", message: "Status updated successfully.",
        data: semester, semester });
    }
const body: unknown = await boundedRequestJson(request);
const semester = await updateCollegeSemester(context, semesterId, body);
return NextResponse.json({ status: "OK", message: "Semester updated successfully.", data: semester, semester });
} catch (error) {
    return handledError(error);
  }
  },
);

export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const context = __actor!;
    try {
const { semesterId } = params;
const body: unknown = await boundedRequestJson(request);
const result = await deleteCollegeSemester(context, semesterId, body);
return NextResponse.json({ status: "OK", message: "Deleted successfully.", data: result, result });
} catch (error) {
    return handledError(error);
  }
  },
);
