import {
  hasActiveMembership,
  hasActiveRecruiter,
  isSuperAdmin,
  type RequestContext,
} from "@/modules/identity/context";

/**
 * Pure W06 scope predicate. Kept separate from the server-only Drizzle reader,
 * so unit tests and route gate checks can execute without database modules.
 */
export function canReadSkillCatalog(context: RequestContext) {
  return context.user.platformStatus === "ACTIVE" &&
    (hasActiveMembership(context) ||
      hasActiveRecruiter(context) ||
      isSuperAdmin(context));
}
