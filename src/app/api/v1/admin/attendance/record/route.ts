import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
/** An old numeric record bookmark cannot identify an authorized vNext
 * membership/event cell. Direct the authenticated operator to the current
 * scoped college grid, where opening the row resolves session and learner.
 */
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor }) => {
    const __ctx = __actor!;
    __ctx;
    return NextResponse.json({
   error:"LEGACY_ATTENDANCE_RECORD_RETIRED",
   replacementPath:"/college/attendance",
   instructions:"Open the class, month and learner in the College Attendance grid.",
  },{status:410,headers:{"Cache-Control":CACHE.NONE}});
  },
);
