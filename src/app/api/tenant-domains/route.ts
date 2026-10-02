import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
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
    const domain = await createTenantDomainWithRuntime(context, body);

    return NextResponse.json({ domain }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
