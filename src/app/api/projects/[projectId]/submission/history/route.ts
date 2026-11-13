import { route } from "@/security/route";

import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getLegacyProjectDeliveryHistory} from "@/modules/projects/project-legacy-delivery-history-service";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {projectId}=params;
    const raw=new URL(request.url).searchParams.get("limit");
    const limit=raw&&/^[0-9]{1,3}$/.test(raw)?Number(raw):100;
    const history=await getLegacyProjectDeliveryHistory(
    __ctx,projectId,limit);
    return privateJson(history);
  },
);
