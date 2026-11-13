import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  createPlacementRoleOption,
  listPlacementRoleOptions,
} from "@/modules/placements/role-option-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { jobId } = params;
    const roles =
      await listPlacementRoleOptions(
        context,
        jobId,
      );
    return NextResponse.json({ roles });
  },
);

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { jobId } = params;
    const role =
      await createPlacementRoleOption(
        context,
        jobId,
        await boundedRequestJson(request),
      );
    return NextResponse.json(
      { role },
      { status: 201 },
    );
  },
);
