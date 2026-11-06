import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoApplicantLegacyStatus} from "@/modules/placements/tpo-applicant-legacy-status-service";
export const runtime="nodejs";
/** GET has no side effects and never grants tenant access by raw applicant ID. */
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId,applicationId}=params;
    const status=await getTpoApplicantLegacyStatus(
   __ctx,{jobId,applicationId});
    return NextResponse.json(status,{headers:{"cache-control":"no-store"}});
  },
);
