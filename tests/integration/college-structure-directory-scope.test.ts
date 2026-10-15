import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { exportCollegeElectives } from "@/modules/academics/college-elective-export-service";
import {
  listCollegeClasses,
  listCollegeElectives,
} from "@/modules/academics/college-structure-directory-service";
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
    identityUid: "college-structure-admin-a",
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
    identityUid: "college-structure-admin-b",
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
const nonAdmin: RequestContext = {
  ...adminA,
  membership: { ...adminA.membership!, roles: ["FACULTY"] },
};
const ids = {
  period: randomUUID(),
  program: randomUUID(),
  cohort: randomUUID(),
  section: randomUUID(),
  elective: randomUUID(),
};
const key = "W-Structure-" + ids.program.slice(0, 8);

describe.skipIf(!enabled)("College Admin Classes/Electives disposable PostgreSQL scope", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("A disposable PostgreSQL connection is required");
    const relations = await pool.query(
      "SELECT to_regclass('public.sections') AS sections, " +
      "to_regclass('public.elective_slots') AS slots, " +
      "to_regclass('public.elective_offerings') AS offerings",
    );
    for (const value of Object.values(relations.rows[0] ?? {})) {
      if (!value) throw new Error("Registered academic and DB-0037 elective migrations required");
    }
    await pool.query(
      "INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) " +
      "VALUES($1,$2,$3,$4,'2026-07-01','2026-12-31')",
      [ids.period, SEED_IDS.collegeA, key, key],
    );
    await pool.query(
      "INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3,$4,8)",
      [ids.program, SEED_IDS.departmentA, key, key],
    );
    await pool.query(
      "INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES($1,$2,$3,$4,$5)",
      [ids.cohort, ids.program, key, key, ids.period],
    );
    await pool.query(
      "INSERT INTO sections(id,cohort_id,academic_period_id,name,code,capacity) " +
      "VALUES($1,$2,$3,$4,$5,36)",
      [ids.section, ids.cohort, ids.period, key, key],
    );
    await pool.query(
      "INSERT INTO elective_slots(id,college_id,program_id,academic_period_id,semester_number,name,credits,min_pick,max_pick) " +
      "VALUES($1,$2,$3,$4,1,$5,3,1,2)",
      [ids.elective, SEED_IDS.collegeA, ids.program, ids.period, key],
    );
  });

  afterAll(async () => {
    try {
      if (pool) {
        const deletions: ReadonlyArray<readonly [string, string]> = [
          ["elective_slots", ids.elective],
          ["sections", ids.section],
          ["cohorts", ids.cohort],
          ["programs", ids.program],
          ["academic_periods", ids.period],
        ];
        for (const [table, id] of deletions) {
          // Fixed test-owned table names; UUID remains a bound parameter.
          await pool.query(`DELETE FROM ${table} WHERE id=$1`, [id]);
        }
      }
    } finally {
      await pool?.end();
      await closeDatabaseConnection();
    }
  });

  it("shows persisted own-college class and elective slots with honest counts", async () => {
    const [classes, electives] = await Promise.all([
      listCollegeClasses(adminA, { q: key }),
      listCollegeElectives(adminA, { q: key }),
    ]);
    const [capacityFit, capacityTooHigh] = await Promise.all([
      listCollegeClasses(adminA, { q: key, minimumCapacity: 36 }),
      listCollegeClasses(adminA, { q: key, minimumCapacity: 37 }),
    ]);
    expect(capacityFit.items.map(item => item.id)).toContain(ids.section);
    expect(capacityTooHigh.items).toEqual([]);
    const [max36,max35]=await Promise.all([
      listCollegeClasses(adminA,{q:key,maximumCapacity:36}),
      listCollegeClasses(adminA,{q:key,maximumCapacity:35}),
    ]);
    expect(max36.items.map(r=>r.id)).toContain(ids.section);
    expect(max35.items).toEqual([]);
    expect(classes.items.find(item => item.id === ids.section))
      .toMatchObject({ capacity: 36, activeLearners: 0 });
    const [firstTerm, secondTerm] = await Promise.all([
      listCollegeElectives(adminA, { q: key, semesterNumber: 1 }),
      listCollegeElectives(adminA, { q: key, semesterNumber: 2 }),
    ]);
    expect(firstTerm.items.map(item => item.id)).toContain(ids.elective);
    expect(secondTerm.items).toEqual([]);
    const [credits3,credits4]=await Promise.all([
      listCollegeElectives(adminA,{q:key,minimumCredits:3}),
      listCollegeElectives(adminA,{q:key,minimumCredits:4}),
    ]);
    expect(credits3.items.map(r=>r.id)).toContain(ids.elective);
    expect(credits4.items).toEqual([]);
    expect(electives.items.find(item => item.id === ids.elective))
      .toMatchObject({ semesterNumber: 1, minPick: 1, maxPick: 2, activeOfferings: 0 });
  });

  it("exports registered elective slots within the signed-in college only",async()=>{
    const own=await exportCollegeElectives(adminA,{q:key});
    const foreign=await exportCollegeElectives(adminB,{q:key});
    expect(own.csv).toContain(key);
    expect(own.csv).toContain("Minimum picks");
    expect(foreign.csv).not.toContain(key);
    await expect(exportCollegeElectives(nonAdmin,{})).rejects.toBeInstanceOf(AuthorizationError);
  });
  it("does not expose either registered record to a different college", async () => {
    const [classes, electives] = await Promise.all([
      listCollegeClasses(adminB, { q: key }),
      listCollegeElectives(adminB, { q: key }),
    ]);
    expect(classes.items).toEqual([]);
    expect(electives.items).toEqual([]);
  });

  it("denies faculty and caller-injected college IDs", async () => {
    await expect(listCollegeClasses(nonAdmin, {}))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(listCollegeElectives(nonAdmin, {}))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(listCollegeClasses(adminA, { collegeId: SEED_IDS.collegeB }))
      .rejects.toBeDefined();
    await expect(listCollegeElectives(adminA, { collegeId: SEED_IDS.collegeB }))
      .rejects.toBeDefined();
  });

  it("does not fabricate missing class/elective records", async () => {
    const [classes, electives] = await Promise.all([
      listCollegeClasses(adminA, { q: "absent-w42-class" }),
      listCollegeElectives(adminA, { q: "absent-w42-elective" }),
    ]);
    expect(classes.total).toBe(0);
    expect(electives.total).toBe(0);
    expect(classes.items).toEqual([]);
    expect(electives.items).toEqual([]);
  });
  it("cohortStatus uses the persisted same-college academic relation",async()=>{
    const statusRow=await pool!.query<{status:string}>("SELECT status FROM cohorts WHERE id=$1",[ids.cohort]);
    const expected=statusRow.rows[0]!.status;
    const [matching,other,foreign]=await Promise.all([
      listCollegeClasses(adminA,{q:key,cohortStatus:expected}),
      listCollegeClasses(adminA,{q:key,cohortStatus:(expected==="ACTIVE"?"ARCHIVED":"ACTIVE")}),
      listCollegeClasses(adminB,{q:key,cohortStatus:expected}),
    ]);
    expect(matching.items.map(row=>row.id)).toContain(ids.section);
    expect(other.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });

  it("programStatus uses the persisted same-college academic relation",async()=>{
    const statusRow=await pool!.query<{status:string}>("SELECT status FROM programs WHERE id=$1",[ids.program]);
    const expected=statusRow.rows[0]!.status;
    const [matching,other,foreign]=await Promise.all([
      listCollegeClasses(adminA,{q:key,programStatus:expected}),
      listCollegeClasses(adminA,{q:key,programStatus:(expected==="ACTIVE"?"ARCHIVED":"ACTIVE")}),
      listCollegeClasses(adminB,{q:key,programStatus:expected}),
    ]);
    expect(matching.items.map(row=>row.id)).toContain(ids.section);
    expect(other.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });

  it("periodState uses the persisted same-college academic relation",async()=>{
    
    const [matching,other,foreign]=await Promise.all([
      listCollegeElectives(adminA,{q:key,periodState:"LINKED"}),
      listCollegeElectives(adminA,{q:key,periodState:"UNLINKED"}),
      listCollegeElectives(adminB,{q:key,periodState:"LINKED"}),
    ]);
    expect(matching.items.map(row=>row.id)).toContain(ids.elective);
    expect(other.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });

  it("elective program lifecycle filters only the owning college",async()=>{
    const statusRow=await pool!.query<{status:string}>("SELECT status FROM programs WHERE id=$1",[ids.program]);
    const status=statusRow.rows[0]!.status;
    const [matching,excluded,foreign]=await Promise.all([
      listCollegeElectives(adminA,{q:key,programStatus:status}),
      listCollegeElectives(adminA,{q:key,programStatus:status==="ACTIVE"?"ARCHIVED":"ACTIVE"}),
      listCollegeElectives(adminB,{q:key,programStatus:status}),
    ]);
    expect(matching.items.map(row=>row.id)).toContain(ids.elective);
    expect(excluded.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });

  it("periodCode restricts registered classes within owning college",async()=>{
    const [matching,other,foreign]=await Promise.all([
      listCollegeClasses(adminA,{q:key,periodCode:key}),
      listCollegeClasses(adminA,{q:key,periodCode:"NO-SUCH-CODE"}),
      listCollegeClasses(adminB,{q:key,periodCode:key}),
    ]);
    expect(matching.items.map(row=>row.id)).toContain(ids.section);
    expect(other.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });

  it("classCode restricts registered classes within owning college",async()=>{
    const [matching,other,foreign]=await Promise.all([
      listCollegeClasses(adminA,{q:key,classCode:key}),
      listCollegeClasses(adminA,{q:key,classCode:"NO-SUCH-CODE"}),
      listCollegeClasses(adminB,{q:key,classCode:key}),
    ]);
    expect(matching.items.map(row=>row.id)).toContain(ids.section);
    expect(other.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });

  it("choiceMode finds only registered own-college elective evidence",async()=>{
    const [matching,excluded,foreign]=await Promise.all([
      listCollegeElectives(adminA,{q:key,choiceMode:"FLEXIBLE"}),
      listCollegeElectives(adminA,{q:key,choiceMode:"FIXED"}),
      listCollegeElectives(adminB,{q:key,choiceMode:"FLEXIBLE"}),
    ]);
    expect(matching.items.map(row=>row.id)).toContain(ids.elective);
    expect(excluded.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });

  it("offeringState finds only registered own-college elective evidence",async()=>{
    const [matching,excluded,foreign]=await Promise.all([
      listCollegeElectives(adminA,{q:key,offeringState:"NONE_ACTIVE"}),
      listCollegeElectives(adminA,{q:key,offeringState:"HAS_ACTIVE"}),
      listCollegeElectives(adminB,{q:key,offeringState:"NONE_ACTIVE"}),
    ]);
    expect(matching.items.map(row=>row.id)).toContain(ids.elective);
    expect(excluded.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });

  it("academicYearState reflects nullable persisted slot academic years only",async()=>{
    const [missing,recorded,foreign]=await Promise.all([
      listCollegeElectives(adminA,{q:key,academicYearState:"MISSING"}),
      listCollegeElectives(adminA,{q:key,academicYearState:"RECORDED"}),
      listCollegeElectives(adminB,{q:key,academicYearState:"MISSING"}),
    ]);
    expect(missing.items.map(row=>row.id)).toContain(ids.elective);
    expect(recorded.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });

  it("elective periodCode matches own-college registered linked period",async()=>{
    const [matching,other,foreign]=await Promise.all([
      listCollegeElectives(adminA,{q:key,periodCode:key}),
      listCollegeElectives(adminA,{q:key,periodCode:"NOT-A-PERIOD"}),
      listCollegeElectives(adminB,{q:key,periodCode:key}),
    ]);
    expect(matching.items.map(row=>row.id)).toContain(ids.elective);
    expect(other.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });

});
