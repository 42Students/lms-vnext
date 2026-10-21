import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {isSuperAdmin} from "@/modules/identity/context";
import {getCollegeAttendancePolicy} from "@/modules/attendance/policy-service";

export const runtime="nodejs";
export const dynamic="force-dynamic";

/** Read-only compatibility shape for legacy college attendance policy clients.
 * Numeric source IDs cannot be used as vNext tenant authority; resolve scope
 * from the authenticated college or explicit Super Admin college selection.
 * Data comes from attendance_policies (24 hours / 75% absent an override).
 * Do not infer a platform or organization override that is not persisted here.
 */
export async function GET(request:Request){
 try{
  const context=await getCurrentRequestContext();
  const collegeId=context.membership?.collegeId??
   (isSuperAdmin(context)?context.adminScope?.collegeId:null);
  if(!collegeId)return NextResponse.json({error:"COLLEGE_SCOPE_REQUIRED"},{status:403});
  const query=new URL(request.url).searchParams;
  const requested=query.getAll("collegeId");
  if(requested.length>1||requested.some(id=>id!==collegeId))
   return NextResponse.json({error:"INVALID_COLLEGE_SCOPE",
    message:"Choose the authorized college in the workspace switcher. Numeric legacy IDs are not accepted."},{status:400});
  const {policy,hasCollegeOverride}=await getCollegeAttendancePolicy(context,collegeId);
  return NextResponse.json({
   settings:{
    "attendance.correctionWindowHours":policy.correctionWindowHours,
    "attendance.eligibilityThresholdPercent":policy.eligibilityThresholdPercent,
   },
   source:hasCollegeOverride?"COLLEGE":"DEFAULT",
   collegeId,
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
