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
export async function GET(_request: Request, { params }: Params) {
  try {
    return NextResponse.json(await readPrivateTpoDiversityOutreach(
      await getCurrentRequestContext(), (await params).jobId), { headers: noStore });
  } catch (error) {
    if (error instanceof PrivateDiversityPolicyError)
      return NextResponse.json({ error: error.code }, {
        status: error.code === "DIVERSITY_NOT_READY" ? 503 : 403, headers: noStore,
      });
    return apiErrorResponse(error);
  }
}
export async function POST(request: Request, { params }: Params) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403, headers: noStore });
  try {
    const input: unknown = await request.json();
    const context = await getCurrentRequestContext();
    const jobId = (await params).jobId;
    const action = input && typeof input === "object" && "action" in input
      ? (input as { action?: unknown }).action : null;
    const result = action === "SAVE"
      ? await savePrivateTpoDiversityOutreach(context, jobId, input)
      : await reviewPrivateTpoDiversityOutreach(context, jobId, input);
    return NextResponse.json(result, { headers: noStore });
  } catch (error) {
    if (error instanceof PrivateDiversityPolicyError)
      return NextResponse.json({ error: error.code }, {
        status: error.code === "DIVERSITY_NOT_READY" ? 503 : 403, headers: noStore,
      });
    if (error instanceof ZodError)
      return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400, headers: noStore });
    return apiErrorResponse(error);
  }
}
