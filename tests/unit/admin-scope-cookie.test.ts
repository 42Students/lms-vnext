import { describe, expect, it } from "vitest";
import {
  decodeAdminScopeCookie,
  encodeAdminScopeCookie,
} from "@/auth/admin-scope";

const organizationId =
  "11111111-1111-4111-8111-111111111111";
const collegeId =
  "22222222-2222-4222-8222-222222222222";

describe("admin scope cookie", () => {
  it("round-trips organization scope", () => {
    const encoded = encodeAdminScopeCookie({
      organizationId,
      collegeId: null,
    });

    expect(encoded).toBe(
      `organization:${organizationId}`,
    );
    expect(decodeAdminScopeCookie(encoded)).toEqual({
      organizationId,
      collegeId: null,
    });
  });

  it("round-trips college scope with its organization", () => {
    const encoded = encodeAdminScopeCookie({
      organizationId,
      collegeId,
    });

    expect(encoded).toBe(
      `college:${organizationId}:${collegeId}`,
    );
    expect(decodeAdminScopeCookie(encoded)).toEqual({
      organizationId,
      collegeId,
    });
  });

  it("treats malformed values as unscoped", () => {
    expect(decodeAdminScopeCookie("college:not-a-uuid:nope"))
      .toBeNull();
    expect(decodeAdminScopeCookie("organization:broken"))
      .toBeNull();
    expect(decodeAdminScopeCookie(null)).toBeNull();
  });
});
