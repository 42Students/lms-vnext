import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  bulkAddLearnersToDrive,
  listBulkDriveCandidates,
} from "@/modules/placements/bulk-drive-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ jobId: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const context = await getCurrentRequestContext();
    const { jobId } = await params;
    const search = new URL(request.url).searchParams;
    return NextResponse.json(await listBulkDriveCandidates(
      context, jobId, Object.fromEntries(search.entries()),
    ));
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { jobId } = await params;
    return NextResponse.json(await bulkAddLearnersToDrive(
      context, jobId, await request.json(),
    ));
  } catch (error) {
    return apiErrorResponse(error);
  }
}
