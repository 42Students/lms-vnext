import { NextResponse } from "next/server";
import { getReadinessResultWithRuntime } from "@/modules/system/readiness-runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const result = await getReadinessResultWithRuntime();

  return NextResponse.json(result.payload, {
    status: result.httpStatus,
  });
}
