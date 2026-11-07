import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {deleteTpoUnpublishedDraft} from "@/modules/placements/tpo-delete-draft-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId}=params;
    const result=await deleteTpoUnpublishedDraft(__ctx,
   jobId,await boundedRequestJson(request));
    return NextResponse.json(result,{status:result.archived?200:409});
  },
);
