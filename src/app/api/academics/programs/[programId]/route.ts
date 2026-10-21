import { NextResponse } from "next/server";
import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { programs, departments, programTerms, programTermCourses, courses } from "@/db/schema";
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
    // Resolve nested curriculum only within the authorized college's program.
    const terms=await getDb().select({
      id:programTerms.id,name:programTerms.name,termNumber:programTerms.termNumber,
      startDate:programTerms.startDate,endDate:programTerms.endDate,
      legacyStartDate:programTerms.legacyStartDate,legacyEndDate:programTerms.legacyEndDate,
      sourceCourseIds:programTerms.legacyCourseIds,
      status:programTerms.legacyStructureStatus,isActive:programTerms.isActive,
      createdAt:programTerms.createdAt,
    }).from(programTerms).where(eq(programTerms.programId,program.id))
      .orderBy(asc(programTerms.termNumber),asc(programTerms.id));
    const links=terms.length?await getDb().select({
      termId:programTermCourses.programTermId,id:courses.id,
      name:courses.name,code:courses.code,metaData:courses.legacyMetadata,
      enabled:courses.enabled,status:courses.status,
      deletedAt:courses.deletedAt,legacyCourseId:courses.legacyCourseId,
      mandatory:programTermCourses.legacyIsMandatory,type:programTermCourses.type,
      credits:programTermCourses.credits,createdAt:programTermCourses.createdAt,
    }).from(programTermCourses)
      .innerJoin(courses,eq(courses.id,programTermCourses.courseId))
      .innerJoin(departments,eq(departments.id,courses.departmentId))
      .where(and(inArray(programTermCourses.programTermId,terms.map(term=>term.id)),
        eq(departments.collegeId,scope.collegeId)))
      .orderBy(asc(programTermCourses.displayOrder),asc(programTermCourses.id)):[];
    const dateArray=(date:Date)=>[
      date.getUTCFullYear(),date.getUTCMonth()+1,date.getUTCDate(),
    ];
    const structure=terms.map(term=>{
      const linked=links.filter(row=>row.termId===term.id);
      return {
        id:term.id,name:term.name,term_number:term.termNumber,
        start_date:term.startDate??term.legacyStartDate,
        end_date:term.endDate??term.legacyEndDate,
        status:term.status??(term.isActive?"ACTIVE":"INACTIVE"),
        course_ids:linked.map(course=>course.id),
        source_course_ids:term.sourceCourseIds??[],
        courses:linked.map(course=>({
          id:course.id,name:course.name,code:course.code,
          meta_data:course.metaData,enabled:course.enabled,
          status:course.status,deleted:course.deletedAt!==null,
          legacy_course_id:course.legacyCourseId,
          mandatory:course.mandatory,type:course.type,credits:course.credits,
          created_at:dateArray(course.createdAt),
        })),
        created_at:dateArray(term.createdAt),
      };
    });
    return NextResponse.json({
      status:"OK",message:"OK",program:{...program,program_structure:structure},
      data:{...program,program_structure:structure,durationYears:program.durationTerms%2===0?
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
