import { randomUUID } from "node:crypto";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { SEED_IDS } from "../../scripts/db-seed-data";
import {
  upsertPlacementBatch,
  transitionPlacementBatch,
  recordPlacementRegistration,
} from "@/modules/placements/db08-batch-registration-service";

const enabled = process.env.DB08_SCHEMA_READY === "1";
const connection = process.env.TEST_DATABASE_URL;
if (enabled && (!connection || process.env.DB08_ISOLATED_TEST_DATABASE !== "1")) {
  throw new Error(
    "DB08 lifecycle tests require TEST_DATABASE_URL and DB08_ISOLATED_TEST_DATABASE=1",
  );
}
const pool = enabled ? new Pool({ connectionString: connection, max: 2 }) : null;
const ids = {
  users: [] as string[],
  memberships: [] as string[],
  programs: [] as string[],
  periods: [] as string[],
  cohorts: [] as string[],
  enrollments: [] as string[],
};

const tpo: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "seed-shared-faculty",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["FACULTY", "TPO"],
  },
};

async function createCohortLearner(college = SEED_IDS.collegeA) {
  if (!pool) throw new Error("No DB08 test PostgreSQL pool");
  const userId = randomUUID();
  const membershipId = randomUUID();
  const programId = randomUUID();
  const periodId = randomUUID();
  const cohortId = randomUUID();
  const enrollmentId = randomUUID();
  ids.users.push(userId);
  ids.memberships.push(membershipId);
  ids.programs.push(programId);
  ids.periods.push(periodId);
  ids.cohorts.push(cohortId);
  ids.enrollments.push(enrollmentId);
  const departmentId = college === SEED_IDS.collegeA
    ? SEED_IDS.departmentA : SEED_IDS.departmentB;
  await pool.query(
    "INSERT INTO users (id,identity_uid) VALUES ($1,$2)",
    [userId, "db08-" + userId],
  );
  await pool.query(
    "INSERT INTO college_memberships (id,user_id,college_id) VALUES ($1,$2,$3)",
    [membershipId, userId, college],
  );
  await pool.query(
    "INSERT INTO membership_roles (membership_id,role) VALUES ($1,'LEARNER')",
    [membershipId],
  );
  await pool.query(
    "INSERT INTO programs (id,department_id,name,code,duration_terms) VALUES ($1,$2,'DB08 Program',$3,8)",
    [programId, departmentId, "db08-" + programId],
  );
  await pool.query(
    `INSERT INTO academic_periods (id,college_id,name,code,start_date,end_date)
      VALUES ($1,$2,'DB08 Period',$3,'2026-08-01','2027-07-31')`,
    [periodId, college, "db08-" + periodId],
  );
  await pool.query(
    "INSERT INTO cohorts (id,program_id,name,code,start_period_id) VALUES ($1,$2,'DB08 Cohort',$3,$4)",
    [cohortId, programId, "db08-" + cohortId, periodId],
  );
  await pool.query(
    `INSERT INTO learner_program_enrollments
     (id,membership_id,program_id,cohort_id)
     VALUES ($1,$2,$3,$4)`,
    [enrollmentId, membershipId, programId, cohortId],
  );
  const learner: RequestContext = {
    user: {
      id: userId,
      identityUid: "db08-" + userId,
      platformStatus: "ACTIVE",
      systemRoles: [],
    },
    membership: {
      id: membershipId,
      collegeId: college,
      organizationId: SEED_IDS.organization,
      status: "ACTIVE",
      roles: ["LEARNER"],
    },
  };
  return { learner, cohortId, membershipId };
}

afterEach(async () => {
  if (!pool) return;
  if (ids.memberships.length) {
    await pool.query("DELETE FROM placement_registrations WHERE membership_id=ANY($1::uuid[])", [ids.memberships]);
  }
  if (ids.cohorts.length) {
    await pool.query("DELETE FROM placement_batches WHERE cohort_id=ANY($1::uuid[])", [ids.cohorts]);
  }
  if (ids.enrollments.length) {
    await pool.query("DELETE FROM learner_program_enrollments WHERE id=ANY($1::uuid[])", [ids.enrollments]);
  }
  if (ids.cohorts.length) {
    await pool.query("DELETE FROM cohorts WHERE id=ANY($1::uuid[])", [ids.cohorts]);
  }
  if (ids.periods.length) {
    await pool.query("DELETE FROM academic_periods WHERE id=ANY($1::uuid[])", [ids.periods]);
  }
  if (ids.programs.length) {
    await pool.query("DELETE FROM programs WHERE id=ANY($1::uuid[])", [ids.programs]);
  }
  if (ids.memberships.length) {
    await pool.query("DELETE FROM membership_roles WHERE membership_id=ANY($1::uuid[])", [ids.memberships]);
    await pool.query("DELETE FROM college_memberships WHERE id=ANY($1::uuid[])", [ids.memberships]);
  }
  if (ids.users.length) {
    await pool.query("DELETE FROM users WHERE id=ANY($1::uuid[])", [ids.users]);
  }
  Object.values(ids).forEach((list) => { list.length = 0; });
});
afterAll(async () => {
  if (pool) await pool.end();
  if (enabled) await closeDatabaseConnection();
});

describe.skipIf(!enabled)("DB08-B batch and registration PostgreSQL contracts (migration-required)", () => {
  it("treats absent batch as not started and preserves invitation/finalization", async () => {
    const { learner, cohortId, membershipId } = await createCohortLearner();
    await expect(recordPlacementRegistration(learner, {
      collegeId: SEED_IDS.collegeA,
      seasonId: SEED_IDS.placementSeasonA,
      membershipId,
      choice: "PLACEMENTS",
    })).rejects.toMatchObject({ code: "PLACEMENT_BATCH_NOT_STARTED" });

    const batch = await upsertPlacementBatch(tpo, {
      collegeId: SEED_IDS.collegeA, cohortId,
    });
    expect(batch.finishedAt).toBeNull();
    const invite = await transitionPlacementBatch(tpo, {
      collegeId: SEED_IDS.collegeA, cohortId, action: "INVITE",
    });
    expect(invite.invitedAt).not.toBeNull();
    const finish = await transitionPlacementBatch(tpo, {
      collegeId: SEED_IDS.collegeA, cohortId, action: "FINISH",
    });
    expect(finish.finishedAt).not.toBeNull();
    await expect(recordPlacementRegistration(learner, {
      collegeId: SEED_IDS.collegeA,
      seasonId: SEED_IDS.placementSeasonA,
      membershipId,
      choice: "PLACEMENTS",
    })).rejects.toMatchObject({ code: "PLACEMENT_BATCH_NOT_STARTED" });
  });

  it("does not invent fresh consent timestamps for a repeated registration", async () => {
    const { learner, cohortId, membershipId } = await createCohortLearner();
    await upsertPlacementBatch(tpo, { collegeId: SEED_IDS.collegeA, cohortId });
    const form = {
      collegeId: SEED_IDS.collegeA,
      seasonId: SEED_IDS.placementSeasonA,
      membershipId,
      choice: "PLACEMENTS",
      consentVersion: "v1",
    };
    const first = await recordPlacementRegistration(learner, form);
    const second = await recordPlacementRegistration(learner, form);
    expect(first.replayed).toBe(false);
    expect(second.replayed).toBe(true);
    expect(second.consentAt?.toISOString()).toBe(first.consentAt?.toISOString());
    const count = await pool!.query(
      "SELECT count(*)::int AS n FROM placement_registrations WHERE membership_id=$1",
      [membershipId],
    );
    expect(count.rows[0].n).toBe(1);
  });

  it("rejects registration beyond a batch deadline", async () => {
    const { learner, cohortId, membershipId } = await createCohortLearner();
    await upsertPlacementBatch(tpo, {
      collegeId: SEED_IDS.collegeA, cohortId,
      registrationDeadline: "2026-01-01T12:00:00+05:30",
    });
    await expect(recordPlacementRegistration(learner, {
      collegeId: SEED_IDS.collegeA,
      seasonId: SEED_IDS.placementSeasonA,
      membershipId,
      choice: "HIGHER_STUDIES",
    }, new Date("2026-10-11T00:00:00Z"))).rejects.toMatchObject({
      code: "PLACEMENT_REGISTRATION_DEADLINE_PASSED",
    });
  });

  it("rejects a college-A TPO managing a college-B cohort", async () => {
    const { cohortId } = await createCohortLearner(SEED_IDS.collegeB);
    await expect(upsertPlacementBatch(tpo, {
      collegeId: SEED_IDS.collegeA, cohortId,
    })).rejects.toMatchObject({ code: "PLACEMENT_BATCH_SCOPE_MISMATCH" });
  });
});
