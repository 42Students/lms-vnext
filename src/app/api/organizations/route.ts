import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import {
  createOrganization,
  listOrganizations,
} from "@/modules/organizations/service";
import { apiErrorResponse } from "@/lib/api-error";
import { secured } from "@/security/secure-handler";

/** Canonical UUID API. Legacy /api/v1/organization/create and /fetch
 * use dedicated response-envelope shims; numeric-ID update/delete URLs are
 * deliberately not translated to unrelated UUID records. */
export const runtime = "nodejs";

async function handleGET() {
  try {
    const context = await getCurrentRequestContext();
    const items = await listOrganizations(context);

    return NextResponse.json({ organizations: items });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const GET = secured(handleGET);

async function handlePOST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "INVALID_REQUEST" },
        { status: 400 },
      );
    }

    const organization = await createOrganization(
      context,
      body as { name: string },
    );

    return NextResponse.json(
      { organization },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const POST = secured(handlePOST);
