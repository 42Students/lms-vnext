import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import {
  createDepartment,
  listDepartments,
} from "@/modules/departments/service";
import { apiErrorResponse } from "@/lib/api-error";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const collegeId =
      new URL(request.url).searchParams.get("collegeId") ?? "";

    const items = await listDepartments(context, collegeId);
    return NextResponse.json({ departments: items });
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

    const department = await createDepartment(
      context,
      body as {
        collegeId: string;
        name: string;
      },
    );

    return NextResponse.json(
      { department },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
