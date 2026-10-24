import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api-error";
import { TpoCrmError } from "@/modules/placements/tpo-crm-service";
import { TpoCompanyMemoryError } from "@/modules/placements/tpo-company-memory-service";

export function tpoCrmApiErrorResponse(error: unknown) {
  if (error instanceof TpoCompanyMemoryError) {
    return NextResponse.json(
      { error: error.code },
      { status: error.code === "TPO_COMPANY_NOT_FOUND" ? 404 : 422 },
    );
  }
  if (error instanceof TpoCrmError) {
    const notFound =
      error.code === "TPO_CRM_LEAD_NOT_FOUND" ||
      error.code === "TPO_CRM_FOLLOWUP_NOT_FOUND";
    return NextResponse.json(
      { error: error.code },
      { status: notFound ? 404 : (error.code === "TPO_CRM_CONTACT_REQUIRED" || error.code === "TPO_CRM_INVALID_DUE_AT") ? 422 : 409 },
    );
  }
  return apiErrorResponse(error);
}
