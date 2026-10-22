import { NextResponse } from "next/server";
import { and, eq, inArray, or, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { programTermCourses, programTerms } from "@/db/schema";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import {
  listLearnerCourseDeliveries,
} from "@/modules/courses/learner-course-service";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Authenticated-learner-only replacement for StudentCourseController:
 * no studentId/classId override; numeric legacy semesterId is resolved only
 * through imported term-to-course records for the authenticated learner's
 * currently authorized programs and courses.
 *
 * Legacy SemesterService.js endpoint mapping (all three are role-scoped):
 *  - GET /api/v1/student-courses/byStudent/{studentId}[?semesterId=]
 *      -> GET /api/courses/learner[?semesterId=<imported legacy id>|academicPeriodId=<UUID>]
 *  - GET /api/v1/student-courses/byStudent/{studentId}/semesters
 *      -> GET /api/courses/learner?view=semesters
 *  - GET /api/v1/student-courses/byClass/{classId}
 *      -> no learner route: a class roster of courses is a staff read served by
 *         the college class/section pages (src/app/(authenticated)/college/classes)
 *         and faculty deliveries (faculty-course-service), never a learner override.
 * The only principal is the current ACTIVE learner membership resolved by
 * listLearnerCourseDeliveries. An independent teacher/admin roster endpoint
 * must handle staff-authorized byClass reads with its own permission check.
 */
export async function GET(request:Request) {
  try {
    const context = await getCurrentRequestContext();
    const url = new URL(request.url);
    if (url.searchParams.has("studentId") || url.searchParams.has("classId")) {
      return NextResponse.json({ error:"ACCESS_DENIED",message:"Access denied" },
        { status:403,headers });
    }
    const rawLegacySemester=url.searchParams.get("semesterId");
    const legacySemesterId=rawLegacySemester===null?null:Number(rawLegacySemester);
    if(rawLegacySemester!==null&&(!/^[-]?(?:0|[1-9][0-9]{0,9})$/.test(rawLegacySemester)||
       !Number.isSafeInteger(legacySemesterId)||Number(legacySemesterId)>2147483647||
       Number(legacySemesterId)<-2147483648)){
      return NextResponse.json({error:"INVALID_LEGACY_SEMESTER_ID"},
        {status:400,headers});
    }
    const view=url.searchParams.get("view");
    if(view!==null && view!=="semesters")
      return NextResponse.json({error:"INVALID_LEARNER_COURSE_VIEW"},
        {status:400,headers});
    const rawPeriod=url.searchParams.get("academicPeriodId");
    if(rawPeriod!==null && !uuid.test(rawPeriod))
      return NextResponse.json({error:"INVALID_ACADEMIC_PERIOD_ID"},
        {status:400,headers});
    if(rawPeriod!==null && legacySemesterId!==null)
      return NextResponse.json({error:"AMBIGUOUS_SEMESTER_FILTER"},
        {status:400,headers});

    const courses=await listLearnerCourseDeliveries(context);
    // Only derive choices from deliveries authorized to this learner; do not
    // read or infer any other learner's class or private semester.
    const semesters=[...new Map(courses.map(course=>[
      course.academicPeriodId,{
        id:course.academicPeriodId,
        name:course.academicPeriodName,
        startDate:course.periodStartDate,
        endDate:course.periodEndDate,
      },
    ])).values()].sort((a,b)=>
      b.startDate.localeCompare(a.startDate) || a.id.localeCompare(b.id));
    if(view==="semesters") {
      return NextResponse.json({
        status:"OK",message:"OK",data:semesters,semesters,
        note:"Available periods come only from your authorized active Course deliveries.",
      },{headers});
    }
    const periodMatched=rawPeriod!==null &&
      semesters.some(period=>period.id===rawPeriod);
    let legacyMatchedCourseKeys:Set<string>|null=null;
    if(legacySemesterId!==null&&courses.length){
      const programIds=[...new Set(courses.map(course=>course.programId))];
      const courseIds=[...new Set(courses.map(course=>course.courseId))];
      const mapped=await getDb().select({
        programId:programTerms.programId,
        courseId:programTermCourses.courseId,
      }).from(programTermCourses)
        .innerJoin(programTerms,eq(programTermCourses.programTermId,programTerms.id))
        .where(and(eq(programTerms.legacySemesterId,legacySemesterId),
          inArray(programTerms.programId,programIds),
          inArray(programTermCourses.courseId,courseIds),
          eq(programTerms.isActive,true),
          or(isNull(programTerms.legacyWasDeleted),eq(programTerms.legacyWasDeleted,false)),
          or(isNull(programTermCourses.legacyWasDeleted),eq(programTermCourses.legacyWasDeleted,false))));
      const authorized=new Set(courses.map(course=>course.programId+":"+course.courseId));
      legacyMatchedCourseKeys=new Set(mapped
        .map(item=>item.programId+":"+item.courseId)
        .filter(key=>authorized.has(key)));
    }
    // Foreign, soft-deleted and unmapped IDs use the existing unfiltered
    // learner-authorized fallback; we never reveal if an external term exists.
    const legacyMatched=Boolean(legacyMatchedCourseKeys?.size);
    const selected=legacyMatched
      ? courses.filter(course=>legacyMatchedCourseKeys!.has(course.programId+":"+course.courseId))
      : periodMatched
       ? courses.filter(course=>course.academicPeriodId===rawPeriod)
       : courses;
    return NextResponse.json({
      courses:selected,
      ...(rawPeriod!==null?{
        requestedAcademicPeriodId:rawPeriod,
        semesterFallbackApplied:!periodMatched,
      }:{}),
      ...(legacySemesterId!==null?{
        requestedLegacySemesterId:legacySemesterId,
        requestedSemesterId:legacySemesterId,
        semesterFallbackApplied:!legacyMatched,
      }:{}),
    },{headers});
  } catch (error) {
    return apiErrorResponse(error);
  }
}
