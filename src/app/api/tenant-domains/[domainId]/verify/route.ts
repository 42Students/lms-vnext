import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { verifyTenantDomainWithRuntime } from "@/modules/tenant-domains/runtime";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    domainId: string;
  }>;
};

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const { domainId } = await params;
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
    },{headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    return apiErrorResponse(error);
  }
}
