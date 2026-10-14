import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { listActivityEvents } from "@/modules/activity/service";
import { AuthorizationError } from "@/modules/permissions/policy";
import { SEED_IDS } from "../../scripts/db-seed-data";
const enabled = !!process.env.TEST_DATABASE_URL && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 }) : null;
const admin: RequestContext = {user:{id:SEED_IDS.superAdminUser,identityUid:"audit-route-fixture",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
  membership:null,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}};
describe.skipIf(!enabled)("Super Admin audit URL source filter PG", () => {
  afterAll(async () => { await pool?.end(); await closeDatabaseConnection(); });
  it("reads own in-test activity, excludes foreign college, rejects wrong-role", async () => {
    const subject = randomUUID();
    await pool!.query("insert into activity_events (organization_id,college_id,module,event_type,subject_type,subject_id,summary) values ($1,$2,'PLATFORM','platform.fixture','admin_route',$3,$4)",
      [SEED_IDS.organization,SEED_IDS.collegeA,subject,"Admin route "+subject]);
    const own = await listActivityEvents(admin,{subjectId:subject});
    expect(own.groups.some(group => group.latest.event.subjectId === subject)).toBe(true);
    const foreign = {...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeB}};
    expect((await listActivityEvents(foreign,{subjectId:subject})).groups).toHaveLength(0);
    await expect(listActivityEvents({...admin,user:{...admin.user,systemRoles:[]}}, {subjectId:subject}))
      .rejects.toBeInstanceOf(AuthorizationError);
    // activity_events is append-only; fixture is intentionally retained.
  });
});
