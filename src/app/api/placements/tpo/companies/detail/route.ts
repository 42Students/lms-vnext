import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import { getTpoCompanyMemory } from "@/modules/placements/tpo-company-memory-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const url = new URL(request.url);
    return NextResponse.json({
      company: await getTpoCompanyMemory(
        context,
        url.searchParams.get("collegeId") ?? "",
        url.searchParams.get("name") ?? "",
      ),
    });
  } catch (error) {
    return tpoCrmApiErrorResponse(error);
  }
}
