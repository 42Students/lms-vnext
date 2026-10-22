import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  archiveCollegeProgram,
  createCollegeProgram,
  updateCollegeProgram,
} from "@/modules/academics/college-program-mutation-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { releaseSeedLearnerPlacementEnrollment } from "../support/w04-placement-access-fixture";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({
  connectionString: process.env.TEST_DATABASE_URL, max: 2,
}) : null;

const adminA: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "w-college-program-admin",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.collegeAdminMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE",
    roles: ["COLLEGE_ADMIN"],
  },
};
const adminB: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "w-college-program-foreign",
    platformStatus: "ACTIVE", systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeBMembership, collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization, status: "ACTIVE",
    roles: ["COLLEGE_ADMIN"],
  },
};
const nonAdmin: RequestContext = {
  ...adminA, membership: { ...adminA.membership!, roles: ["FACULTY"] },
};

const ids = {
  period: randomUUID(),
  cohort: randomUUID(),
  enrollment: randomUUID(),
  term: randomUUID(),
};
const createdPrograms: string[] = [];
const label = "W-P-" + ids.period.slice(0, 8);

function newProgram(suffix: string) {
  return {
    departmentId: SEED_IDS.departmentA,
    name: label + suffix, code: "WP" + ids.period.slice(0, 7) + suffix,
    durationTerms: 8,
  };
}

async function ownProgram(suffix: string) {
  const program = await createCollegeProgram(adminA, newProgram(suffix));
  createdPrograms.push(program.id);
  return program;
}

describe.skipIf(!enabled)("College Admin program create/edit/archive transactions (isolated PostgreSQL)", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("Disposable PostgreSQL is required");
    const relations = await pool.query(
      "SELECT to_regclass('public.programs') AS programs, " +
      "to_regclass('public.cohorts') AS cohorts, " +
      "to_regclass('public.learner_program_enrollments') AS enrollments, " +
      "to_regclass('public.program_terms') AS terms, " +
      "to_regclass('public.activity_events') AS audit",
    );
    for (const value of Object.values(relations.rows[0] ?? {})) {
      if (!value) throw new Error("Registered academics, DB0050 and activity migrations required");
    }
    await pool.query(
      "INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) " +
      "VALUES($1,$2,$3,$4,'2026-07-01','2026-12-31')",
      [ids.period, SEED_IDS.collegeA, label, label],
    );
  });

  afterAll(async () => {
    try {
      if (pool) {
        await pool.query("DELETE FROM learner_program_enrollments WHERE id=$1", [ids.enrollment]);
        await pool.query("DELETE FROM cohorts WHERE id=$1", [ids.cohort]);
        await pool.query("DELETE FROM program_terms WHERE id=$1", [ids.term]);
        for (const id of createdPrograms) {
          await pool.query(
            "DELETE FROM activity_events WHERE subject_type='program' AND subject_id=$1",
            [id],
          );
          await pool.query("DELETE FROM programs WHERE id=$1", [id]);
        }
        await pool.query("DELETE FROM academic_periods WHERE id=$1", [ids.period]);
      }
    } finally {
      await pool?.end();
      await closeDatabaseConnection();
    }
  });

  it("persists create, edit, archive and three transaction-coupled audit events", async () => {
    const created = await ownProgram("CR");
    expect(created).toMatchObject({
      name: label + "CR", status: "ACTIVE", durationTerms: 8,
    });
    const updated = await updateCollegeProgram(adminA, created.id, {
      name: label + "REVISED", code: "WP" + ids.period.slice(0, 7) + "NEW", durationTerms: 6,
    });
    expect(updated).toMatchObject({ id: created.id, name: label + "REVISED", durationTerms: 6 });

    // A freshly created program has no children even when the seeded DB has
    // cohorts and terms belonging to *other* programs.
    const childCounts = await pool!.query(
      "SELECT " +
      "(SELECT count(*)::int FROM cohorts WHERE program_id=$1) AS cohorts, " +
      "(SELECT count(*)::int FROM learner_program_enrollments WHERE program_id=$1) AS enrollments, " +
      "(SELECT count(*)::int FROM program_terms WHERE program_id=$1) AS semesters",
      [created.id],
    );
    expect(childCounts.rows[0]).toMatchObject({
      cohorts: 0, enrollments: 0, semesters: 0,
    });
    await expect(archiveCollegeProgram(adminA, created.id, {})).rejects.toBeDefined();
    const archived = await archiveCollegeProgram(adminA, created.id, { confirm: true });
    expect(archived.status).toBe("ARCHIVED");
    const stored = await pool!.query("SELECT status FROM programs WHERE id=$1", [created.id]);
    expect(stored.rows[0]?.status).toBe("ARCHIVED");

    const events = await pool!.query(
      "SELECT event_type, college_id FROM activity_events WHERE subject_type='program' AND subject_id=$1",
      [created.id],
    );
    expect(events.rows.map(row => row.event_type).sort()).toEqual([
      "academics.program.archived",
      "academics.program.created",
      "academics.program.updated",
    ]);
    expect(events.rows.every(row => row.college_id === SEED_IDS.collegeA)).toBe(true);
  });

  it("rolls back rejected edits without writing audit rows", async () => {
    const target = await ownProgram("ROLLBACK");
    const taken = await ownProgram("NAMEOWNER");
    const countEvents = async () => {
      const events = await pool!.query(
        "SELECT count(*)::int AS count FROM activity_events WHERE subject_type='program' AND subject_id=$1",
        [target.id],
      );
      return Number(events.rows[0]?.count ?? 0);
    };
    const before = await countEvents();
    expect(before).toBe(1);
    await expect(updateCollegeProgram(adminA, target.id, {
      name: taken.name.toUpperCase(), code: target.code, durationTerms: 8,
    })).rejects.toMatchObject({ code: "PROGRAM_NAME_CONFLICT" });
    await expect(updateCollegeProgram(adminB, target.id, {
      name: label + "FOREIGN", code: "FOREIGN", durationTerms: 8,
    })).rejects.toMatchObject({ code: "PROGRAM_NOT_FOUND" });
    expect(await countEvents()).toBe(before);
    const stored = await pool!.query(
      "SELECT name,code,duration_terms,status FROM programs WHERE id=$1",
      [target.id],
    );
    expect(stored.rows[0]).toMatchObject({
      name: target.name, code: target.code, duration_terms: 8, status: "ACTIVE",
    });
    await archiveCollegeProgram(adminA, target.id, { confirm: true });
    await archiveCollegeProgram(adminA, taken.id, { confirm: true });
  });

  it("denies cross-college IDs, forged ownership and a non-admin role", async () => {
    const owned = await ownProgram("SCOPED");
    await expect(createCollegeProgram(adminA, {
      ...newProgram("FOREIGN"), departmentId: SEED_IDS.departmentB,
    })).rejects.toMatchObject({ code: "DEPARTMENT_NOT_FOUND" });
    await expect(updateCollegeProgram(adminB, owned.id, {
      name: label + "ATTACK", code: "WP-ATTACK", durationTerms: 8,
    })).rejects.toMatchObject({ code: "PROGRAM_NOT_FOUND" });
    await expect(archiveCollegeProgram(adminB, owned.id, { confirm: true }))
      .rejects.toMatchObject({ code: "PROGRAM_NOT_FOUND" });
    await expect(createCollegeProgram(nonAdmin, newProgram("NOREAD")))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(updateCollegeProgram(nonAdmin, owned.id, {
      name: label + "ROLE", code: "WP-ROLE", durationTerms: 8,
    })).rejects.toBeInstanceOf(AuthorizationError);
    await expect(archiveCollegeProgram(nonAdmin, owned.id, { confirm: true }))
      .rejects.toBeInstanceOf(AuthorizationError);
    await archiveCollegeProgram(adminA, owned.id, { confirm: true });
  });

  it("rejects duplicate department-local names/codes and protects cohort, enrollment, curriculum", async () => {
    const first = await ownProgram("ONE");
    const second = await ownProgram("TWO");
    await expect(createCollegeProgram(adminA, {
      ...newProgram("DUP"), name: first.name,
    })).rejects.toMatchObject({ code: "PROGRAM_NAME_CONFLICT" });
    await expect(createCollegeProgram(adminA, {
      ...newProgram("DUQ"), code: first.code,
    })).rejects.toMatchObject({ code: "PROGRAM_CODE_CONFLICT" });
    await expect(updateCollegeProgram(adminA, second.id, {
      name: first.name, code: second.code, durationTerms: 8,
    })).rejects.toMatchObject({ code: "PROGRAM_NAME_CONFLICT" });

    await pool!.query(
      "INSERT INTO program_terms(id,program_id,term_number,name) VALUES($1,$2,7,$3)",
      [ids.term, first.id, label + "Term7"],
    );
    await expect(updateCollegeProgram(adminA, first.id, {
      name: first.name, code: first.code, durationTerms: 6,
    })).rejects.toMatchObject({ code: "PROGRAM_DURATION_HAS_DEPENDENCIES" });
    // Curriculum without a cohort must report its own dependency, not an
    // unrelated cohort belonging to another seeded program.
    const beforeCohort = await pool!.query(
      "SELECT count(*)::int AS total FROM cohorts WHERE program_id=$1",
      [first.id],
    );
    expect(beforeCohort.rows[0]?.total).toBe(0);
    await expect(archiveCollegeProgram(adminA, first.id, { confirm: true }))
      .rejects.toMatchObject({ code: "PROGRAM_HAS_SEMESTERS" });

    await pool!.query(
      "INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES($1,$2,$3,$4,$5)",
      [ids.cohort, first.id, label + "Cohort", label + "Cohort", ids.period],
    );
    await releaseSeedLearnerPlacementEnrollment(pool!);
    await pool!.query(
      "INSERT INTO learner_program_enrollments(id,membership_id,program_id,cohort_id) " +
      "VALUES($1,$2,$3,$4)",
      [ids.enrollment, SEED_IDS.learnerCollegeAMembership, first.id, ids.cohort],
    );
    await expect(archiveCollegeProgram(adminA, first.id, { confirm: true }))
      .rejects.toMatchObject({ code: "PROGRAM_HAS_COHORTS" });
    await pool!.query("DELETE FROM learner_program_enrollments WHERE id=$1", [ids.enrollment]);
    await pool!.query("DELETE FROM cohorts WHERE id=$1", [ids.cohort]);
    await pool!.query("DELETE FROM program_terms WHERE id=$1", [ids.term]);
    await archiveCollegeProgram(adminA, first.id, { confirm: true });
    await archiveCollegeProgram(adminA, second.id, { confirm: true });
  });
});
