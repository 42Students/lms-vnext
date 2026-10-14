import { describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { requireFacultyNotificationsAccess } from "@/modules/activity/faculty-notifications-access";

type Membership = NonNullable<RequestContext["membership"]>;
function context(
  roles: Membership["roles"],
  status: Membership["status"] = "ACTIVE",
  platform: RequestContext["user"]["platformStatus"] = "ACTIVE",
): RequestContext {
  return {
    user: { id: "user", identityUid: "uid", platformStatus: platform, systemRoles: [] },
    membership: {
      id: "faculty-membership", organizationId: "org", collegeId: "college",
      status, roles,
    },
  };
}
describe("Faculty Notifications account access", () => {
  it("accepts active Faculty, including active multi-role memberships", () => {
    expect(requireFacultyNotificationsAccess(context(["FACULTY"])).id).toBe("faculty-membership");
    expect(requireFacultyNotificationsAccess(context(["FACULTY","MENTOR"])).id).toBe("faculty-membership");
  });
  it.each(["LEARNER","MENTOR","TPO","COLLEGE_ADMIN"] as const)(
    "rejects a %s-only membership", (role) => {
      expect(() => requireFacultyNotificationsAccess(context([role])))
        .toThrow(AuthorizationError);
    },
  );
  it("rejects suspended, disabled and absent memberships", () => {
    expect(() => requireFacultyNotificationsAccess(context(["FACULTY"],"SUSPENDED")))
      .toThrow(AuthorizationError);
    expect(() => requireFacultyNotificationsAccess(context(["FACULTY"],"ACTIVE","DISABLED")))
      .toThrow(AuthorizationError);
    expect(() => requireFacultyNotificationsAccess({
      ...context(["FACULTY"]), membership: null,
    })).toThrow(AuthorizationError);
  });
});
