import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  PrivateDiversityPolicyError, readPrivateTpoDiversityOutreach, savePrivateTpoDiversityOutreach,
  reviewPrivateTpoDiversityOutreach,
} from "@/modules/placements/tpo-diversity-outreach-service";

export const runtime = "nodejs";
const noStore = { "Cache-Control": "private, no-store" };
type Params = { params: Promise<{ jobId: string }> };
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    return NextResponse.json(await readPrivateTpoDiversityOutreach(
      __ctx, (params).jobId), { headers: noStore });
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const context = __actor!;
    const input: unknown = await request.json();
    const jobId = (params).jobId;
    const action = input && typeof input === "object" && "action" in input
      ? (input as { action?: unknown }).action : null;
    const result = action === "SAVE"
      ? await savePrivateTpoDiversityOutreach(context, jobId, input)
      : await reviewPrivateTpoDiversityOutreach(context, jobId, input);
    return NextResponse.json(result, { headers: noStore });
  },
);
