import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {submitCollegeInterviewFeedback} from "@/modules/placements/college-round-slot-action-service";
export const runtime="nodejs";
type Props={params:Promise<{jobId:string}>};
export const POST = route(
  { auth: "user", permission: "placements.manage" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId}=params;
    return NextResponse.json(await submitCollegeInterviewFeedback(
   __ctx,jobId,await request.json()),
   {headers:{"Cache-Control":"private, no-store"}});
  },
);
