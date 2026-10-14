import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { getFacultyContactDetail } from "@/modules/courses/faculty-contacts-service";
import { getMentorTeamHistory } from "@/modules/projects/mentor-team-history-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Faculty/Mentor detail tests require isolated TEST_DATABASE_URL");
}

const faculty: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "faculty-mentor-read-test",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["FACULTY", "MENTOR"],
  },
};
const learner: RequestContext = {
  user: {
    id: SEED_IDS.learnerUser,
    identityUid: "faculty-mentor-learner-test",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.learnerCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["LEARNER"],
  },
};

afterAll(async () => { await closeDatabaseConnection(); });

describe("Faculty contact / Mentor project membership database denials", () => {
  it("never permits cross-college Faculty contact lookup", async () => {
    await expect(getFacultyContactDetail(faculty,{
      contactsTab:"allContacts",
      membershipId: SEED_IDS.facultyCollegeBMembership,
    })).rejects.toBeDefined();
  });
  it("requires a persisted matching contact role, even for active same-college users", async () => {
    await expect(getFacultyContactDetail(faculty,{
      contactsTab:"students",
      membershipId: SEED_IDS.facultyCollegeAMembership,
    })).rejects.toBeDefined();
  });
  it("denies non-Faculty from directory detail", async () => {
    await expect(getFacultyContactDetail(learner,{
      contactsTab:"allContacts",
      membershipId: SEED_IDS.facultyCollegeAMembership,
    })).rejects.toBeDefined();
  });
  it("denies a non-Mentor from team lifecycle history", async () => {
    await expect(getMentorTeamHistory(learner,{
      projectId: SEED_IDS.collegeA,
    })).rejects.toBeDefined();
  });
  it("denies an active Mentor a nonexistent or unauthorized project", async () => {
    await expect(getMentorTeamHistory(faculty,{
      projectId: SEED_IDS.collegeA,
    })).rejects.toBeDefined();
  });
  it("blocks caller-controlled college scope in either reader", async () => {
    await expect(getFacultyContactDetail(faculty,{
      contactsTab:"allContacts",
      membershipId: SEED_IDS.learnerCollegeAMembership,
      collegeId: SEED_IDS.collegeB,
    })).rejects.toBeDefined();
    await expect(getMentorTeamHistory(faculty,{
      projectId: SEED_IDS.collegeA,
      collegeId: SEED_IDS.collegeB,
    })).rejects.toBeDefined();
  });
});
