import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import { getTpoCompanyMemory } from "@/modules/placements/tpo-company-memory-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (process.env.DB09_TPO_API_READY !== "DB09_VERIFIED") {
    return NextResponse.json({ error: "DB09_MIGRATIONS_PENDING" }, { status: 503 });
  }
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
