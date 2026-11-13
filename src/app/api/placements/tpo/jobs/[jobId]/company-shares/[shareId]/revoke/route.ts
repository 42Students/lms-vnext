import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {CompanyShareError,revokeTpoCompanyApplicantShare} from "@/modules/placements/company-share/manage-service";
import { CACHE, privateJson } from "@/security/responses";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const {jobId,shareId}=params;
const data=await revokeTpoCompanyApplicantShare(__ctx,{jobId,shareId});
return privateJson(data);
} catch(error){
  if(error instanceof CompanyShareError)return NextResponse.json({error:error.code},{
   status:error.code==="MIGRATION_PENDING"?503:404,
   headers:{"Cache-Control":CACHE.PRIVATE},
  });
  return apiErrorResponse(error);
 }
  },
);
