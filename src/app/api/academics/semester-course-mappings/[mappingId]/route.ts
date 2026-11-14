import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
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

import { CACHE } from "@/security/responses";
import { zUuid } from "@/lib/schema-primitives";
export const runtime = "nodejs";
/** Legacy semester courses endpoint map (numeric term/course identifiers must
 * be mapped within the acting college, never trusted from a client request):
 * old GET semester/{id}/courses => GET /api/academics/semesters/:semesterId
 * old POST single/multiple => POST /api/academics/semester-course-mappings
 * old PUT credits/is_mandatory/course_order => PATCH .../:mappingId
 * (credits, one-based position, CORE/ELECTIVE and nullable legacy isMandatory
 * are readable and updatable with a scoped transaction; mandatory edits
 * persist both original mandatory flag and type, never silently reset it);
 * old DELETE semesterId/courseId => DELETE .../:mappingId {confirm:true}
 * old reorderCourses => PUT /api/academics/semester-course-mappings
 * with {programTermId,mappingIds:[full ordered mapping UUID set]}. Reordering
 * uses a transaction and resequences ALL peers, so update atomically.
 */
const inUseMessage = "A current active batch offering is using this semester-course mapping. Remove the live offering before deleting this mapping.";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const context = __actor!;
    const { mappingId: raw } = params;
    const mappingId = zUuid.parse(raw);
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
      data:row,legacySemantics:{
        mandatory:row.isMandatory===null?"unknown":row.isMandatory,
        orderIsOneBased:true,
        positionChangesResequencePeers:true,
        deleteRequiresConfirmation:true,
      },
      deleteWarning:activeOffering?inUseMessage:
        "Removing this course will remove it from the semester map; historical course and learner records are retained."},
      {headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);

export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const context = __actor!;
    try {
const { mappingId } = params;
const result = await removeCollegeTermMapping(context, mappingId, await boundedRequestJson(request));
return NextResponse.json({status:"OK",result,message:"Course removed from semester"},
      {headers:{"Cache-Control":CACHE.PRIVATE}});
} catch (error) {
    if (error instanceof CollegeTermMappingError)
      return NextResponse.json({ error: error.code,
        message: error.code==="TERM_COURSE_IN_USE" ? inUseMessage :
          "The semester mapping changed. Review its current state before retrying." },
        { status: error.code.endsWith("NOT_FOUND") ? 404 : 409 });
    return apiErrorResponse(error);
  }
  },
);

export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const context = __actor!;
    try {
const { mappingId } = params;
const mapping = await updateCollegeTermMapping(context, mappingId, await boundedRequestJson(request));
return NextResponse.json({ status:"OK", mapping,
      data:mapping,message:"Semester course updated",
      reorderHint:"Changing position resequences other courses within this semester." }, { headers: { "Cache-Control": CACHE.PRIVATE } });
} catch (error) {
    if (error instanceof CollegeTermMappingError)
      return NextResponse.json({ error: error.code }, { status: error.code.endsWith("NOT_FOUND") ? 404 : 409 });
    return apiErrorResponse(error);
  }
  },
);
