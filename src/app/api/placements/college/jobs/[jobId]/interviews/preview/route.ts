import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { previewCollegeInterviewConflicts } from "@/modules/placements/college-interview-conflict-preview";

export const runtime="nodejs";
export const dynamic="force-dynamic";
type Props={params:Promise<{jobId:string}>};

/** Same-origin authenticated preview; no cross-tenant records or candidate
 * identifiers from other jobs are accepted, and all results are aggregate.
 */
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId}=params;
    return NextResponse.json(
      await previewCollegeInterviewConflicts(
        __ctx,jobId,await boundedRequestJson(request),
      ),{headers:{"Cache-Control":"private, no-store"}},
    );
  },
);
