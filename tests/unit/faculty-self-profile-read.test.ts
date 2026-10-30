import { describe, expect, it, vi } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import type { ProfileRepository } from "@/modules/people/profile-service";
import { getOwnFacultyProfile } from "@/modules/people/profile-service";
import { AuthorizationError } from "@/modules/permissions/policy";

const membershipId = "b7c2d1a4-5555-4444-8888-000000000001";
const collegeId = "b7c2d1a4-5555-4444-8888-000000000002";
const organizationId = "b7c2d1a4-5555-4444-8888-000000000003";

function ctx(roles: Array<"FACULTY" | "MENTOR" | "COLLEGE_ADMIN" | "LEARNER">): RequestContext {
  return {
    user: { id: "faculty-user", identityUid: "faculty-identity", platformStatus: "ACTIVE", systemRoles: [] },
    membership: { id: membershipId, collegeId, organizationId, status: "ACTIVE", roles },
  };
}

function repo(ownerId = "faculty-user", storedRoles: Array<"FACULTY" | "MENTOR" | "COLLEGE_ADMIN"> = ["FACULTY"]) {
  const loadMembershipDetail = vi.fn(async () => ({
    organizationId,
    user: { id: ownerId, identityUid: "faculty-identity", phoneE164: null, email: "faculty@example.org", displayName: "Faculty User" },
    membership: {
      id: membershipId,
      collegeId,
      status: "ACTIVE" as const,
      suspendedAt: null, suspensionReason: null,
      createdAt: new Date(0), updatedAt: new Date(0),
      roles: storedRoles,
    },
  }));
  const loadFacultyProfile = vi.fn(async () => null);
  return {
    loadMembershipDetail,
    loadFacultyProfile,
  } as unknown as ProfileRepository & {
    loadMembershipDetail: typeof loadMembershipDetail;
    loadFacultyProfile: typeof loadFacultyProfile;
  };
}

describe("Faculty self-profile read authorization", () => {
  it("loads only the active Faculty member's own record", async () => {
    const repository = repo();
    const result = await getOwnFacultyProfile(ctx(["FACULTY"]), repository);
    expect(result.person.user.id).toBe("faculty-user");
    expect(result.profile).toBeNull();
    expect(repository.loadMembershipDetail).toHaveBeenCalledWith(membershipId);
    expect(repository.loadFacultyProfile).toHaveBeenCalledWith(membershipId);
  });

  it.each([
    ["LEARNER"] as const,
    ["FACULTY", "MENTOR"] as const,
    ["FACULTY", "COLLEGE_ADMIN"] as const,
  ])("rejects non-teaching Faculty identity roles", async (...roles) => {
    const repository = repo();
    await expect(getOwnFacultyProfile(ctx([...roles]), repository))
      .rejects.toBeInstanceOf(AuthorizationError);
    expect(repository.loadMembershipDetail).not.toHaveBeenCalled();
  });

  it("rejects stale user ownership and never discloses Faculty profile data", async () => {
    const repository = repo("another-user");
    await expect(getOwnFacultyProfile(ctx(["FACULTY"]), repository))
      .rejects.toBeInstanceOf(AuthorizationError);
    expect(repository.loadFacultyProfile).not.toHaveBeenCalled();
  });

  it("allows a persisted mixed-role membership only under selected Faculty context", async () => {
    for(const roles of [
      ["FACULTY","MENTOR"],["FACULTY","COLLEGE_ADMIN"],
    ] as Array<Array<"FACULTY"|"MENTOR"|"COLLEGE_ADMIN">>) {
      const repository=repo("faculty-user",roles);
      const result=await getOwnFacultyProfile(ctx(["FACULTY"]),repository);
      expect(result.person.user.id).toBe("faculty-user");
      expect(repository.loadFacultyProfile).toHaveBeenCalledWith(membershipId);
    }
  });
  it("rejects a forged stale Faculty request if the persisted grant is Mentor-only",async()=>{
    const repository=repo("faculty-user",["MENTOR"]);
    await expect(getOwnFacultyProfile(ctx(["FACULTY"]),repository))
      .rejects.toBeInstanceOf(AuthorizationError);
    expect(repository.loadFacultyProfile).not.toHaveBeenCalled();
  });
});
