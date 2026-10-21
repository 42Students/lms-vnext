import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSuperAdmin } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import { getDb } from "@/db/client";
import {
  devFixtureManifestEnabled,
  readProvisionedDevFixtureManifest,
} from "@/modules/e2e/dev-fixture-manifest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store" } as const;

function matchesSecret(value: string | null, expected: string) {
  if (!value || value.length > 256) return false;
  const a = Buffer.from(value, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Read-only replacement for the legacy unrestricted seed response:
 * fixtures must be provisioned transactionally by the dev environment.
 * Never accepts IDs/body or writes data, and is wholly unavailable in prod. */
export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production" || process.env.APP_ENV !== "development") {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404, headers: noStore });
  }
  if (!devFixtureManifestEnabled()) {
    return NextResponse.json({
      status: "error", error: "E2E_SEED_DISABLED",
      message: "Development fixtures are disabled or not configured.",
    }, { status: 503, headers: noStore });
  }
  const secret = request.headers.get("x-e2e-seed-secret");
  if (!matchesSecret(secret, process.env.APP_E2E_SEED_SECRET!)) {
    return NextResponse.json({ status: "error", error: "FORBIDDEN" }, {
      status: 403, headers: noStore,
    });
  }
  try {
    const context = await getCurrentRequestContext();
    if (!isSuperAdmin(context) || context.adminScope?.collegeId ||
        context.adminScope?.organizationId) {
      return NextResponse.json({ status: "error", error: "FORBIDDEN" }, {
        status: 403, headers: noStore,
      });
    }
    requirePermission(context, "admin-scope.select");
    await getDb().transaction(async tx => {
      await assertPersistedPlatformPermission(tx, context, "admin-scope.select");
    });
    const manifest = readProvisionedDevFixtureManifest();
    if (!manifest) {
      return NextResponse.json({
        status: "error", error: "E2E_FIXTURE_UNAVAILABLE",
        message: "Deterministic development fixtures have not been provisioned.",
      }, { status: 503, headers: noStore });
    }
    return NextResponse.json({
      status: "OK", message: "Development fixtures ready",
      data: manifest, reused: true, writesPerformed: false,
    }, { headers: noStore });
  } catch {
    return NextResponse.json({ status: "error", error: "FORBIDDEN" }, {
      status: 403, headers: noStore,
    });
  }
}
