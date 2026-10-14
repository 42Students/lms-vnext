import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  createCollegeSection, updateCollegeSection,
} from "@/modules/academics/college-section-mutation-service";
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
    id: SEED_IDS.collegeAdminUser, identityUid: "w-ca-class-admin",
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
    id: SEED_IDS.facultyUser, identityUid: "w-ca-class-foreign",
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
const ids = {
  program: randomUUID(), cohort: randomUUID(),
  period: randomUUID(), foreignPeriod: randomUUID(),
  learnerEnrollment: randomUUID(), sectionEnrollment: randomUUID(),
  learnerEnrollment2: randomUUID(), sectionEnrollment2: randomUUID(),
  user1: randomUUID(), member1: randomUUID(), role1: randomUUID(),
  user2: randomUUID(), member2: randomUUID(), role2: randomUUID(),
};
const prefix = "W-CS-" + ids.program.slice(0, 8);
const created: string[] = [];
const input = (suffix: string) => ({
  cohortId: ids.cohort, academicPeriodId: ids.period,
  name: prefix + suffix, code: "WCS" + ids.program.slice(0, 8) + suffix,
  capacity: 30,
});
async function own(suffix: string) {
  const row = await createCollegeSection(adminA, input(suffix));
  created.push(row.id);
  return row;
}

describe.skipIf(!enabled)("College Admin class create/edit — disposable PostgreSQL", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("Disposable PostgreSQL required");
    const tables = await pool.query(
      "SELECT to_regclass('public.sections') AS sections, " +
      "to_regclass('public.activity_events') AS audit, " +
      "to_regclass('public.section_enrollments') AS enrollment",
    );
    for (const table of Object.values(tables.rows[0] ?? {})) {
      if (!table) throw new Error("Registered sections, audit and enrollment tables required");
    }
    await pool.query(
      "INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) " +
      "VALUES($1,$2,$3,$4,'2026-07-01','2026-12-31')," +
      "($5,$6,$7,$8,'2026-07-01','2026-12-31')",
      [ids.period, SEED_IDS.collegeA, prefix + "Start", prefix + "START",
        ids.foreignPeriod, SEED_IDS.collegeB, prefix + "Foreign", prefix + "FOREIGN"],
    );
    await pool.query(
      "INSERT INTO programs(id,department_id,name,code,duration_terms) " +
      "VALUES($1,$2,$3,$4,8)",
      [ids.program, SEED_IDS.departmentA, prefix, prefix],
    );
    await pool.query(
      "INSERT INTO cohorts(id,program_id,name,code,start_period_id) " +
      "VALUES($1,$2,$3,$4,$5)",
      [ids.cohort, ids.program, prefix, prefix, ids.period],
    );
  });

  afterAll(async () => {
    try {
      if (pool) {
        for (const id of [ids.sectionEnrollment, ids.sectionEnrollment2]) {
          await pool.query("DELETE FROM section_enrollments WHERE id=$1", [id]);
        }
        for (const id of [ids.learnerEnrollment, ids.learnerEnrollment2]) {
          await pool.query("DELETE FROM learner_program_enrollments WHERE id=$1", [id]);
        }
        for (const id of created) {
          await pool.query(
            "DELETE FROM activity_events WHERE subject_type='section' AND subject_id=$1", [id],
          );
          await pool.query("DELETE FROM sections WHERE id=$1", [id]);
        }
        await pool.query("DELETE FROM cohort_progression_events WHERE cohort_id=$1", [ids.cohort]);
        await pool.query("DELETE FROM cohorts WHERE id=$1", [ids.cohort]);
        await pool.query("DELETE FROM programs WHERE id=$1", [ids.program]);
        for (const id of [ids.role1, ids.role2]) {
          await pool.query("DELETE FROM membership_roles WHERE id=$1", [id]);
        }
        for (const id of [ids.member1, ids.member2]) {
          await pool.query("DELETE FROM college_memberships WHERE id=$1", [id]);
        }
        for (const id of [ids.user1, ids.user2]) {
          await pool.query("DELETE FROM users WHERE id=$1", [id]);
        }
        await pool.query("DELETE FROM academic_periods WHERE id = ANY($1::uuid[])",
          [[ids.period, ids.foreignPeriod]]);
      }
    } finally {
      await pool?.end();
      await closeDatabaseConnection();
    }
  });

  it("creates and updates a section in one transaction with exactly two immutable audits", async () => {
    const row = await own("OK");
    expect(row).toMatchObject({ name: input("OK").name, capacity: 30, status: "ACTIVE" });
    const edited = await updateCollegeSection(adminA, row.id, {
      name: prefix + "REVISED", code: input("REVISED").code,
      capacity: 48, confirm: true,
    });
    expect(edited).toMatchObject({ id: row.id, capacity: 48 });
    const stored = await pool!.query("SELECT name,code,capacity FROM sections WHERE id=$1", [row.id]);
    expect(stored.rows[0]).toMatchObject({
      name: prefix + "REVISED", code: input("REVISED").code, capacity: 48,
    });
    const audit = await pool!.query(
      "SELECT event_type,college_id,actor_user_id FROM activity_events " +
      "WHERE subject_type='section' AND subject_id=$1 ORDER BY occurred_at", [row.id],
    );
    expect(audit.rows.map(item => item.event_type).sort()).toEqual([
      "academics.class.created", "academics.class.updated",
    ]);
    expect(audit.rows.every(item => item.college_id === SEED_IDS.collegeA &&
      item.actor_user_id === SEED_IDS.collegeAdminUser)).toBe(true);
  });

  it("rejects other-college creates/edits, forged periods and non-admin requests", async () => {
    const row = await own("SCOPE");
    await expect(createCollegeSection(adminB, input("B")))
      .rejects.toMatchObject({ code: "CLASS_COHORT_NOT_FOUND" });
    await expect(updateCollegeSection(adminB, row.id, {
      name: "Foreign", code: "Foreign", capacity: 50, confirm: true,
    })).rejects.toMatchObject({ code: "CLASS_NOT_FOUND" });
    await expect(createCollegeSection(adminA, {
      ...input("FOREIGN"), academicPeriodId: ids.foreignPeriod,
    })).rejects.toMatchObject({ code: "CLASS_PERIOD_INVALID" });
    await expect(createCollegeSection(faculty, input("FACULTY")))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(updateCollegeSection(faculty, row.id, {
      name: "Blocked", code: "Blocked", capacity: 20, confirm: true,
    })).rejects.toBeInstanceOf(AuthorizationError);
    await expect(updateCollegeSection(adminA, row.id, {
      name: "Unconfirmed", code: "Unconfirmed", capacity: 20,
    })).rejects.toBeDefined();
    const audit = await pool!.query(
      "SELECT count(*)::int AS total FROM activity_events WHERE subject_type='section' AND subject_id=$1",
      [row.id],
    );
    expect(audit.rows[0]?.total).toBe(1);
  });

  it("enforces active name and code uniqueness", async () => {
    const row = await own("UNIQUE");
    await expect(createCollegeSection(adminA, {
      ...input("DUPNAME"), name: row.name.toUpperCase(),
    })).rejects.toMatchObject({ code: "CLASS_NAME_CONFLICT" });
    await expect(createCollegeSection(adminA, {
      ...input("DUPCODE"), code: row.code.toUpperCase(),
    })).rejects.toMatchObject({ code: "CLASS_CODE_CONFLICT" });
  });

  it("blocks rename after dependency and capacity reductions below actual active enrollment", async () => {
    const row = await own("DEPEND");
    for (const [user, member, role, learnerEnrollment, sectionEnrollment, index] of [
      [ids.user1, ids.member1, ids.role1, ids.learnerEnrollment, ids.sectionEnrollment, "1"],
      [ids.user2, ids.member2, ids.role2, ids.learnerEnrollment2, ids.sectionEnrollment2, "2"],
    ] as const) {
      await pool!.query(
        "INSERT INTO users(id,identity_uid,display_name) VALUES($1,$2,$3)",
        [user, "w-ca-class-" + ids.program + "-" + index, prefix + " Learner " + index],
      );
      await pool!.query(
        "INSERT INTO college_memberships(id,user_id,college_id) VALUES($1,$2,$3)",
        [member, user, SEED_IDS.collegeA],
      );
      await pool!.query(
        "INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,'LEARNER')",
        [role, member],
      );
      await pool!.query(
        "INSERT INTO learner_program_enrollments(id,membership_id,program_id,cohort_id) " +
        "VALUES($1,$2,$3,$4)", [learnerEnrollment, member, ids.program, ids.cohort],
      );
      await pool!.query(
        "INSERT INTO section_enrollments(id,learner_enrollment_id,section_id,academic_period_id) " +
        "VALUES($1,$2,$3,$4)", [sectionEnrollment, learnerEnrollment, row.id, ids.period],
      );
    }
    await expect(updateCollegeSection(adminA, row.id, {
      name: prefix + "RENAMED", code: row.code, capacity: 30, confirm: true,
    })).rejects.toMatchObject({ code: "CLASS_HAS_DEPENDENCIES" });
    await expect(updateCollegeSection(adminA, row.id, {
      name: row.name, code: row.code, capacity: 1, confirm: true,
    })).rejects.toMatchObject({ code: "CLASS_CAPACITY_BELOW_ENROLLMENT" });
    const changed = await updateCollegeSection(adminA, row.id, {
      name: row.name, code: row.code, capacity: 50, confirm: true,
    });
    expect(changed.capacity).toBe(50);
    const audit = await pool!.query(
      "SELECT count(*)::int AS total FROM activity_events WHERE subject_type='section' AND subject_id=$1",
      [row.id],
    );
    expect(audit.rows[0]?.total).toBe(2);
  });
});
