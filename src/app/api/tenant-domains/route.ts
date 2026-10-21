import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {createTenantDomainInputSchema,tenantDomainPrimaryNextStep} from "@/modules/tenant-domains/validation";
import {
  createTenantDomainWithRuntime,
  listTenantDomainsWithRuntime,
} from "@/modules/tenant-domains/runtime";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const collegeId =
      new URL(request.url).searchParams.get("collegeId") ?? "";
    const domains = await listTenantDomainsWithRuntime(
      context,
      collegeId,
    );

    return NextResponse.json({ domains });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
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
    const context = await getCurrentRequestContext();
    const intent=createTenantDomainInputSchema.parse(body);
    const domain=await createTenantDomainWithRuntime(context,intent);
    return NextResponse.json({domain,compatibilityStatus:"CREATED",
      nextStep:tenantDomainPrimaryNextStep({isPrimary:intent.isPrimary,domainId:domain.id,verified:domain.isVerified}),
      message:intent.isPrimary?"Domain added. Verify DNS before making it primary.":"Domain added.",
    },{status:201});
  } catch (error) {
    return apiErrorResponse(error);
  }
}
