import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createSuperAdminHrAccount,
  listSuperAdminHrAccounts,
} from "@/modules/placements/super-admin-hr-service";
import {
  createSuperAdminHrInputSchema,
} from "@/modules/placements/super-admin-hr-validation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context =
      await getCurrentRequestContext();
    const params =
      new URL(request.url).searchParams;

    const result =
      await listSuperAdminHrAccounts(
        context,
        {
          q: params.get("q") ?? undefined,
          status:
            params.get("status") ?? undefined,
          page:
            params.get("page") ?? undefined,
          pageSize:
            params.get("pageSize") ?? undefined,
        },
      );

    return NextResponse.json(result);
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

  try {
    const context =
      await getCurrentRequestContext();

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "INVALID_REQUEST" },
        { status: 400 },
      );
    }

    const input =
      createSuperAdminHrInputSchema.parse(
        body,
      );

    const account =
      await createSuperAdminHrAccount(
        context,
        input,
      );

    return NextResponse.json(
      { account },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
