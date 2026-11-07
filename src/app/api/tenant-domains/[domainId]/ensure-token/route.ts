import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {ensureTenantDomainVerificationTokenWithRuntime} from "@/modules/tenant-domains/runtime";

export const runtime="nodejs";
type Params={params:Promise<{domainId:string}>};
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {domainId}=params;
    const domain=await ensureTenantDomainVerificationTokenWithRuntime(__ctx,domainId);
    return NextResponse.json({domain,verificationRequired:!domain.isVerified},
   {headers:{"Cache-Control":"private, no-store"}});
  },
);
