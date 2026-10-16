import { describe, expect, it } from "vitest";
import { canOpenTpoWorkspace, hasTpoTooling } from "@/modules/placements/tpo-workspace-access-model";
import type { RequestContext } from "@/modules/identity/context";

function ctx(roles: string[], collegeId = "c1", status = "ACTIVE"): RequestContext {
  return {
    user: { id: "u", identityUid: "i", platformStatus: "ACTIVE", systemRoles: [] },
    membership: { id: "m", organizationId: "o", collegeId, status, roles },
  } as unknown as RequestContext;
}

describe("TPO workspace access (legacy: college admin reaches the placement cell)", () => {
  it("lets a college admin open /tpo without TPO tooling", () => {
    const c = ctx(["COLLEGE_ADMIN"]);
    expect(canOpenTpoWorkspace(c)).toBe(true);
    expect(hasTpoTooling(c)).toBe(false);
  });
  it("gives a TPO full tooling", () => {
    const c = ctx(["TPO"]);
    expect(canOpenTpoWorkspace(c)).toBe(true);
    expect(hasTpoTooling(c)).toBe(true);
  });
  it("keeps learners, faculty and inactive memberships out", () => {
    expect(canOpenTpoWorkspace(ctx(["LEARNER"]))).toBe(false);
    expect(canOpenTpoWorkspace(ctx(["FACULTY"]))).toBe(false);
    expect(canOpenTpoWorkspace(ctx(["COLLEGE_ADMIN"], "c1", "SUSPENDED"))).toBe(false);
    expect(canOpenTpoWorkspace(null)).toBe(false);
  });
});
