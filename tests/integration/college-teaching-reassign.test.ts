import {randomUUID} from "node:crypto";
import {beforeAll,afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {reassignCollegeTeaching}
  from "@/modules/courses/college-teaching-reassign-service";
const enabled=!!process.env.TEST_DATABASE_URL&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const actorIds={user:randomUUID(),member:randomUUID(),role:randomUUID()};
const own:RequestContext={user:{id:actorIds.user,identityUid:actorIds.user,platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:actorIds.member,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]}};
const foreign:RequestContext={...own,membership:{...own.membership!,
  collegeId:SEED_IDS.collegeB,id:SEED_IDS.facultyCollegeBMembership}};
const learner:RequestContext={...own,membership:{...own.membership!,roles:["LEARNER"]}};
const ids={period:randomUUID(),program:randomUUID(),cohort:randomUUID(),
  section:randomUUID(),course:randomUUID(),offering:randomUUID(),delivery:randomUUID(),
  oldAssignment:randomUUID(),firstUser:randomUUID(),firstMember:randomUUID(),firstRole:randomUUID(),
  nextUser:randomUUID(),nextMember:randomUUID(),nextRole:randomUUID()};
const key="w-reassign-"+ids.offering.slice(0,8);
let expectedUpdatedAt="";
const payload=()=>({expectedMembershipId:ids.firstMember,replacementMembershipId:ids.nextMember,
  expectedUpdatedAt,confirm:true});
describe.skipIf(!enabled)("College Faculty reassign PostgreSQL fixtures",()=>{
  beforeAll(async()=>{
    if(!pool)throw Error("Disposable PostgreSQL required");
    await pool.query("INSERT INTO users(id,identity_uid,display_name) VALUES($1,$2::text,$3::text)",
      [actorIds.user,actorIds.user,key]);
    await pool.query("INSERT INTO college_memberships(id,user_id,college_id) VALUES($1,$2,$3)",
      [actorIds.member,actorIds.user,SEED_IDS.collegeA]);
    await pool.query("INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,'COLLEGE_ADMIN')",
      [actorIds.role,actorIds.member]);
    for(const [user,member,role] of [
      [ids.firstUser,ids.firstMember,ids.firstRole],[ids.nextUser,ids.nextMember,ids.nextRole],
    ]) {
      await pool.query("INSERT INTO users(id,identity_uid,display_name) VALUES($1,$2::text,$3::text)",
        [user,user,key]);
      await pool.query("INSERT INTO college_memberships(id,user_id,college_id) VALUES($1,$2,$3)",
        [member,user,SEED_IDS.collegeA]);
      await pool.query("INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,'FACULTY')",
        [role,member]);
    }
    await pool.query("INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) VALUES($1,$2,$3::text,$3::text,'2026-07-01','2026-12-31')",
      [ids.period,SEED_IDS.collegeA,key]);
    await pool.query("INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3::text,$3::text,8)",
      [ids.program,SEED_IDS.departmentA,key]);
    await pool.query("INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES($1,$2,$3::text,$3::text,$4)",
      [ids.cohort,ids.program,key,ids.period]);
    await pool.query("INSERT INTO sections(id,cohort_id,academic_period_id,name,code) VALUES($1,$2,$3,$4::text,$4::text)",
      [ids.section,ids.cohort,ids.period,key]);
    await pool.query("INSERT INTO courses(id,department_id,name,code) VALUES($1,$2,$3::text,$3::text)",
      [ids.course,SEED_IDS.departmentA,key]);
    await pool.query("INSERT INTO course_offerings(id,course_id,cohort_id,academic_period_id) VALUES($1,$2,$3,$4)",
      [ids.offering,ids.course,ids.cohort,ids.period]);
    await pool.query("INSERT INTO course_section_deliveries(id,offering_id,section_id) VALUES($1,$2,$3)",
      [ids.delivery,ids.offering,ids.section]);
    const created=await pool.query<{updated_at:Date}>(
      "INSERT INTO course_teaching_assignments(id,delivery_id,membership_id,role) VALUES($1,$2,$3,'PRIMARY') RETURNING updated_at",
      [ids.oldAssignment,ids.delivery,ids.firstMember]);
    expectedUpdatedAt=created.rows[0]!.updated_at.toISOString();
  });
  afterAll(async()=>{try{if(pool){
    await pool.query("DELETE FROM course_teaching_assignments WHERE delivery_id=$1",[ids.delivery]);
    for(const [table,id] of [
      ["course_section_deliveries",ids.delivery],["course_offerings",ids.offering],["courses",ids.course],
      ["sections",ids.section],["cohorts",ids.cohort],["programs",ids.program],["academic_periods",ids.period],
    ] as const)await pool.query(`DELETE FROM ${table} WHERE id=$1`,[id]);
    // User, membership and role fixtures retained: immutable activity_events may reference them.
  }}finally{await pool?.end();await closeDatabaseConnection();}});
  it("denies foreign/not-found/wrong-role/forged and stale, then reassigns atomically",async()=>{
    await expect(reassignCollegeTeaching(foreign,ids.oldAssignment,payload()))
      .rejects.toMatchObject({code:"ASSIGNMENT_NOT_FOUND"});
    await expect(reassignCollegeTeaching(own,randomUUID(),payload()))
      .rejects.toMatchObject({code:"ASSIGNMENT_NOT_FOUND"});
    await expect(reassignCollegeTeaching(learner,ids.oldAssignment,payload()))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(reassignCollegeTeaching(own,ids.oldAssignment,{...payload(),collegeId:SEED_IDS.collegeB}))
      .rejects.toBeDefined();
    await pool!.query("UPDATE users SET platform_status='DISABLED' WHERE id=$1",[ids.nextUser]);
    await expect(reassignCollegeTeaching(own,ids.oldAssignment,payload()))
      .rejects.toMatchObject({code:"TARGET_NOT_FOUND"});
    await pool!.query("UPDATE users SET platform_status='ACTIVE' WHERE id=$1",[ids.nextUser]);
    await pool!.query("UPDATE users SET platform_status='DISABLED' WHERE id=$1",[actorIds.user]);
    await expect(reassignCollegeTeaching(own,ids.oldAssignment,payload()))
      .rejects.toBeInstanceOf(AuthorizationError);
    await pool!.query("UPDATE users SET platform_status='ACTIVE' WHERE id=$1",[actorIds.user]);
    await pool!.query("UPDATE college_memberships SET status='SUSPENDED' WHERE id=$1",[actorIds.member]);
    await expect(reassignCollegeTeaching(own,ids.oldAssignment,payload()))
      .rejects.toBeInstanceOf(AuthorizationError);
    await pool!.query("UPDATE college_memberships SET status='ACTIVE' WHERE id=$1",[actorIds.member]);
    await pool!.query("DELETE FROM membership_roles WHERE id=$1",[actorIds.role]);
    await expect(reassignCollegeTeaching(own,ids.oldAssignment,payload()))
      .rejects.toBeInstanceOf(AuthorizationError);
    await pool!.query("INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,'COLLEGE_ADMIN')",
      [actorIds.role,actorIds.member]);
    const untouched=await pool!.query("SELECT membership_id,ended_at FROM course_teaching_assignments WHERE delivery_id=$1",
      [ids.delivery]);
    expect(untouched.rows).toEqual([{membership_id:ids.firstMember,ended_at:null}]);
    await pool!.query("UPDATE course_teaching_assignments SET updated_at=updated_at + interval '1 millisecond' WHERE id=$1",
      [ids.oldAssignment]);
    await expect(reassignCollegeTeaching(own,ids.oldAssignment,payload()))
      .rejects.toMatchObject({code:"ASSIGNMENT_STALE"});
    const refreshed=await pool!.query<{updated_at:Date}>("SELECT updated_at FROM course_teaching_assignments WHERE id=$1",[ids.oldAssignment]);
    expectedUpdatedAt=refreshed.rows[0]!.updated_at.toISOString();
    const result=await reassignCollegeTeaching(own,ids.oldAssignment,payload());
    expect(result.role).toBe("PRIMARY");
    const assignments=await pool!.query("SELECT membership_id,ended_at FROM course_teaching_assignments WHERE delivery_id=$1",
      [ids.delivery]);
    expect(assignments.rows).toHaveLength(2);
    expect(assignments.rows.filter(r=>r.ended_at===null).map(r=>r.membership_id)).toEqual([ids.nextMember]);
    const audit=await pool!.query("SELECT id FROM activity_events WHERE subject_type='course_teaching_assignment' AND subject_id=$1::text",[result.newAssignmentId]);
    expect(audit.rowCount).toBe(1);
  });
});
