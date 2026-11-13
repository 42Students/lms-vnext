import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {searchOrganizationPlacementJobs} from "@/modules/placements/organization-job-search-service";

import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const dynamic="force-dynamic";

/** Read-only Super Admin job search. The requested organization is always
 * checked against the selected tenant (or an explicitly unscoped platform
 * admin), and neither legacy numeric IDs nor slug text grant write access.
 */
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const url=new URL(request.url);
    const query:Record<string,string>={};
    for(const [key,value] of url.searchParams){
   if(Object.hasOwn(query,key))
    return NextResponse.json({error:"INVALID_SEARCH_FILTERS"},{status:400});
   query[key]=value;
  }
    const result=await searchOrganizationPlacementJobs(context,query);
    return privateJson(result);
  },
);
