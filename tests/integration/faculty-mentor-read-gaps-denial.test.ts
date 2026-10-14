import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { getFacultyStudentDetail } from "@/modules/courses/faculty-student-detail-service";
import { getMentorTaskReviews } from "@/modules/projects/mentor-task-review-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Faculty/Mentor denial tests require isolated disposable TEST_DATABASE_URL");
}
const learner: RequestContext = {
  user: { id: SEED_IDS.learnerUser, identityUid: "faculty-mentor-read-denial",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.learnerCollegeAMembership,
    collegeId: SEED_IDS.collegeA, organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["LEARNER"] },
};
afterAll(async () => { await closeDatabaseConnection(); });

describe("Faculty/Mentor read-only denial paths on PostgreSQL", () => {
  it("rejects learner role on the Faculty drill-in", async () => {
    await expect(getFacultyStudentDetail(learner, {
      deliveryId: SEED_IDS.collegeA, membershipId: learner.membership!.id,
    })).rejects.toBeDefined();
  });
  it("rejects learner role on Mentor task queue", async () => {
    await expect(getMentorTaskReviews(learner, {})).rejects.toBeDefined();
  });
  it("rejects disabled Faculty and Mentor accounts", async () => {
    const disabled: RequestContext = {
      ...learner,
      user: {...learner.user, platformStatus:"DISABLED"},
      membership: {...learner.membership!,roles:["FACULTY","MENTOR"]},
    };
    await expect(getFacultyStudentDetail(disabled, {
      deliveryId: SEED_IDS.collegeA, membershipId: learner.membership!.id,
    })).rejects.toBeDefined();
    await expect(getMentorTaskReviews(disabled, {})).rejects.toBeDefined();
  });
  it("rejects untrusted extra college selectors at the Zod boundary", async () => {
    await expect(getFacultyStudentDetail(learner, {
      deliveryId: SEED_IDS.collegeA,
      membershipId: learner.membership!.id, collegeId: SEED_IDS.collegeA,
    })).rejects.toBeDefined();
    await expect(getMentorTaskReviews(learner,{collegeId:SEED_IDS.collegeA})).rejects.toBeDefined();
  });
});
