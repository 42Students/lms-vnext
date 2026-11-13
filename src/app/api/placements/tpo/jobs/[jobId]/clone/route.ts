import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";

import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {cloneTpoDrive} from "@/modules/placements/tpo-drive-clone-service";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";export const dynamic="force-dynamic";
type Props={params:Promise<{jobId:string}>};
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId}=params;
    const copied=await cloneTpoDrive(__ctx,jobId,await boundedRequestJson(request));
    return privateJson(copied, { status: 201 });
  },
);
