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
