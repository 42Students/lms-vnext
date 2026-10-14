import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { getLearnerAssessmentOverview } from "@/modules/courses/learner-assessment-service";
import { learnerAssignmentFileRequest } from "@/modules/courses/learner-assignment-file-model";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { newLearnerLearningFixture, seedLearnerLearningFixture } from "../support/learner-learning-surface-fixture";
if (!process.env.TEST_DATABASE_URL) throw new Error("Requires disposable TEST_DATABASE_URL");
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 });
const fixture = newLearnerLearningFixture();
beforeAll(async () => { await seedLearnerLearningFixture(pool, fixture); }, 45000);
afterAll(async () => {
  // Retain append-only fixture activity and referenced identities in this disposable DB.
  await pool.end(); await closeDatabaseConnection();
}, 30000);
describe("file UI uses only persisted own learner assignment delivery", () => {
  it("constructs file metadata from a real authorized assignment without claiming storage activation", async () => {
    const overview = await getLearnerAssessmentOverview(fixture.learner.context);
    const own = overview.assignments.find(item => item.id === fixture.ids.assignment);
    expect(own?.deliveryId).toBe(fixture.ids.delivery);
    if (!own) throw new Error("Own assignment missing");
    expect(learnerAssignmentFileRequest(own.deliveryId, { name: "proof.pdf", size: 10, type: "application/pdf" }).success).toBe(true);
  });
  it("denies foreign-college, suspended, wrong-role and forged-actor persisted reads", async () => {
    const base = fixture.learner.context;
    for (const actor of [
      { ...base, membership: { ...base.membership!, collegeId: SEED_IDS.collegeB } },
      { ...base, membership: { ...base.membership!, status: "SUSPENDED" } },
      { ...base, membership: { ...base.membership!, roles: ["FACULTY"] } },
      { ...base, user: { ...base.user, id: SEED_IDS.facultyUser } },
    ] as RequestContext[]) await expect(getLearnerAssessmentOverview(actor)).rejects.toBeDefined();
  });
});
