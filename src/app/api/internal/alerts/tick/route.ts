import { NextResponse } from "next/server";
import { runAlertTick } from "@/modules/log-alerts/scheduler";
import { logAlertsRuntimeEnabled } from "@/modules/log-alerts/readiness";
import { internalRoute } from "@/security/internal-route";
import { credentialMatches } from "@/security/internal-route-core";

import { jobCredential } from "@/security/jobs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Only a separately provisioned, high-entropy machine credential can run the
 * alert scheduler. A short or missing deployment secret must fail closed.
 */
export const isValidTickSecret = credentialMatches;

/** Machine-to-machine only: no Origin, query options, or request payload. */
export const POST = internalRoute(
  {
    name: "internal.alerts.tick",
    credential: jobCredential("internal.alerts.tick"),
    emptyBody: true,
    denied: { status: 403, body: { message: "Not authorized." } },
    invalid: { message: "Invalid request." },
  },
  async () => {
    if (!logAlertsRuntimeEnabled()) {
      return NextResponse.json({ message: "Alert storage is not ready." }, { status: 503 });
    }
    try {
      return NextResponse.json(await runAlertTick());
    } catch {
      return NextResponse.json({ message: "Could not run the scheduled check." }, { status: 503 });
    }
  },
);
