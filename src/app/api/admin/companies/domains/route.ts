import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {changeSuperAdminCompanyDomain} from "@/modules/placements/super-admin-company-identities-service";
import {readBoundedJsonRequest} from "@/lib/request-body";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const parsed=await readBoundedJsonRequest(request,8192);
    if(!parsed.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    return NextResponse.json(await changeSuperAdminCompanyDomain(__ctx,parsed.value));
  },
);
