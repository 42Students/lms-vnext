import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ADMIN_SCOPE_COOKIE_NAME } from "@/auth/admin-scope";
import { isSameOriginRequest } from "@/auth/origin";
import {
  archiveCollege,
  updateCollege,
} from "@/modules/colleges/service";
import { apiErrorResponse } from "@/lib/api-error";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    collegeId: string;
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
    const { collegeId } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "INVALID_REQUEST" },
        { status: 400 },
      );
    }

    const college = await updateCollege(
      context,
      collegeId,
      body as Record<string, unknown>,
    );

    return NextResponse.json({ college });
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
    const context =
      await getCurrentRequestContext();
    const { collegeId } = await params;
    const college = await archiveCollege(
      context,
      collegeId,
    );

    const response =
      NextResponse.json({ college });

    if (
      context.adminScope?.collegeId ===
      college.id
    ) {
      response.cookies.set(
        ADMIN_SCOPE_COOKIE_NAME,
        "",
        {
          httpOnly: true,
          secure:
            process.env.NODE_ENV ===
            "production",
          sameSite: "lax",
          path: "/",
          maxAge: 0,
        },
      );
    }

    return response;
  } catch (error) {
    return apiErrorResponse(error);
  }
}
