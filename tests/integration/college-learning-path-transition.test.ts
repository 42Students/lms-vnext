import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { transitionLearningPath } from "@/modules/courses/learning-path-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL }) : null;
const admin: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "path-publishing", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const foreign: RequestContext = {
  user: { ...admin.user, id: SEED_IDS.facultyUser },
  membership: { id: SEED_IDS.facultyCollegeBMembership, collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const ids = { period: randomUUID(), program: randomUUID(), cohort: randomUUID(),
  course: randomUUID(), offering: randomUUID(), path: randomUUID(), lesson: randomUUID() };
const name = "w-path-"+ids.path.slice(0,8);

describe.skipIf(!enabled)("College offering publish/unpublish — PostgreSQL tenant guards",()=>{
  beforeAll(async()=>{
    if(!pool)throw Error("TEST_DATABASE_URL required");
    await pool.query("INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) VALUES($1,$2,$3,$4,'2026-07-01','2026-12-31')",[ids.period,SEED_IDS.collegeA,name,name]);
    await pool.query("INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3,$4,8)",[ids.program,SEED_IDS.departmentA,name,name]);
    await pool.query("INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES($1,$2,$3,$4,$5)",[ids.cohort,ids.program,name,name,ids.period]);
    await pool.query("INSERT INTO courses(id,department_id,name,code) VALUES($1,$2,$3,$4)",[ids.course,SEED_IDS.departmentA,name,name]);
    await pool.query("INSERT INTO course_offerings(id,course_id,cohort_id,academic_period_id) VALUES($1,$2,$3,$4)",[ids.offering,ids.course,ids.cohort,ids.period]);
    await pool.query("INSERT INTO course_learning_paths(id,offering_id,title) VALUES($1,$2,$3)",[ids.path,ids.offering,name]);
  });
  afterAll(async()=>{
    try {
      if(pool) {
        for(const [table,id] of [
          ["course_lessons",ids.lesson],["course_learning_paths",ids.path],
          ["course_offerings",ids.offering],["courses",ids.course],
          ["cohorts",ids.cohort],["programs",ids.program],["academic_periods",ids.period],
        ] as const) {
          if(table==="courses") await pool.query("DELETE FROM program_term_courses WHERE course_id=$1",[id]);
          if(table==="programs") await pool.query("DELETE FROM program_terms WHERE program_id=$1",[id]);
          await pool.query(`DELETE FROM ${table} WHERE id=$1`,[id]);
        }
      }
    } finally { await pool?.end(); await closeDatabaseConnection(); }
  });
  it("blocks empty publication, enforces college, then publishes and unpublishes with immutable audit",async()=>{
    await expect(transitionLearningPath(admin,ids.path,{action:"PUBLISH"})).rejects.toBeDefined();
    await pool!.query("INSERT INTO course_lessons(id,learning_path_id,name,sequence) VALUES($1,$2,$3,0)",[ids.lesson,ids.path,name]);
    await expect(transitionLearningPath(foreign,ids.path,{action:"PUBLISH"})).rejects.toBeInstanceOf(AuthorizationError);
    expect((await transitionLearningPath(admin,ids.path,{action:"PUBLISH"})).status).toBe("PUBLISHED");
    expect((await transitionLearningPath(admin,ids.path,{action:"UNPUBLISH"})).status).toBe("DRAFT");
    const audit=await pool!.query("SELECT event_type FROM activity_events WHERE subject_type='course_learning_path' AND subject_id=$1 ORDER BY occurred_at",[ids.path]);
    expect(audit.rows.map(r=>r.event_type)).toEqual(expect.arrayContaining([
      "courses.learning_path.published","courses.learning_path.unpublished",
    ]));
    await expect(transitionLearningPath(admin,ids.path,{action:"UNPUBLISH"})).rejects.toBeDefined();
    await expect(transitionLearningPath(admin,ids.path,{action:"UNPUBLISH",collegeId:SEED_IDS.collegeB})).rejects.toBeDefined();
  });
});
