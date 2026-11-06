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
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const { batchId } = params;
    const result = await inviteTpoBatch(
      __ctx, batchId, await request.json(),
    );
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  },
);

export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const { batchId } = params;
    const result = await saveTpoBatchRegistrationDeadline(
      __ctx, batchId, await request.json(),
    );
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  },
);
