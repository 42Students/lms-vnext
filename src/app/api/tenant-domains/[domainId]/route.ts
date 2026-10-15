import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  deleteTenantDomainWithRuntime,
  setPrimaryTenantDomainWithRuntime,
} from "@/modules/tenant-domains/runtime";
import { tenantDomainActionSchema } from "@/modules/tenant-domains/validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    domainId: string;
  }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "INVALID_REQUEST" },
      { status: 400 },
    );
  }

  try {
    tenantDomainActionSchema.parse(body);
    const context = await getCurrentRequestContext();
    const { domainId } = await params;
    const domain = await setPrimaryTenantDomainWithRuntime(
      context,
      domainId,
    );

    return NextResponse.json({ domain });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(
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
    const body: unknown = await request.json().catch(() => ({}));
    const parsed = z.strictObject({ confirmationHost: z.string().max(255).optional() }).parse(body);
    await deleteTenantDomainWithRuntime(context, domainId, parsed.confirmationHost);

    return NextResponse.json({ deleted: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
