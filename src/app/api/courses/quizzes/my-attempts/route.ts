import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listOwnQuizAttemptHistoryIndex} from "@/modules/courses/quiz-attempt-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
 try{
  const history=await listOwnQuizAttemptHistoryIndex(await getCurrentRequestContext());
  return NextResponse.json(history,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
