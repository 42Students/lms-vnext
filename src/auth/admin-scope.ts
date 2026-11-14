import { z } from "zod";
import type { AdminScope } from "@/modules/identity/context";

import { zUuid } from "@/lib/schema-primitives";
export const ADMIN_SCOPE_COOKIE_NAME = "lms_admin_scope";
/** Companion cookie holding the epoch-seconds expiry of the selected scope. The server enforces it on every request,
 * so a copied or replayed scope cookie stops working after the window (SEC-05-022). */
export const ADMIN_SCOPE_EXPIRY_COOKIE_NAME = "lms_admin_scope_exp";
/** A Super Admin acting inside an organization or college must re-select after this long. */
export const ADMIN_SCOPE_MAX_AGE_SECONDS = 4 * 60 * 60;

/** True unless the expiry value is a whole number of seconds that is still in the future and not further
 * ahead than the maximum window (a tampered far-future value is also expired). Missing means expired. */
export function adminScopeExpired(expiryValue: string | null | undefined, nowMs: number = Date.now()): boolean {
  if (!expiryValue || !/^\d{1,12}$/.test(expiryValue)) return true;
  const expiresAtMs = Number(expiryValue) * 1000;
  return !(expiresAtMs > nowMs && expiresAtMs <= nowMs + (ADMIN_SCOPE_MAX_AGE_SECONDS + 60) * 1000);
}

const uuidSchema = zUuid;

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

/** Browser localStorage and old JWT role claims are never authoritative.
 * A cross-tab cookie change is restored only after the server has loaded the
 * caller's currently permitted organization/college scopes. */
export function restoreVerifiedAdminScope(
 cookieValue:string|null|undefined,
 permitted:readonly AdminScope[],
):AdminScope|null {
 const requested=decodeAdminScopeCookie(cookieValue);
 if(!requested)return null;
 return permitted.find(scope=>scope.organizationId===requested.organizationId&&
   scope.collegeId===requested.collegeId)??null;
}
