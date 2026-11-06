import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { decideTpoRequest } from "@/modules/placements/tpo-request-decision-service";
export const runtime = "nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { requestId } = params;
    return NextResponse.json({ request: await decideTpoRequest(context, requestId, await request.json()) });
  },
);
