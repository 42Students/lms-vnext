import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getPersonMembershipDetailWithRuntime } from "@/modules/people/runtime";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { membershipId } = params;
    const person = await getPersonMembershipDetailWithRuntime(
      context,
      membershipId,
    );
    return NextResponse.json({ person });
  },
);
