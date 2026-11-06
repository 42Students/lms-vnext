import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {editGlobalCompany} from "@/modules/placements/super-admin-company-edit-service";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handlePATCH(request:Request) {
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try {
  const parsed=await readBoundedJsonRequest(request,8192);
  if(!parsed.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  const context=await getCurrentRequestContext();
  return NextResponse.json(await editGlobalCompany(context,parsed.value),
   {headers:{"Cache-Control":"private, no-store"}});
 } catch(e){return apiErrorResponse(e);}
}
export const PATCH = secured(handlePATCH, { csrf: "enforce" });
