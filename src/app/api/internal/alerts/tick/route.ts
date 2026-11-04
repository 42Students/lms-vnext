import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { readBoundedUtf8Body } from "@/lib/bounded-utf8-body";
import { runAlertTick } from "@/modules/log-alerts/scheduler";
import { logAlertsRuntimeEnabled } from "@/modules/log-alerts/readiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" } as const;

/**
 * Only a separately provisioned, high-entropy machine credential can run the
 * alert scheduler. A short or missing deployment secret must fail closed.
 */
export function isValidTickSecret(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected) return false;
  if (Buffer.byteLength(expected, "utf8") < 32) return false;
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Machine-to-machine only: no Origin, query options, or request payload. */
export async function POST(request: Request) {
  if (request.headers.has("origin")) {
    return NextResponse.json({ message: "Not authorized." }, { status: 403, headers: noStore });
  }
  if (!isValidTickSecret(request.headers.get("x-internal-alerts-key"), process.env["INTERNAL_ALERT_TICK_SECRET"])) {
    return NextResponse.json({ message: "Not authorized." }, { status: 403, headers: noStore });
  }
  if (new URL(request.url).search) {
    return NextResponse.json({ message: "Invalid request." }, { status: 400, headers: noStore });
  }
  // Reject even streamed bodies rather than trusting Content-Length: 0.
  const body = await readBoundedUtf8Body(request, 0);
  if (body.kind !== "OK" || body.body !== "") {
    return NextResponse.json({ message: "Invalid request." }, { status: 400, headers: noStore });
  }
  if (!logAlertsRuntimeEnabled()) {
    return NextResponse.json({ message: "Alert storage is not ready." }, { status: 503, headers: noStore });
  }
  try {
    const result = await runAlertTick();
    return NextResponse.json(result, { headers: noStore });
  } catch {
    return NextResponse.json({ message: "Could not run the scheduled check." }, { status: 503, headers: noStore });
  }
}
