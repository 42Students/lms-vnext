import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {editGlobalCompany} from "@/modules/placements/super-admin-company-edit-service";
export const runtime="nodejs";
export async function PATCH(request:Request) {
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try {
  const context=await getCurrentRequestContext();
  return NextResponse.json(await editGlobalCompany(context,await request.json()),
   {headers:{"Cache-Control":"private, no-store"}});
 } catch(e){return apiErrorResponse(e);}
}
