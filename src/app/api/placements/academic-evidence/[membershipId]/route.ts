import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  getManagedAcademicEvidence,
  upsertVerifiedAcademicEvidence,
} from "@/modules/placements/eligibility-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { membershipId } = params;
    const evidence =
      await getManagedAcademicEvidence(
        context,
        membershipId,
      );
    return NextResponse.json({ evidence });
  },
);

export const PUT = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { membershipId } = params;
    const evidence =
      await upsertVerifiedAcademicEvidence(
        context,
        membershipId,
        await boundedRequestJson(request),
      );
    return NextResponse.json({ evidence });
  },
);
