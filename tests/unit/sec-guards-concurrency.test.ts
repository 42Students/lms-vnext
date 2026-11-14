import { describe, expect, it, vi } from "vitest";

vi.mock("@/observability/logger", () => ({ logError: () => {} }));

import { apiErrorResponse } from "@/lib/api-error";
import { VersionConflictError, requireCurrentVersion, versionMatches } from "@/lib/concurrency";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { ownsResource, requireOwnsResource, requireSameCollege, sameCollege } from "@/modules/permissions/resource-guards";

const ctx = (over: Partial<RequestContext> = {}): RequestContext => ({
  user: { id: "u1", identityUid: "x", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: "m1", collegeId: "c1", organizationId: "o1", status: "ACTIVE", roles: ["LEARNER"] },
  ...over,
});

describe("same-college and ownership guards", () => {
  it("sameCollege needs an active membership and an equal, present college", () => {
    expect(sameCollege(ctx(), { collegeId: "c1" })).toBe(true);
    expect(sameCollege(ctx(), { collegeId: "c2" })).toBe(false);
    expect(sameCollege(ctx(), { collegeId: null })).toBe(false);
    expect(sameCollege(ctx(), {})).toBe(false);
    expect(sameCollege(null, { collegeId: "c1" })).toBe(false);
    expect(sameCollege(ctx({ membership: null }), { collegeId: "c1" })).toBe(false);
    expect(sameCollege(ctx({ membership: { id: "m1", collegeId: "c1", organizationId: "o1", status: "SUSPENDED", roles: ["LEARNER"] } }), { collegeId: "c1" })).toBe(false);
  });
  it("requireSameCollege throws AuthorizationError on a mismatch", () => {
    expect(() => requireSameCollege(ctx(), { collegeId: "c2" })).toThrow(AuthorizationError);
    expect(() => requireSameCollege(ctx(), { collegeId: "c1" })).not.toThrow();
  });
  it("ownsResource matches the membership id or the user id, and nothing else", () => {
    expect(ownsResource(ctx(), { membershipId: "m1" })).toBe(true);
    expect(ownsResource(ctx(), { userId: "u1" })).toBe(true);
    expect(ownsResource(ctx(), { membershipId: "m2", userId: "u2" })).toBe(false);
    expect(ownsResource(ctx(), {})).toBe(false);
    expect(ownsResource(ctx({ user: { id: "u1", identityUid: "x", platformStatus: "DISABLED", systemRoles: [] } }), { userId: "u1" })).toBe(false);
    expect(() => requireOwnsResource(ctx(), { membershipId: "m9" })).toThrow(AuthorizationError);
  });
});

describe("requireCurrentVersion", () => {
  it("passes only for an exactly equal version", () => {
    expect(() => requireCurrentVersion(3, 3)).not.toThrow();
    expect(() => requireCurrentVersion("v1", "v1")).not.toThrow();
    expect(() => requireCurrentVersion(new Date("2026-01-01"), new Date("2026-01-01"))).not.toThrow();
    for (const [a, b] of [[3, 4], [3, "3"], [null, null], [undefined, undefined], [new Date(1), 1]] as const) {
      expect(versionMatches(a as never, b as never), `${String(a)} vs ${String(b)}`).toBe(false);
      expect(() => requireCurrentVersion(a as never, b as never)).toThrow(VersionConflictError);
    }
  });
  it("answers 409 VERSION_CONFLICT through the central mapper", async () => {
    const response = apiErrorResponse(new VersionConflictError());
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: "VERSION_CONFLICT" });
  });
});
