import { getCurrentRequestContext } from "@/auth/request-context";
import { allowRequestShared } from "@/security/shared-store";
import { requireActorPermission, type PlatformPermission } from "@/modules/permissions/policy";
import { writeStructuredLog } from "@/observability/logger";

export class ActionRateLimitError extends Error {
  constructor() {
    super("Too many requests. Wait a minute and retry.");
    this.name = "ActionRateLimitError";
  }
}

type ActionGuardConfig = {
  /** Stable name, used for the audit line and the rate-limit bucket (for example "college.electives.allocate"). */
  name: string;
  /** Registry permission checked against the actor's own selected scope. */
  permission: PlatformPermission;
  /** Per-user budget for this action. Default 60 calls per minute. */
  rateLimit?: { limit: number; windowMs?: number };
};

/**
 * Central gate for a Next.js server action. Call it first in the action body: it resolves the actor, checks the
 * named permission against the actor's own selected scope, applies a per-user rate limit and writes a structured
 * audit line. It does not wrap the function, so Next's own server-action handling (same-origin check, encrypted
 * closure variables) is untouched. Returns the resolved actor so the body does not look the session up twice.
 * `security:central` fails the build on any "use server" file that is not on its reviewed list.
 * Debt: actions do not yet run inside the actor's database scope the way route() handlers do.
 */
export async function guardAction(config: ActionGuardConfig) {
  const context = await getCurrentRequestContext();
  const actor = context as { user: { id: string }; membership?: { id?: string; collegeId?: string } | null };
  const audit = (outcome: string) =>
    writeStructuredLog(outcome === "ok" ? "INFO" : "WARNING", "action.audit", {
      action: config.name,
      outcome,
      userId: actor.user.id,
      membershipId: actor.membership?.id ?? null,
      collegeId: actor.membership?.collegeId ?? null,
    });
  try {
    requireActorPermission(context as never, config.permission);
  } catch (error) {
    audit("denied");
    throw error;
  }
  const windowMs = config.rateLimit?.windowMs ?? 60_000;
  if (!(await allowRequestShared(`action:${actor.user.id}:${config.name}`, config.rateLimit?.limit ?? 60, windowMs))) {
    audit("rate_limited");
    throw new ActionRateLimitError();
  }
  audit("ok");
  return context;
}
