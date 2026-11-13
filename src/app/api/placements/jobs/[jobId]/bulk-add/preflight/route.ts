import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";

import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {previewBulkDriveAdd} from "@/modules/placements/bulk-drive-service";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";export const dynamic="force-dynamic";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId}=params;
    const result=await previewBulkDriveAdd(__ctx,jobId,await boundedRequestJson(request, 8 * 1024 * 1024));
    return privateJson(result);
  },
);
