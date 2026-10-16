import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { updateCollegeElectiveOffering, archiveCollegeElectiveOffering } from "@/modules/electives/service";
export const runtime = "nodejs";
type Params = { params: Promise<{ slotId: string; offeringId: string }> };
export async function PATCH(request: Request, { params }: Params) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const context = await getCurrentRequestContext();
    const { slotId, offeringId } = await params;
    const input = await request.json();
    const offering = await updateCollegeElectiveOffering(context, slotId, offeringId, input);
    return NextResponse.json({ offering });
  } catch (error) { return apiErrorResponse(error); }
}

export async function DELETE(request: Request, { params }: Params) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const context = await getCurrentRequestContext();
    const { slotId, offeringId } = await params;
    const { expectedVersion } = await request.json();
    const offering = await archiveCollegeElectiveOffering(context, slotId, offeringId, expectedVersion);
    return NextResponse.json({ offering });
  } catch (error) { return apiErrorResponse(error); }
}
