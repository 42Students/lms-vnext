import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listOwnRecruiterPlacementJobs } from "@/modules/placements/recruiter-service";

import { CACHE } from "@/security/responses";
export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor }) => {
    const context = __actor!;
    const jobs =
      await listOwnRecruiterPlacementJobs(
        context,
      );
    return NextResponse.json({ jobs },{
      headers:{"Cache-Control":CACHE.PRIVATE},
    });
  },
);
