import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  listCollegeBatches,
  listCollegeSemesters,
} from "@/modules/academics/college-academic-directory-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled
  ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 })
  : null;

const adminA: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "w-ca-semester-batch",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["COLLEGE_ADMIN"],
  },
};
const adminB: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "w-ca-semester-batch-b",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeBMembership,
    collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["COLLEGE_ADMIN"],
  },
};
const faculty: RequestContext = {
  ...adminA,
  membership: { ...adminA.membership!, roles: ["FACULTY"] },
};

const ids = {
  period: randomUUID(),
  program: randomUUID(),
  term: randomUUID(),
  cohort: randomUUID(),
  course: randomUUID(),
  termCourse: randomUUID(),
  section: randomUUID(),
};
const label = "W-SB-" + ids.program.slice(0, 8);

describe.skipIf(!enabled)("College Admin Semesters/Batches real PostgreSQL denial", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("Isolated TEST_DATABASE_URL is required");
    const check = await pool.query(
      "SELECT to_regclass('public.program_terms') AS terms, " +
      "to_regclass('public.program_term_courses') AS mappings, " +
      "to_regclass('public.cohort_progression_state') AS progression",
    );
    for (const value of Object.values(check.rows[0] ?? {})) {
      if (!value) throw new Error("DB0050/51 registered tables are required");
    }
    await pool.query(
      "INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) " +
      "VALUES($1,$2,$3,$4,'2026-07-01','2026-12-31')",
      [ids.period, SEED_IDS.collegeA, label, label],
    );
    await pool.query(
      "INSERT INTO programs(id,department_id,name,code,duration_terms) " +
      "VALUES($1,$2,$3,$4,8)",
      [ids.program, SEED_IDS.departmentA, label, label],
    );
    await pool.query(
      "INSERT INTO program_terms(id,program_id,term_number,name,total_credits) " +
      "VALUES($1,$2,1,$3,18)",
      [ids.term, ids.program, label],
    );
    await pool.query(
      "INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES($1,$2,$3,$4,$5)",
      [ids.cohort, ids.program, label, label, ids.period],
    );
    await pool.query(
      "INSERT INTO cohort_progression_state(cohort_id,current_term_number,current_academic_year_start,current_period_id) " +
      "VALUES($1,1,2026,$2) ON CONFLICT (cohort_id) DO NOTHING",
      [ids.cohort, ids.period],
    );
    await pool.query(
      "INSERT INTO courses(id,department_id,name,code) VALUES($1,$2,$3,$4)",
      [ids.course, SEED_IDS.departmentA, label, label],
    );
    await pool.query(
      "INSERT INTO program_term_courses(id,program_term_id,course_id,type,credits,display_order) " +
      "VALUES($1,$2,$3,'CORE',3,1)",
      [ids.termCourse, ids.term, ids.course],
    );
    await pool.query(
      "INSERT INTO sections(id,cohort_id,academic_period_id,name,code) VALUES($1,$2,$3,$4,$5)",
      [ids.section, ids.cohort, ids.period, label, label],
    );
  });

  afterAll(async () => {
    try {
      if (pool) {
        const rows: ReadonlyArray<readonly [string, string, string]> = [
          ["sections", "id", ids.section],
          ["program_term_courses", "id", ids.termCourse],
          ["courses", "id", ids.course],
          // Version-0 state is owned by its cohort and cascades on valid cohort
          // cleanup. Direct deletion is forbidden by registered DB-005 audit guards.
          ["cohorts", "id", ids.cohort],
          ["program_terms", "id", ids.term],
          ["programs", "id", ids.program],
          ["academic_periods", "id", ids.period],
        ];
        for (const [table, column, id] of rows) {
          // Only hardcoded test-owned table/column identifiers; bind UUID values.
          await pool.query(`DELETE FROM ${table} WHERE ${column} = $1`, [id]);
        }
      }
    } finally {
      await pool?.end();
      await closeDatabaseConnection();
    }
  });

  it("exposes actual program term and batch progression only within owning college", async () => {
    const [semestersA, batchesA, semestersB, batchesB] = await Promise.all([
      listCollegeSemesters(adminA, { q: label }),
      listCollegeBatches(adminA, { q: label }),
      listCollegeSemesters(adminB, { q: label }),
      listCollegeBatches(adminB, { q: label }),
    ]);
    expect(semestersA.items.find((row) => row.id === ids.term)).toMatchObject({
      mappedCourses: 1, totalCredits: 18, termNumber: 1,
      name: label, programId: ids.program, programName: label,
    });
    expect(batchesA.items.find((row) => row.id === ids.cohort)).toMatchObject({
      currentTermNumber: 1, currentAcademicYearStart: 2026, activeSections: 1,
      activeEnrolledLearners: 0,
      name: label, code: label, programId: ids.program,
      programName: label, programCode: label, startPeriodId: ids.period,
    });
    const [matchedTerm, otherTerm] = await Promise.all([
      listCollegeSemesters(adminA, { q: label, termNumber: 1 }),
      listCollegeSemesters(adminA, { q: label, termNumber: 2 }),
    ]);
    expect(matchedTerm.items.map((row) => row.id)).toContain(ids.term);
    expect(otherTerm.items).toEqual([]);
    const [min18,min19]=await Promise.all([
      listCollegeSemesters(adminA,{q:label,minimumCredits:18}),
      listCollegeSemesters(adminA,{q:label,minimumCredits:19}),
    ]);
    expect(min18.items.map(r=>r.id)).toContain(ids.term);
    expect(min19.items).toEqual([]);
    const [max18,max17]=await Promise.all([
      listCollegeSemesters(adminA,{q:label,maximumCredits:18}),
      listCollegeSemesters(adminA,{q:label,maximumCredits:17}),
    ]);
    expect(max18.items.map(r=>r.id)).toContain(ids.term);
    expect(max17.items).toEqual([]);
    expect(semestersB.items).toEqual([]);
    const [year2026, year2027] = await Promise.all([
      listCollegeBatches(adminA, { q: label, yearStart: 2026 }),
      listCollegeBatches(adminA, { q: label, yearStart: 2027 }),
    ]);
    expect(year2026.items.map((row) => row.id)).toContain(ids.cohort);
    expect(year2027.items).toEqual([]);
    expect(batchesB.items).toEqual([]);
    const [termOne,termTwo]=await Promise.all([
      listCollegeBatches(adminA,{q:label,currentTerm:1}),
      listCollegeBatches(adminA,{q:label,currentTerm:2}),
    ]);
    expect(termOne.items.map(r=>r.id)).toContain(ids.cohort);
    expect(termTwo.items).toEqual([]);
    const recorded = await listCollegeBatches(adminA,{q:label,progression:"RECORDED"});
    const missing = await listCollegeBatches(adminA,{q:label,progression:"MISSING"});
    expect(recorded.items.map(r=>r.id)).toContain(ids.cohort);
    expect(missing.items).toEqual([]);
  });

  it("denies Faculty and forged college controls before querying private rows", async () => {
    await expect(listCollegeSemesters(faculty, {}))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(listCollegeBatches(faculty, {}))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(listCollegeSemesters(adminA, { collegeId: SEED_IDS.collegeB }))
      .rejects.toBeDefined();
    await expect(listCollegeBatches(adminA, { collegeId: SEED_IDS.collegeB }))
      .rejects.toBeDefined();
  });

  it("returns honest empties for nonexistent filters", async () => {
    const [semesters, batches] = await Promise.all([
      listCollegeSemesters(adminA, { q: "never-a-term-w42" }),
      listCollegeBatches(adminA, { q: "never-a-batch-w42" }),
    ]);
    expect(semesters.items).toEqual([]);
    expect(batches.items).toEqual([]);
    expect(semesters.total).toBe(0);
    expect(batches.total).toBe(0);
  });
  it("filters semesters by recorded credit configuration within the admin college", async () => {
    const [configured,missing,foreign] = await Promise.all([
      listCollegeSemesters(adminA,{q:label,creditState:"CONFIGURED"}),
      listCollegeSemesters(adminA,{q:label,creditState:"UNSET"}),
      listCollegeSemesters(adminB,{q:label,creditState:"CONFIGURED"}),
    ]);
    expect(configured.items.map(row=>row.id)).toContain(ids.term);
    expect(missing.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });

  it("semester parent program lifecycle is scoped to own persisted college records",async()=>{
    const [positive,negative,foreign]=await Promise.all([
      listCollegeSemesters(adminA,{q:label,programStatus:"ACTIVE"}),
      listCollegeSemesters(adminA,{q:label,programStatus:"ARCHIVED"}),
      listCollegeSemesters(adminB,{q:label,programStatus:"ACTIVE"}),
    ]);
    expect(positive.items.map(row=>row.id)).toContain(ids.term);
    expect(negative.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });

  it("mappingState: matches persisted own-college evidence only",async()=>{
    const [matching,excluded,foreign]=await Promise.all([
      listCollegeSemesters(adminA,{q:label,mappingState:"MAPPED"}),
      listCollegeSemesters(adminA,{q:label,mappingState:"UNMAPPED"}),
      listCollegeSemesters(adminB,{q:label,mappingState:"MAPPED"}),
    ]);
    expect(matching.items.map(row=>row.id)).toContain(ids.term);
    expect(excluded.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });

  it("expectedEndState: matches persisted own-college evidence only",async()=>{
    const [matching,excluded,foreign]=await Promise.all([
      listCollegeBatches(adminA,{q:label,expectedEndState:"UNSET"}),
      listCollegeBatches(adminA,{q:label,expectedEndState:"SET"}),
      listCollegeBatches(adminB,{q:label,expectedEndState:"UNSET"}),
    ]);
    expect(matching.items.map(row=>row.id)).toContain(ids.cohort);
    expect(excluded.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });

  it("academicYearState: matches persisted own-college evidence only",async()=>{
    const [matching,excluded,foreign]=await Promise.all([
      listCollegeBatches(adminA,{q:label,academicYearState:"RECORDED"}),
      listCollegeBatches(adminA,{q:label,academicYearState:"UNRECORDED"}),
      listCollegeBatches(adminB,{q:label,academicYearState:"RECORDED"}),
    ]);
    expect(matching.items.map(row=>row.id)).toContain(ids.cohort);
    expect(excluded.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });

  it("filters batches by college-owned parent program status",async()=>{
    const [own,archived,foreign]=await Promise.all([
      listCollegeBatches(adminA,{q:label,programStatus:"ACTIVE"}),
      listCollegeBatches(adminA,{q:label,programStatus:"ARCHIVED"}),
      listCollegeBatches(adminB,{q:label,programStatus:"ACTIVE"}),
    ]);
    expect(own.items.map(row=>row.id)).toContain(ids.cohort);
    expect(archived.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });

  it("startOnOrAfter filters college-owned persisted cohort period starts",async()=>{
    const [matching,excluded,foreign]=await Promise.all([
      listCollegeBatches(adminA,{q:label,startOnOrAfter:"2026-06-30"}),
      listCollegeBatches(adminA,{q:label,startOnOrAfter:"2026-07-02"}),
      listCollegeBatches(adminB,{q:label,startOnOrAfter:"2026-06-30"}),
    ]);
    expect(matching.items.map(row=>row.id)).toContain(ids.cohort);
    expect(excluded.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });

  it("startOnOrBefore filters registered own-college cohort period starts",async()=>{
    const [matching,excluded,foreign]=await Promise.all([
      listCollegeBatches(adminA,{q:label,startOnOrBefore:"2026-07-02"}),
      listCollegeBatches(adminA,{q:label,startOnOrBefore:"2026-06-30"}),
      listCollegeBatches(adminB,{q:label,startOnOrBefore:"2026-07-02"}),
    ]);
    expect(matching.items.map(row=>row.id)).toContain(ids.cohort);
    expect(excluded.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });

  it("activeClassState filters only registered classes in the owning college",async()=>{
    const [matching,empty,foreign]=await Promise.all([
      listCollegeBatches(adminA,{q:label,activeClassState:"HAS_ACTIVE"}),
      listCollegeBatches(adminA,{q:label,activeClassState:"NONE_ACTIVE"}),
      listCollegeBatches(adminB,{q:label,activeClassState:"HAS_ACTIVE"}),
    ]);
    expect(matching.items.map(row=>row.id)).toContain(ids.cohort);
    expect(empty.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });

  it("activeLearnerState filters only registered learner enrollments in the owning college",async()=>{
    const [matching,empty,foreign]=await Promise.all([
      listCollegeBatches(adminA,{q:label,activeLearnerState:"NONE_ACTIVE"}),
      listCollegeBatches(adminA,{q:label,activeLearnerState:"HAS_ACTIVE"}),
      listCollegeBatches(adminB,{q:label,activeLearnerState:"NONE_ACTIVE"}),
    ]);
    expect(matching.items.map(row=>row.id)).toContain(ids.cohort);
    expect(empty.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });

});
