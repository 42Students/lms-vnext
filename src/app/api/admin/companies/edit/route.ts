import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {editGlobalCompany} from "@/modules/placements/super-admin-company-edit-service";
import {readBoundedJsonRequest} from "@/lib/request-body";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    const parsed=await readBoundedJsonRequest(request,8192);
    if(!parsed.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    return NextResponse.json(await editGlobalCompany(context,parsed.value),
   {headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
