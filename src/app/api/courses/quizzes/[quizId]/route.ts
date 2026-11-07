import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  getCourseQuiz,
  updateCourseQuiz,
  transitionCourseQuiz,
  setCourseQuizResults,
} from "@/modules/courses/quiz-service";
import {getDb} from "@/db/client";
import {quizAttempts} from "@/db/schema";
import {eq,sql} from "drizzle-orm";
import {can} from "@/modules/permissions/policy";
import { route } from "@/security/route";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ quizId: string }>;
};

async function handleGET(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const context =
      await getCurrentRequestContext();
    const { quizId } = await params;
    const url = new URL(request.url);
    const answerFlags=url.searchParams.getAll("includeCorrectAnswers");
    if(answerFlags.length>1||(answerFlags.length===1&&!["true","false"].includes(answerFlags[0]!)))
      return NextResponse.json({error:"INVALID_REQUEST",message:"includeCorrectAnswers must be true or false."},
        {status:400,headers:{"Cache-Control":"private, no-store"}});
    const quiz = await getCourseQuiz(
      context,
      quizId,
      url.searchParams.get("deliveryId"),
      answerFlags[0]==="true",
    );

    // Unknown submission count must not unlock a destructive edit. Keep
    // title/description corrections available while the count query fails.
    let editPolicy:{
      attemptCount:number|null;metadataOnly:boolean;warning:string|null;
    }|null=null;
    if(can(context,"courses.manage",{
      collegeId:quiz.quiz.collegeId,organizationId:quiz.quiz.organizationId,
    })){
      let attemptCount:number|null=null;
      try{
        const [row]=await getDb().select({count:sql<number>`count(*)::int`})
          .from(quizAttempts).where(eq(quizAttempts.quizId,quizId));
        attemptCount=row?.count??0;
      }catch{ /* fail closed to metadata-only editing */ }
      editPolicy={
        attemptCount,
        metadataOnly:attemptCount===null||attemptCount>0||quiz.quiz.status!=="DRAFT",
        warning:attemptCount===null
          ?"Could not verify submissions. Only title/description editing is available right now."
          :attemptCount>0
           ?"This quiz already has learner submissions. Questions, deadline, attempt limit and randomization are locked after "+
             attemptCount+" submitted attempt"+(attemptCount===1?"":"s")+". You can still correct the title or description."
           :null,
      };
    }
    return NextResponse.json({ quiz,editPolicy });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const GET = route(
  { auth: "user", permission: "service-enforced", repeatableQuery: ["includeCorrectAnswers"] },
  ({ request, params }) => handleGET(request as Parameters<typeof handleGET>[0], { params: Promise.resolve(params) } as Parameters<typeof handleGET>[1]),
);

async function handlePATCH(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context =
      await getCurrentRequestContext();
    const { quizId } = await params;
    const body = await request.json();
    // Legacy PATCH also carried transition and result-publication commands.
    // Every command still passes through its scoped service validation.
    const quiz = body && typeof body==="object" && "action" in body
      ? await transitionCourseQuiz(context,quizId,body)
      : body && typeof body==="object" && "published" in body
       ? await setCourseQuizResults(context,quizId,body)
       : await updateCourseQuiz(context,quizId,body);

    return NextResponse.json({ quiz });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const PATCH = route(
  { auth: "user", permission: "service-enforced", repeatableQuery: ["includeCorrectAnswers"] },
  ({ request, params }) => handlePATCH(request as Parameters<typeof handlePATCH>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePATCH>[1]),
);

/** Old clients used PUT for the same validated metadata update. */
async function handlePUT(request:Request,context:RouteContext){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 return PATCH(request,context);
}
export const PUT = route(
  { auth: "user", permission: "service-enforced", repeatableQuery: ["includeCorrectAnswers"] },
  ({ request, params }) => handlePUT(request as Parameters<typeof handlePUT>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePUT>[1]),
);

/** DELETE archives and retains every attempt; it never destroys learner data. */
async function handleDELETE(request:Request,{params}:RouteContext){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  const {quizId}=await params;
  const quiz=await transitionCourseQuiz(context,quizId,{action:"ARCHIVE",confirmed:true});
  return NextResponse.json({quiz});
 }catch(error){return apiErrorResponse(error);}
}
export const DELETE = route(
  { auth: "user", permission: "service-enforced", repeatableQuery: ["includeCorrectAnswers"] },
  ({ request, params }) => handleDELETE(request as Parameters<typeof handleDELETE>[0], { params: Promise.resolve(params) } as Parameters<typeof handleDELETE>[1]),
);
