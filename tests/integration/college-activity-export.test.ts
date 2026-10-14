import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { recordActivityEvent } from "@/modules/activity/service";
import { exportCollegeActivity } from "@/modules/activity/college-activity-export-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const adminA: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "activity-export-a",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA, organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const adminB: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "activity-export-b",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeBMembership,
    collegeId: SEED_IDS.collegeB, organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const nonce = randomUUID();
const subjectType = "w42_csv_" + nonce.slice(0, 8);

describe.skipIf(!enabled)("College Activity export own-scope PostgreSQL", () => {
  afterAll(async () => {
    // Intentionally never delete from append-only activity_events.
    await closeDatabaseConnection();
  });
  it("includes own-college event and excludes other college event", async () => {
    const ownEvent = await recordActivityEvent(adminA, {
      eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_PROGRAM_UPDATED,
      collegeId: SEED_IDS.collegeA, organizationId: SEED_IDS.organization,
      subjectType, subjectId: "A-" + nonce,
      summary: "=INJECT protected activity",
    });
    const foreignEvent = await recordActivityEvent(adminB, {
      eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_PROGRAM_UPDATED,
      collegeId: SEED_IDS.collegeB, organizationId: SEED_IDS.organization,
      subjectType, subjectId: "B-" + nonce,
      summary: "Private activity B",
    });
    const result = await exportCollegeActivity(adminA, { subjectType });
    const selected = await exportCollegeActivity(adminA, { subjectType, subjectId: ownEvent.subjectId });
    expect(selected.csv).toContain(ownEvent.subjectId);
    expect(selected.csv).not.toContain(foreignEvent.subjectId);
    expect(result.csv).toContain(ownEvent.subjectId);
    expect(result.csv).not.toContain(foreignEvent.subjectId);
    expect(result.csv).toContain("'=INJECT");
    expect(result.truncated).toBe(false);
    const resultB = await exportCollegeActivity(adminB, { subjectType });
    expect(resultB.csv).toContain(foreignEvent.subjectId);
    expect(resultB.csv).not.toContain(ownEvent.subjectId);
  });
  it("denies other roles and forged college selector", async () => {
    await expect(exportCollegeActivity({
      ...adminA, membership: { ...adminA.membership!, roles: ["LEARNER"] },
    }, { subjectType })).rejects.toBeInstanceOf(AuthorizationError);
    await expect(exportCollegeActivity(adminA, {
      subjectType, collegeId: SEED_IDS.collegeB,
    })).rejects.toBeDefined();
  });
});
