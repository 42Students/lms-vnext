import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { requireLearnerPlacementAccess } from "@/modules/placements/learner-participation-guard";
import { getCandidatePreferences, upsertCandidatePreferences } from "@/modules/placements/candidate-preferences-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import {
  newLearnerPlacementWriteFixture,
  seedLearnerPlacementWriteFixture,
  cleanupLearnerPlacementWriteFixture,
  type LearnerPlacementWriteFixture,
} from "../support/learner-placement-write-fixture";

if (!process.env.TEST_DATABASE_URL) throw new Error("Use a disposable TEST_DATABASE_URL");
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 });
let fixture: LearnerPlacementWriteFixture | null = null;

beforeEach(async () => {
  fixture = newLearnerPlacementWriteFixture();
  await seedLearnerPlacementWriteFixture(pool, fixture);
}, 45_000);

afterEach(async () => {
  const current = fixture; fixture = null;
  if (current) await cleanupLearnerPlacementWriteFixture(pool, current);
}, 45_000);
afterAll(async () => {
  await pool.end();
  await closeDatabaseConnection();
}, 30_000);

describe("learner placement preferences with an independent ACTIVE enrollment", () => {
  it("passes the real placement gate, saves roles/CTC and audits one own-member write", async () => {
    const { ids, context } = fixture!;
    const enrollment = await pool.query<{total:string}>(
      "SELECT count(*)::text AS total FROM learner_program_enrollments WHERE membership_id=$1 AND status='ACTIVE'",
      [ids.membership],
    );
    expect(enrollment.rows[0]?.total).toBe("1");
    const paid = await pool.query<{enabled:boolean}>(
      "SELECT enabled FROM module_access_rules WHERE scope_type='COLLEGE' AND scope_id=$1 AND module='placements'",
      [ids.college],
    );
    expect(paid.rows[0]?.enabled).toBe(true);
    const eligibility = await pool.query<{status:string}>(
      "SELECT status FROM placement_eligibility_decisions WHERE college_id=$1 AND scope_type='MEMBERSHIP' AND scope_id=$2",
      [ids.college, ids.membership],
    );
    expect(eligibility.rows[0]?.status).toBe("ELIGIBLE");
    expect((await requireLearnerPlacementAccess(context)).id).toBe(ids.membership);

    const saved = await upsertCandidatePreferences(context, {
      preferredRoleTitles: ["Backend Engineer"],
      preferredLocations: ["Hyderabad"],
      minimumAnnualCtcInr: 1_200_000,
    });
    expect(saved.membershipId).toBe(ids.membership);
    expect(await getCandidatePreferences(context)).toMatchObject({
      preferredRoleTitles: ["Backend Engineer"],
      preferredLocations: ["Hyderabad"],
      minimumAnnualCtcInr: 1_200_000,
    });
    const audit = await pool.query<{total:string}>(
      "SELECT count(*)::text AS total FROM activity_events WHERE actor_user_id=$1 AND actor_membership_id=$2 AND college_id=$3 AND event_type='placements.candidate_preferences.updated'",
      [ids.user, ids.membership, ids.college],
    );
    expect(audit.rows[0]?.total).toBe("1");
  }, 30_000);

  it("rejects forged college, suspended, wrong role and swapped principal without mutation", async () => {
    const {ids, context}=fixture!;
    const denied:RequestContext[] = [
      {...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},
      {...context,membership:{...context.membership!,status:"SUSPENDED"}},
      {...context,membership:{...context.membership!,roles:["FACULTY"]}},
      {...context,user:{...context.user,id:SEED_IDS.facultyUser}},
    ];
    for(const actor of denied) await expect(upsertCandidatePreferences(actor,{
      preferredRoleTitles:["Forged"],minimumAnnualCtcInr:1,
    })).rejects.toBeInstanceOf(AuthorizationError);

    // Persisted suspension must win even when request context still says ACTIVE.
    await pool.query(
      "UPDATE college_memberships SET status='SUSPENDED',suspended_at=now() WHERE id=$1",
      [ids.membership],
    );
    try {
      await expect(upsertCandidatePreferences(context,{
        preferredRoleTitles:["Forged"],minimumAnnualCtcInr:1,
      })).rejects.toBeInstanceOf(AuthorizationError);
    } finally {
      await pool.query(
        "UPDATE college_memberships SET status='ACTIVE',suspended_at=NULL WHERE id=$1",
        [ids.membership],
      );
    }
    const preferences = await pool.query(
      "SELECT membership_id FROM placement_candidate_preferences WHERE membership_id=$1",
      [ids.membership],
    );
    expect(preferences.rows).toHaveLength(0);
  }, 30_000);
});
