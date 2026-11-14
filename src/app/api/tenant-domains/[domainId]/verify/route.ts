import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { verifyTenantDomainWithRuntime } from "@/modules/tenant-domains/runtime";

import { CACHE } from "@/security/responses";
export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "college.manage" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { domainId } = params;
    const domain = await verifyTenantDomainWithRuntime(
      context,
      domainId,
    );
    return NextResponse.json({
      ok:domain.isVerified,
      domain,
      result:domain.lastCheckResult??(domain.isVerified?"VERIFIED":"DNS_LOOKUP_FAILED"),
      message:domain.isVerified
        ? domain.lastCheckResult&&domain.lastCheckResult!=="VERIFIED"
          ? "Previously verified hostname remains active. The latest DNS recheck failed; inspect the TXT challenge and retry."
          : "Domain verified."
        : "DNS verification has not succeeded. Check the TXT record and retry.",
    },{headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
