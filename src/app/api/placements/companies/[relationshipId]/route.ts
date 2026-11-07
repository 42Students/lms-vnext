import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  archivePlacementCompanyRelationship,
  updatePlacementCompanyRelationship,
} from "@/modules/placements/company-service";

export const runtime = "nodejs";

export const PATCH = route(
  { auth: "user", permission: "placements.manage" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { relationshipId } = params;
    const body = await boundedRequestJson(request);
    const result =
      await updatePlacementCompanyRelationship(
        context,
        relationshipId,
        body,
      );
    return NextResponse.json(result);
  },
);

export const DELETE = route(
  { auth: "user", permission: "placements.manage" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { relationshipId } = params;
    const result =
      await archivePlacementCompanyRelationship(
        context,
        relationshipId,
      );
    return NextResponse.json(result);
  },
);
