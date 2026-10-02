import { describe, expect, it } from "vitest";
import type { MembershipRole } from "@/modules/identity/constants";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { PeopleServiceError } from "@/modules/people/errors";
import {
  getFacultyProfile,
  getLearnerProfile,
  upsertFacultyProfile,
  upsertLearnerProfile,
  type FacultyProfileView,
  type LearnerProfileView,
  type ProfileRepository,
} from "@/modules/people/profile-service";
import type { PersonMembershipView } from "@/modules/people/service";

const collegeA = "7f8e7b00-8503-4a2d-a222-fdfe8eb55ac0";
const collegeB = "b14f1d5a-97d4-4dfa-989a-5c9bbf713cde";
const orgA = "47c5f3b4-1e89-430e-9ac8-718758e72403";
const orgB = "c6dba3fd-3515-45c6-bab4-9293e80276f1";
const learnerMembership = "9c0ee299-faa4-4166-ab5e-35ec463940ce";
const facultyMembership = "f63b269d-92bd-4fa8-8caf-7bb91a91a591";
const otherCollegeMembership = "a45d86d2-fd5b-49c0-b77a-928cdad3c844";
const departmentA = "5cfab2a1-ddd6-45be-b05e-7b330ca6591c";
const departmentB = "e09e86c2-d4af-4e64-a343-1963be7f6b65";

const baseUser = {
  id: "admin-user",
  identityUid: "admin-identity",
  platformStatus: "ACTIVE" as const,
  systemRoles: [] as const,
};

function context(
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
  roles: MembershipRole[],
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
      status: "ACTIVE",
      suspendedAt: null,
      suspensionReason: null,
      createdAt: new Date("2026-10-02T00:00:00Z"),
      updatedAt: new Date("2026-10-02T00:00:00Z"),
      roles,
    },
  };
}

class FakeProfileRepository implements ProfileRepository {
  readonly people = new Map<string, PersonMembershipView>([
    [
      learnerMembership,
      person(
        learnerMembership,
        collegeA,
        orgA,
        ["LEARNER"],
      ),
    ],
    [
      facultyMembership,
      person(
        facultyMembership,
        collegeA,
        orgA,
        ["FACULTY"],
      ),
    ],
    [
      otherCollegeMembership,
      person(
        otherCollegeMembership,
        collegeB,
        orgB,
        ["LEARNER"],
      ),
    ],
  ]);

  readonly learnerProfiles = new Map<string, LearnerProfileView>();
  readonly facultyProfiles = new Map<string, FacultyProfileView>();

  async loadMembershipDetail(membershipId: string) {
    return this.people.get(membershipId) ?? null;
  }

  async loadLearnerProfile(membershipId: string) {
    return this.learnerProfiles.get(membershipId) ?? null;
  }

  async upsertLearnerProfile(
    membershipId: string,
    input: Parameters<ProfileRepository["upsertLearnerProfile"]>[1],
  ) {
    const existing = this.learnerProfiles.get(membershipId);
    const now = new Date("2026-10-02T12:00:00Z");
    const profile: LearnerProfileView = {
      membershipId,
      rollNumber: input.rollNumber ?? null,
      registrationNumber: input.registrationNumber ?? null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this.learnerProfiles.set(membershipId, profile);
    return profile;
  }

  async loadFacultyProfile(membershipId: string) {
    return this.facultyProfiles.get(membershipId) ?? null;
  }

  async upsertFacultyProfile(
    membershipId: string,
    input: Parameters<ProfileRepository["upsertFacultyProfile"]>[1],
  ) {
    const existing = this.facultyProfiles.get(membershipId);
    const now = new Date("2026-10-02T12:00:00Z");
    const profile: FacultyProfileView = {
      membershipId,
      primaryDepartmentId: input.primaryDepartmentId ?? null,
      employmentType: input.employmentType ?? null,
      academicTitle: input.academicTitle ?? null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this.facultyProfiles.set(membershipId, profile);
    return profile;
  }

  async hasActiveDepartment(departmentId: string, collegeId: string) {
    return (
      (departmentId === departmentA && collegeId === collegeA) ||
      (departmentId === departmentB && collegeId === collegeB)
    );
  }
}

describe("people profile services", () => {
  it("creates and reads a minimal learner profile in the authorized college", async () => {
    const repository = new FakeProfileRepository();
    const admin = context(collegeA, orgA, ["COLLEGE_ADMIN"]);

    const profile = await upsertLearnerProfile(
      admin,
      learnerMembership,
      {
        rollNumber: "  22CE001  ",
        registrationNumber: " REG-001 ",
      },
      repository,
    );

    expect(profile).toMatchObject({
      rollNumber: "22CE001",
      registrationNumber: "REG-001",
    });
    expect(
      await getLearnerProfile(
        admin,
        learnerMembership,
        repository,
      ),
    ).toEqual(profile);
  });

  it("denies cross-college profile management", async () => {
    const repository = new FakeProfileRepository();
    const admin = context(collegeA, orgA, ["COLLEGE_ADMIN"]);

    await expect(
      upsertLearnerProfile(
        admin,
        otherCollegeMembership,
        { rollNumber: "X" },
        repository,
      ),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("requires the matching membership role for each profile type", async () => {
    const repository = new FakeProfileRepository();
    const admin = context(collegeA, orgA, ["COLLEGE_ADMIN"]);

    await expect(
      upsertLearnerProfile(
        admin,
        facultyMembership,
        { rollNumber: "X" },
        repository,
      ),
    ).rejects.toMatchObject<Partial<PeopleServiceError>>({
      code: "LEARNER_ROLE_REQUIRED",
    });

    await expect(
      upsertFacultyProfile(
        admin,
        learnerMembership,
        { academicTitle: "Professor" },
        repository,
      ),
    ).rejects.toMatchObject<Partial<PeopleServiceError>>({
      code: "FACULTY_ROLE_REQUIRED",
    });
  });

  it("requires a faculty primary department to belong to the same college", async () => {
    const repository = new FakeProfileRepository();
    const admin = context(collegeA, orgA, ["COLLEGE_ADMIN"]);

    await expect(
      upsertFacultyProfile(
        admin,
        facultyMembership,
        {
          primaryDepartmentId: departmentB,
          employmentType: "FULL_TIME",
        },
        repository,
      ),
    ).rejects.toMatchObject<Partial<PeopleServiceError>>({
      code: "DEPARTMENT_NOT_FOUND",
    });

    const profile = await upsertFacultyProfile(
      admin,
      facultyMembership,
      {
        primaryDepartmentId: departmentA,
        employmentType: "FULL_TIME",
        academicTitle: "Assistant Professor",
      },
      repository,
    );

    expect(profile).toMatchObject({
      primaryDepartmentId: departmentA,
      employmentType: "FULL_TIME",
      academicTitle: "Assistant Professor",
    });
    expect(
      await getFacultyProfile(
        admin,
        facultyMembership,
        repository,
      ),
    ).toEqual(profile);
  });

  it("does not mutate profiles after membership has ended", async () => {
    const repository = new FakeProfileRepository();
    const admin = context(collegeA, orgA, ["COLLEGE_ADMIN"]);
    const target = repository.people.get(learnerMembership);
    if (!target) throw new Error("missing fake membership");
    target.membership.status = "ENDED";

    await expect(
      upsertLearnerProfile(
        admin,
        learnerMembership,
        { rollNumber: "X" },
        repository,
      ),
    ).rejects.toThrowError("MEMBERSHIP_ENDED");
  });
});
