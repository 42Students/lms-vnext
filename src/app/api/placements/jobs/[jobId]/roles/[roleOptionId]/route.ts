import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  archivePlacementRoleOption,
  updatePlacementRoleOption,
} from "@/modules/placements/role-option-service";

export const runtime = "nodejs";

export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { jobId, roleOptionId } =
      params;
    const role =
      await updatePlacementRoleOption(
        context,
        jobId,
        roleOptionId,
        await request.json(),
      );
    return NextResponse.json({ role });
  },
);

export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { jobId, roleOptionId } =
      params;
    const role =
      await archivePlacementRoleOption(
        context,
        jobId,
        roleOptionId,
      );
    return NextResponse.json({ role });
  },
);
