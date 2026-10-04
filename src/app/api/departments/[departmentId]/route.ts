import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import {
  archiveDepartment,
  renameDepartment,
} from "@/modules/departments/service";
import { apiErrorResponse } from "@/lib/api-error";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    departmentId: string;
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
    const { departmentId } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "INVALID_REQUEST" },
        { status: 400 },
      );
    }

    const department = await renameDepartment(
      context,
      departmentId,
      body as { name: string },
    );

    return NextResponse.json({ department });
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
    const { departmentId } = await params;
    const department =
      await archiveDepartment(
        context,
        departmentId,
      );

    return NextResponse.json({ department });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
