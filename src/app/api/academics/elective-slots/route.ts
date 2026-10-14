import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { CollegeElectiveSlotMutationError, createCollegeElectiveSlot } from "@/modules/electives/college-slot-mutation-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const body: unknown = await request.json();
    const result = await createCollegeElectiveSlot(context, body);
    return NextResponse.json({ slot: result }, { status: 201 });
  } catch (error) {
    if (error instanceof CollegeElectiveSlotMutationError) {
      return NextResponse.json({ error: error.code }, { status: 409 });
    }
    return apiErrorResponse(error);
  }
}
