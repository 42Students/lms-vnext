import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { confirmTpoRoundResult } from "@/modules/placements/tpo-confirmed-round-result-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { roundId } = params;
    const result = await confirmTpoRoundResult(context, roundId, await boundedRequestJson(request));
    return NextResponse.json({ result }, { status: 201 });
  },
);
