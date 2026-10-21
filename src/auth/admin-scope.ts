import { z } from "zod";
import type { AdminScope } from "@/modules/identity/context";

export const ADMIN_SCOPE_COOKIE_NAME = "lms_admin_scope";

const uuidSchema = z.string().uuid();

export function encodeAdminScopeCookie(scope: AdminScope) {
  if (scope.collegeId && scope.organizationId) {
    return `college:${scope.organizationId}:${scope.collegeId}`;
  }

  if (scope.organizationId) {
    return `organization:${scope.organizationId}`;
  }

  return "";
}

export function decodeAdminScopeCookie(
  value: string | null | undefined,
): AdminScope | null {
  if (!value) {
    return null;
  }

  const parts = value.split(":");

  if (
    parts[0] === "organization" &&
    parts.length === 2 &&
    uuidSchema.safeParse(parts[1]).success
  ) {
    return {
      organizationId: parts[1]!,
      collegeId: null,
    };
  }

  if (
    parts[0] === "college" &&
    parts.length === 3 &&
    uuidSchema.safeParse(parts[1]).success &&
    uuidSchema.safeParse(parts[2]).success
  ) {
    return {
      organizationId: parts[1]!,
      collegeId: parts[2]!,
    };
  }

  return null;
}
/** Error visibility for a malformed/outdated selected scope cookie.
 * This is a UI hint only: effective authorization is server/DB verified.
 */
export function inspectAdminScopeCookie(value: string | null | undefined): {
  scope: AdminScope | null;
  malformed: boolean;
} {
  if (!value) return { scope: null, malformed: false };
  const scope = decodeAdminScopeCookie(value);
  return { scope, malformed: scope === null };
}

/** Compare an on-screen scope selection to the server's effective scope.
 * A stale cookie must never silently authorize the wrong tenant.
 */
export function adminScopeOutOfSync(
  displayedScope: AdminScope | null,
  effectiveScope: AdminScope | null,
): boolean {
  if (!displayedScope && !effectiveScope) return false;
  if (!displayedScope || !effectiveScope) return true;
  return displayedScope.organizationId !== effectiveScope.organizationId ||
    displayedScope.collegeId !== effectiveScope.collegeId;
}
