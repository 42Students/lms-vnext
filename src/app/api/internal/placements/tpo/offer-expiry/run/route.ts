import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runTpoOfferExpiryTick } from "@/modules/operations/tpo-offer-expiry-worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const expected = process.env.TPO_NOTICE_SCHEDULER_SECRET ?? "";
  const provided = request.headers.get("x-tpo-scheduler-key") ?? "";
  // Require an operator-managed secret, fail closed for absent/short values.
  if (Buffer.byteLength(expected, "utf8") < 32) return false;
  const actualBytes = Buffer.from(provided, "utf8");
  const expectedBytes = Buffer.from(expected, "utf8");
  return actualBytes.length === expectedBytes.length &&
    timingSafeEqual(actualBytes, expectedBytes);
}

/** Dev scheduler ingress. No GET, no user-session privilege escalation. */
export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const result = await runTpoOfferExpiryTick();
    if (result.status === "DISABLED") {
      return NextResponse.json(
        { error: "SCHEDULER_NOT_ENABLED" },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    // Do not return DB errors, SQL, service actor IDs or provider details.
    return NextResponse.json(
      { error: "SCHEDULED_JOB_UNAVAILABLE" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
