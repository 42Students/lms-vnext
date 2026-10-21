import { NextResponse } from "next/server";
import {z} from "zod";
import {hasMembershipRole} from "@/modules/identity/context";
import {loadLessonContentScope} from "@/modules/courses/scope";
import {getFacultyAssessmentOverview} from "@/modules/courses/faculty-assessment-service";
import {getLearnerAssessmentOverview} from "@/modules/courses/learner-assessment-service";
import {CoursesServiceError} from "@/modules/courses/errors";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createLessonContent,
  listLessonContents,
  listLessonContentMetrics,
} from "@/modules/courses/lesson-content-service";

export const runtime = "nodejs";
const noStore={"Cache-Control":"private, no-store"};
/** Server-side legacy→vNext crosswalk (numeric course/class/lesson IDs are not
 * authority). Legacy lesson_id→lessonId UUID, class_id→deliveryId UUID,
 * content_title→title, content_type→contentType, duration→durationSeconds,
 * enabled→visibleToStudents, active→PUBLISH action. The author's faculty ID
 * ALWAYS comes from the persisted request context. Creating a content row
 * cannot auto-publish around the separate authorization/transition service.
 */
function normalizeContentCreatePayload(body:Record<string,unknown>){
 const next={...body};
 for(const [legacy,modern] of [
  ["lesson_id","lessonId"],["class_id","deliveryId"],
  ["content_title","title"],["content_type","contentType"],
  ["duration_seconds","durationSeconds"],["visible_to_students","visibleToStudents"],
 ] as const){
  if(legacy in next){
   if(modern in next&&next[modern]!==next[legacy])
    throw new Error("Conflicting "+modern+" and "+legacy+" fields");
   next[modern]=next[legacy];delete next[legacy];
  }
 }
 // Old Java relied on positive integer Faculty IDs. Membership tenancy now
 // identifies the author, so even a valid legacy filter cannot impersonate it.
 delete next.facultyId;delete next.faculty_id;
 return next;
}
function optionalLegacyFacultyFilter(value:string|null){
 if(value===null)return;
 if(!/^[1-9][0-9]*$/.test(value)||!Number.isSafeInteger(Number(value)))
  throw new Error("facultyId must be a positive integer");
 throw new Error("Use the authenticated faculty workspace; legacy numeric facultyId filters are not available.");
}


export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const url = new URL(request.url);
    const contentId=url.searchParams.get("contentId");
    const facultyId=url.searchParams.get("facultyId");
    optionalLegacyFacultyFilter(facultyId);
    // Distinct legacy content-grades and learner-progress aggregates are not
    // represented by the simple author content list. An explicit error is
    // preferable to a 200 empty list that looks like zero grades.
    if(url.searchParams.get("view")==="grades")
      return NextResponse.json({
        error:"CONTENT_GRADES_REPORT_UNAVAILABLE",
        message:"Use the authorized assessment results report. No grade data was fetched.",
      },{status:503,headers:noStore});
    if(url.searchParams.get("view")==="metrics"){
      const lessonId=z.string().uuid().parse(url.searchParams.get("lessonId"));
      const metrics=await listLessonContentMetrics(context,lessonId,url.searchParams.get("deliveryId"));
      return NextResponse.json({metrics,data:metrics,status:"SUCCESS",reason:"Lesson content metrics retrieved"},
        {headers:noStore});
    }
    const assessmentKind=url.searchParams.get("assessmentKind");
    if(contentId){
      const id=z.string().uuid().parse(contentId);
      const scoped=await loadLessonContentScope(id);
      const contents=await listLessonContents(context,scoped.lessonId,
        url.searchParams.get("deliveryId"),false);
      const content=contents.find(item=>item.id===id);
      if(!content)throw new CoursesServiceError("LESSON_CONTENT_NOT_FOUND");
      return NextResponse.json({content,data:content,status:"SUCCESS",reason:"Lesson content retrieved"},
        {headers:{"Cache-Control":"private, no-store"}});
    }
    if(assessmentKind==="ASSIGNMENT"||assessmentKind==="QUIZ"){
      // Optional old courseSlug takes precedence over courseId. Resolve the
      // slug/code ONLY within the currently authorized learner catalog.
      const courseSlug=url.searchParams.get("courseSlug")?.trim();
      const learner=hasMembershipRole(context,"LEARNER");
      const faculty=hasMembershipRole(context,"FACULTY");
      if(!learner&&!faculty)throw new CoursesServiceError("LEARNING_ACCESS_DENIED");
      const initial=learner?await getLearnerAssessmentOverview(context):null;
      const authorizedCourse=courseSlug&&initial?
        initial.courses.find(course=>course.code.toLowerCase()===courseSlug.toLowerCase()):null;
      if(courseSlug&&learner&&!authorizedCourse)
        throw new CoursesServiceError("COURSE_NOT_FOUND");
      const overview=learner
        ?courseSlug?await getLearnerAssessmentOverview(context,{courseId:authorizedCourse!.id}):
         await getLearnerAssessmentOverview(context,{courseId:url.searchParams.get("courseId")??undefined})
        :await getFacultyAssessmentOverview(context);
      const contentsUnfiltered=assessmentKind==="ASSIGNMENT"?overview.assignments:overview.quizzes;
      const contents=courseSlug&&!learner
        ?contentsUnfiltered.filter(item=>item.courseCode.toLowerCase()===courseSlug.toLowerCase())
        :contentsUnfiltered;
      return NextResponse.json({contents,data:contents,status:"SUCCESS",reason:"Lesson contents retrieved"},
        {headers:{"Cache-Control":"private, no-store"}});
    }
    const contents = await listLessonContents(
      context,
      url.searchParams.get("lessonId") ?? "",
      url.searchParams.get("deliveryId"),
      url.searchParams.get("includeArchived") === "true",
    );
    return NextResponse.json({contents,data:contents,status:"SUCCESS",reason:"Lesson contents retrieved"},
      {headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const body = await request.json();
    if(body===null||typeof body!=="object"||Array.isArray(body)){
      return NextResponse.json({error:"INVALID_REQUEST",message:"Valid lessonId required"},
        {status:400});
    }
    const next=normalizeContentCreatePayload(body as Record<string,unknown>);
    const content = await createLessonContent(context,next as Parameters<typeof createLessonContent>[1]);

    return NextResponse.json(
      {content,data:content,LessonContents:content,status:"SUCCESS",reason:"Lesson content created"},
      {status:new URL(request.url).searchParams.get("response")==="vnext"?201:200,headers:noStore},
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
