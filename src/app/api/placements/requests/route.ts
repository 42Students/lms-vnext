import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { createPlacementRequest,listOwnPlacementRequests } from "@/modules/placements/request-service";

import { CACHE } from "@/security/responses";
export const runtime = "nodejs";

/** Compatibility for old GET /learner/requests/mine and new unified history.
 * Every row comes from the currently authenticated learner membership. */
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const u=new URL(request.url);
    if([...u.searchParams.keys()].some(key=>!["mine","page","pageSize"].includes(key))||
     (u.searchParams.has("mine")&&u.searchParams.get("mine")!=="1"))
   return NextResponse.json({error:"INVALID_QUERY"},{status:400});
    const pageRaw=u.searchParams.get("page")??"1";
    const sizeRaw=u.searchParams.get("pageSize")??"25";
    if(!/^[1-9][0-9]{0,4}$/.test(pageRaw)||!["10","25","50","100"].includes(sizeRaw))
   return NextResponse.json({error:"INVALID_PAGINATION"},{status:400});
    const rows=await listOwnPlacementRequests(__ctx);
    const page=Math.min(Number(pageRaw),Math.max(1,Math.ceil(rows.length/Number(sizeRaw))));
    const items=rows.slice((page-1)*Number(sizeRaw),page*Number(sizeRaw));
    return NextResponse.json({status:"success",message:"Your placement requests",
   items,data:items,total:rows.length,page,pageSize:Number(sizeRaw),
   nextPage:page*Number(sizeRaw)<rows.length?page+1:null,
  },{headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    const placementRequest =
      await createPlacementRequest(
        context,
        await boundedRequestJson(request),
      );
    return NextResponse.json(
      placementRequest,
      { status: 201 },
    );
  },
);
