import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import { listTpoCompanies } from "@/modules/placements/tpo-company-memory-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (process.env.DB09_TPO_API_READY !== "DB09_VERIFIED") {
    return NextResponse.json({ error: "DB09_MIGRATIONS_PENDING" }, { status: 503 });
  }
  try {
    const context = await getCurrentRequestContext();
    const collegeId = new URL(request.url).searchParams.get("collegeId") ?? "";
    return NextResponse.json({
      companies: await listTpoCompanies(context, collegeId),
    });
  } catch (error) {
    return tpoCrmApiErrorResponse(error);
  }
}
