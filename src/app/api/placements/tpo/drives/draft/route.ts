import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { createTpoDraftDriveStepOne } from "@/modules/placements/tpo-draft-drive-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const result = await createTpoDraftDriveStepOne(context, await request.json());
    return NextResponse.json(result, { status: 201 });
  },
);
