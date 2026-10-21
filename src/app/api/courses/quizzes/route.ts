import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createCourseQuiz,
  listCourseQuizzes,
} from "@/modules/courses/quiz-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context =
      await getCurrentRequestContext();
    const url = new URL(request.url);
    const quizzes = await listCourseQuizzes(
      context,
      url.searchParams.get("lessonId") ?? "",
      url.searchParams.get("deliveryId"),
      url.searchParams.get(
        "includeArchived",
      ) === "true",
    );

    return NextResponse.json({ quizzes });
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
