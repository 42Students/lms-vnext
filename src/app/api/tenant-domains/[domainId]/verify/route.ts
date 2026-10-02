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

    return NextResponse.json({ domain });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
