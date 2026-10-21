import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { CollegeElectiveSlotMutationError, createCollegeElectiveSlot, listCollegeElectiveSlotOptions } from "@/modules/electives/college-slot-mutation-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const body: unknown = await request.json();
    const result = await createCollegeElectiveSlot(context, body);
    // Return a complete display view as well as the row; keep the existing
    // {slot} property for clients that refresh after creating the slot.
    const options = await listCollegeElectiveSlotOptions(context);
    const program = options.programs.find(item => item.id === result.programId);
    const period = options.periods.find(item => item.id === result.academicPeriodId);
    return NextResponse.json({
      slot: { ...result, programName: program?.name ?? null,
        academicPeriodName: period?.name ?? null },
      message: "Elective slot created",
    }, { status: 201 });
  } catch (error) {
    if (error instanceof CollegeElectiveSlotMutationError) {
      return NextResponse.json({ error: error.code }, { status: 409 });
    }
    return apiErrorResponse(error);
  }
}
