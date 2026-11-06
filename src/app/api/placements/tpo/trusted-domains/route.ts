import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readTpoSettingsBody,TpoCommunicationBodyError} from "@/modules/placements/tpo-communication-request-model";
import {changeTpoTrustedDomain,TpoTrustedDomainError} from "@/modules/placements/tpo-trusted-domains-write-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    try {
return NextResponse.json(await changeTpoTrustedDomain(__ctx,await readTpoSettingsBody(request)),
    {headers:{"Cache-Control":"private, no-store"}});
} catch(error){
  if(error instanceof TpoCommunicationBodyError)return NextResponse.json({error:"INVALID_REQUEST"},{
   status:error.code==="BODY_TOO_LARGE"?413:400,headers:{"Cache-Control":"private, no-store"},
  });
  if(error instanceof TpoTrustedDomainError)return NextResponse.json({error:error.code},
   {status:error.code==="TRUST_STORAGE_PENDING"?503:409});
  return apiErrorResponse(error);
 }
  },
);
