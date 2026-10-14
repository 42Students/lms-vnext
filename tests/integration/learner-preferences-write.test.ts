import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getCandidatePreferences, upsertCandidatePreferences } from "@/modules/placements/candidate-preferences-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { newLearnerCourseWriteFixture, seedLearnerCourseWriteFixture, cleanupLearnerCourseWriteFixture,
  type LearnerCourseWriteFixture } from "../support/learner-course-write-fixture";

if (!process.env.TEST_DATABASE_URL) throw new Error("Use disposable TEST_DATABASE_URL");
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max:1 });
let fixture: LearnerCourseWriteFixture | null = null;
beforeEach(async () => {
  fixture = newLearnerCourseWriteFixture();
  await seedLearnerCourseWriteFixture(pool, fixture);
  await pool.query(`INSERT INTO module_access_rules(scope_type,scope_id,module,enabled,locked)
    VALUES('MEMBERSHIP',$1,'placements',true,false)`, [fixture.ids.membership]);
  await pool.query(`INSERT INTO placement_eligibility_decisions
    (college_id,scope_type,scope_id,status,decided_by_user_id)
    VALUES($1,'MEMBERSHIP',$2,'ELIGIBLE',$3)`,
    [SEED_IDS.collegeA, fixture.ids.membership, SEED_IDS.collegeAdminUser]);
}, 45_000);
afterEach(async () => {
  const current=fixture; fixture=null;
  if (!current) return;
  await pool.query("DELETE FROM placement_candidate_preferences WHERE membership_id=$1", [current.ids.membership]);
  await pool.query("DELETE FROM placement_eligibility_decisions WHERE scope_type='MEMBERSHIP' AND scope_id=$1", [current.ids.membership]);
  await pool.query("DELETE FROM module_access_rules WHERE scope_type='MEMBERSHIP' AND scope_id=$1 AND module='placements'", [current.ids.membership]);
  await cleanupLearnerCourseWriteFixture(pool, current);
}, 45_000);
afterAll(async () => { await pool.end(); await closeDatabaseConnection(); }, 30_000);
describe("learner placement preferences write on fresh PostgreSQL", () => {
  it("saves bounded roles, locations, CTC and audits a private own-member update", async () => {
    const {context,ids}=fixture!;
    const result=await upsertCandidatePreferences(context, {
      preferredRoleTitles:["Backend Engineer"], preferredLocations:["Hyderabad"], minimumAnnualCtcInr: 1200000,
    });
    expect(result.membershipId).toBe(ids.membership);
    const persisted=await getCandidatePreferences(context);
    expect(persisted).toMatchObject({ preferredRoleTitles:["Backend Engineer"],
      preferredLocations:["Hyderabad"], minimumAnnualCtcInr:1200000 });
    const audits=await pool.query<{total:string}>(`SELECT count(*)::text AS total FROM activity_events
      WHERE actor_user_id=$1 AND event_type='placements.candidate_preferences.updated'`, [ids.user]);
    expect(audits.rows[0]?.total).toBe("1");
  });
  it("denies forged college, suspended learner, wrong role and swapped user without a write", async () => {
    const {context,ids}=fixture!;
    const bad:RequestContext[]=[
      {...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},
      {...context,membership:{...context.membership!,status:"SUSPENDED"}},
      {...context,membership:{...context.membership!,roles:["FACULTY"]}},
      {...context,user:{...context.user,id:SEED_IDS.facultyUser}},
    ];
    for (const actor of bad) await expect(upsertCandidatePreferences(actor,{
      preferredRoleTitles:["Illicit"], minimumAnnualCtcInr:1,
    })).rejects.toBeInstanceOf(AuthorizationError);
    const rows=await pool.query("SELECT membership_id FROM placement_candidate_preferences WHERE membership_id=$1",[ids.membership]);
    expect(rows.rows).toHaveLength(0);
  });
});
