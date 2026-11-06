import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {getCohortCreationPreflight} from "@/modules/projects/cohort-preflight-service";
export const runtime="nodejs";

function resultEnvelope(result:Awaited<ReturnType<typeof getCohortCreationPreflight>>){
 return {...result,createdCount:0,unchangedCount:result.alreadyCovered,
  failedCount:0,partialFailure:false,noEligible:result.toCreate===0,
  committed:false,action:"PREFLIGHT" as const,
  nextAction:result.toCreate>0?"REVIEW_AND_CONFIRM_BULK":"REVIEW_CLASS_OR_TEMPLATE",
  commitHref:"/api/projects/class-team-workspaces"};
}
/** The old API accepted POST for preflight. Preserve POST and legacy client
 * response flags while GET remains available to current vNext forms.
 * This is always read-only: actual creation uses its independent POST route. */
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const raw:unknown=await request.json();
    const result=await getCohortCreationPreflight(__ctx,raw);
    return NextResponse.json(resultEnvelope(result),{headers:{"Cache-Control":"private, no-store"}});
  },
);
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const params=new URL(request.url).searchParams;
    const result=await getCohortCreationPreflight(__ctx,{
   collegeId:params.get("collegeId"),classId:params.get("classId"),templateId:params.get("templateId"),
  });
    return NextResponse.json(resultEnvelope(result),{headers:{"Cache-Control":"private, no-store"}});
  },
);
