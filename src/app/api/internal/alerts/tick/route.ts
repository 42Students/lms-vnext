import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runAlertTick } from "@/modules/log-alerts/scheduler";
import { logAlertsRuntimeEnabled } from "@/modules/log-alerts/readiness";

export const runtime = "nodejs";

export function isValidTickSecret(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!isValidTickSecret(request.headers.get("x-internal-alerts-key"), process.env["INTERNAL_ALERT_TICK_SECRET"])) {
    return NextResponse.json({ message: "Not authorized." }, { status: 403 });
  }
  if (!logAlertsRuntimeEnabled()) {
    return NextResponse.json({ message: "Alert storage is not ready." }, { status: 503 });
  }
  try {
    const result = await runAlertTick();
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ message: "Could not run the scheduled check." }, { status: 503 });
  }
}
