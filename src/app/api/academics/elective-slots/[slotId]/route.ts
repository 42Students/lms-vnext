import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { CollegeElectiveSlotMutationError, updateCollegeElectiveSlot } from "@/modules/electives/college-slot-mutation-service";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: {
  params: Promise<{ slotId: string }>;
}) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { slotId } = await params;
    const body: unknown = await request.json();
    const result = await updateCollegeElectiveSlot(context, slotId, body);
    return NextResponse.json({ slot: result });
  } catch (error) {
    if (error instanceof CollegeElectiveSlotMutationError) {
      return NextResponse.json({ error: error.code }, {
        status: error.code === "ELECTIVE_SLOT_NOT_FOUND" ? 404 : 409,
      });
    }
    return apiErrorResponse(error);
  }
}
