import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { createPlacementRequest,listOwnPlacementRequests } from "@/modules/placements/request-service";

export const runtime = "nodejs";

/** Compatibility for old GET /learner/requests/mine and new unified history.
 * Every row comes from the currently authenticated learner membership. */
export async function GET(request:Request){
 try{
  const u=new URL(request.url);
  if([...u.searchParams.keys()].some(key=>!["mine","page","pageSize"].includes(key))||
     (u.searchParams.has("mine")&&u.searchParams.get("mine")!=="1"))
   return NextResponse.json({error:"INVALID_QUERY"},{status:400});
  const pageRaw=u.searchParams.get("page")??"1";
  const sizeRaw=u.searchParams.get("pageSize")??"25";
  if(!/^[1-9][0-9]{0,4}$/.test(pageRaw)||!["10","25","50","100"].includes(sizeRaw))
   return NextResponse.json({error:"INVALID_PAGINATION"},{status:400});
  const rows=await listOwnPlacementRequests(await getCurrentRequestContext());
  const page=Math.min(Number(pageRaw),Math.max(1,Math.ceil(rows.length/Number(sizeRaw))));
  const items=rows.slice((page-1)*Number(sizeRaw),page*Number(sizeRaw));
  return NextResponse.json({status:"success",message:"Your placement requests",
   items,data:items,total:rows.length,page,pageSize:Number(sizeRaw),
   nextPage:page*Number(sizeRaw)<rows.length?page+1:null,
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }
  try {
    const context =
      await getCurrentRequestContext();
    const placementRequest =
      await createPlacementRequest(
        context,
        await request.json(),
      );
    return NextResponse.json(
      placementRequest,
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
