import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  grantPlacementRecruiter,
  listPlacementRecruiterGrants,
} from "@/modules/placements/recruiter-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const collegeId =
      new URL(request.url).searchParams.get(
        "collegeId",
      );
    const grants =
      await listPlacementRecruiterGrants(
        context,
        collegeId ?? "",
      );
    return NextResponse.json({ grants });
  },
);

export const POST = route(
  { auth: "user", permission: "placements.manage" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const result =
      await grantPlacementRecruiter(
        context,
        await boundedRequestJson(request),
      );
    return NextResponse.json(result, {
      status: 201,
    });
  },
);
