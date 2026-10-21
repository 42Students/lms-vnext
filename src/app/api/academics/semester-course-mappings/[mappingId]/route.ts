import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { cohortProgressionState, cohorts, courseOfferings, departments, programTermCourses, programTerms, programs } from "@/db/schema";
import { resolveActingCollege } from "@/modules/permissions/acting-college";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { updateCollegeTermMapping, removeCollegeTermMapping, CollegeTermMappingError } from "@/modules/academics/college-term-mapping-service";

export const runtime = "nodejs";
const inUseMessage = "A current active batch offering is using this semester-course mapping. Remove the live offering before deleting this mapping.";

export async function GET(
  _request: Request, { params }: { params: Promise<{ mappingId: string }> },
) {
  try {
    const { mappingId: raw } = await params;
    const mappingId = z.string().uuid().parse(raw);
    const context = await getCurrentRequestContext();
    const member = await resolveActingCollege(context, "academics.read");
    const [row] = await getDb().select({
      id: programTermCourses.id,
      courseId: programTermCourses.courseId,
      termId: programTerms.id,
      programId: programs.id,
      termNumber: programTerms.termNumber,
      credits: programTermCourses.credits,
      type: programTermCourses.type,
      isMandatory: programTermCourses.legacyIsMandatory,
      displayOrder: programTermCourses.displayOrder,
    }).from(programTermCourses)
      .innerJoin(programTerms, eq(programTerms.id,programTermCourses.programTermId))
      .innerJoin(programs, eq(programs.id,programTerms.programId))
      .innerJoin(departments, and(eq(departments.id,programs.departmentId),
        eq(departments.collegeId,member.collegeId)))
      .where(eq(programTermCourses.id,mappingId)).limit(1);
    if (!row) return NextResponse.json({error:"TERM_COURSE_NOT_FOUND"},{status:404});
    const [activeOffering] = await getDb().select({id:courseOfferings.id})
      .from(courseOfferings)
      .innerJoin(cohorts,and(eq(cohorts.id,courseOfferings.cohortId),
        eq(cohorts.programId,row.programId),eq(cohorts.status,"ACTIVE")))
      .innerJoin(cohortProgressionState,and(
        eq(cohortProgressionState.cohortId,cohorts.id),
        eq(cohortProgressionState.currentTermNumber,row.termNumber)))
      .where(and(eq(courseOfferings.courseId,row.courseId),
        eq(courseOfferings.status,"ACTIVE"))).limit(1);
    return NextResponse.json({mapping:row,canRemove:!activeOffering,
      deleteWarning:activeOffering?inUseMessage:
        "Removing this course will remove it from the semester map; historical course and learner records are retained."});
  } catch(error) { return apiErrorResponse(error); }
}

export async function DELETE(
  request: Request, { params }: { params: Promise<{ mappingId: string }> },
) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const { mappingId } = await params;
    const context = await getCurrentRequestContext();
    const result = await removeCollegeTermMapping(context, mappingId, await request.json());
    return NextResponse.json({ result, message:"Course removed from semester" });
  } catch (error) {
    if (error instanceof CollegeTermMappingError)
      return NextResponse.json({ error: error.code,
        message: error.code==="TERM_COURSE_IN_USE" ? inUseMessage :
          "The semester mapping changed. Review its current state before retrying." },
        { status: error.code.endsWith("NOT_FOUND") ? 404 : 409 });
    return apiErrorResponse(error);
  }
}

export async function PATCH(
  request: Request, { params }: { params: Promise<{ mappingId: string }> },
) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const { mappingId } = await params;
    const context = await getCurrentRequestContext();
    const mapping = await updateCollegeTermMapping(context, mappingId, await request.json());
    return NextResponse.json({ mapping, message: "Semester course updated" }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof CollegeTermMappingError)
      return NextResponse.json({ error: error.code }, { status: error.code.endsWith("NOT_FOUND") ? 404 : 409 });
    return apiErrorResponse(error);
  }
}
