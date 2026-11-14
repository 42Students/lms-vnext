import { NextResponse } from "next/server";
import { runTpoOfferExpiryTick } from "@/modules/operations/tpo-offer-expiry-worker";
import { internalRoute } from "@/security/internal-route";

import { jobCredential } from "@/security/jobs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Dev scheduler ingress. No GET, no user-session privilege escalation. */
export const POST = internalRoute(
  {
    name: "internal.tpo.offer-expiry.run",
    credential: jobCredential("internal.tpo.offer-expiry.run"),
    emptyBody: true,
    denied: { status: 403, body: { error: "FORBIDDEN" } },
    invalid: { error: "INVALID_REQUEST" },
  },
  async () => {
    try {
      const result = await runTpoOfferExpiryTick();
      if (result.status === "DISABLED") {
        return NextResponse.json({ error: "SCHEDULER_NOT_ENABLED" }, { status: 503 });
      }
      return NextResponse.json(result);
    } catch {
      // Do not return DB errors, SQL, service actor IDs or provider details.
      return NextResponse.json({ error: "SCHEDULED_JOB_UNAVAILABLE" }, { status: 503 });
    }
  },
);
