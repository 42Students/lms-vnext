import { NextResponse } from "next/server";
import { z } from "zod";
import {
  guardLoginRequest,
  loginErrorResponse,
} from "@/modules/auth/http";
import { startLoginWithRuntime } from "@/modules/auth/runtime";

export const runtime = "nodejs";

const schema = z.object({
  channel: z.enum(["PHONE", "EMAIL"]),
  contact: z.string().min(3).max(254),
});

export async function POST(request: Request) {
  const guarded = await guardLoginRequest(
    request,
    schema,
    "login-start",
    10,
  );
  if (!guarded.ok) return guarded.response;

  try {
    const result = await startLoginWithRuntime({
      channel: guarded.body.channel,
      contact: guarded.body.contact,
      tenantCollegeId: guarded.tenantCollegeId,
    });
    return NextResponse.json(result);
  } catch (error) {
    return loginErrorResponse(error);
  }
}
