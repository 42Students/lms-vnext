import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getPlacementTpoOperations } from "@/modules/placements/tpo-operations-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const collegeId =
      new URL(request.url).searchParams.get(
        "collegeId",
      ) ?? "";
    const operations =
      await getPlacementTpoOperations(
        context,
        collegeId,
      );
    return NextResponse.json({ operations });
  },
);
