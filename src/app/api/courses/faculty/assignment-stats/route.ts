import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {
 getFacultyAssignmentSubmissionStats,
 getFacultyAssignmentSubmissionStatsBulk,
} from "@/modules/courses/faculty-submission-review-service";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
/** Single and max-100 bulk legacy stats, now keyed by authorized UUIDs. */
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const url=new URL(request.url);
    const stats=await getFacultyAssignmentSubmissionStats(context,
    url.searchParams.get("deliveryId")??"",url.searchParams.get("assignmentId")??"");
    return NextResponse.json({status:"success",message:"Submission stats retrieved",stats},
    {headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const stats=await getFacultyAssignmentSubmissionStatsBulk(context,await boundedRequestJson(request));
    return NextResponse.json({status:"success",message:"Submission stats retrieved",stats},
    {headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
