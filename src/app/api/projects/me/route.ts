import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import {
  listMyProjectInstances,
} from "@/modules/projects/member-service";
import { secured } from "@/security/secure-handler";

export const runtime = "nodejs";

async function handleGET() {
  try {
    const context = await getCurrentRequestContext();
    const projects =
      await listMyProjectInstances(context);

    return NextResponse.json({ projects });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const GET = secured(handleGET);
