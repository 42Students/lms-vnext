import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readBoundedJsonRequest } from "@/lib/request-body";
import { previewSuperAdminBulkDrives, updateSuperAdminBulkDrives }
  from "@/modules/placements/super-admin-bulk-drive-service";

import { privateJson } from "@/security/responses";
export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    const _p = await readBoundedJsonRequest(request, 16384);
    if (!_p.ok) return NextResponse.json({error: "INVALID_REQUEST"}, {status: 400});
    const raw: unknown = _p.value;
    const body = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
    const result = body["confirmStage"] === "PREVIEW"
      ? await previewSuperAdminBulkDrives(context, {action: body["action"], jobIds: body["jobIds"]})
      : await updateSuperAdminBulkDrives(context, {
          action: body["action"], jobIds: body["jobIds"], confirmed: body["confirmed"],
        });
    return privateJson(result);
  },
);
