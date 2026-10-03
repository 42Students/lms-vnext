import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import {
  getProjectInstanceWorkspace,
} from "@/modules/projects/instance-service";

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
    const workspace =
      await getProjectInstanceWorkspace(
        context,
        projectId,
      );

    return NextResponse.json({ workspace });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
