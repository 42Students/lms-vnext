import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { changeTpoRules } from "@/modules/placements/tpo-season-write-service";
export const runtime = "nodejs";
export const POST = route(
  { auth: "user", permission: "placements.manage" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const rules = await changeTpoRules(context, await request.json());
    return NextResponse.json({ rules });
  },
);
