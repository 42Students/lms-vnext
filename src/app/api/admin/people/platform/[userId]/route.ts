import { route } from "@/security/route";

import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {requireRecentDeviceAuthentication} from "@/auth/recent-device-auth";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/request-body";
import {changePlatformAccountStatus} from "@/modules/people/super-admin-platform-account-service";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";
type Params={params:Promise<{userId:string}>};
export const PATCH = route(
  { auth: "user", permission: "system-role.manage" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const {userId}=params;
    const parsed=await readBoundedJsonRequest(request,8192);
    if(!parsed.ok)return privateJson({error:"INVALID_REQUEST"}, { status: 400 });
    await requireRecentDeviceAuthentication(context.user.id);
    const result=await changePlatformAccountStatus(context,userId,parsed.value);
    return privateJson(result);
  },
);
