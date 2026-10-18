import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection, getDb } from "@/db/client";
import { and, eq } from "drizzle-orm";
import { collegeMemberships } from "@/db/schema";
import {collegeContactAcademicScope} from "@/modules/people/college-contacts-academic-scope";
import type { RequestContext } from "@/modules/identity/context";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import {
 loadLearnerEnrollmentScope, loadSectionEnrollmentScope,
 loadFacultyAssignmentScope, loadScheduleEventScope,
} from "@/modules/academics/a2-scope";
import {
 listSectionRoster, listLearnerSectionHistory,
} from "@/modules/academics/roster-service";

const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const uid=()=>randomUUID();
const ids={
 periodA:uid(),periodB:uid(),programA:uid(),programB:uid(),
 cohortA:uid(),cohortB:uid(),sectionA:uid(),sectionB:uid(),
 wrongPeriodSection:uid(),membershipA:uid(),userA:uid(),membershipB:uid(),userB:uid(),
 membershipC:uid(),userC:uid(),
 enrollmentA:uid(),enrollmentB:uid(),wrongProgramEnrollment:uid(),
 good:uid(),foreignSection:uid(),foreignLearner:uid(),
 facultyAssignment:uid(),event:uid(),
};
const tag="chat4-scope-"+ids.programA.slice(0,8);
const actor:RequestContext={
 user:{id:SEED_IDS.collegeAdminUser,identityUid:"integration-college-admin",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.collegeAdminMembership,organizationId:SEED_IDS.organization,
  collegeId:SEED_IDS.collegeA,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};

describe.skipIf(!enabled)("COL-academics-scope-tenant-PG-01 forged but FK-valid tenant relationships",()=>{
 beforeAll(async()=>{
  if(!pool)throw new Error("Disposable DB03 required");
  for(const [period,college,suffix] of [
   [ids.periodA,SEED_IDS.collegeA,"a"],[ids.periodB,SEED_IDS.collegeB,"b"],
  ]){
   await pool.query(
    "insert into academic_periods(id,college_id,name,code,start_date,end_date,status) values($1,$2,$3,$3,'2099-07-01','2100-06-30','ACTIVE')",
    [period,college,tag+"-"+suffix],
   );
  }
  for(const [program,department,suffix] of [
   [ids.programA,SEED_IDS.departmentA,"a"],[ids.programB,SEED_IDS.departmentB,"b"],
  ]){
   await pool.query(
    "insert into programs(id,department_id,name,code,duration_terms,status) values($1,$2,$3,$3,8,'ACTIVE')",
    [program,department,tag+"-"+suffix],
   );
  }
  for(const [cohort,program,period,suffix] of [
   [ids.cohortA,ids.programA,ids.periodA,"a"],[ids.cohortB,ids.programB,ids.periodB,"b"],
  ]){
   await pool.query(
    "insert into cohorts(id,program_id,name,code,start_period_id,status) values($1,$2,$3,$3,$4,'ACTIVE')",
    [cohort,program,tag+"-"+suffix,period],
   );
  }
  for(const [section,cohort,period,suffix] of [
   [ids.sectionA,ids.cohortA,ids.periodA,"a"],
   [ids.sectionB,ids.cohortB,ids.periodB,"b"],
   [ids.wrongPeriodSection,ids.cohortA,ids.periodB,"invalid"],
  ]){
   await pool.query(
    "insert into sections(id,cohort_id,academic_period_id,name,code,status) values($1,$2,$3,$4,$4,'ACTIVE')",
    [section,cohort,period,tag+"-"+suffix],
   );
  }
  for(const [member,user,college,suffix] of [
   [ids.membershipA,ids.userA,SEED_IDS.collegeA,"a"],
   [ids.membershipB,ids.userB,SEED_IDS.collegeB,"b"],
   [ids.membershipC,ids.userC,SEED_IDS.collegeA,"c"],
  ]){
   await pool.query("insert into users(id,identity_uid,display_name) values($1,$2,$3)",
    [user,tag+"-student-"+suffix,tag+" student "+suffix]);
   await pool.query("insert into college_memberships(id,user_id,college_id) values($1,$2,$3)",
    [member,user,college]);
   await pool.query("insert into membership_roles(membership_id,role) values($1,'LEARNER')",
    [member]);
  }
  await pool.query(
   "insert into learner_program_enrollments(id,membership_id,program_id,cohort_id) values($1,$2,$3,$4)",
   [ids.enrollmentA,ids.membershipA,ids.programA,ids.cohortA],
  );
  await pool.query(
   "insert into learner_program_enrollments(id,membership_id,program_id,cohort_id) values($1,$2,$3,$4)",
   [ids.enrollmentB,ids.membershipB,ids.programB,ids.cohortB],
  );
  // This extra learner has *only* a forged foreign cohort for a college-A
  // program. Independent FKs accept it, but it cannot count as an active
  // same-college program enrollment or authorize a College Contacts filter.
  await pool.query(
   "insert into learner_program_enrollments(id,membership_id,program_id,cohort_id) values($1,$2,$3,$4)",
   [ids.wrongProgramEnrollment,ids.membershipC,ids.programA,ids.cohortB],
  );
  for(const [placement,enrollment,section,period] of [
   [ids.good,ids.enrollmentA,ids.sectionA,ids.periodA],
   [ids.foreignSection,ids.enrollmentA,ids.sectionB,ids.periodB],
   [ids.foreignLearner,ids.enrollmentB,ids.sectionA,ids.periodA],
  ]){
   await pool.query(
    "insert into section_enrollments(id,learner_enrollment_id,section_id,academic_period_id) values($1,$2,$3,$4)",
    [placement,enrollment,section,period],
   );
  }
  await pool.query(
   "insert into section_faculty_assignments(id,section_id,membership_id,role) values($1,$2,$3,'ADVISOR')",
   [ids.facultyAssignment,ids.sectionA,SEED_IDS.facultyCollegeBMembership],
  );
  await pool.query(
   "insert into section_schedule_events(id,section_id,faculty_membership_id,title,starts_at,ends_at,status) values($1,$2,$3,$4,$5,$6,'SCHEDULED')",
   [ids.event,ids.wrongPeriodSection,SEED_IDS.facultyCollegeAMembership,
    tag,new Date("2099-10-18T10:00:00Z"),new Date("2099-10-18T11:00:00Z")],
  );
 });
 afterAll(async()=>{
  try{
   if(pool){
    await pool.query("delete from section_schedule_events where id=$1",[ids.event]);
    await pool.query("delete from section_faculty_assignments where id=$1",[ids.facultyAssignment]);
    await pool.query("delete from section_enrollments where id=any($1::uuid[])",[
     [ids.good,ids.foreignSection,ids.foreignLearner],
    ]);
    await pool.query("delete from learner_program_enrollments where id=any($1::uuid[])",[
     [ids.enrollmentA,ids.enrollmentB,ids.wrongProgramEnrollment],
    ]);
    await pool.query("delete from sections where id=any($1::uuid[])",[
     [ids.sectionA,ids.sectionB,ids.wrongPeriodSection],
    ]);
    await pool.query("delete from cohorts where id=any($1::uuid[])",[[ids.cohortA,ids.cohortB]]);
    await pool.query("delete from programs where id=any($1::uuid[])",[[ids.programA,ids.programB]]);
    await pool.query("delete from academic_periods where id=any($1::uuid[])",[[ids.periodA,ids.periodB]]);
    await pool.query("delete from membership_roles where membership_id=any($1::uuid[])",[
     [ids.membershipA,ids.membershipB,ids.membershipC],
    ]);
    await pool.query("delete from college_memberships where id=any($1::uuid[])",[
     [ids.membershipA,ids.membershipB,ids.membershipC],
    ]);
    await pool.query("delete from users where id=any($1::uuid[])",[[ids.userA,ids.userB,ids.userC]]);
   }
  }finally{
   await pool?.end();
   await closeDatabaseConnection();
  }
 });
 it("COL-academics-scope-tenant-01 valid section and learner remain reachable, forged joins fail closed",async()=>{
  expect((await loadLearnerEnrollmentScope(ids.enrollmentA)).collegeId).toBe(SEED_IDS.collegeA);
  expect((await loadSectionEnrollmentScope(ids.good)).collegeId).toBe(SEED_IDS.collegeA);
  await expect(loadLearnerEnrollmentScope(ids.wrongProgramEnrollment))
   .rejects.toMatchObject({code:"LEARNER_ENROLLMENT_NOT_FOUND"});
  await expect(loadSectionEnrollmentScope(ids.foreignSection))
   .rejects.toMatchObject({code:"SECTION_ENROLLMENT_NOT_FOUND"});
  await expect(loadSectionEnrollmentScope(ids.foreignLearner))
   .rejects.toMatchObject({code:"SECTION_ENROLLMENT_NOT_FOUND"});
 });
 it("COL-academics-scope-tenant-02 roster and learner history never expose foreign college or section",async()=>{
  const roster=await listSectionRoster(actor,ids.sectionA);
  expect(roster.map(row=>row.id)).toContain(ids.good);
  expect(roster.map(row=>row.id)).not.toContain(ids.foreignLearner);
  const history=await listLearnerSectionHistory(actor,ids.enrollmentA);
  expect(history.map(row=>row.id)).toContain(ids.good);
  expect(history.map(row=>row.id)).not.toContain(ids.foreignSection);
 });
 it("COL-contacts-scope-PG-01 forged cohort-program associations never appear as active contacts",async()=>{
  const scope=collegeContactAcademicScope(SEED_IDS.collegeA);
  const program=async(memberId:string)=>getDb().select({id:collegeMemberships.id})
   .from(collegeMemberships).where(and(
     eq(collegeMemberships.id,memberId),
     eq(collegeMemberships.collegeId,SEED_IDS.collegeA),
     scope.inProgram(ids.programA),
   ));
  const active=async(memberId:string)=>getDb().select({id:collegeMemberships.id})
   .from(collegeMemberships).where(and(
     eq(collegeMemberships.id,memberId),
     eq(collegeMemberships.collegeId,SEED_IDS.collegeA),
     scope.activeEnrollment,
   ));
  expect((await program(ids.membershipA)).map(row=>row.id)).toContain(ids.membershipA);
  expect((await active(ids.membershipA)).map(row=>row.id)).toContain(ids.membershipA);
  expect(await program(ids.membershipC)).toEqual([]);
  expect(await active(ids.membershipC)).toEqual([]);
 });

 it("COL-academics-scope-tenant-03 foreign faculty membership or period never authorize assignment/event",async()=>{
  await expect(loadFacultyAssignmentScope(ids.facultyAssignment))
   .rejects.toMatchObject({code:"FACULTY_ASSIGNMENT_NOT_FOUND"});
  await expect(loadScheduleEventScope(ids.event))
   .rejects.toMatchObject({code:"SCHEDULE_EVENT_NOT_FOUND"});
 });
});
