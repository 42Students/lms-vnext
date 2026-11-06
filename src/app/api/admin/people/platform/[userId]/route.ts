import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {requireRecentDeviceAuthentication} from "@/auth/recent-device-auth";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import {changePlatformAccountStatus} from "@/modules/people/super-admin-platform-account-service";
export const runtime="nodejs";
type Params={params:Promise<{userId:string}>};
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const {userId}=params;
    const parsed=await readBoundedJsonRequest(request,8192);
    if(!parsed.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400,headers:{"Cache-Control":"private, no-store"}});
    await requireRecentDeviceAuthentication(context.user.id);
    const result=await changePlatformAccountStatus(context,userId,parsed.value);
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  },
);
