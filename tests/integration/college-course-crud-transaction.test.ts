import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { closeDatabaseConnection, getDb } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { createCourse } from "@/modules/courses/course-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = !!process.env.TEST_DATABASE_URL &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });

const admin: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "w-course-crud-admin",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA, organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const foreign: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "w-course-crud-foreign",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeBMembership,
    collegeId: SEED_IDS.collegeB, organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const learner: RequestContext = {
  ...admin, membership: { ...admin.membership!, roles: ["LEARNER"] },
};

describe.skipIf(!enabled)("College course create and denial, rollback-only PostgreSQL", () => {
  afterAll(async () => { await closeDatabaseConnection(); });

  it("creates real course and append-only audit inside a transaction; denies foreign/wrong role", async () => {
    const marker = "w-course-" + randomUUID().slice(0, 8);
    const input = { departmentId: SEED_IDS.departmentA, name: marker, code: marker };
    await expect(getDb().transaction(async tx => {
      await expect(createCourse(foreign, input)).rejects.toBeInstanceOf(AuthorizationError);
      await expect(createCourse(learner, input)).rejects.toBeInstanceOf(AuthorizationError);
      const created = await createCourse(admin, input, work => tx.transaction(work));
      expect(created).toMatchObject({ name: marker, code: marker,
        departmentId: SEED_IDS.departmentA, status: "ACTIVE" });
      const audit = await tx.execute(sql`SELECT event_type,actor_user_id,subject_id
        FROM activity_events WHERE subject_id=${created.id} ORDER BY occurred_at DESC`);
      expect(audit.rows[0]).toMatchObject({
        event_type: "courses.catalog.created", actor_user_id: SEED_IDS.collegeAdminUser,
        subject_id: created.id,
      });
      // The entire outer transaction rolls back including the immutable audit.
      // This test never DELETEs append-only activity_events.
      throw new Error("COURSE_FIXTURE_ROLLBACK");
    })).rejects.toThrow("COURSE_FIXTURE_ROLLBACK");
  });
});
