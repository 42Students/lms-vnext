import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import {
  decidePlacementParticipation,
  markPlacementBatchFinished,
  markPlacementBatchInvited,
  undoPlacementParticipation,
  upsertPlacementBatchSettings,
} from "@/modules/placements/batch-participation-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

const url = process.env.TEST_DATABASE_URL;
if (!url ||
  process.env.DATABASE_URL !== url ||
  process.env.DB08_ISOLATED_TEST_DATABASE !== "1" ||
  process.env.DB08_MIGRATION_APPLIED !== "1") {
  throw new Error(
    "DB08 tests require matching TEST_DATABASE_URL/DATABASE_URL, DB08_ISOLATED_TEST_DATABASE=1 and DB08_MIGRATION_APPLIED=1, on an isolated disposable PostgreSQL with the staged DB08 schema actually applied",
  );
}
const pool = new Pool({ connectionString: url, max: 4 });

const admin: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser, identityUid: "seed-college-admin",
    platformStatus: "ACTIVE", systemRoles: [],
  },
  membership: {
    id: SEED_IDS.collegeAdminMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"],
  },
};

const f = {
  users: [] as string[], memberships: [] as string[],
  programs: [] as string[], periods: [] as string[],
  cohorts: [] as string[], sections: [] as string[],
  learnerEnrollments: [] as string[], sectionEnrollments: [] as string[],
};

async function makeAcademicFixture(collegeId: string) {
  const programId = randomUUID();
  const periodId = randomUUID();
  const cohortId = randomUUID();
  const sectionId = randomUUID();
  f.programs.push(programId);
  f.periods.push(periodId);
  f.cohorts.push(cohortId);
  f.sections.push(sectionId);
  const departmentId = collegeId === SEED_IDS.collegeA
    ? SEED_IDS.departmentA : SEED_IDS.departmentB;
  await pool.query(
    "INSERT INTO programs (id,department_id,name,code,duration_terms) VALUES ($1,$2,$3,$4,8)",
    [programId, departmentId, "DB08 Program "+programId, "DB08-"+programId],
  );
  await pool.query(
    "INSERT INTO academic_periods (id,college_id,name,code,start_date,end_date) VALUES ($1,$2,$3,$4,'2026-07-01','2026-12-31')",
    [periodId, collegeId, "DB08 Period "+periodId, "DB08-"+periodId],
  );
  await pool.query(
    "INSERT INTO cohorts (id,program_id,name,code,start_period_id) VALUES ($1,$2,$3,$4,$5)",
    [cohortId, programId, "DB08 Cohort "+cohortId, "DB08-"+cohortId, periodId],
  );
  await pool.query(
    "INSERT INTO sections (id,cohort_id,academic_period_id,name,code) VALUES ($1,$2,$3,$4,$5)",
    [sectionId, cohortId, periodId, "DB08 Class "+sectionId, "DB08-"+sectionId],
  );
  return { programId, periodId, cohortId, sectionId };
}

async function makeLearner(collegeId: string, academic: Awaited<ReturnType<typeof makeAcademicFixture>>) {
  const userId = randomUUID(), membershipId = randomUUID();
  const enrollmentId = randomUUID(), sectionEnrollmentId = randomUUID();
  f.users.push(userId); f.memberships.push(membershipId);
  f.learnerEnrollments.push(enrollmentId); f.sectionEnrollments.push(sectionEnrollmentId);
  await pool.query("INSERT INTO users (id,identity_uid,display_name) VALUES ($1,$2,'DB08 Learner')",
    [userId, "db08-"+userId]);
  await pool.query(
    "INSERT INTO college_memberships (id,user_id,college_id) VALUES ($1,$2,$3)",
    [membershipId, userId, collegeId],
  );
  await pool.query("INSERT INTO membership_roles (membership_id,role) VALUES ($1,'LEARNER')", [membershipId]);
  await pool.query(
    "INSERT INTO learner_program_enrollments (id,membership_id,program_id,cohort_id) VALUES ($1,$2,$3,$4)",
    [enrollmentId, membershipId, academic.programId, academic.cohortId],
  );
  await pool.query(
    "INSERT INTO section_enrollments (id,learner_enrollment_id,section_id,academic_period_id) VALUES ($1,$2,$3,$4)",
    [sectionEnrollmentId, enrollmentId, academic.sectionId, academic.periodId],
  );
  return membershipId;
}

beforeEach(() => {
  for (const v of Object.values(f)) v.length = 0;
});
afterEach(async () => {
  // TRUNCATE the immutable audit log only on this EXPLICIT isolated test database.
  await pool.query("TRUNCATE TABLE placement_eligibility_events");
  if (f.memberships.length) {
    await pool.query("DELETE FROM placement_eligibility_decisions WHERE scope_type='MEMBERSHIP' AND scope_id = ANY($1::uuid[])", [f.memberships]);
  }
  if (f.sections.length) {
    await pool.query("DELETE FROM placement_eligibility_decisions WHERE scope_type='SECTION' AND scope_id = ANY($1::uuid[])", [f.sections]);
  }
  if (f.cohorts.length) {
    await pool.query("DELETE FROM placement_eligibility_decisions WHERE scope_type='COHORT' AND scope_id = ANY($1::uuid[])", [f.cohorts]);
    await pool.query("DELETE FROM placement_batch_lifecycles WHERE cohort_id = ANY($1::uuid[])", [f.cohorts]);
  }
  if (f.sectionEnrollments.length) await pool.query("DELETE FROM section_enrollments WHERE id = ANY($1::uuid[])", [f.sectionEnrollments]);
  if (f.learnerEnrollments.length) await pool.query("DELETE FROM learner_program_enrollments WHERE id = ANY($1::uuid[])", [f.learnerEnrollments]);
  if (f.sections.length) await pool.query("DELETE FROM sections WHERE id = ANY($1::uuid[])", [f.sections]);
  if (f.cohorts.length) await pool.query("DELETE FROM cohorts WHERE id = ANY($1::uuid[])", [f.cohorts]);
  if (f.periods.length) await pool.query("DELETE FROM academic_periods WHERE id = ANY($1::uuid[])", [f.periods]);
  if (f.programs.length) await pool.query("DELETE FROM programs WHERE id = ANY($1::uuid[])", [f.programs]);
  if (f.memberships.length) {
    await pool.query("DELETE FROM membership_roles WHERE membership_id = ANY($1::uuid[])", [f.memberships]);
    await pool.query("DELETE FROM college_memberships WHERE id = ANY($1::uuid[])", [f.memberships]);
  }
  if (f.users.length) await pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [f.users]);
});
afterAll(async () => { await pool.end(); await closeDatabaseConnection(); });

describe("DB08: atomic placement batch and inherited eligibility", () => {
  it("retains before/after history and reverses whole bulk action atomically", async () => {
    const a = await makeAcademicFixture(SEED_IDS.collegeA);
    const learnerId = await makeLearner(SEED_IDS.collegeA, a);
    const made = await decidePlacementParticipation(admin, {
      collegeId: SEED_IDS.collegeA,
      changes: [
        { scopeType: "COHORT", scopeId: a.cohortId, status: "ELIGIBLE" },
        { scopeType: "MEMBERSHIP", scopeId: learnerId, status: "INELIGIBLE", reason: "Higher studies" },
      ],
    });
    expect(made.changedCount).toBe(2);
    expect(made.actionId).toBeTruthy();
    const events = await pool.query(
      "SELECT event_kind,after_status FROM placement_eligibility_events WHERE action_id=$1 ORDER BY scope_type",
      [made.actionId],
    );
    expect(events.rows).toHaveLength(2);
    expect(events.rows.every(x => x.event_kind === "DECIDE")).toBe(true);

    const undone = await undoPlacementParticipation(admin, {
      collegeId: SEED_IDS.collegeA, actionId: made.actionId,
    });
    expect(undone.changedCount).toBe(2);
    const decisions = await pool.query(
      "SELECT id FROM placement_eligibility_decisions WHERE (scope_type='COHORT' AND scope_id=$1) OR (scope_type='MEMBERSHIP' AND scope_id=$2)",
      [a.cohortId, learnerId],
    );
    expect(decisions.rows).toHaveLength(0);
    const inverse = await pool.query(
      "SELECT event_kind,reverses_action_id FROM placement_eligibility_events WHERE action_id=$1",
      [undone.actionId],
    );
    expect(inverse.rows).toHaveLength(2);
    expect(inverse.rows.every(x => x.event_kind === "UNDO" && x.reverses_action_id === made.actionId)).toBe(true);
    await expect(undoPlacementParticipation(admin, {
      collegeId: SEED_IDS.collegeA, actionId: made.actionId,
    })).rejects.toMatchObject({ code: "DB08_ACTION_STALE" });
  });

  it("prevents stale bulk undo after a later action on any touched scope", async () => {
    const a = await makeAcademicFixture(SEED_IDS.collegeA);
    const first = await decidePlacementParticipation(admin, {
      collegeId: SEED_IDS.collegeA,
      changes: [{ scopeType: "COHORT", scopeId: a.cohortId, status: "ELIGIBLE" }],
    });
    await decidePlacementParticipation(admin, {
      collegeId: SEED_IDS.collegeA,
      changes: [{ scopeType: "COHORT", scopeId: a.cohortId, status: "INELIGIBLE", reason: "Not interested" }],
    });
    await expect(undoPlacementParticipation(admin, {
      collegeId: SEED_IDS.collegeA, actionId: first.actionId,
    })).rejects.toMatchObject({ code: "DB08_ACTION_STALE" });
  });

  it("rejects wrong-college scope at service AND direct SQL layer", async () => {
    const b = await makeAcademicFixture(SEED_IDS.collegeB);
    await expect(decidePlacementParticipation(admin, {
      collegeId: SEED_IDS.collegeA,
      changes: [{ scopeType: "COHORT", scopeId: b.cohortId, status: "ELIGIBLE" }],
    })).rejects.toMatchObject({ code: "DB08_SCOPE_COLLEGE_MISMATCH" });

    await expect(pool.query(
      "INSERT INTO placement_eligibility_decisions(college_id,scope_type,scope_id,status) VALUES ($1,'COHORT',$2,'ELIGIBLE')",
      [SEED_IDS.collegeA,b.cohortId],
    )).rejects.toMatchObject({ code: "23514" });
    await expect(pool.query(
      "INSERT INTO placement_batch_lifecycles(cohort_id,college_id,created_by_user_id,updated_by_user_id) VALUES ($1,$2,$3,$3)",
      [b.cohortId,SEED_IDS.collegeA,SEED_IDS.collegeAdminUser],
    )).rejects.toMatchObject({ code: "23514" });
    await expect(pool.query(
      "INSERT INTO placement_eligibility_events(college_id,action_id,event_kind,scope_type,scope_id,after_status,actor_user_id) VALUES ($1,$2,'DECIDE','COHORT',$3,'ELIGIBLE',$4)",
      [SEED_IDS.collegeA,randomUUID(),b.cohortId,SEED_IDS.collegeAdminUser],
    )).rejects.toMatchObject({ code: "23514" });
  });

  it("enforces immutable events and valid ineligible reasons in database", async () => {
    const a = await makeAcademicFixture(SEED_IDS.collegeA);
    const made = await decidePlacementParticipation(admin, {
      collegeId: SEED_IDS.collegeA,
      changes: [{ scopeType: "COHORT", scopeId: a.cohortId, status: "INELIGIBLE", reason: "Year back" }],
    });
    const row = await pool.query("SELECT id FROM placement_eligibility_events WHERE action_id=$1", [made.actionId]);
    await expect(pool.query("DELETE FROM placement_eligibility_events WHERE id=$1", [row.rows[0].id]))
      .rejects.toMatchObject({ code: "23514" });
    await expect(pool.query("UPDATE placement_eligibility_events SET after_status='ELIGIBLE' WHERE id=$1", [row.rows[0].id]))
      .rejects.toMatchObject({ code: "23514" });
    await expect(pool.query(
      "INSERT INTO placement_eligibility_decisions(college_id,scope_type,scope_id,status) VALUES ($1,'SECTION',$2,'INELIGIBLE')",
      [SEED_IDS.collegeA,a.sectionId],
    )).rejects.toMatchObject({ code: "23514" });
    await expect(decidePlacementParticipation(admin, {
      collegeId: SEED_IDS.collegeA,
      changes: [{ scopeType: "SECTION", scopeId: a.sectionId, status: "INELIGIBLE", reason: " " }],
    })).rejects.toThrow();
  });

  it("serializes competing updates and makes earlier action stale", async () => {
    const a = await makeAcademicFixture(SEED_IDS.collegeA);
    const [left, right] = await Promise.all([
      decidePlacementParticipation(admin, {
        collegeId: SEED_IDS.collegeA,
        changes: [{ scopeType: "COHORT", scopeId: a.cohortId, status: "ELIGIBLE" }],
      }),
      decidePlacementParticipation(admin, {
        collegeId: SEED_IDS.collegeA,
        changes: [{ scopeType: "COHORT", scopeId: a.cohortId, status: "INELIGIBLE", reason: "Not interested" }],
      }),
    ]);
    expect(left.changedCount).toBe(1);
    expect(right.changedCount).toBe(1);
    const ev = await pool.query(
      "SELECT action_id FROM placement_eligibility_events WHERE scope_type='COHORT' AND scope_id=$1 ORDER BY sequence",
      [a.cohortId],
    );
    expect(ev.rows).toHaveLength(2);
    await expect(undoPlacementParticipation(admin, {
      collegeId: SEED_IDS.collegeA, actionId: ev.rows[0].action_id,
    })).rejects.toMatchObject({ code: "DB08_ACTION_STALE" });
  });

  it("keeps batch settings and finish state separate for each cohort", async () => {
    const a = await makeAcademicFixture(SEED_IDS.collegeA);
    const b = await makeAcademicFixture(SEED_IDS.collegeA);
    await upsertPlacementBatchSettings(admin, {
      collegeId: SEED_IDS.collegeA, cohortId: a.cohortId,
      registrationDeadline: "2026-12-05T18:30:00+05:30", rulesOverride: { maxOffers: 2 },
    });
    await upsertPlacementBatchSettings(admin, {
      collegeId: SEED_IDS.collegeA, cohortId: b.cohortId,
      registrationDeadline: "2026-12-20T18:30:00+05:30", rulesOverride: null,
    });
    await markPlacementBatchInvited(admin, { collegeId: SEED_IDS.collegeA, cohortId: a.cohortId });
    await markPlacementBatchFinished(admin, { collegeId: SEED_IDS.collegeA, cohortId: a.cohortId });
    await expect(markPlacementBatchFinished(admin, {
      collegeId: SEED_IDS.collegeA, cohortId: b.cohortId,
    })).rejects.toMatchObject({ code: "DB08_ACTION_INVALID" });
    const rows = await pool.query(
      "SELECT cohort_id,finished_at,registration_deadline,rules_override FROM placement_batch_lifecycles ORDER BY cohort_id",
    );
    const finished = rows.rows.find(x => x.cohort_id === a.cohortId);
    const active = rows.rows.find(x => x.cohort_id === b.cohortId);
    expect(finished.finished_at).toBeTruthy();
    expect(active.finished_at).toBeNull();
    expect(finished.rules_override.maxOffers).toBe(2);
    expect(active.rules_override).toBeNull();
    expect(finished.registration_deadline).not.toEqual(active.registration_deadline);
  });
});
