import { boundedRequestJson } from "@/lib/request-body";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  PrivateDiversityPolicyError, readPrivateTpoDiversityOutreach, savePrivateTpoDiversityOutreach,
  reviewPrivateTpoDiversityOutreach,
} from "@/modules/placements/tpo-diversity-outreach-service";
import { route } from "@/security/route";

import { CACHE } from "@/security/responses";
export const runtime = "nodejs";
const noStore = { "Cache-Control": CACHE.PRIVATE };
type Params = { params: Promise<{ jobId: string }> };
async function handleGET(_request: Request, { params }: Params) {
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
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handleGET(request as Parameters<typeof handleGET>[0], { params: Promise.resolve(params) } as Parameters<typeof handleGET>[1]),
);
async function handlePOST(request: Request, { params }: Params) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403, headers: noStore });
  try {
    const input: unknown = await boundedRequestJson(request);
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
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
