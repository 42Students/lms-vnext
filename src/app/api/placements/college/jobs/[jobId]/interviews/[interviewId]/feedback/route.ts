import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";

import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {getCollegeInterviewFeedback,recordCollegeInterviewFeedback} from "@/modules/placements/college-interview-feedback-service";

import { privateJson } from "@/security/responses";
export const runtime="nodejs";
type Context={params:Promise<{jobId:string;interviewId:string}>};
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId,interviewId}=params;
    const data=await getCollegeInterviewFeedback(__ctx,jobId,interviewId);
    return privateJson(data);
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId,interviewId}=params;
    const data=await recordCollegeInterviewFeedback(__ctx,
   jobId,interviewId,await boundedRequestJson(request));
    return privateJson(data, { status: 201 });
  },
);
