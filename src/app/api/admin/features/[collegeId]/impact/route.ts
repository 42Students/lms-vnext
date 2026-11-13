import { route } from "@/security/route";

import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {readModuleDisableImpact} from "@/modules/module-access/admin-module-impact-service";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {collegeId}=params;
    const moduleName=new URL(request.url).searchParams.get("module")??"";
    const result=await readModuleDisableImpact(__ctx,collegeId,moduleName);
    return privateJson(result);
  },
);
