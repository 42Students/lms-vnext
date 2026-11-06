import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoInterviewLegacyStatus} from "@/modules/placements/tpo-interview-legacy-status-service";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId,slotId}=params;
    const state=await getTpoInterviewLegacyStatus(
   __ctx,jobId,slotId);
    return NextResponse.json(state,{headers:{"cache-control":"no-store"}});
  },
);
