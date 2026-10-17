import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { previewSuperAdminBulkDrives, updateSuperAdminBulkDrives }
  from "@/modules/placements/super-admin-bulk-drive-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({error: "INVALID_ORIGIN"}, {status: 403});
  }
  try {
    const context = await getCurrentRequestContext();
    const raw: unknown = await request.json();
    const body = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
    const result = body.confirmStage === "PREVIEW"
      ? await previewSuperAdminBulkDrives(context, {action: body.action, jobIds: body.jobIds})
      : await updateSuperAdminBulkDrives(context, {
          action: body.action, jobIds: body.jobIds, confirmed: body.confirmed,
        });
    return NextResponse.json(result, {headers: {"Cache-Control": "private, no-store"}});
  } catch (error) {
    return apiErrorResponse(error);
  }
}
