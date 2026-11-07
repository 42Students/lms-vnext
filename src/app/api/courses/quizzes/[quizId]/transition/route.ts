import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  transitionCourseQuiz,
  setCourseQuizResults,
} from "@/modules/courses/quiz-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { quizId } = params;
    const body:unknown=await boundedRequestJson(request);
    if(!body||typeof body!=="object"||Array.isArray(body))
      return NextResponse.json({error:"INVALID_QUIZ_TRANSITION",message:"A transition action is required"},{status:400});
    const data=body as Record<string,unknown>;
    if(data["action"]==="PUBLISH_GRADES"||data["action"]==="UNPUBLISH_GRADES"){
      // Quiz availability and result visibility are independent. Reuse the
      // same embargo and history-preserving service as POST /results.
      const published=data["action"]==="PUBLISH_GRADES";
      const quiz=await setCourseQuizResults(context,quizId,{published});
      return NextResponse.json({quiz,status:"OK",message:"OK",data:quiz,
       operation:published?"PUBLISH_GRADES":"UNPUBLISH_GRADES"},
       {headers:{"Cache-Control":"private, no-store"}});
    }
    const action=data["action"]==="DELETE"?"ARCHIVE":data["action"];
    const quiz=await transitionCourseQuiz(context,quizId,{...data,action});
    return NextResponse.json({quiz,status:"OK",message:"OK",data:quiz,
     operation:action,archived:action==="ARCHIVE",
     retainedHistory:action==="ARCHIVE"},
     {headers:{"Cache-Control":"private, no-store"}});
  },
);
