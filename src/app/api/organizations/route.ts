import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import {
  createOrganization,
  listOrganizations,
} from "@/modules/organizations/service";
import { apiErrorResponse } from "@/lib/api-error";

/** Canonical UUID API. Legacy /api/v1/organization/create and /fetch
 * use dedicated response-envelope shims; numeric-ID update/delete URLs are
 * deliberately not translated to unrelated UUID records. */
export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor }) => {
    const context = actor!;
    const items = await listOrganizations(context);
    return NextResponse.json({ organizations: items });
  },
);

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
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
  },
);
