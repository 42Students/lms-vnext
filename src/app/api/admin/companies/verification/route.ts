import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {setSuperAdminGlobalCompanyVerification} from "@/modules/placements/super-admin-company-verification-service";
import {readBoundedJsonRequest} from "@/lib/request-body";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "admin-scope.select" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    const parsed=await readBoundedJsonRequest(request,8192);
    if(!parsed.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    return NextResponse.json(await setSuperAdminGlobalCompanyVerification(context,parsed.value),
   {headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
