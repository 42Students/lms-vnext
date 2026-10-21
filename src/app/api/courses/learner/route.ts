import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import {
  listLearnerCourseDeliveries,
} from "@/modules/courses/learner-course-service";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Authenticated-learner-only replacement for StudentCourseController:
 * no studentId/classId override, and no numeric legacy semesterId guesswork.
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
    if (url.searchParams.has("semesterId")) {
      return NextResponse.json({
        error:"LEGACY_SEMESTER_ID_UNMAPPED",
        message:"Use an authorized academicPeriodId UUID instead of a legacy numeric semesterId.",
      },{status:400,headers});
    }
    const view=url.searchParams.get("view");
    if(view!==null && view!=="semesters")
      return NextResponse.json({error:"INVALID_LEARNER_COURSE_VIEW"},
        {status:400,headers});
    const rawPeriod=url.searchParams.get("academicPeriodId");
    if(rawPeriod!==null && !uuid.test(rawPeriod))
      return NextResponse.json({error:"INVALID_ACADEMIC_PERIOD_ID"},
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
    const selected=periodMatched
      ? courses.filter(course=>course.academicPeriodId===rawPeriod)
      : courses;
    return NextResponse.json({
      courses:selected,
      ...(rawPeriod!==null?{
        requestedAcademicPeriodId:rawPeriod,
        semesterFallbackApplied:!periodMatched,
      }:{}),
    },{headers});
  } catch (error) {
    return apiErrorResponse(error);
  }
}
