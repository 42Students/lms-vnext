import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { listActivityEvents } from "@/modules/activity/service";
import { exportSuperAdminActivity } from "@/modules/activity/super-admin-audit-export-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
const enabled = Boolean(process.env.TEST_DATABASE_URL) && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 }) : null;
const admin: RequestContext = { user: { id: SEED_IDS.superAdminUser, identityUid: "audit-search", platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] }, membership: null,
  adminScope: { organizationId: SEED_IDS.organization, collegeId: SEED_IDS.collegeA } };
describe.skipIf(!enabled)("Super Admin audit actor/entity text search (PG)", () => {
  afterAll(async () => { await pool?.end(); await closeDatabaseConnection(); });
  it("combines literal filters inside scope with identical CSV filtering", async () => {
    const token = randomUUID(), actor = randomUUID();
    await pool!.query("insert into users (id,identity_uid,display_name) values ($1,$2,$3)", [actor, "audit-" + token, "Actor_100% " + token]);
    for (const [collegeId, subjectId, summary] of [
      [SEED_IDS.collegeA, "own-" + token, "Review_100% " + token],
      [SEED_IDS.collegeA, "near-" + token, "ReviewX100X " + token],
      [SEED_IDS.collegeB, "foreign-" + token, "Review_100% " + token],
    ]) await pool!.query("insert into activity_events (organization_id,college_id,actor_user_id,module,event_type,subject_type,subject_id,summary) values ($1,$2,$3,'PLATFORM','platform.fixture','college',$4,$5)",
      [SEED_IDS.organization, collegeId, actor, subjectId, summary]);
    const filters = { actorName: "Actor_100% " + token, q: "Review_100% " + token };
    expect((await listActivityEvents(admin, filters)).items.map(row => row.event.subjectId)).toEqual(["own-" + token]);
    const exported = await exportSuperAdminActivity(admin, filters);
    expect(exported.csv).toContain("own-" + token);
    expect(exported.csv).not.toContain("near-" + token);
    expect(exported.csv).not.toContain("foreign-" + token);
    expect((await listActivityEvents(admin, { ...filters, actorName: "Missing " + token })).items).toEqual([]);
    await expect(exportSuperAdminActivity({ ...admin, adminScope: { organizationId: SEED_IDS.organization, collegeId: SEED_IDS.collegeB } },
      { ...filters, collegeId: SEED_IDS.collegeA })).rejects.toBeInstanceOf(AuthorizationError);
    await expect(exportSuperAdminActivity({ ...admin, user: { ...admin.user, systemRoles: [] } }, filters)).rejects.toBeInstanceOf(AuthorizationError);
    // Retain append-only activity and its referenced user fixtures.
  });
});
