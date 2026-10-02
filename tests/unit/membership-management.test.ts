import { describe, expect, it } from "vitest";
import type {
  MembershipRole,
  MembershipStatus,
} from "@/modules/identity/constants";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  getMembershipLifecyclePatch,
  removeMembershipRoleFromSet,
} from "@/modules/people/membership-domain";
import {
  addMembershipRole,
  listMembershipRoles,
  removeMembershipRole,
  updateMembershipLifecycle,
  type MembershipManagementRepository,
} from "@/modules/people/membership-service";
import type { PersonMembershipView } from "@/modules/people/service";

const collegeA = "7f8e7b00-8503-4a2d-a222-fdfe8eb55ac0";
const collegeB = "b14f1d5a-97d4-4dfa-989a-5c9bbf713cde";
const orgA = "47c5f3b4-1e89-430e-9ac8-718758e72403";
const orgB = "c6dba3fd-3515-45c6-bab4-9293e80276f1";
const membershipA = "9c0ee299-faa4-4166-ab5e-35ec463940ce";
const membershipB = "f63b269d-92bd-4fa8-8caf-7bb91a91a591";

const baseUser = {
  id: "admin-user",
  identityUid: "admin-identity",
  platformStatus: "ACTIVE" as const,
  systemRoles: [] as const,
};

function collegeContext(
  collegeId: string,
  organizationId: string,
  roles: MembershipRole[],
): RequestContext {
  return {
    user: baseUser,
    membership: {
      id: "admin-membership",
      collegeId,
      organizationId,
      status: "ACTIVE",
      roles,
    },
  };
}

function makePerson(
  membershipId: string,
  collegeId: string,
  organizationId: string,
  roles: MembershipRole[],
  status: MembershipStatus = "ACTIVE",
): PersonMembershipView {
  return {
    organizationId,
    user: {
      id: `user-${membershipId}`,
      identityUid: `identity-${membershipId}`,
      phoneE164: "+919397662127",
      email: "person@example.com",
      displayName: "Person",
    },
    membership: {
      id: membershipId,
      collegeId,
      status,
      suspendedAt: null,
      suspensionReason: null,
      createdAt: new Date("2026-10-02T00:00:00Z"),
      updatedAt: new Date("2026-10-02T00:00:00Z"),
      roles: [...roles],
    },
  };
}

class FakeMembershipRepository implements MembershipManagementRepository {
  readonly people = new Map<string, PersonMembershipView>([
    [
      membershipA,
      makePerson(
        membershipA,
        collegeA,
        orgA,
        ["FACULTY"],
      ),
    ],
    [
      membershipB,
      makePerson(
        membershipB,
        collegeB,
        orgB,
        ["LEARNER"],
      ),
    ],
  ]);

  async loadMembershipDetail(membershipId: string) {
    return this.people.get(membershipId) ?? null;
  }

  async addMembershipRole(
    membershipId: string,
    role: MembershipRole,
  ) {
    const person = this.people.get(membershipId);
    if (!person) throw new Error("missing fake membership");

    person.membership.roles = [
      ...new Set([...person.membership.roles, role]),
    ];
    return person.membership.roles;
  }

  async removeMembershipRole(
    membershipId: string,
    role: MembershipRole,
  ) {
    const person = this.people.get(membershipId);
    if (!person) throw new Error("missing fake membership");

    person.membership.roles = removeMembershipRoleFromSet(
      person.membership.roles,
      role,
    );
    return person.membership.roles;
  }

  async transitionMembershipLifecycle(
    membershipId: string,
    input: Parameters<
      MembershipManagementRepository["transitionMembershipLifecycle"]
    >[1],
  ) {
    const person = this.people.get(membershipId);
    if (!person) throw new Error("missing fake membership");

    const patch = getMembershipLifecyclePatch(
      {
        status: person.membership.status,
        suspendedAt: person.membership.suspendedAt,
        suspensionReason: person.membership.suspensionReason,
      },
      input,
      new Date("2026-10-02T12:00:00Z"),
    );

    if (patch) {
      Object.assign(person.membership, patch);
    }

    return person;
  }
}

describe("membership management services", () => {
  it("lists and adds membership roles idempotently", async () => {
    const repository = new FakeMembershipRepository();
    const context = collegeContext(collegeA, orgA, ["COLLEGE_ADMIN"]);

    expect(
      await listMembershipRoles(context, membershipA, repository),
    ).toEqual(["FACULTY"]);

    expect(
      await addMembershipRole(
        context,
        membershipA,
        { role: "MENTOR" },
        repository,
      ),
    ).toEqual(["FACULTY", "MENTOR"]);

    expect(
      await addMembershipRole(
        context,
        membershipA,
        { role: "MENTOR" },
        repository,
      ),
    ).toEqual(["FACULTY", "MENTOR"]);
  });

  it("removes roles idempotently and protects the last membership role", async () => {
    const repository = new FakeMembershipRepository();
    const context = collegeContext(collegeA, orgA, ["COLLEGE_ADMIN"]);

    await addMembershipRole(
      context,
      membershipA,
      { role: "MENTOR" },
      repository,
    );

    expect(
      await removeMembershipRole(
        context,
        membershipA,
        { role: "MENTOR" },
        repository,
      ),
    ).toEqual(["FACULTY"]);

    expect(
      await removeMembershipRole(
        context,
        membershipA,
        { role: "MENTOR" },
        repository,
      ),
    ).toEqual(["FACULTY"]);

    await expect(
      removeMembershipRole(
        context,
        membershipA,
        { role: "FACULTY" },
        repository,
      ),
    ).rejects.toThrowError("LAST_MEMBERSHIP_ROLE");
  });

  it("denies cross-college and non-admin role changes", async () => {
    const repository = new FakeMembershipRepository();

    await expect(
      addMembershipRole(
        collegeContext(collegeA, orgA, ["COLLEGE_ADMIN"]),
        membershipB,
        { role: "FACULTY" },
        repository,
      ),
    ).rejects.toBeInstanceOf(AuthorizationError);

    await expect(
      addMembershipRole(
        collegeContext(collegeA, orgA, ["FACULTY"]),
        membershipA,
        { role: "MENTOR" },
        repository,
      ),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("suspends and reactivates one membership without affecting another college", async () => {
    const repository = new FakeMembershipRepository();
    const context = collegeContext(collegeA, orgA, ["COLLEGE_ADMIN"]);

    const suspended = await updateMembershipLifecycle(
      context,
      membershipA,
      { action: "SUSPEND", reason: "Policy review" },
      repository,
    );

    expect(suspended.membership).toMatchObject({
      status: "SUSPENDED",
      suspensionReason: "Policy review",
    });
    expect(
      repository.people.get(membershipB)?.membership.status,
    ).toBe("ACTIVE");

    const reactivated = await updateMembershipLifecycle(
      context,
      membershipA,
      { action: "REACTIVATE" },
      repository,
    );
    expect(reactivated.membership.status).toBe("ACTIVE");
  });

  it("ends memberships permanently and rejects later role mutations", async () => {
    const repository = new FakeMembershipRepository();
    const context = collegeContext(collegeA, orgA, ["COLLEGE_ADMIN"]);

    const ended = await updateMembershipLifecycle(
      context,
      membershipA,
      { action: "END" },
      repository,
    );
    expect(ended.membership.status).toBe("ENDED");

    await expect(
      addMembershipRole(
        context,
        membershipA,
        { role: "MENTOR" },
        repository,
      ),
    ).rejects.toThrowError("MEMBERSHIP_ENDED");

    await expect(
      updateMembershipLifecycle(
        context,
        membershipA,
        { action: "REACTIVATE" },
        repository,
      ),
    ).rejects.toThrowError("MEMBERSHIP_ENDED");
  });
});
