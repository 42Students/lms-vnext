import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { leaveOwnRecruiterCollegeAccess } from "@/modules/placements/recruiter-profile-service";

export const runtime = "nodejs";

export const DELETE = route(
  { auth: "user", permission: "placements.recruiter.read" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { grantId } = params;
    return NextResponse.json({
      access: await leaveOwnRecruiterCollegeAccess(context, grantId),
    }, { headers: { "Cache-Control": "private, no-store" } });
  },
);
