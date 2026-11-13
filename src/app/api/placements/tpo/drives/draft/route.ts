import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { createTpoDraftDriveStepOne } from "@/modules/placements/tpo-draft-drive-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "placements.manage" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const result = await createTpoDraftDriveStepOne(context, await boundedRequestJson(request));
    return NextResponse.json(result, { status: 201 });
  },
);
