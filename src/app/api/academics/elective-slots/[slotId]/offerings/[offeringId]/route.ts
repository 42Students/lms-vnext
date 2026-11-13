import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { updateCollegeElectiveOffering, archiveCollegeElectiveOffering } from "@/modules/electives/service";
export const runtime = "nodejs";
export const PATCH = route(
  { auth: "user", permission: "academics.manage" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { slotId, offeringId } = params;
    const input = await boundedRequestJson(request);
    const offering = await updateCollegeElectiveOffering(context, slotId, offeringId, input);
    return NextResponse.json({ offering });
  },
);

export const DELETE = route(
  { auth: "user", permission: "academics.manage" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { slotId, offeringId } = params;
    const { expectedVersion } = await boundedRequestJson(request);
    const offering = await archiveCollegeElectiveOffering(context, slotId, offeringId, expectedVersion);
    return NextResponse.json({ offering });
  },
);
