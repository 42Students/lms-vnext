import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { reviewTpoApplicant } from "@/modules/placements/tpo-applicant-review-service";
export const runtime = "nodejs";
export async function POST(request: Request, {params}: {
  params: Promise<{ jobId: string; applicationId: string }>;
}) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  if (process.env.DB09_TPO_API_READY !== "DB09_VERIFIED")
    return NextResponse.json({error:"DB09_MIGRATIONS_PENDING"},{status:503,
      headers:{"Cache-Control":"private, no-store, max-age=0"}});
  try {
    const {jobId, applicationId} = await params;
    const saved = await reviewTpoApplicant(await getCurrentRequestContext(),
      {jobId, applicationId}, await request.json());
    return NextResponse.json({ status: saved.status, updatedAt: saved.updatedAt.toISOString() });
  } catch (error) { return apiErrorResponse(error); }
}
