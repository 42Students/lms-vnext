import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getLearnerAssessmentOverview} from "@/modules/courses/learner-assessment-service";
import {learnerDueSoonNotices} from "@/modules/courses/learner-assignment-due-notice-model";
import {apiErrorResponse} from "@/lib/api-error";
export const runtime="nodejs";
/** Learner-only live reminder read; no externally scheduled delivery is claimed. */
export async function GET(){
 try{
  const overview=await getLearnerAssessmentOverview(await getCurrentRequestContext());
  const notices=learnerDueSoonNotices(overview.assignments,new Date(overview.snapshotNowMs));
  return NextResponse.json({notices},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return apiErrorResponse(e);}
}
