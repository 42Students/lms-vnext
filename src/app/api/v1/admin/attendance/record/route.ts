import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
/** An old numeric record bookmark cannot identify an authorized vNext
 * membership/event cell. Direct the authenticated operator to the current
 * scoped college grid, where opening the row resolves session and learner.
 */
async function handleGET(){
 try{
  await getCurrentRequestContext();
  return NextResponse.json({
   error:"LEGACY_ATTENDANCE_RECORD_RETIRED",
   replacementPath:"/college/attendance",
   instructions:"Open the class, month and learner in the College Attendance grid.",
  },{status:410,headers:{"Cache-Control":"no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export const GET = secured(handleGET);
