import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { CollegePersonNotFoundError } from "@/modules/people/college-person-detail-model";
import { getCollegeFacultyDetail } from "@/modules/people/college-faculty-detail-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, {serviceBound: true});
const pool = enabled ? new Pool({connectionString: process.env.TEST_DATABASE_URL, max: 2}) : null;
const admin: RequestContext = {
  user: {id: SEED_IDS.collegeAdminUser, identityUid: "faculty-detail-admin", platformStatus: "ACTIVE", systemRoles: []},
  membership: {id: SEED_IDS.collegeAdminMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"]},
};
const foreign: RequestContext = {
  user: {...admin.user, id: SEED_IDS.facultyUser},
  membership: {id: SEED_IDS.facultyCollegeBMembership, collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"]},
};
const learner: RequestContext = {...admin, membership: {...admin.membership!, roles: ["LEARNER"]}};
const ids = { user: randomUUID(), membership: randomUUID(), roleId: randomUUID(),
  period: randomUUID(), program: randomUUID(), cohort: randomUUID(),
  section: randomUUID(), course: randomUUID(), offering: randomUUID(),
  delivery: randomUUID(), assignment: randomUUID() };
const code = "w-faculty-detail-" + ids.period.slice(0, 8);

describe.skipIf(!enabled)("College Faculty Detail DB ownership", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("Disposable PG required");
    await pool.query("INSERT INTO users(id,identity_uid,display_name) VALUES($1,$2,$3)",
      [ids.user, ids.user, code]);
    await pool.query("INSERT INTO college_memberships(id,user_id,college_id) VALUES($1,$2,$3)",
      [ids.membership, ids.user, SEED_IDS.collegeA]);
    await pool.query("INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,'FACULTY')",
      [ids.roleId, ids.membership]);
    await pool.query("INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) VALUES($1,$2,$3,$4,'2026-07-01','2026-12-31')",
      [ids.period, SEED_IDS.collegeA, code, code]);
    await pool.query("INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3,$4,8)",
      [ids.program, SEED_IDS.departmentA, code, code]);
    await pool.query("INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES($1,$2,$3,$4,$5)",
      [ids.cohort, ids.program, code, code, ids.period]);
    await pool.query("INSERT INTO sections(id,cohort_id,academic_period_id,name,code) VALUES($1,$2,$3,$4,$5)",
      [ids.section, ids.cohort, ids.period, code, code]);
    await pool.query("INSERT INTO courses(id,department_id,name,code) VALUES($1,$2,$3,$4)",
      [ids.course, SEED_IDS.departmentA, code, code]);
    await pool.query("INSERT INTO course_offerings(id,course_id,cohort_id,academic_period_id) VALUES($1,$2,$3,$4)",
      [ids.offering, ids.course, ids.cohort, ids.period]);
    await pool.query("INSERT INTO course_section_deliveries(id,offering_id,section_id) VALUES($1,$2,$3)",
      [ids.delivery, ids.offering, ids.section]);
    await pool.query("INSERT INTO course_teaching_assignments(id,delivery_id,membership_id,role) VALUES($1,$2,$3,'PRIMARY')",
      [ids.assignment, ids.delivery, ids.membership]);
  });
  afterAll(async () => {
    try {
      if (pool) for (const [table,id] of [
        ["course_teaching_assignments", ids.assignment], ["course_section_deliveries", ids.delivery],
        ["course_offerings", ids.offering], ["courses", ids.course], ["sections", ids.section],
        ["cohorts", ids.cohort], ["programs", ids.program], ["academic_periods", ids.period],
        ["membership_roles", ids.roleId], ["college_memberships", ids.membership],
        ["users", ids.user],
      ] as const) {
        if(table==="courses") await pool.query("DELETE FROM program_term_courses WHERE course_id=$1",[id]);
        if(table==="programs") await pool.query("DELETE FROM program_terms WHERE program_id=$1",[id]);
        await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
      }
    } finally {await pool?.end(); await closeDatabaseConnection();}
  });
  it("shows own-college faculty and actual teaching counts without private identity", async () => {
    const data = await getCollegeFacultyDetail(admin, ids.membership);
    expect(data.assignments.map(x=>x.id)).toContain(ids.assignment);
    expect(data.counts.activeAssignments).toBe(1);
    expect(data.person.name).toBe(code);
    expect("identityUid" in data.person).toBe(false);
    expect("email" in data.person).toBe(false);
  });
  it("limits assignment history at SQL level without changing total summary",async()=>{
    const active=await getCollegeFacultyDetail(admin,ids.membership,{status:"ACTIVE"});
    const ended=await getCollegeFacultyDetail(admin,ids.membership,{status:"ENDED"});
    expect(active.assignments.map(row=>row.id)).toContain(ids.assignment);
    expect(ended.assignments).toHaveLength(0);
    expect(ended.counts.totalAssignments).toBe(active.counts.totalAssignments);
    expect(ended.counts.activeAssignments).toBe(1);
    await expect(getCollegeFacultyDetail(foreign,ids.membership,{status:"ENDED"}))
      .rejects.toBeInstanceOf(CollegePersonNotFoundError);
    await expect(getCollegeFacultyDetail(learner,ids.membership,{status:"ACTIVE"}))
      .rejects.toBeInstanceOf(AuthorizationError);
  });
  it("filters teaching history by persisted teaching role before the row cap",async()=>{
    const primary=await getCollegeFacultyDetail(admin,ids.membership,{role:"PRIMARY"});
    const assistant=await getCollegeFacultyDetail(admin,ids.membership,{role:"TA"});
    expect(primary.assignments.map(item=>item.id)).toContain(ids.assignment);
    expect(assistant.assignments).toHaveLength(0);
    expect(primary.counts.totalAssignments).toBe(assistant.counts.totalAssignments);
    await expect(getCollegeFacultyDetail(foreign,ids.membership,{role:"PRIMARY"}))
      .rejects.toBeInstanceOf(CollegePersonNotFoundError);
    await expect(getCollegeFacultyDetail(learner,ids.membership,{role:"TA"}))
      .rejects.toBeInstanceOf(AuthorizationError);
  });
  it("returns NOT_FOUND for foreign-college and nonexistent faculties", async () => {
    await expect(getCollegeFacultyDetail(foreign, ids.membership))
      .rejects.toBeInstanceOf(CollegePersonNotFoundError);
    await expect(getCollegeFacultyDetail(admin, randomUUID()))
      .rejects.toBeInstanceOf(CollegePersonNotFoundError);
  });
  it("denies non-admin and forged college context", async () => {
    await expect(getCollegeFacultyDetail(learner, ids.membership))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(getCollegeFacultyDetail(admin, ids.membership, {
      collegeId: SEED_IDS.collegeB,
    })).rejects.toBeDefined();
  });
});
