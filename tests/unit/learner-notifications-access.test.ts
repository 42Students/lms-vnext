import { describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { requireLearnerNotificationsAccess } from "@/modules/activity/learner-notifications-access";

type Membership = NonNullable<RequestContext["membership"]>;
function context(
  roles: Membership["roles"],
  membershipStatus: Membership["status"] = "ACTIVE",
  platformStatus: RequestContext["user"]["platformStatus"] = "ACTIVE",
): RequestContext {
  return {
    user: {
      id: "learner-user", identityUid: "learner-uid",
      platformStatus, systemRoles: [],
    },
    membership: {
      id: "learner-membership", organizationId: "org-1",
      collegeId: "college-1", status: membershipStatus, roles,
    },
  };
}

describe("Learner Notifications route access", () => {
  it("accepts an active Learner membership in its own college", () => {
    expect(requireLearnerNotificationsAccess(context(["LEARNER"])).id)
      .toBe("learner-membership");
  });

  it.each(["FACULTY", "MENTOR", "COLLEGE_ADMIN", "TPO"] as const)(
    "rejects a non-Learner %s membership", (role) => {
      expect(() => requireLearnerNotificationsAccess(context([role])))
        .toThrow(AuthorizationError);
    },
  );

  it("rejects disabled or suspended Learner accounts", () => {
    expect(() => requireLearnerNotificationsAccess(
      context(["LEARNER"], "ACTIVE", "DISABLED"),
    )).toThrow(AuthorizationError);
    expect(() => requireLearnerNotificationsAccess(
      context(["LEARNER"], "SUSPENDED"),
    )).toThrow(AuthorizationError);
  });

  it("rejects an absent active membership", () => {
    expect(() => requireLearnerNotificationsAccess({
      ...context(["LEARNER"]), membership: null,
    })).toThrow(AuthorizationError);
  });
});
