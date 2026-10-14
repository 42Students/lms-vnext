import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { CollegePromotionExecuteError, executeCollegeBatchPromotion } from "@/modules/academics/college-batch-promotion-execute";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const result = await executeCollegeBatchPromotion(context, await request.json());
    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof CollegePromotionExecuteError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === "BATCH_NOT_FOUND" ? 404 : 409 },
      );
    }
    return apiErrorResponse(error);
  }
}
