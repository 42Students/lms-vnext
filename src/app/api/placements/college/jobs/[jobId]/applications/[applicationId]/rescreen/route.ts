import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {rescreenCollegeApplication} from "@/modules/placements/college-application-detail-service";
export const runtime="nodejs";
type Ctx={params:Promise<{jobId:string;applicationId:string}>};
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request: req, context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId,applicationId}=params;
    const result=await rescreenCollegeApplication(__ctx,
   jobId,applicationId,await req.json());
    return NextResponse.json({
   ...result,screeningProvider:"PERSISTED_ELIGIBILITY_RULES",
   automatedScoringAvailable:false,
   automatedScoringUnavailableReason:"AUTOMATED_SCORING_MODULE_DISABLED",
  },{headers:{"Cache-Control":"private, no-store"}});
  },
);
