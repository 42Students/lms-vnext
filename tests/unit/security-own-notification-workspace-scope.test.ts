import { describe, expect, it } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import { ownNotificationEventScope } from "@/modules/activity/own-notification-scope";
import type { RequestContext } from "@/modules/identity/context";

const organizationA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const collegeA = "11111111-1111-4111-8111-111111111111";
const collegeB = "22222222-2222-4222-8222-222222222222";
const dialect = new PgDialect();
const membership: RequestContext = {
  user: {
    id: "33333333-3333-4333-8333-333333333333",
    identityUid: "security-notification-fixture",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: "44444444-4444-4444-8444-444444444444",
    collegeId: collegeA,
    organizationId: organizationA,
    status: "ACTIVE",
    roles: ["LEARNER"],
  },
};
function compiled(context: RequestContext) {
  return dialect.sqlToQuery(ownNotificationEventScope(context));
}

describe("actor-owned notification event scope", () => {
  it("requires the selected organization plus college, allowing org-wide notices", () => {
    const query = compiled(membership);
    expect(query.params).toEqual([organizationA, collegeA]);
    expect(query.sql).toContain("organization_id");
    expect(query.sql).toContain("college_id");
    expect(query.sql).toMatch(/is null/i);
    expect(query.sql).toMatch(/\bor\b/i);
  });

  it("prevents an unselected super-admin role from bypassing the college workspace", () => {
    const query = compiled({
      ...membership,
      user: { ...membership.user, systemRoles: ["SUPER_ADMIN"] },
    });
    expect(query.params).toEqual([organizationA, collegeA]);
  });

  it("rejects suspended users, ambiguous selected roles and inactive memberships", () => {
    expect(() => compiled({
      ...membership,
      user: { ...membership.user, platformStatus: "DISABLED" },
    })).toThrow();
    expect(() => compiled({
      ...membership,
      membership: { ...membership.membership!, roles: ["LEARNER", "FACULTY"] },
    })).toThrow();
    expect(() => compiled({
      ...membership,
      membership: { ...membership.membership!, status: "SUSPENDED" },
    })).toThrow();
  });

  it("keeps recruiter notification access inside explicit company-college grants", () => {
    const query = compiled({
      ...membership,
      membership: null,
      recruiter: {
        userId: membership.user.id,
        companyId: "55555555-5555-4555-8555-555555555555",
        companyName: "Fixture employer",
        title: null,
        status: "ACTIVE",
        grants: [
          {
            id: "66666666-6666-4666-8666-666666666666",
            organizationId: organizationA,
            collegeId: collegeB,
            collegeName: "College B",
            companyRelationshipId: "77777777-7777-4777-8777-777777777777",
          },
        ],
      },
    });
    expect(query.params).toEqual([organizationA, collegeB]);
    expect(query.sql).toContain("college_id");
    expect(() => compiled({
      ...membership,
      membership: null,
      recruiter: {
        userId: membership.user.id,
        companyId: "55555555-5555-4555-8555-555555555555",
        companyName: "Fixture employer",
        title: null,
        status: "ACTIVE",
        grants: [],
      },
    })).toThrow();
  });

  it("rejects unaffiliated identities but permits a separate system-admin scope", () => {
    expect(() => compiled({ ...membership, membership: null })).toThrow();
    const platform: RequestContext = {
      ...membership,
      membership: null,
      user: { ...membership.user, systemRoles: ["SUPER_ADMIN"] },
      adminScope: { collegeId: collegeB, organizationId: organizationA },
    };
    expect(compiled(platform).params).toEqual([collegeB, organizationA]);
  });
});
