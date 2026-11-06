import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  archivePlacementCompanyRelationship,
  updatePlacementCompanyRelationship,
} from "@/modules/placements/company-service";

export const runtime = "nodejs";

export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { relationshipId } = params;
    const body = await request.json();
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
  { auth: "user", permission: "service-enforced" },
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
