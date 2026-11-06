import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {restorePlacementCompanyRelationship} from "@/modules/placements/company-service";
export const runtime="nodejs";
/** COL-placements-15: restoration is a protected mutation, never GET. */
export const POST = route(
  { auth: "user", permission: "placements.manage" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const {relationshipId}=params;
    const result=await restorePlacementCompanyRelationship(context,relationshipId);
    return NextResponse.json(result);
  },
);
