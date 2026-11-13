import { boundedRequestJson } from "@/lib/request-body";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  deleteTenantDomainWithRuntime,
  editTenantDomainHostWithRuntime,
  setPrimaryTenantDomainWithRuntime,
} from "@/modules/tenant-domains/runtime";
import { tenantDomainActionSchema,tenantDomainHostSchema } from "@/modules/tenant-domains/validation";
import { route } from "@/security/route";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    domainId: string;
  }>;
};

async function handlePATCH(
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
    body = await boundedRequestJson(request);
  } catch {
    return NextResponse.json(
      { error: "INVALID_REQUEST" },
      { status: 400 },
    );
  }

  try {
    const input=z.union([
      tenantDomainActionSchema,
      z.strictObject({
        action:z.literal("EDIT_HOST"),
        host:tenantDomainHostSchema,
        expectedHost:tenantDomainHostSchema,
      }),
    ]).parse(body);
    const context = await getCurrentRequestContext();
    const { domainId } = await params;
    const domain = input.action==="EDIT_HOST"
      ? await editTenantDomainHostWithRuntime(context,domainId,{
          host:input.host,expectedHost:input.expectedHost,
        })
      : await setPrimaryTenantDomainWithRuntime(context,domainId);

    return NextResponse.json({ domain });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePATCH(request as Parameters<typeof handlePATCH>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePATCH>[1]),
);

async function handleDELETE(
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
    const body: unknown = await boundedRequestJson(request).catch(() => ({}));
    const parsed = z.strictObject({ confirmationHost: z.string().max(255).optional() }).parse(body);
    await deleteTenantDomainWithRuntime(context, domainId, parsed.confirmationHost);

    return NextResponse.json({ deleted: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handleDELETE(request as Parameters<typeof handleDELETE>[0], { params: Promise.resolve(params) } as Parameters<typeof handleDELETE>[1]),
);
