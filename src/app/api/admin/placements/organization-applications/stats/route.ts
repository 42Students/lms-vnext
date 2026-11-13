import { route } from "@/security/route";

import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getOrganizationApplicationStats} from "@/modules/placements/organization-application-search-service";

import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const requested=new URL(request.url).searchParams.get("organizationId");
    const stats=await getOrganizationApplicationStats(__ctx,
   requested?{organizationId:requested}:{});
    return privateJson(stats);
  },
);
