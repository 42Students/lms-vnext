import { describe, expect, it } from "vitest";
import type {
  MembershipRole,
  MembershipStatus,
} from "@/modules/identity/constants";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  getPersonMembershipDetail,
  listCollegePeople,
  type CollegePeoplePage,
  type PeopleReadRepository,
  type PersonMembershipView,
} from "@/modules/people/service";

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

function person(
  membershipId: string,
  collegeId: string,
  organizationId: string,
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
      roles: ["FACULTY"],
    },
  };
}

class FakeReadRepository implements PeopleReadRepository {
  async loadActiveCollege(collegeId: string) {
    if (collegeId === collegeA) {
      return { id: collegeA, organizationId: orgA };
    }
    if (collegeId === collegeB) {
      return { id: collegeB, organizationId: orgB };
    }
    return null;
  }

  async listCollegePeople(input: {
    collegeId: string;
    limit: number;
    offset: number;
  }): Promise<CollegePeoplePage> {
    return {
      items: [
        input.collegeId === collegeA
          ? person(membershipA, collegeA, orgA)
          : person(membershipB, collegeB, orgB),
      ],
      pagination: {
        limit: input.limit,
        offset: input.offset,
        total: 1,
      },
    };
  }

  async loadMembershipDetail(membershipId: string) {
    if (membershipId === membershipA) {
      return person(membershipA, collegeA, orgA);
    }
    if (membershipId === membershipB) {
      return person(membershipB, collegeB, orgB);
    }
    return null;
  }
}

describe("people read services", () => {
  it("lists a bounded page only after authorizing the target college", async () => {
    const repository = new FakeReadRepository();
    const context = collegeContext(collegeA, orgA, ["COLLEGE_ADMIN"]);

    const page = await listCollegePeople(
      context,
      { collegeId: collegeA, limit: "25", offset: "0" },
      repository,
    );

    expect(page.pagination).toEqual({
      limit: 25,
      offset: 0,
      total: 1,
    });
    expect(page.items[0]?.membership.collegeId).toBe(collegeA);
  });

  it("denies college people listing to non-admin or cross-college contexts", async () => {
    const repository = new FakeReadRepository();

    await expect(
      listCollegePeople(
        collegeContext(collegeA, orgA, ["FACULTY"]),
        { collegeId: collegeA },
        repository,
      ),
    ).rejects.toBeInstanceOf(AuthorizationError);

    await expect(
      listCollegePeople(
        collegeContext(collegeA, orgA, ["COLLEGE_ADMIN"]),
        { collegeId: collegeB },
        repository,
      ),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("authorizes membership detail from stored membership ownership", async () => {
    const repository = new FakeReadRepository();
    const context = collegeContext(collegeA, orgA, ["COLLEGE_ADMIN"]);

    const detail = await getPersonMembershipDetail(
      context,
      membershipA,
      repository,
    );

    expect(detail.membership.id).toBe(membershipA);

    await expect(
      getPersonMembershipDetail(context, membershipB, repository),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });
});
