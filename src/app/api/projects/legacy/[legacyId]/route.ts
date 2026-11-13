import { route } from "@/security/route";

import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {resolveLegacyProjectIdentity} from "@/modules/projects/project-legacy-id-resolver";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {legacyId}=params;
    const query=new URL(request.url).searchParams;
    const data=await resolveLegacyProjectIdentity(
    __ctx,legacyId,{
      ...(query.get("releaseKey") !== null ? {releaseKey:query.get("releaseKey") ?? ""} : {}),
      ...(query.get("sprintKey") !== null ? {sprintKey:query.get("sprintKey") ?? ""} : {}),
      ...(query.get("taskKey") !== null ? {taskKey:query.get("taskKey") ?? ""} : {}),
    });
    return privateJson(data);
  },
);
