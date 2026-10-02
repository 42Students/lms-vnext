import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import {
  createCollege,
  listColleges,
} from "@/modules/colleges/service";
import { apiErrorResponse } from "@/lib/api-error";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const organizationId =
      new URL(request.url).searchParams.get("organizationId");

    const items = await listColleges(context, organizationId);
    return NextResponse.json({ colleges: items });
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

    const college = await createCollege(
      context,
      body as {
        organizationId: string;
        name: string;
        code: string;
      },
    );

    return NextResponse.json(
      { college },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
