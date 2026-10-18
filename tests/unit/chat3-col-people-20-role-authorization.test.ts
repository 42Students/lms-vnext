import { describe, expect, it } from "vitest";
import type { MembershipRole, SystemRole } from "@/modules/identity/constants";
import type { RequestContext } from "@/modules/identity/context";
import {
  addMembershipRole,
  removeMembershipRole,
  type MembershipManagementRepository,
} from "@/modules/people/membership-service";
import type { PersonMembershipView } from "@/modules/people/service";

const membershipId = "11111111-1111-4111-8111-111111111111";
const collegeId = "22222222-2222-4222-8222-222222222222";
const organizationId = "33333333-3333-4333-8333-333333333333";
const timestamp = new Date("2099-01-01T00:00:00.000Z");

const person: PersonMembershipView = {
  organizationId,
  user: {
    id: "target-user",
    identityUid: "target-identity",
    phoneE164: null,
    email: null,
    displayName: "Faculty target",
  },
  membership: {
    id: membershipId,
    collegeId,
    status: "ACTIVE",
    suspendedAt: null,
    suspensionReason: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    roles: ["FACULTY", "LEARNER"],
  },
};

function actor(
  roles: MembershipRole[],
  systemRoles: SystemRole[] = [],
  overrides: Partial<RequestContext> = {},
): RequestContext {
  return {
    user: {
      id: "actor-user",
      identityUid: "actor-identity",
      platformStatus: "ACTIVE",
      systemRoles,
    },
    membership: {
      id: "actor-membership",
      collegeId,
      organizationId,
      status: "ACTIVE",
      roles,
    },
    ...overrides,
  };
}

function repositoryFixture() {
  const calls: string[] = [];
  const repository: MembershipManagementRepository = {
    async loadMembershipDetail(id) {
      calls.push("read:" + id);
      return id === membershipId ? person : null;
    },
    async addMembershipRole(id, role) {
      calls.push("add:" + id + ":" + role);
      return [...person.membership.roles, role];
    },
    async removeMembershipRole(id, role) {
      calls.push("remove:" + id + ":" + role);
      return person.membership.roles.filter((current) => current !== role);
    },
    async transitionMembershipLifecycle() {
      throw new Error("Unexpected lifecycle mutation");
    },
  };
  return { repository, calls };
}

describe("COL-people-20 persisted role mutation authorization", () => {
  it("COL-people-20 denies College Admin, Faculty, Mentor and Learner grants and revocations before looking up a target", async () => {
    for (const roles of [
      ["COLLEGE_ADMIN"],
      ["FACULTY"],
      ["MENTOR"],
      ["LEARNER"],
    ] satisfies MembershipRole[][]) {
      for (const action of [addMembershipRole, removeMembershipRole]) {
        const { repository, calls } = repositoryFixture();
        await expect(
          action(actor(roles), membershipId, { role: "COLLEGE_ADMIN" }, repository),
        ).rejects.toThrow("Missing permission: admin-scope.select");
        expect(calls).toEqual([]);
      }
    }
  });

  it("COL-people-20 refuses a disabled Super Admin before lookup, even with a cached system role", async () => {
    for (const action of [addMembershipRole, removeMembershipRole]) {
      const { repository, calls } = repositoryFixture();
      const context = actor([], ["SUPER_ADMIN"], {
        user: {
          id: "actor-user",
          identityUid: "actor-identity",
          platformStatus: "DISABLED",
          systemRoles: ["SUPER_ADMIN"],
        },
      });
      await expect(action(context, membershipId, { role: "COLLEGE_ADMIN" }, repository))
        .rejects.toThrow("Missing permission: admin-scope.select");
      expect(calls).toEqual([]);
    }
  });

  it("COL-people-20 rejects a Super Admin whose selected college is foreign before writing", async () => {
    for (const action of [addMembershipRole, removeMembershipRole]) {
      const { repository, calls } = repositoryFixture();
      await expect(action(actor([], ["SUPER_ADMIN"], {
        adminScope: {
          organizationId: "44444444-4444-4444-8444-444444444444",
          collegeId: "55555555-5555-4555-8555-555555555555",
        },
      }), membershipId, { role: "COLLEGE_ADMIN" }, repository))
        .rejects.toThrow("Missing permission: membership.role.manage");
      expect(calls).toEqual(["read:" + membershipId]);
    }
  });

  it("COL-people-20 permits only scoped active Super Admin grant and revoke, preserving other roles", async () => {
    const context = actor([], ["SUPER_ADMIN"], {
      adminScope: { organizationId, collegeId },
    });
    const { repository, calls } = repositoryFixture();
    await expect(addMembershipRole(context, membershipId, { role: "COLLEGE_ADMIN" }, repository))
      .resolves.toEqual(["FACULTY", "LEARNER", "COLLEGE_ADMIN"]);
    await expect(removeMembershipRole(context, membershipId, { role: "COLLEGE_ADMIN" }, repository))
      .resolves.toEqual(["FACULTY", "LEARNER"]);
    expect(calls).toEqual([
      "read:" + membershipId, "add:" + membershipId + ":COLLEGE_ADMIN",
      "read:" + membershipId, "remove:" + membershipId + ":COLLEGE_ADMIN",
    ]);
  });

  it("COL-people-20 lets a college admin manage ordinary roles only in their own college", async () => {
    const { repository, calls } = repositoryFixture();
    const context = actor(["COLLEGE_ADMIN"]);
    await expect(addMembershipRole(context, membershipId, { role: "MENTOR" }, repository))
      .resolves.toContain("MENTOR");
    expect(calls).toEqual(["read:" + membershipId, "add:" + membershipId + ":MENTOR"]);
    const foreign = actor(["COLLEGE_ADMIN"], [], {
      membership: {
        id: "other-college-membership",
        organizationId,
        collegeId: "66666666-6666-4666-8666-666666666666",
        status: "ACTIVE",
        roles: ["COLLEGE_ADMIN"],
      },
    });
    await expect(addMembershipRole(foreign, membershipId, { role: "MENTOR" }, repository))
      .rejects.toThrow("Missing permission: membership.role.manage");
    expect(calls).toEqual([
      "read:" + membershipId, "add:" + membershipId + ":MENTOR",
      "read:" + membershipId,
    ]);
  });
});
