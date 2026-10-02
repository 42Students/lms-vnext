import { describe, expect, it } from "vitest";
import type { MembershipRole } from "@/modules/identity/constants";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  type IdentityDirectory,
  type IdentityDirectoryCreateInput,
  type IdentityDirectoryUpdateInput,
  type IdentityDirectoryUser,
} from "@/modules/people/identity";
import {
  onboardPerson,
  type OnboardedPerson,
  type PeopleRepository,
  type PersistPersonMembershipInput,
} from "@/modules/people/service";

const collegeA = "7f8e7b00-8503-4a2d-a222-fdfe8eb55ac0";
const collegeB = "b14f1d5a-97d4-4dfa-989a-5c9bbf713cde";
const orgA = "47c5f3b4-1e89-430e-9ac8-718758e72403";
const orgB = "c6dba3fd-3515-45c6-bab4-9293e80276f1";

class FakeIdentityDirectory implements IdentityDirectory {
  private users = new Map<string, IdentityDirectoryUser>();

  async findByPhone(phoneNumber: string) {
    return (
      [...this.users.values()].find(
        (user) => user.phoneNumber === phoneNumber,
      ) ?? null
    );
  }

  async findByEmail(email: string) {
    const normalized = email.toLowerCase();
    return (
      [...this.users.values()].find(
        (user) => user.email?.toLowerCase() === normalized,
      ) ?? null
    );
  }

  async createUser(input: IdentityDirectoryCreateInput) {
    const user: IdentityDirectoryUser = {
      uid: `uid-${this.users.size + 1}`,
      phoneNumber: input.phoneNumber,
      email: input.email ?? null,
      displayName: input.displayName,
    };
    this.users.set(user.uid, user);
    return { ...user };
  }

  async updateUser(
    uid: string,
    input: IdentityDirectoryUpdateInput,
  ) {
    const current = this.users.get(uid);
    if (!current) throw new Error("missing fake user");

    const updated = { ...current, ...input };
    this.users.set(uid, updated);
    return { ...updated };
  }
}

class FakePeopleRepository implements PeopleRepository {
  readonly persistCalls: PersistPersonMembershipInput[] = [];
  private users = new Map<string, OnboardedPerson["user"]>();
  private memberships = new Map<
    string,
    {
      id: string;
      collegeId: string;
      status: "ACTIVE";
      roles: Set<MembershipRole>;
    }
  >();

  async loadActiveCollege(collegeId: string) {
    if (collegeId === collegeA) {
      return { id: collegeA, organizationId: orgA };
    }
    if (collegeId === collegeB) {
      return { id: collegeB, organizationId: orgB };
    }
    return null;
  }

  async persistPersonMembership(input: PersistPersonMembershipInput) {
    this.persistCalls.push(input);

    let user = this.users.get(input.identityUid);
    if (!user) {
      user = {
        id: `user-${this.users.size + 1}`,
        identityUid: input.identityUid,
        phoneE164: input.phoneE164,
        email: input.email ?? null,
        displayName: input.displayName,
      };
      this.users.set(input.identityUid, user);
    }

    const key = `${input.identityUid}:${input.collegeId}`;
    let membership = this.memberships.get(key);
    if (!membership) {
      membership = {
        id: `membership-${this.memberships.size + 1}`,
        collegeId: input.collegeId,
        status: "ACTIVE",
        roles: new Set(),
      };
      this.memberships.set(key, membership);
    }

    for (const role of input.roles) {
      membership.roles.add(role);
    }

    return {
      user,
      membership: {
        id: membership.id,
        collegeId: membership.collegeId,
        status: "ACTIVE" as const,
        roles: [...membership.roles],
      },
    };
  }
}

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

function superAdminContext(): RequestContext {
  return {
    user: {
      ...baseUser,
      systemRoles: ["SUPER_ADMIN"],
    },
    membership: null,
  };
}

const baseInput = {
  phoneE164: "+919397662127",
  email: "phani@example.com",
  displayName: "Phanindra",
  roles: ["FACULTY", "MENTOR", "FACULTY"] as const,
};

describe("people onboarding service", () => {
  it("keeps repeat onboarding idempotent and deduplicates roles", async () => {
    const identityDirectory = new FakeIdentityDirectory();
    const repository = new FakePeopleRepository();
    const context = collegeContext(collegeA, orgA, ["COLLEGE_ADMIN"]);

    const first = await onboardPerson(
      context,
      { ...baseInput, collegeId: collegeA },
      { identityDirectory, repository },
    );
    const second = await onboardPerson(
      context,
      { ...baseInput, collegeId: collegeA },
      { identityDirectory, repository },
    );

    expect(second.user.id).toBe(first.user.id);
    expect(second.membership.id).toBe(first.membership.id);
    expect(new Set(second.membership.roles)).toEqual(
      new Set(["FACULTY", "MENTOR"]),
    );
    expect(repository.persistCalls[0]?.roles).toEqual([
      "FACULTY",
      "MENTOR",
    ]);
  });

  it("lets one canonical person join a second college", async () => {
    const identityDirectory = new FakeIdentityDirectory();
    const repository = new FakePeopleRepository();
    const context = superAdminContext();

    const first = await onboardPerson(
      context,
      { ...baseInput, collegeId: collegeA },
      { identityDirectory, repository },
    );
    const second = await onboardPerson(
      context,
      { ...baseInput, collegeId: collegeB, roles: ["LEARNER"] },
      { identityDirectory, repository },
    );

    expect(second.user.id).toBe(first.user.id);
    expect(second.membership.id).not.toBe(first.membership.id);
    expect(second.membership.collegeId).toBe(collegeB);
  });

  it("denies a college admin onboarding into another college before identity creation", async () => {
    const identityDirectory = new FakeIdentityDirectory();
    const repository = new FakePeopleRepository();
    const context = collegeContext(collegeA, orgA, ["COLLEGE_ADMIN"]);

    await expect(
      onboardPerson(
        context,
        { ...baseInput, collegeId: collegeB },
        { identityDirectory, repository },
      ),
    ).rejects.toBeInstanceOf(AuthorizationError);

    expect(repository.persistCalls).toHaveLength(0);
  });

  it("denies faculty, mentors, TPOs and learners unless separately college admin", async () => {
    for (const role of ["FACULTY", "MENTOR", "TPO", "LEARNER"] as const) {
      const identityDirectory = new FakeIdentityDirectory();
      const repository = new FakePeopleRepository();
      const context = collegeContext(collegeA, orgA, [role]);

      await expect(
        onboardPerson(
          context,
          { ...baseInput, collegeId: collegeA },
          { identityDirectory, repository },
        ),
      ).rejects.toBeInstanceOf(AuthorizationError);
      expect(repository.persistCalls).toHaveLength(0);
    }
  });
});
