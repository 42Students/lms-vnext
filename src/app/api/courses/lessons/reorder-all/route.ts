import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {reorderCollegeCourseLessons} from "@/modules/courses/lesson-service";

export const runtime="nodejs";
/** Drag-and-drop/table full-order equivalent to legacy PUT /lesson/reorder.
 * Input requires learningPathId, the complete orderedIds list and expected
 * [{id,sequence}]. The service locks current ACTIVE lessons, rejects stale
 * snapshots and writes one COURSES_LESSON_REORDERED activity event. */
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  const moved=await reorderCollegeCourseLessons(context,await request.json());
  return NextResponse.json({moved,mode:"FULL_ORDER" as const});
 }catch(error){return apiErrorResponse(error);}
}
