import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import { AuthorizationError } from "@/modules/permissions/policy";
import type { RequestContext } from "@/modules/identity/context";
import {
  createCollegeSemester,
  deleteCollegeSemester,
  SemesterMutationError,
  updateCollegeSemester,
} from "@/modules/academics/semester-mutation-service";
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
    id: SEED_IDS.collegeAdminUser, identityUid: "college-semester-write",
    platformStatus: "ACTIVE", systemRoles: [],
  },
  membership: {
    id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["COLLEGE_ADMIN"],
  },
};
const adminB: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser, identityUid: "college-semester-write-b",
    platformStatus: "ACTIVE", systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeBMembership,
    collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["COLLEGE_ADMIN"],
  },
};
const faculty: RequestContext = {
  ...adminA, membership: { ...adminA.membership!, roles: ["FACULTY"] },
};

const ids = {
  programA: randomUUID(),
  programB: randomUUID(),
  courseA: randomUUID(),
  termMap: randomUUID(),
};
const label = "W-Semester-" + ids.programA.slice(0, 8);

describe.skipIf(!enabled)("College Admin semester transactional writes / denial (isolated PG)", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("Disposable PostgreSQL required");
    const tables = await pool.query(
      "SELECT to_regclass('public.program_terms') AS terms, " +
      "to_regclass('public.program_term_courses') AS mappings, " +
      "to_regclass('public.activity_events') AS audit",
    );
    for (const value of Object.values(tables.rows[0] ?? {})) {
      if (!value) throw new Error("Registered DB0050 and audit migrations required");
    }
    await pool.query(
      "INSERT INTO programs(id,department_id,name,code,duration_terms) " +
      "VALUES($1,$2,$3,$4,8),($5,$6,$7,$8,8)",
      [
        ids.programA, SEED_IDS.departmentA, label, label,
        ids.programB, SEED_IDS.departmentB, label + "-B", label + "-B",
      ],
    );
    await pool.query(
      "INSERT INTO courses(id,department_id,name,code) VALUES($1,$2,$3,$4)",
      [ids.courseA, SEED_IDS.departmentA, label, label],
    );
  });
  afterAll(async () => {
    try {
      if (pool) {
        // activity_events is append-only; never DELETE its immutable audit rows.
        await pool.query(
          "DELETE FROM program_term_courses WHERE program_term_id IN (SELECT id FROM program_terms WHERE program_id IN ($1,$2))",
          [ids.programA, ids.programB],
        );
        await pool.query(
          "DELETE FROM program_terms WHERE program_id IN ($1,$2)",
          [ids.programA, ids.programB],
        );
        await pool.query("DELETE FROM courses WHERE id=$1", [ids.courseA]);
        await pool.query("DELETE FROM programs WHERE id IN ($1,$2)", [ids.programA, ids.programB]);
      }
    } finally {
      await pool?.end();
      await closeDatabaseConnection();
    }
  });

  it("creates, edits and deletes a term with all three transaction-coupled audit events", async () => {
    const created = await createCollegeSemester(adminA, {
      programId: ids.programA, termNumber: 1, name: "First", totalCredits: 18,
    });
    expect(created).toMatchObject({
      programId: ids.programA, termNumber: 1, name: "First", totalCredits: 18,
    });
    const edited = await updateCollegeSemester(adminA, created.id, {
      name: "First revised", totalCredits: 20, isActive: false,
      expectedUpdatedAt: created.updatedAt.toISOString(),confirm:true,
    });
    expect(edited).toMatchObject({
      id: created.id, programId: ids.programA, termNumber: 1,
      name: "First revised", totalCredits: 20, isActive: false,
    });
    await expect(updateCollegeSemester(adminA, created.id, {
      name:"Stale",totalCredits:20,isActive:false,
      expectedUpdatedAt:created.updatedAt.toISOString(),confirm:true,
    })).rejects.toMatchObject({code:"SEMESTER_STALE"});
    const removed = await deleteCollegeSemester(adminA, created.id, { confirm: true });
    expect(removed.id).toBe(created.id);
    const audit = await pool!.query(
      "SELECT event_type FROM activity_events WHERE subject_id=$1 AND college_id=$2 ORDER BY occurred_at",
      [created.id, SEED_IDS.collegeA],
    );
    expect(audit.rows.map(row => row.event_type).sort()).toEqual([
      "academics.semester.created",
      "academics.semester.deleted",
      "academics.semester.updated",
    ]);
    const absent = await pool!.query("SELECT id FROM program_terms WHERE id=$1", [created.id]);
    expect(absent.rows).toHaveLength(0);
  });

  it("rejects duplicate numbers, unconfirmed deletion and mapped-course dependencies", async () => {
    const created = await createCollegeSemester(adminA, {
      programId: ids.programA, termNumber: 2, name: "Two",
    });
    await expect(createCollegeSemester(adminA, {
      programId: ids.programA, termNumber: 2, name: "Duplicate",
    })).rejects.toMatchObject({ code: "SEMESTER_NUMBER_CONFLICT" });
    await expect(deleteCollegeSemester(adminA, created.id, {})).rejects.toBeDefined();
    await pool!.query(
      "INSERT INTO program_term_courses(id,program_term_id,course_id,type,credits,display_order) " +
      "VALUES($1,$2,$3,'CORE',3,1)",
      [ids.termMap, created.id, ids.courseA],
    );
    await expect(deleteCollegeSemester(adminA, created.id, { confirm: true }))
      .rejects.toMatchObject({ code: "SEMESTER_HAS_COURSES" });
    await expect(updateCollegeSemester(adminA, created.id, {
      name:"Mapped",totalCredits:null,isActive:false,
      expectedUpdatedAt:created.updatedAt.toISOString(),confirm:true,
    })).rejects.toMatchObject({code:"SEMESTER_ACTIVE_CURRICULUM"});
    const stillThere = await pool!.query("SELECT id FROM program_terms WHERE id=$1", [created.id]);
    expect(stillThere.rows).toHaveLength(1);
    await pool!.query("DELETE FROM program_term_courses WHERE id=$1", [ids.termMap]);
    await deleteCollegeSemester(adminA, created.id, { confirm: true });
  });

  it("denies a non-admin and the opposite college on every write, including IDOR by UUID", async () => {
    await expect(createCollegeSemester(faculty, {
      programId: ids.programA, termNumber: 3, name: "Blocked",
    })).rejects.toBeInstanceOf(AuthorizationError);
    await expect(createCollegeSemester(adminA, {
      programId: ids.programB, termNumber: 3, name: "Wrong tenant",
    })).rejects.toMatchObject({ code: "PROGRAM_NOT_FOUND" });

    const created = await createCollegeSemester(adminA, {
      programId: ids.programA, termNumber: 3, name: "Private",
    });
    await expect(updateCollegeSemester(adminB, created.id, {
      name: "Cross tenant", totalCredits: null, isActive: true,
      expectedUpdatedAt:created.updatedAt.toISOString(),confirm:true,
    })).rejects.toMatchObject({ code: "SEMESTER_NOT_FOUND" });
    await expect(deleteCollegeSemester(adminB, created.id, { confirm: true }))
      .rejects.toMatchObject({ code: "SEMESTER_NOT_FOUND" });
    await expect(updateCollegeSemester(faculty, created.id, {
      name: "Role denied", totalCredits: null, isActive: true,
      expectedUpdatedAt:created.updatedAt.toISOString(),confirm:true,
    })).rejects.toBeInstanceOf(AuthorizationError);
    await expect(deleteCollegeSemester(faculty, created.id, { confirm: true }))
      .rejects.toBeInstanceOf(AuthorizationError);
    await deleteCollegeSemester(adminA, created.id, { confirm: true });
  });
});
