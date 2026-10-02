import { NextResponse } from "next/server";
import { getHealthPayload } from "@/modules/system/health";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getHealthPayload());
}
