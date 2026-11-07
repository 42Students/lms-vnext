import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { PlacementBatchError } from "@/modules/placements/batch-participation-service";
import { TpoBatchInvitationError } from "@/modules/placements/tpo-batch-invitation-model";
import { inviteTpoBatch, saveTpoBatchRegistrationDeadline } from "@/modules/placements/tpo-batch-invitation-service";
export const runtime = "nodejs";
type Params = { params: Promise<{ batchId: string }> };

export const POST = route(
  { auth: "user", permission: "placements.manage" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const { batchId } = params;
const result = await inviteTpoBatch(
      __ctx, batchId, await request.json(),
    );
return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
} catch (error) {
    if (error instanceof PlacementBatchError)
      return NextResponse.json({ error: error.code }, {
        status: error.code === "DB08_ACTION_STALE" ? 409 : 422,
      });
    if (error instanceof TpoBatchInvitationError)
      return NextResponse.json({ error: error.code }, { status: 422 });
    return apiErrorResponse(error);
  }
  },
);

export const PATCH = route(
  { auth: "user", permission: "placements.manage" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const { batchId } = params;
const result = await saveTpoBatchRegistrationDeadline(
      __ctx, batchId, await request.json(),
    );
return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
} catch (error) {
    if (error instanceof PlacementBatchError)
      return NextResponse.json({ error: error.code }, {
        status: error.code === "DB08_ACTION_STALE" ? 409 : 422,
      });
    if (error instanceof TpoBatchInvitationError)
      return NextResponse.json({ error: error.code }, { status: 422 });
    return apiErrorResponse(error);
  }
  },
);
