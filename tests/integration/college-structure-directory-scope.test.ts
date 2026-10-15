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

  it("Academic period status uses persisted college class parents before pagination",async()=>{
    const persistedPeriod=await pool!.query<{status:string}>("SELECT status FROM academic_periods WHERE id=$1",[ids.period]);
    const actual=persistedPeriod.rows[0]!.status;const other=actual==="CLOSED"?"ACTIVE":"CLOSED";
    const [found,excluded,foreign]=await Promise.all([
      listCollegeClasses(adminA,{q:key,periodLifecycle:actual}),
      listCollegeClasses(adminA,{q:key,periodLifecycle:other}),
      listCollegeClasses(adminB,{q:key,periodLifecycle:actual}),
    ]);
    expect(found.items.map(row=>row.id)).toContain(ids.section);
    expect(excluded.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });
  it("Exact program code is scoped before class pagination",async()=>{
    const [matching,excluded,foreign]=await Promise.all([
      listCollegeClasses(adminA,{q:key,programCode:key}),
      listCollegeClasses(adminA,{q:key,programCode:"NOT-MATCHED"}),
      listCollegeClasses(adminB,{q:key,programCode:key}),
    ]);
    expect(matching.items.map(row=>row.id)).toContain(ids.section);
    expect(excluded.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });
  it("Exact class name is scoped before class pagination",async()=>{
    const [matching,excluded,foreign]=await Promise.all([
      listCollegeClasses(adminA,{q:key,className:key}),
      listCollegeClasses(adminA,{q:key,className:"NOT-MATCHED"}),
      listCollegeClasses(adminB,{q:key,className:key}),
    ]);
    expect(matching.items.map(row=>row.id)).toContain(ids.section);
    expect(excluded.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });
  it("Exact cohort name is scoped before class pagination",async()=>{
    const [matching,excluded,foreign]=await Promise.all([
      listCollegeClasses(adminA,{q:key,cohortName:key}),
      listCollegeClasses(adminA,{q:key,cohortName:"NOT-MATCHED"}),
      listCollegeClasses(adminB,{q:key,cohortName:key}),
    ]);
    expect(matching.items.map(row=>row.id)).toContain(ids.section);
    expect(excluded.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });
  it("Saved section schedule is observed only on persisted own-college classes",async()=>{
    const [absent,present,foreign]=await Promise.all([
      listCollegeClasses(adminA,{q:key,schedulePresence:"NO_EVENTS"}),
      listCollegeClasses(adminA,{q:key,schedulePresence:"HAS_EVENTS"}),
      listCollegeClasses(adminB,{q:key,schedulePresence:"NO_EVENTS"}),
    ]);
    expect(absent.items.map(row=>row.id)).toContain(ids.section);
    expect(present.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });
  it("Current section Faculty assignments is observed only on persisted own-college classes",async()=>{
    const [absent,present,foreign]=await Promise.all([
      listCollegeClasses(adminA,{q:key,facultyCoverage:"NO_FACULTY"}),
      listCollegeClasses(adminA,{q:key,facultyCoverage:"HAS_FACULTY"}),
      listCollegeClasses(adminB,{q:key,facultyCoverage:"NO_FACULTY"}),
    ]);
    expect(absent.items.map(row=>row.id)).toContain(ids.section);
    expect(present.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });
  it("Authored section course deliveries is observed only on persisted own-college classes",async()=>{
    const [absent,present,foreign]=await Promise.all([
      listCollegeClasses(adminA,{q:key,deliveryPresence:"NO_DELIVERIES"}),
      listCollegeClasses(adminA,{q:key,deliveryPresence:"HAS_DELIVERIES"}),
      listCollegeClasses(adminB,{q:key,deliveryPresence:"NO_DELIVERIES"}),
    ]);
    expect(absent.items.map(row=>row.id)).toContain(ids.section);
    expect(present.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });
  it("Period start date on or after filters persisted own-college academic date",async()=>{
    const [matching,excluded,foreign]=await Promise.all([
      listCollegeClasses(adminA,{q:key,periodStartsOnOrAfter:"2026-07-01"}),
      listCollegeClasses(adminA,{q:key,periodStartsOnOrAfter:"2026-07-02"}),
      listCollegeClasses(adminB,{q:key,periodStartsOnOrAfter:"2026-07-01"}),
    ]);
    expect(matching.items.map(row=>row.id)).toContain(ids.section);
    expect(excluded.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });
  it("Period end date on or before filters persisted own-college academic date",async()=>{
    const [matching,excluded,foreign]=await Promise.all([
      listCollegeClasses(adminA,{q:key,periodEndsOnOrBefore:"2026-12-31"}),
      listCollegeClasses(adminA,{q:key,periodEndsOnOrBefore:"2026-12-30"}),
      listCollegeClasses(adminB,{q:key,periodEndsOnOrBefore:"2026-12-31"}),
    ]);
    expect(matching.items.map(row=>row.id)).toContain(ids.section);
    expect(excluded.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });
  it("filters classes by the persisted department belonging to their College Admin",async()=>{
    const department=await pool!.query<{code:string}>("SELECT code FROM departments WHERE id=$1",[SEED_IDS.departmentA]);
    const code=department.rows[0]!.code;
    const [matching,excluded,foreign]=await Promise.all([
      listCollegeClasses(adminA,{q:key,departmentCode:code}),
      listCollegeClasses(adminA,{q:key,departmentCode:"NO-MATCHING-DEPARTMENT"}),
      listCollegeClasses(adminB,{q:key,departmentCode:code}),
    ]);
    expect(matching.items.map(row=>row.id)).toContain(ids.section);
    expect(excluded.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });
  it("Exact elective slot name filters persisted own-college slots and exports",async()=>{
    
    const [own,missing,foreign,csvOwn,csvForeign]=await Promise.all([
      listCollegeElectives(adminA,{q:key,slotName:key}),
      listCollegeElectives(adminA,{q:key,slotName:"NOT-A-SLOT"}),
      listCollegeElectives(adminB,{q:key,slotName:key}),
      exportCollegeElectives(adminA,{q:key,slotName:key}),
      exportCollegeElectives(adminB,{q:key,slotName:key}),
    ]);
    expect(own.items.map(row=>row.id)).toContain(ids.elective);
    expect(missing.items).toEqual([]);
    expect(foreign.items).toEqual([]);
    expect(csvOwn.csv).toContain(key);
    expect(csvForeign.csv).not.toContain(key);
  });
  it("Exact elective program code filters persisted own-college slots and exports",async()=>{
    
    const [own,missing,foreign,csvOwn,csvForeign]=await Promise.all([
      listCollegeElectives(adminA,{q:key,programCode:key}),
      listCollegeElectives(adminA,{q:key,programCode:"NOT-A-PROGRAM"}),
      listCollegeElectives(adminB,{q:key,programCode:key}),
      exportCollegeElectives(adminA,{q:key,programCode:key}),
      exportCollegeElectives(adminB,{q:key,programCode:key}),
    ]);
    expect(own.items.map(row=>row.id)).toContain(ids.elective);
    expect(missing.items).toEqual([]);
    expect(foreign.items).toEqual([]);
    expect(csvOwn.csv).toContain(key);
    expect(csvForeign.csv).not.toContain(key);
  });
  it("Elective owning department code filters persisted own-college slots and exports",async()=>{
    const department=await pool!.query<{code:string}>("SELECT code FROM departments WHERE id=$1",[SEED_IDS.departmentA]);const departmentCode=department.rows[0]!.code;
    const [own,missing,foreign,csvOwn,csvForeign]=await Promise.all([
      listCollegeElectives(adminA,{q:key,departmentCode:departmentCode}),
      listCollegeElectives(adminA,{q:key,departmentCode:"NOT-A-DEPARTMENT"}),
      listCollegeElectives(adminB,{q:key,departmentCode:departmentCode}),
      exportCollegeElectives(adminA,{q:key,departmentCode:departmentCode}),
      exportCollegeElectives(adminB,{q:key,departmentCode:departmentCode}),
    ]);
    expect(own.items.map(row=>row.id)).toContain(ids.elective);
    expect(missing.items).toEqual([]);
    expect(foreign.items).toEqual([]);
    expect(csvOwn.csv).toContain(key);
    expect(csvForeign.csv).not.toContain(key);
  });
  it("Minimum required elective choices restricts persisted College elective lists and CSV",async()=>{
    const [matching,excluded,foreign,csvMatched,csvExcluded]=await Promise.all([
      listCollegeElectives(adminA,{q:key,minimumRequiredPicks:1}),
      listCollegeElectives(adminA,{q:key,minimumRequiredPicks:2}),
      listCollegeElectives(adminB,{q:key,minimumRequiredPicks:1}),
      exportCollegeElectives(adminA,{q:key,minimumRequiredPicks:1}),
      exportCollegeElectives(adminA,{q:key,minimumRequiredPicks:2}),
    ]);
    expect(matching.items.map(row=>row.id)).toContain(ids.elective);
    expect(excluded.items).toEqual([]);
    expect(foreign.items).toEqual([]);
    expect(csvMatched.csv).toContain(key);
    expect(csvExcluded.csv).not.toContain(key);
  });
  it("Maximum allowed elective choices restricts persisted College elective lists and CSV",async()=>{
    const [matching,excluded,foreign,csvMatched,csvExcluded]=await Promise.all([
      listCollegeElectives(adminA,{q:key,maximumAllowedPicks:2}),
      listCollegeElectives(adminA,{q:key,maximumAllowedPicks:1}),
      listCollegeElectives(adminB,{q:key,maximumAllowedPicks:2}),
      exportCollegeElectives(adminA,{q:key,maximumAllowedPicks:2}),
      exportCollegeElectives(adminA,{q:key,maximumAllowedPicks:1}),
    ]);
    expect(matching.items.map(row=>row.id)).toContain(ids.elective);
    expect(excluded.items).toEqual([]);
    expect(foreign.items).toEqual([]);
    expect(csvMatched.csv).toContain(key);
    expect(csvExcluded.csv).not.toContain(key);
  });
});
