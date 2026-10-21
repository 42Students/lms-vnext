import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {bulkSuperAdminCourseVisibility} from "@/modules/courses/super-admin-course-bulk-visibility";

export const runtime="nodejs";

/** College Admin bulk visibility adapter. The shared service resolves and
 * verifies the actor's live college, applies course and published-content
 * visibility with per-course failures, and never accepts a client college ID.
 * This route is not an escalation into the Super Admin workspace. */
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  const report=await bulkSuperAdminCourseVisibility(context,await request.json());
  return NextResponse.json(report,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  return apiErrorResponse(error);
 }
}
