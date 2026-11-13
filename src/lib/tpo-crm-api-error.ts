import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api-error";
import { TpoCrmError } from "@/modules/placements/tpo-crm-service";
import { statusForCode } from "@/lib/error-registry";
import { TpoCompanyMemoryError } from "@/modules/placements/tpo-company-memory-service";

export function tpoCrmApiErrorResponse(error: unknown) {
  if (error instanceof TpoCompanyMemoryError) {
    return NextResponse.json(
      { error: error.code },
      { status: statusForCode("tpoCompanyMemory", error.code) },
    );
  }
  if (error instanceof TpoCrmError) {
    return NextResponse.json(
      { error: error.code },
      { status: statusForCode("tpoCrm", error.code) },
    );
  }
  return apiErrorResponse(error);
}
