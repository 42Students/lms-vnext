import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { decidePlacementParticipation } from "@/modules/placements/batch-participation-service";
import {
  registerOwnPlacementChoice,
} from "@/modules/placements/batch-registration-service";
import {
  createPlacementDebarment,
  liftPlacementDebarment,
} from "@/modules/placements/debarment-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

const url = process.env.TEST_DATABASE_URL;
if (!url || process.env.DATABASE_URL !== url ||
    process.env.DB08_ISOLATED_TEST_DATABASE !== "1" ||
    process.env.DB08_B_MIGRATION_APPLIED !== "1") {
  throw new Error("DB08-B requires matching TEST_DATABASE_URL/DATABASE_URL, DB08_ISOLATED_TEST_DATABASE=1 and DB08_B_MIGRATION_APPLIED=1; use a disposable PostgreSQL with DB08-A/B schemas actually applied.");
}
const pool = new Pool({ connectionString: url, max: 3 });
 
// Distinct test identity avoids violating the registered rule permitting
// one active learner program enrollment per membership. This database is
// explicitly disposable; do not mutate seed learners' real enrollment.
const db08LearnerUser = randomUUID();
const db08LearnerMembership = randomUUID();
beforeAll(async () => {
  await pool.query(
    "INSERT INTO users(id,identity_uid,display_name) VALUES($1,$2,$3)",
    [db08LearnerUser,"db08-registration-"+db08LearnerUser,"DB08 Registration Learner"],
  );
  await pool.query(
    "INSERT INTO college_memberships(id,user_id,college_id) VALUES($1,$2,$3)",
    [db08LearnerMembership,db08LearnerUser,SEED_IDS.collegeA],
  );
  await pool.query(
    "INSERT INTO membership_roles(membership_id,role) VALUES($1,'LEARNER')",
    [db08LearnerMembership],
  );
});


const admin: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser, identityUid: "seed-admin",
    platformStatus: "ACTIVE", systemRoles: [],
  },
  membership: {
    id: SEED_IDS.collegeAdminMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"],
  },
};
const learner: RequestContext = {
  user: {
    id: db08LearnerUser, identityUid: "db08-registration-learner",
    platformStatus: "ACTIVE", systemRoles: [],
  },
  membership: {
    id: db08LearnerMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["LEARNER"],
  },
};
const touched = {
  program: [] as string[], period: [] as string[],
  cohort: [] as string[], section: [] as string[],
  enrollment: [] as string[], sectionEnrollment: [] as string[],
  moduleRule: [] as string[],
};

async function createBatchFixture(invited = true, deadline = "2026-12-01T00:00:00Z") {
  const ids = {
    program: randomUUID(), period: randomUUID(),
    cohort: randomUUID(), section: randomUUID(),
    enrollment: randomUUID(), sectionEnrollment: randomUUID(),
  };
  for (const [key, value] of Object.entries(ids)) {
    touched[key as keyof typeof touched].push(value);
  }
  await pool.query(
    "INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3,$4,8)",
    [ids.program, SEED_IDS.departmentA, "DB08-B Program", "DB08-"+ids.program],
  );
  await pool.query(
    "INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) VALUES($1,$2,$3,$4,'2026-07-01','2026-12-31')",
    [ids.period, SEED_IDS.collegeA, "DB08-B Period", "DB08-"+ids.period],
  );
  await pool.query(
    "INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES($1,$2,$3,$4,$5)",
    [ids.cohort, ids.program, "DB08-B Cohort", "DB08-"+ids.cohort, ids.period],
  );
  await pool.query(
    "INSERT INTO sections(id,cohort_id,academic_period_id,name,code) VALUES($1,$2,$3,$4,$5)",
    [ids.section, ids.cohort, ids.period, "DB08-B Class", "DB08-"+ids.section],
  );
  await pool.query(
    "INSERT INTO learner_program_enrollments(id,membership_id,program_id,cohort_id) VALUES($1,$2,$3,$4)",
    [ids.enrollment, db08LearnerMembership, ids.program, ids.cohort],
  );
  await pool.query(
    "INSERT INTO section_enrollments(id,learner_enrollment_id,section_id,academic_period_id) VALUES($1,$2,$3,$4)",
    [ids.sectionEnrollment, ids.enrollment, ids.section, ids.period],
  );
  await pool.query(
    "INSERT INTO placement_batch_lifecycles(cohort_id,college_id,invited_at,registration_deadline,created_by_user_id,updated_by_user_id) VALUES($1,$2,$3,$4,$5,$5)",
    [ids.cohort, SEED_IDS.collegeA, invited ? new Date() : null,
      deadline, SEED_IDS.collegeAdminUser],
  );
  await decidePlacementParticipation(admin, {
    collegeId: SEED_IDS.collegeA,
    changes: [{ scopeType: "COHORT", scopeId: ids.cohort, status: "ELIGIBLE" }],
  });
  return ids;
}

let previousModuleRule:{id:string;enabled:boolean}|null=null;
beforeEach(async () => {
  for (const arr of Object.values(touched)) arr.length = 0;
  previousModuleRule=null;
  // CI may seed the college's placement rule already. Keep that row and its
  // original state; never insert a duplicate unique(scope,module) rule, and
  // never delete a pre-existing access policy during test cleanup.
  const existing=await pool.query<{id:string;enabled:boolean}>(
    "SELECT id,enabled FROM module_access_rules WHERE scope_type='COLLEGE' AND scope_id=$1 AND module='placements'",
    [SEED_IDS.collegeA],
  );
  if(existing.rows[0]){
    previousModuleRule=existing.rows[0];
    if(!previousModuleRule.enabled)await pool.query(
      "UPDATE module_access_rules SET enabled=true WHERE id=$1",
      [previousModuleRule.id],
    );
  }else{
    const inserted=await pool.query<{id:string}>(
      "INSERT INTO module_access_rules(id,scope_type,scope_id,module,enabled) VALUES($1,'COLLEGE',$2,'placements',true) ON CONFLICT DO NOTHING RETURNING id",
      [randomUUID(),SEED_IDS.collegeA],
    );
    if(inserted.rows[0])touched.moduleRule.push(inserted.rows[0].id);
    else{
      // Another setup may have created the scoped rule between SELECT and
      // INSERT. Preserve its previous value just as for the seeded case.
      const raced=await pool.query<{id:string;enabled:boolean}>(
        "SELECT id,enabled FROM module_access_rules WHERE scope_type='COLLEGE' AND scope_id=$1 AND module='placements'",
        [SEED_IDS.collegeA],
      );
      if(!raced.rows[0])throw new Error("Placement module rule disappeared during fixture setup");
      previousModuleRule=raced.rows[0];
      if(!previousModuleRule.enabled)await pool.query(
        "UPDATE module_access_rules SET enabled=true WHERE id=$1",
        [previousModuleRule.id],
      );
    }
  }
});

afterEach(async () => {
  // TRUNCATE immutable event data ONLY on the required explicitly isolated test DB.
  await pool.query("TRUNCATE TABLE placement_batch_registration_events");
  await pool.query("TRUNCATE TABLE placement_debarment_history");
  await pool.query("TRUNCATE TABLE placement_debarment_drive_events");
  await pool.query("TRUNCATE TABLE placement_eligibility_events");
  await pool.query("DELETE FROM placement_batch_registrations WHERE cohort_id=ANY($1::uuid[])", [touched.cohort]);
  await pool.query("DELETE FROM placement_debarments WHERE membership_id=$1",
    [db08LearnerMembership]);
  await pool.query("DELETE FROM placement_eligibility_decisions WHERE scope_type='COHORT' AND scope_id=ANY($1::uuid[])", [touched.cohort]);
  await pool.query("DELETE FROM placement_batch_lifecycles WHERE cohort_id=ANY($1::uuid[])", [touched.cohort]);
  await pool.query("DELETE FROM section_enrollments WHERE id=ANY($1::uuid[])", [touched.sectionEnrollment]);
  await pool.query("DELETE FROM learner_program_enrollments WHERE id=ANY($1::uuid[])", [touched.enrollment]);
  await pool.query("DELETE FROM sections WHERE id=ANY($1::uuid[])", [touched.section]);
  await pool.query("DELETE FROM cohorts WHERE id=ANY($1::uuid[])", [touched.cohort]);
  await pool.query("DELETE FROM academic_periods WHERE id=ANY($1::uuid[])", [touched.period]);
  await pool.query("DELETE FROM programs WHERE id=ANY($1::uuid[])", [touched.program]);
  await pool.query("DELETE FROM module_access_rules WHERE id=ANY($1::uuid[])", [touched.moduleRule]);
  if(previousModuleRule){
    await pool.query("UPDATE module_access_rules SET enabled=$2 WHERE id=$1",
      [previousModuleRule.id,previousModuleRule.enabled]);
    previousModuleRule=null;
  }
});
afterAll(async () => {
  await pool.end();
  await closeDatabaseConnection();
});

describe("DB08-B per-cohort consented learner registration", () => {
  it("denies stale ACTIVE context when the persisted learner account was disabled", async () => {
    const fixture = await createBatchFixture();
    try {
      await pool.query(
        "UPDATE users SET platform_status='DISABLED' WHERE id=$1",
        [db08LearnerUser],
      );
      await expect(registerOwnPlacementChoice(learner, {
        choice: "PLACEMENTS", acceptedConsent: true,
      })).rejects.toMatchObject({ code: "DB08_REGISTRATION_FORBIDDEN" });

      // A failed authorization must not persist either consent or event.
      const registrations = await pool.query(
        "SELECT id FROM placement_batch_registrations WHERE membership_id=$1 AND cohort_id=$2",
        [db08LearnerMembership, fixture.cohort],
      );
      expect(registrations.rows).toHaveLength(0);
    } finally {
      await pool.query(
        "UPDATE users SET platform_status='ACTIVE' WHERE id=$1",
        [db08LearnerUser],
      );
    }
  });

  it("denies a stale ACTIVE context when the persisted membership is suspended", async () => {
    const fixture = await createBatchFixture();
    try {
      await pool.query(
        "UPDATE college_memberships SET status='SUSPENDED' WHERE id=$1",
        [db08LearnerMembership],
      );
      await expect(registerOwnPlacementChoice(learner, {
        choice: "PLACEMENTS", acceptedConsent: true,
      })).rejects.toMatchObject({ code: "DB08_REGISTRATION_FORBIDDEN" });

      const registrations = await pool.query(
        "SELECT id FROM placement_batch_registrations WHERE membership_id=$1 AND cohort_id=$2",
        [db08LearnerMembership, fixture.cohort],
      );
      expect(registrations.rows).toHaveLength(0);
    } finally {
      await pool.query(
        "UPDATE college_memberships SET status='ACTIVE' WHERE id=$1",
        [db08LearnerMembership],
      );
    }
  });

  it("stores a single consent and event on repeated identical self registration", async () => {
    const ids = await createBatchFixture();
    const first = await registerOwnPlacementChoice(learner, {
      choice: "PLACEMENTS", acceptedConsent: true,
    });
    const again = await registerOwnPlacementChoice(learner, {
      choice: "PLACEMENTS", acceptedConsent: true,
    });
    expect(first.id).toBe(again.id);
    expect(first.consentVersion).toBe("v1");
    expect(first.consentAt).toEqual(again.consentAt);
    const events = await pool.query(
      "SELECT id FROM placement_batch_registration_events WHERE registration_id=$1",
      [first.id],
    );
    expect(events.rows).toHaveLength(1);
    const registration = await pool.query(
      "SELECT cohort_id FROM placement_batch_registrations WHERE id=$1", [first.id],
    );
    expect(registration.rows[0].cohort_id).toBe(ids.cohort);
  });

  it("records a changed choice and clears current consent, preserving first event", async () => {
    await createBatchFixture();
    const initial = await registerOwnPlacementChoice(learner, {
      choice: "PLACEMENTS", acceptedConsent: true,
    });
    const changed = await registerOwnPlacementChoice(learner, {
      choice: "HIGHER_STUDIES", acceptedConsent: false,
    });
    expect(changed.id).toBe(initial.id);
    expect(changed.consentVersion).toBeNull();
    expect(changed.consentAt).toBeNull();
    expect(changed.version).toBe(1);
    const events = await pool.query(
      "SELECT next_choice,consent_version FROM placement_batch_registration_events WHERE registration_id=$1 ORDER BY occurred_at,id",
      [initial.id],
    );
    expect(events.rows).toHaveLength(2);
    expect(events.rows.some(x => x.next_choice === "PLACEMENTS" && x.consent_version === "v1")).toBe(true);
  });

  it("does not register when a batch has not been invited", async () => {
    await createBatchFixture(false);
    await expect(registerOwnPlacementChoice(learner, {
      choice: "PLACEMENTS", acceptedConsent: true,
    })).rejects.toMatchObject({ code: "DB08_REGISTRATION_WINDOW_CLOSED" });
  });

  it("rejects wrong-cohort direct SQL registrations and missing consent", async () => {
    const a = await createBatchFixture();
    await expect(pool.query(
      "INSERT INTO placement_batch_registrations(college_id,cohort_id,membership_id,choice,consent_at,consent_version,source,recorded_by_user_id) VALUES($1,$2,$3,'PLACEMENTS',now(),'v1','SELF',$4)",
      [SEED_IDS.collegeA, randomUUID(), db08LearnerMembership, db08LearnerUser],
    )).rejects.toMatchObject({
      // Ownership trigger rejects a nonexistent/non-enrolled cohort before
      // PostgreSQL's deferred FK check; this is the stronger fail-closed gate.
      code: "23514",
      message: "Registration cohort is not owned by learner college",
    });
    await expect(pool.query(
      "INSERT INTO placement_batch_registrations(college_id,cohort_id,membership_id,choice,source,recorded_by_user_id) VALUES($1,$2,$3,'PLACEMENTS','SELF',$4)",
      [SEED_IDS.collegeA, a.cohort, db08LearnerMembership, db08LearnerUser],
    )).rejects.toMatchObject({ code: "23514" });
  });
});

describe("DB08-B manager debarment with SQL-generated immutable audit", () => {
  it("creates and lifts a manual debarment, idempotently", async () => {
    const created = await createPlacementDebarment(admin, {
      collegeId: SEED_IDS.collegeA,
      membershipId: db08LearnerMembership,
      reason: "Placement policy violation",
      untilDrives: 3,
    });
    expect(created.untilDrives).toBe(3);
    expect(created.drivesCounted).toBe(0);
    const lifted = await liftPlacementDebarment(admin, {
      debarmentId: created.id, reason: "Appeal accepted",
    });
    expect(lifted.liftedAt).toBeTruthy();
    await liftPlacementDebarment(admin, {
      debarmentId: created.id, reason: "Appeal accepted",
    });
    const events = await pool.query(
      "SELECT event_type FROM placement_debarment_history WHERE debarment_id=$1",
      [created.id],
    );
    expect(events.rows.map(x=>x.event_type).sort()).toEqual(["CREATED","LIFTED"]);
    await expect(pool.query(
      "DELETE FROM placement_debarment_history WHERE debarment_id=$1",
      [created.id],
    )).rejects.toMatchObject({ code: "23514" });
  });
});
