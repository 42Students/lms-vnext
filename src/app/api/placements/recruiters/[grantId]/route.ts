import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { revokePlacementRecruiterGrant } from "@/modules/placements/recruiter-service";

export const runtime = "nodejs";

export const DELETE = route(
  { auth: "user", permission: "placements.manage" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { grantId } = params;
    const grant =
      await revokePlacementRecruiterGrant(
        context,
        grantId,
      );
    return NextResponse.json({ grant });
  },
);
