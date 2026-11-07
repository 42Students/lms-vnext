import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  getCollegeCompanyHistory,
  updateCollegeCompanyPrivateDetails,
} from "@/modules/placements/college-company-history-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { relationshipId } = params;
    const history = await getCollegeCompanyHistory(context, relationshipId);
    return NextResponse.json(history);
  },
);

export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { relationshipId } = params;
    const body: unknown = await boundedRequestJson(request);
    const result = await updateCollegeCompanyPrivateDetails(
      context, relationshipId, body,
    );
    return NextResponse.json(result);
  },
);
