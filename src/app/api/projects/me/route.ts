import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import {
  listMyProjectInstances,
} from "@/modules/projects/member-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const context = await getCurrentRequestContext();
    const projects =
      await listMyProjectInstances(context);

    return NextResponse.json({ projects });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
