import {
  describe,
  expect,
  it,
} from "vitest";
import {
  getMembershipDashboardWorkspaces,
} from "@/components/dashboard/membership-dashboard-model";
import type {
  RequestContext,
} from "@/modules/identity/context";

function context(
  roles: RequestContext["membership"] extends infer T
    ? T extends { roles: infer R }
      ? R
      : never
    : never,
  status:
    | "ACTIVE"
    | "SUSPENDED" = "ACTIVE",
): RequestContext {
  return {
    user: {
      id: "user-1",
      identityUid: "identity-1",
      platformStatus: "ACTIVE",
      systemRoles: [],
    },
    membership: {
      id: "membership-1",
      collegeId: "college-1",
      organizationId: "org-1",
      status,
      roles,
    },
  };
}

describe("membership dashboard workspaces", () => {
  it("keeps additive membership roles visible in a stable order", () => {
    expect(
      getMembershipDashboardWorkspaces(
        context([
          "TPO",
          "MENTOR",
          "FACULTY",
          "LEARNER",
          "COLLEGE_ADMIN",
        ]),
      ),
    ).toEqual([
      "COLLEGE_ADMIN",
      "FACULTY",
      "MENTOR",
      "TPO",
      "LEARNER",
    ]);
  });

  it("does not expose workspaces for a suspended membership", () => {
    expect(
      getMembershipDashboardWorkspaces(
        context(
          ["FACULTY", "MENTOR"],
          "SUSPENDED",
        ),
      ),
    ).toEqual([]);
  });

  it("returns no membership workspaces when only recruiter/system context exists", () => {
    const recruiterOnly: RequestContext = {
      user: {
        id: "user-1",
        identityUid: "identity-1",
        platformStatus: "ACTIVE",
        systemRoles: [],
      },
      membership: null,
      recruiter: {
        userId: "user-1",
        companyId: "company-1",
        companyName: "Company",
        title: null,
        status: "ACTIVE",
        grants: [],
      },
    };

    expect(
      getMembershipDashboardWorkspaces(
        recruiterOnly,
      ),
    ).toEqual([]);
  });
});
