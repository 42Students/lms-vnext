import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import {
  getMentorPortfolioActivity, getMentorReviewQueue,
} from "@/modules/projects/mentor-portfolio-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Mentor denial tests require isolated disposable TEST_DATABASE_URL");
}
const learner: RequestContext = {
  user: {id: SEED_IDS.learnerUser, identityUid: "mentor-test-learner",
    platformStatus: "ACTIVE", systemRoles: []},
  membership: {id: SEED_IDS.learnerCollegeAMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["LEARNER"]},
};
afterAll(async () => closeDatabaseConnection());
describe("Mentor portfolio deny-by-default PostgreSQL gates", () => {
  it("rejects learner role for both screens", async () => {
    await expect(getMentorReviewQueue(learner, {})).rejects.toBeDefined();
    await expect(getMentorPortfolioActivity(learner, {})).rejects.toBeDefined();
    await expect(getMentorPortfolioActivity(learner, {importance:"HIGH"})).rejects.toBeDefined();
  });
  it("rejects disabled mentor principal for both screens", async () => {
    const disabled: RequestContext = {...learner,
      user: {...learner.user, platformStatus: "DISABLED"},
      membership: {...learner.membership!, roles: ["MENTOR"]}};
    await expect(getMentorReviewQueue(disabled, {})).rejects.toBeDefined();
    await expect(getMentorPortfolioActivity(disabled, {})).rejects.toBeDefined();
  });
  it("rejects caller-controlled tenant and project IDs at Zod boundary", async () => {
    await expect(getMentorReviewQueue(learner, {collegeId: SEED_IDS.collegeA})).rejects.toBeDefined();
    await expect(getMentorPortfolioActivity(learner, {projectId: SEED_IDS.collegeA})).rejects.toBeDefined();
  });
});
