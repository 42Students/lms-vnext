import { NextResponse } from "next/server";
import { and, asc, eq, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { courses, departments, courseOfferings, courseLearningPaths, courseLessons } from "@/db/schema";
import { loadCourseScope } from "@/modules/courses/scope";
import { CoursesServiceError } from "@/modules/courses/errors";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createCourseQuiz,
  listCourseQuizzes,
} from "@/modules/courses/quiz-service";

export const runtime = "nodejs";

/** Legacy QuizController crosswalk:
 * POST /api/v1/quizzes/create -> POST /api/courses/quizzes (201 {quiz,data})
 * GET /api/v1/quizzes/{lessonId} -> GET ?lessonId=... ({quizzes})
 * GET /api/v1/quizzes/by-course?courseSlug=... -> GET ?courseSlug=...
 * GET /api/v1/quizzes/by-course?courseId=... -> GET ?courseId=...
 * PUT /api/v1/quizzes/{id} -> PATCH /api/courses/quizzes/{quizId}
 * PATCH /api/v1/quizzes/{id}/publish -> POST /api/courses/quizzes/{quizId}/transition
 * Legacy array/page response consumers explicitly opt in with legacyShape;
 * standard vNext response remains a stable {quizzes} envelope.
 */
export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const url = new URL(request.url);
    const query = url.searchParams;
    const lessonId = query.get("lessonId");
    const courseSlug = query.get("courseSlug")?.trim();
    const courseId = query.get("courseId")?.trim();
    const shape = query.get("legacyShape");
    if (shape && shape !== "array" && shape !== "page") {
      return NextResponse.json({error:"INVALID_LEGACY_SHAPE"},{status:400});
    }
    if (query.getAll("courseSlug").length>1 || query.getAll("courseId").length>1 ||
        query.getAll("lessonId").length>1) {
      return NextResponse.json({error:"INVALID_QUIZ_FILTERS"},{status:400});
    }
    const pageRaw = query.get("page") ?? "1";
    const sizeRaw = query.get("limit") ?? query.get("size") ?? "25";
    if (!/^[1-9][0-9]{0,3}$/.test(pageRaw) ||
        !/^[1-9][0-9]{0,2}$/.test(sizeRaw) ||
        Number(sizeRaw)>100 || Number(pageRaw)>1000) {
      return NextResponse.json({error:"INVALID_PAGINATION"},{status:400});
    }
    const page=Number(pageRaw),size=Number(sizeRaw);
    const includeArchived=query.get("includeArchived")==="true";
    let quizzes: Awaited<ReturnType<typeof listCourseQuizzes>>;
    if (lessonId) {
      quizzes=await listCourseQuizzes(context,lessonId,
        query.get("deliveryId"),includeArchived);
    } else if (courseSlug || courseId) {
      // Historical slug wins over courseId; never let an unscoped slug resolve
      // to a different college or leak rows from another role membership.
      let resolvedCourseId: string | null = null;
      if (courseSlug) {
        if (!/^[A-Za-z][A-Za-z0-9._-]{0,63}$/.test(courseSlug)) {
          return NextResponse.json({error:"INVALID_COURSE_SLUG"},{status:400});
        }
        const collegeId=context.membership?.collegeId??context.adminScope?.collegeId;
        if (!collegeId) throw new CoursesServiceError("LEARNING_ACCESS_DENIED");
        const matches=await getDb().select({id:courses.id}).from(courses)
          .innerJoin(departments,eq(departments.id,courses.departmentId))
          .where(and(eq(departments.collegeId,collegeId),eq(courses.status,"ACTIVE"),
            or(sql`lower(${courses.slug})=${courseSlug.toLowerCase()}`,
              sql`lower(${courses.code})=${courseSlug.toLowerCase()}`))).limit(2);
        if (matches.length!==1) throw new CoursesServiceError("COURSE_NOT_FOUND");
        resolvedCourseId=matches[0]!.id;
      } else if (courseId) {
        const scope=await loadCourseScope(courseId);
        const selected=context.membership?.collegeId??context.adminScope?.collegeId;
        if (!selected || scope.collegeId!==selected)
          throw new CoursesServiceError("COURSE_NOT_FOUND");
        resolvedCourseId=scope.id;
      }
      const lessons=await getDb().select({id:courseLessons.id}).from(courseLessons)
        .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
        .innerJoin(courseOfferings,eq(courseOfferings.id,courseLearningPaths.offeringId))
        .where(eq(courseOfferings.courseId,resolvedCourseId!))
        .orderBy(asc(courseLessons.sequence),asc(courseLessons.id)).limit(501);
      if(lessons.length>500) {
        return NextResponse.json({error:"QUIZ_DISCOVERY_TOO_LARGE",
          message:"Choose a lesson to narrow your quiz search."},{status:413});
      }
      quizzes=[];
      for (const lesson of lessons) {
        try {
          const eligible=await listCourseQuizzes(context,lesson.id,
            query.get("deliveryId"),includeArchived);
          quizzes.push(...eligible);
        } catch (error) {
          if (error instanceof CoursesServiceError &&
              ["LEARNING_ACCESS_DENIED","LESSON_NOT_FOUND","LEARNING_PATH_NOT_PUBLISHED"].includes(error.code)) {
            continue;
          }
          throw error;
        }
      }
    } else {
      return NextResponse.json({error:"QUIZ_SCOPE_REQUIRED",
        message:"Choose a lesson or course to view quizzes."},{status:400});
    }
    const total=quizzes.length;
    const selected=shape==="array"&&!query.has("page")&&!query.has("limit")
      ?quizzes:quizzes.slice((page-1)*size,page*size);
    const headers={"Cache-Control":"private, no-store"};
    if(shape==="array")return NextResponse.json(selected,{headers});
    if(shape==="page")return NextResponse.json({
      content:selected,number:page-1,size,totalElements:total,
      totalPages:Math.ceil(total/size),first:page===1,last:page*size>=total,
    },{headers});
    return NextResponse.json({quizzes:selected,total,page,pageSize:size},{headers});
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
    const context =
      await getCurrentRequestContext();
    const body:unknown=await request.json();
    if(!body||typeof body!=="object"||Array.isArray(body))
      return NextResponse.json({error:"INVALID_QUIZ_INPUT",message:"Quiz details are required"},{status:400});
    const record=body as Record<string,unknown>;
    if(record.publish!==undefined&&typeof record.publish!=="boolean")
      return NextResponse.json({error:"INVALID_QUIZ_INPUT",message:"publish must be true or false"},{status:400});
    if(record.publish!==undefined&&record.publishNow!==undefined&&record.publish!==record.publishNow)
      return NextResponse.json({error:"INVALID_QUIZ_INPUT",message:"Conflicting publish options"},{status:400});
    const {publish,...rest}=record;
    const publishNow=record.publishNow??publish??false;
    // Create + publish is one DB transaction; never claim a successful
    // release when an authoring validation failed halfway through.
    const quiz=await createCourseQuiz(context,{...rest,publishNow});
    return NextResponse.json({
      quiz,status:"OK",message:"OK",data:quiz,
      published:quiz.status==="PUBLISHED",
      draft:quiz.status==="DRAFT",
    },{status:201,headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    return apiErrorResponse(error);
  }
}
