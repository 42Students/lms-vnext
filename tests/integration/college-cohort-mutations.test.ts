import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import { transitionCohort } from "@/modules/academics/cohort-service";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  createCollegeCohort,
  updateCollegeCohort,
} from "@/modules/academics/college-cohort-mutation-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({
  connectionString: process.env.TEST_DATABASE_URL, max: 2,
}) : null;

const adminA: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser, identityUid: "w-ca-batch-admin",
    platformStatus: "ACTIVE", systemRoles: [],
  },
  membership: {
    id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA, organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["COLLEGE_ADMIN"],
  },
};
const adminB: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser, identityUid: "w-ca-batch-foreign",
    platformStatus: "ACTIVE", systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeBMembership,
    collegeId: SEED_IDS.collegeB, organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["COLLEGE_ADMIN"],
  },
};
const faculty: RequestContext = {
  ...adminA, membership: { ...adminA.membership!, roles: ["FACULTY"] },
};

const fixtures = {
  program: randomUUID(),
  firstPeriod: randomUUID(),
  endPeriod: randomUUID(),
  foreignPeriod: randomUUID(),
  section: randomUUID(),
  offering: randomUUID(),
  course: randomUUID(),
  enrollment: randomUUID(),
};
const created: string[] = [];
const name = "W-CB-" + fixtures.program.slice(0, 8);
function payload(suffix: string) {
  return {
    programId: fixtures.program,
    name: name + suffix,
    code: "WCB" + fixtures.program.slice(0, 8) + suffix,
    startPeriodId: fixtures.firstPeriod,
    expectedEndPeriodId: fixtures.endPeriod,
  };
}
async function own(suffix: string) {
  const row = await createCollegeCohort(adminA, payload(suffix));
  created.push(row.id);
  return row;
}

describe.skipIf(!enabled)("College batch create/edit — isolated PostgreSQL", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("Disposable PostgreSQL required");
    const tables = await pool.query(
      "SELECT to_regclass('public.cohorts') AS cohorts, " +
      "to_regclass('public.cohort_progression_state') AS progression, " +
      "to_regclass('public.activity_events') AS audit",
    );
    for (const table of Object.values(tables.rows[0] ?? {})) {
      if (!table) throw new Error("Registered DB02, DB0051 and audit tables required");
    }
    await pool.query(
      "INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) " +
      "VALUES($1,$2,$3,$4,'2026-07-01','2026-12-31')," +
      "($5,$2,$6,$7,'2027-01-01','2027-06-30')," +
      "($8,$9,$10,$11,'2026-07-01','2026-12-31')",
      [fixtures.firstPeriod, SEED_IDS.collegeA, name + "start", name + "START",
        fixtures.endPeriod, name + "end", name + "END",
        fixtures.foreignPeriod, SEED_IDS.collegeB, name + "foreign", name + "FOREIGN"],
    );
    await pool.query(
      "INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3,$4,8)",
      [fixtures.program, SEED_IDS.departmentA, name, name],
    );
  });

  afterAll(async () => {
    try {
      if (pool) {
        await pool.query("DELETE FROM sections WHERE id=$1", [fixtures.section]);
        await pool.query("DELETE FROM course_offerings WHERE id=$1", [fixtures.offering]);
        await pool.query("DELETE FROM courses WHERE id=$1", [fixtures.course]);
        await pool.query("DELETE FROM learner_program_enrollments WHERE id=$1", [fixtures.enrollment]);
        for (const id of created) {
          await pool.query(
            "DELETE FROM activity_events WHERE subject_type='cohort' AND subject_id=$1", [id],
          );
          // Progression events are immutable; this CRUD-only fixture creates none.
          await pool.query("DELETE FROM cohorts WHERE id=$1", [id]);
        }
        await pool.query("DELETE FROM programs WHERE id=$1", [fixtures.program]);
        for (const id of [fixtures.firstPeriod, fixtures.endPeriod, fixtures.foreignPeriod]) {
          await pool.query("DELETE FROM academic_periods WHERE id=$1", [id]);
        }
      }
    } finally {
      await pool?.end();
      await closeDatabaseConnection();
    }
  });

  it("creates, edits and writes exactly one immutable audit event per success", async () => {
    const batch = await own("OK");
    expect(batch).toMatchObject({
      name: name + "OK", code: payload("OK").code, status: "PLANNED",
    });
    const state = await pool!.query(
      "SELECT cohort_id,current_term_number,version FROM cohort_progression_state WHERE cohort_id=$1",
      [batch.id],
    );
    expect(state.rows[0]).toMatchObject({
      cohort_id: batch.id, current_term_number: 1,
    });
    expect(Number(state.rows[0]?.version)).toBe(0);
    const edited = await updateCollegeCohort(adminA, batch.id, {
      name: name + "REVISED", code: payload("REVISED").code,
      expectedEndPeriodId: null, confirm: true,
    });
    expect(edited).toMatchObject({
      id: batch.id, name: name + "REVISED", expectedEndPeriodId: null,
    });
    const persisted = await pool!.query(
      "SELECT name,code,expected_end_period_id FROM cohorts WHERE id=$1", [batch.id],
    );
    expect(persisted.rows[0]).toMatchObject({
      name: name + "REVISED", code: payload("REVISED").code,
      expected_end_period_id: null,
    });
    const audits = await pool!.query(
      "SELECT event_type,college_id FROM activity_events " +
      "WHERE subject_type='cohort' AND subject_id=$1 ORDER BY occurred_at",
      [batch.id],
    );
    expect(audits.rows.map((row) => row.event_type).sort()).toEqual([
      "academics.batch.created", "academics.batch.updated",
    ]);
    expect(audits.rows.every((row) => row.college_id === SEED_IDS.collegeA)).toBe(true);
  });

  it("rejects cross-college program/period and edits without leaking or auditing", async () => {
    const row = await own("SCOPE");
    await expect(createCollegeCohort(adminB, payload("FORGED")))
      .rejects.toMatchObject({ code: "BATCH_PROGRAM_NOT_FOUND" });
    await expect(createCollegeCohort(adminA, {
      ...payload("FOREIGN"), expectedEndPeriodId: fixtures.foreignPeriod,
    })).rejects.toMatchObject({ code: "BATCH_PERIOD_INVALID" });
    await expect(updateCollegeCohort(adminB, row.id, {
      name: name + "FOREIGN", code: payload("FORGED").code,
      expectedEndPeriodId: null, confirm: true,
    })).rejects.toMatchObject({ code: "BATCH_NOT_FOUND" });
    await expect(createCollegeCohort(faculty, payload("ROLE")))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(updateCollegeCohort(faculty, row.id, {
      name: name + "ROLE", code: payload("ROLE").code,
      expectedEndPeriodId: null, confirm: true,
    })).rejects.toBeInstanceOf(AuthorizationError);
    await expect(updateCollegeCohort(adminA, row.id, {
      name: name + "MISSING", code: payload("MISSING").code,
      expectedEndPeriodId: null,
    })).rejects.toBeDefined();
    const audits = await pool!.query(
      "SELECT count(*)::int AS count FROM activity_events " +
      "WHERE subject_type='cohort' AND subject_id=$1", [row.id],
    );
    expect(audits.rows[0]?.count).toBe(1);
  });

  it("enforces name/code uniqueness and period ordering", async () => {
    const row = await own("OWNER");
    await expect(createCollegeCohort(adminA, {
      ...payload("DUPNAME"), name: row.name.toUpperCase(),
    })).rejects.toMatchObject({ code: "BATCH_NAME_CONFLICT" });
    await expect(createCollegeCohort(adminA, {
      ...payload("DUPCODE"), code: row.code.toUpperCase(),
    })).rejects.toMatchObject({ code: "BATCH_CODE_CONFLICT" });
    await expect(createCollegeCohort(adminA, {
      ...payload("BADEND"), startPeriodId: fixtures.endPeriod,
      expectedEndPeriodId: fixtures.firstPeriod,
    })).rejects.toMatchObject({ code: "BATCH_PERIOD_INVALID" });
  });

  it("uses actual dependency rows to block end-period edits, then rejects edits once archived", async () => {
    const row = await own("GUARD");
    const change = { name: name + "CHANGED", code: payload("CHANGED").code,
      expectedEndPeriodId: null, confirm: true };
    // No registered child means edit succeeds; [] must not count as a dependency.
    await updateCollegeCohort(adminA, row.id, change);
    await pool!.query(
      "INSERT INTO sections(id,cohort_id,academic_period_id,name,code) VALUES($1,$2,$3,$4,$5)",
      [fixtures.section, row.id, fixtures.firstPeriod, name, name],
    );
    // Labels stay editable while the batch is in use; the recorded end period does not.
    await expect(updateCollegeCohort(adminA, row.id, {
      ...change, expectedEndPeriodId: fixtures.endPeriod,
    })).rejects.toMatchObject({ code: "BATCH_HAS_DEPENDENCIES" });
    await updateCollegeCohort(adminA, row.id, { ...change, name: name + "RELABELED" });
    const read = await pool!.query("SELECT name, expected_end_period_id FROM cohorts WHERE id=$1", [row.id]);
    expect(read.rows[0]?.name).toBe(name + "RELABELED");
    expect(read.rows[0]?.expected_end_period_id).toBeNull();
    const audits = await pool!.query(
      "SELECT count(*)::int AS count FROM activity_events " +
      "WHERE subject_type='cohort' AND subject_id=$1", [row.id],
    );
    expect(audits.rows[0]?.count).toBe(3);
    await pool!.query("DELETE FROM sections WHERE id=$1", [fixtures.section]);
    await transitionCohort(adminA, row.id, { action: "ACTIVATE" });
    await transitionCohort(adminA, row.id, { action: "COMPLETE" });
    await transitionCohort(adminA, row.id, { action: "ARCHIVE" });
    await expect(updateCollegeCohort(adminA, row.id, change))
      .rejects.toMatchObject({ code: "BATCH_NOT_EDITABLE" });
  });
});
