import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {getFacultyScheduleReassignOptions,reassignFacultyUpcomingSchedules}
 from "@/modules/people/college-faculty-schedule-reassignment-service";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
type Params={params:Promise<{membershipId:string}>};
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {membershipId}=params;
    return NextResponse.json(await getFacultyScheduleReassignOptions(__ctx,membershipId),
   {headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request: req, context: __actor, params }) => {
    const __ctx = __actor!;
    const {membershipId}=params;
    return NextResponse.json(await reassignFacultyUpcomingSchedules(__ctx,
   membershipId,await boundedRequestJson(req)),{headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
