import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {ensureTenantDomainVerificationTokenWithRuntime} from "@/modules/tenant-domains/runtime";
import { secured } from "@/security/secure-handler";

export const runtime="nodejs";
type Params={params:Promise<{domainId:string}>};
async function handlePOST(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {domainId}=await params;
  const domain=await ensureTenantDomainVerificationTokenWithRuntime(await getCurrentRequestContext(),domainId);
  return NextResponse.json({domain,verificationRequired:!domain.isVerified},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export const POST = secured(handlePOST, { csrf: "enforce" });
