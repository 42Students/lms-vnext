import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import {
  archiveOrganization,
  renameOrganization,
} from "@/modules/organizations/service";
import { apiErrorResponse } from "@/lib/api-error";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    organizationId: string;
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

  try {
    const context = await getCurrentRequestContext();
    const { organizationId } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "INVALID_REQUEST" },
        { status: 400 },
      );
    }

    const organization = await renameOrganization(
      context,
      organizationId,
      body as { name: string },
    );

    return NextResponse.json({ organization });
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
    const { organizationId } = await params;
    const organization = await archiveOrganization(
      context,
      organizationId,
    );

    return NextResponse.json({ organization });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
