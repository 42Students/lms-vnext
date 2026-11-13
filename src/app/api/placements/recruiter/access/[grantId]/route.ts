import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { leaveOwnRecruiterCollegeAccess } from "@/modules/placements/recruiter-profile-service";

import { CACHE } from "@/security/responses";
export const runtime = "nodejs";

export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { grantId } = params;
    return NextResponse.json({
      access: await leaveOwnRecruiterCollegeAccess(context, grantId),
    }, { headers: { "Cache-Control": CACHE.PRIVATE } });
  },
);
