import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { isSameOriginRequest } from "@/auth/origin";
import {
  getCollegeCompanyHistory,
  updateCollegeCompanyPrivateDetails,
} from "@/modules/placements/college-company-history-service";

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

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { relationshipId } = await params;
    const body: unknown = await request.json();
    const result = await updateCollegeCompanyPrivateDetails(
      context, relationshipId, body,
    );
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
