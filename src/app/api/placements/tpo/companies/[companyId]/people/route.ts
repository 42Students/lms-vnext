import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { saveTpoCompanyPerson, TpoCompanyPersonStale } from "@/modules/placements/tpo-company-person-service";
import { TpoCrmError } from "@/modules/placements/tpo-crm-service";

export const runtime = "nodejs";
type Context = { params: Promise<{ companyId: string }> };

export async function POST(request: Request, { params }: Context) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const { companyId } = await params;
    const context = await getCurrentRequestContext();
    const result = await saveTpoCompanyPerson(context, companyId, await request.json());
    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof TpoCompanyPersonStale) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof TpoCrmError) {
      return NextResponse.json({ error: error.code }, {
        status: error.code === "TPO_CRM_LEAD_DUPLICATE" ? 409 : 404,
      });
    }
    return apiErrorResponse(error);
  }
}
