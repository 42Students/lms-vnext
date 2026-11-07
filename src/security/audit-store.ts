import "server-only";
import { getDb } from "@/db/client";
import { runAsSystem } from "@/db/tenant-context";
import { securityAuditEvents } from "@/db/schema/security-audit-events";

/**
 * Durable security audit trail (SEC-19). Off unless SECURITY_AUDIT_DB=on (the migration must be applied first).
 * Writing never blocks or fails a request: it is fire-and-forget, bounded, and falls back to the structured log
 * (which the caller has already written) with one warning if the database cannot be reached.
 */
export type SecurityAuditInput = {
  event: string;
  outcome: "ok" | "denied" | "rate_limited" | "error" | string;
  requestId?: string | null;
  userId?: string | null;
  membershipId?: string | null;
  collegeId?: string | null;
  role?: string | null;
  method?: string | null;
  path?: string | null;
  status?: number | null;
  target?: string | null;
  ipTag?: string | null;
  detail?: Record<string, unknown>;
};

const MAX_IN_FLIGHT = 50;
const MAX_DETAIL_BYTES = 4_000;
let inFlight = 0;
let warned = false;
let dropped = 0;

const enabled = () => process.env["SECURITY_AUDIT_DB"] === "on";
const uuidOrNull = (value: string | null | undefined) =>
  typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ? value : null;
const text = (value: string | null | undefined, max: number) => (typeof value === "string" ? value.slice(0, max) : null);

function safeDetail(detail: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!detail) return {};
  try {
    const json = JSON.stringify(detail);
    return json.length <= MAX_DETAIL_BYTES ? (JSON.parse(json) as Record<string, unknown>) : { truncated: true };
  } catch {
    return { unserializable: true };
  }
}

export function recordSecurityEvent(input: SecurityAuditInput): void {
  if (!enabled()) return;
  if (inFlight >= MAX_IN_FLIGHT) {
    dropped += 1;
    return;
  }
  inFlight += 1;
  const row = {
    requestId: text(input.requestId, 64),
    event: input.event.slice(0, 120),
    outcome: input.outcome.slice(0, 40),
    actorUserId: uuidOrNull(input.userId),
    membershipId: uuidOrNull(input.membershipId),
    collegeId: uuidOrNull(input.collegeId),
    role: text(input.role, 40),
    method: text(input.method, 10),
    path: text(input.path, 300),
    status: typeof input.status === "number" ? input.status : null,
    target: text(input.target, 200),
    ipTag: text(input.ipTag, 64),
    detail: safeDetail(input.detail),
  };
  void runAsSystem("audit:write", () => getDb().insert(securityAuditEvents).values(row))
    .catch((error: unknown) => {
      if (warned) return;
      warned = true;
      console.warn(JSON.stringify({ severity: "WARNING", event: "security.audit_store_degraded", error: error instanceof Error ? error.name : "unknown", dropped }));
    })
    .finally(() => {
      inFlight -= 1;
    });
}
