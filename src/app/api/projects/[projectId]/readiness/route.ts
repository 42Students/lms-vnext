import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import {
  getProjectReadiness,
} from "@/modules/projects/readiness-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const context = await getCurrentRequestContext();
    const { projectId } = await params;
    const readiness = await getProjectReadiness(
      context,
      projectId,
    );

    return NextResponse.json({ readiness });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
