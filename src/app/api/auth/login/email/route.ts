import { NextResponse } from "next/server";
import { z } from "zod";
import {
  guardLoginRequest,
  loginErrorResponse,
} from "@/modules/auth/http";
import { sendEmailFallbackWithRuntime } from "@/modules/auth/runtime";

export const runtime = "nodejs";

const schema = z.object({ attemptId: z.string().uuid() });

export async function POST(request: Request) {
  const guarded = await guardLoginRequest(
    request,
    schema,
    "login-email",
    6,
  );
  if (!guarded.ok) return guarded.response;

  try {
    const result = await sendEmailFallbackWithRuntime({
      attemptId: guarded.body.attemptId,
      tenantCollegeId: guarded.tenantCollegeId,
    });
    return NextResponse.json(result);
  } catch (error) {
    return loginErrorResponse(error);
  }
}
