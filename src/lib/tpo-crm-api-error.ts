import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api-error";
import { TpoCrmError } from "@/modules/placements/tpo-crm-service";

export function tpoCrmApiErrorResponse(error: unknown) {
  if (error instanceof TpoCrmError) {
    const notFound =
      error.code === "TPO_CRM_LEAD_NOT_FOUND" ||
      error.code === "TPO_CRM_FOLLOWUP_NOT_FOUND";
    return NextResponse.json(
      { error: error.code },
      { status: notFound ? 404 : 409 },
    );
  }
  return apiErrorResponse(error);
}
