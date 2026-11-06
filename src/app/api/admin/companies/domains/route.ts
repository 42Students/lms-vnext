import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {changeSuperAdminCompanyDomain} from "@/modules/placements/super-admin-company-identities-service";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const parsed=await readBoundedJsonRequest(request,8192);
  if(!parsed.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  return NextResponse.json(await changeSuperAdminCompanyDomain(await getCurrentRequestContext(),parsed.value));
 }catch(error){return apiErrorResponse(error);}
}
export const POST = secured(handlePOST, { csrf: "enforce" });
