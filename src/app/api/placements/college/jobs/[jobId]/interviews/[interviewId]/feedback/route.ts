import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {getCollegeInterviewFeedback,recordCollegeInterviewFeedback} from "@/modules/placements/college-interview-feedback-service";

export const runtime="nodejs";
type Context={params:Promise<{jobId:string;interviewId:string}>};
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId,interviewId}=params;
    const data=await getCollegeInterviewFeedback(__ctx,jobId,interviewId);
    return NextResponse.json(data,{headers:{"Cache-Control":"private, no-store"}});
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId,interviewId}=params;
    const data=await recordCollegeInterviewFeedback(__ctx,
   jobId,interviewId,await request.json());
    return NextResponse.json(data,{status:201,headers:{"Cache-Control":"private, no-store"}});
  },
);
