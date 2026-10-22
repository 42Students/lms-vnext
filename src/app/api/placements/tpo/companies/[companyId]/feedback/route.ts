import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { createTpoCompanyFeedback } from "@/modules/placements/tpo-company-feedback-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ companyId: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  if (process.env["DB09_TPO_API_READY"] !== "DB09_VERIFIED") {
    return NextResponse.json({ error: "DB09_MIGRATIONS_PENDING" }, { status: 503 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { companyId } = await params;
    const created = await createTpoCompanyFeedback(context, companyId, await request.json());
    if (!created) {
      return NextResponse.json({ error: "COMPANY_CONTACT_NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
