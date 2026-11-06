import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readBoundedJsonRequest } from "@/lib/bounded-json-request";
import { previewSuperAdminBulkDrives, updateSuperAdminBulkDrives }
  from "@/modules/placements/super-admin-bulk-drive-service";
import { secured } from "@/security/secure-handler";

export const runtime = "nodejs";

async function handlePOST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({error: "INVALID_ORIGIN"}, {status: 403});
  }
  try {
    const _p = await readBoundedJsonRequest(request, 16384);
    if (!_p.ok) return NextResponse.json({error: "INVALID_REQUEST"}, {status: 400});
    const context = await getCurrentRequestContext();
    const raw: unknown = _p.value;
    const body = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
    const result = body["confirmStage"] === "PREVIEW"
      ? await previewSuperAdminBulkDrives(context, {action: body["action"], jobIds: body["jobIds"]})
      : await updateSuperAdminBulkDrives(context, {
          action: body["action"], jobIds: body["jobIds"], confirmed: body["confirmed"],
        });
    return NextResponse.json(result, {headers: {"Cache-Control": "private, no-store"}});
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const POST = secured(handlePOST, { csrf: "enforce" });
