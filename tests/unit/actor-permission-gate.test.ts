import { describe, expect, it } from "vitest";
import { requireActorPermission, AuthorizationError } from "@/modules/permissions/policy";
import type { RequestContext } from "@/modules/identity/context";

const user = (systemRoles: string[] = []) => ({ id: "u", identityUid: "u", platformStatus: "ACTIVE" as const, systemRoles });
const member = (roles: string[], collegeId = "college-1") =>
  ({ id: "m", collegeId, organizationId: "org-1", status: "ACTIVE" as const, roles });

describe("requireActorPermission: the route-level gate checks the actor's own workspace", () => {
  it("lets a College Admin use a college permission in their own college (an empty scope would deny them)", () => {
    const ctx = { user: user(), membership: member(["COLLEGE_ADMIN"]), adminScope: null } as unknown as RequestContext;
    expect(() => requireActorPermission(ctx, "academics.manage")).not.toThrow();
    expect(() => requireActorPermission(ctx, "academics.read")).not.toThrow();
  });

  it("still denies a role that does not hold the permission", () => {
    const learner = { user: user(), membership: member(["LEARNER"]), adminScope: null } as unknown as RequestContext;
    expect(() => requireActorPermission(learner, "academics.manage")).toThrow(AuthorizationError);
    const tpo = { user: user(), membership: member(["TPO"]), adminScope: null } as unknown as RequestContext;
    expect(() => requireActorPermission(tpo, "academics.manage")).toThrow(AuthorizationError);
    expect(() => requireActorPermission(tpo, "placements.manage")).not.toThrow();
  });

  it("allows a Super Admin without a selected scope, and one inside their selected college", () => {
    const global = { user: user(["SUPER_ADMIN"]), membership: null, adminScope: null } as unknown as RequestContext;
    expect(() => requireActorPermission(global, "academics.manage")).not.toThrow();
    const scoped = { user: user(["SUPER_ADMIN"]), membership: null, adminScope: { collegeId: "college-1", organizationId: "org-1" } } as unknown as RequestContext;
    expect(() => requireActorPermission(scoped, "academics.manage")).not.toThrow();
  });

  it("denies a missing or inactive actor", () => {
    expect(() => requireActorPermission(null, "academics.read")).toThrow(AuthorizationError);
    const inactive = { user: { ...user(), platformStatus: "SUSPENDED" }, membership: member(["COLLEGE_ADMIN"]), adminScope: null } as unknown as RequestContext;
    expect(() => requireActorPermission(inactive, "academics.read")).toThrow(AuthorizationError);
  });
});
