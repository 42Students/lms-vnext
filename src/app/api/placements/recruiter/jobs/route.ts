import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listOwnRecruiterPlacementJobs } from "@/modules/placements/recruiter-service";
import { secured } from "@/security/secure-handler";

export const runtime = "nodejs";

async function handleGET() {
  try {
    const context =
      await getCurrentRequestContext();
    const jobs =
      await listOwnRecruiterPlacementJobs(
        context,
      );
    return NextResponse.json({ jobs },{
      headers:{"Cache-Control":"private, no-store"},
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const GET = secured(handleGET);
