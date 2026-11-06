import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import {searchOrganizationPlacementApplications,getOrganizationApplicationStats} from "@/modules/placements/organization-application-search-service";

export const runtime="nodejs";
export const dynamic="force-dynamic";

/** Exact organization is the one selected by Super Admin's college switcher. */
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const query=Object.fromEntries(new URL(request.url).searchParams.entries());
    const data=await searchOrganizationPlacementApplications(__ctx,query);
    return NextResponse.json(data,{headers:{"Cache-Control":"private, no-store"}});
  },
);

/** Compatibility for legacy refresh: no cache exists to invalidate.
 * This still authenticates and verifies the current organization scope.
 */
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const _p=await readBoundedJsonRequest(request,8192);
    if(!_p.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    const input:unknown=_p.value;
    const stats=await getOrganizationApplicationStats(__ctx,input);
    return NextResponse.json({...stats,refreshed:false,
   reason:"Applications are read directly from the database; no refresh is required."},
   {headers:{"Cache-Control":"private, no-store"}});
  },
);
