import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { PlacementBatchError } from "@/modules/placements/batch-participation-service";
import { TpoBatchInvitationError } from "@/modules/placements/tpo-batch-invitation-model";
import { inviteTpoBatch, saveTpoBatchRegistrationDeadline } from "@/modules/placements/tpo-batch-invitation-service";
export const runtime = "nodejs";
type Params = { params: Promise<{ batchId: string }> };

export async function POST(request: Request, { params }: Params) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const { batchId } = await params;
    const result = await inviteTpoBatch(
      await getCurrentRequestContext(), batchId, await request.json(),
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
}

export async function PATCH(request: Request, { params }: Params) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const { batchId } = await params;
    const result = await saveTpoBatchRegistrationDeadline(
      await getCurrentRequestContext(), batchId, await request.json(),
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
}
