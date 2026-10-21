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
} from "@/modules/courses/lesson-content-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const url = new URL(request.url);
    const contentId=url.searchParams.get("contentId");
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
      const learner=hasMembershipRole(context,"LEARNER");
      const faculty=hasMembershipRole(context,"FACULTY");
      if(!learner&&!faculty)throw new CoursesServiceError("LEARNING_ACCESS_DENIED");
      const overview=learner
        ?await getLearnerAssessmentOverview(context,{courseId:url.searchParams.get("courseId")??undefined})
        :await getFacultyAssessmentOverview(context);
      const contents=assessmentKind==="ASSIGNMENT"?overview.assignments:overview.quizzes;
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
    const content = await createLessonContent(context,body);

    return NextResponse.json(
      {content,data:content,LessonContents:content,status:"SUCCESS",reason:"Lesson content created"},
      {status:200,headers:{"Cache-Control":"private, no-store"}},
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
