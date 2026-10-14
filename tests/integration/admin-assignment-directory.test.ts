import { Pool } from "pg";
import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { listCollegeAssessmentAggregate } from "@/modules/courses/college-assessment-aggregate-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import { makeChat6AssessmentLesson } from "../support/chat6-assessment-fixture";
const enabled = Boolean(process.env.TEST_DATABASE_URL) && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 }) : null;
const admin: RequestContext = { user: { id: SEED_IDS.superAdminUser, identityUid: "assignment-admin",
  platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] }, membership: null,
  adminScope: { organizationId: SEED_IDS.organization, collegeId: SEED_IDS.collegeA } };
describe.skipIf(!enabled)("Super Admin assignments read fixture PG", () => {
  afterAll(async () => { await pool?.end(); await closeDatabaseConnection(); });
  it("finds own assignment, hides foreign college record, rejects wrong role", async () => {
    const { lessonId, suffix } = await makeChat6AssessmentLesson(pool!);
    const title = "Admin Assignment " + suffix;
    const created = await pool!.query<{id:string}>(
      "insert into course_assignments (lesson_id,title,max_points,sequence,created_by_user_id) values ($1,$2,10,0,$3) returning id",
      [lessonId,title,SEED_IDS.superAdminUser]);
    const own = await listCollegeAssessmentAggregate(admin, "ASSIGNMENT", { q: title });
    expect(own.items.map(row => row.id)).toContain(created.rows[0]!.id);
    const foreign = { ...admin, adminScope: { organizationId: SEED_IDS.organization, collegeId: SEED_IDS.collegeB } };
    expect((await listCollegeAssessmentAggregate(foreign, "ASSIGNMENT", { q: title })).items).toHaveLength(0);
    await expect(listCollegeAssessmentAggregate({
      ...admin, user: { ...admin.user, systemRoles: [] },
    }, "ASSIGNMENT", {})).rejects.toBeInstanceOf(AuthorizationError);
  });
});
