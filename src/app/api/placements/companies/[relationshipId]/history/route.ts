import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getCollegeCompanyHistory } from "@/modules/placements/college-company-history-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ relationshipId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const context = await getCurrentRequestContext();
    const { relationshipId } = await params;
    const history = await getCollegeCompanyHistory(context, relationshipId);
    return NextResponse.json(history);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
