import {randomUUID} from "node:crypto";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
import {
 getFacultyScheduleReassignOptions,reassignFacultyUpcomingSchedules,
} from "@/modules/people/college-faculty-schedule-reassignment-service";

const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const uid=()=>randomUUID();
const ids={actor:uid(),actorMembership:uid(),oldUser:uid(),old:uid(),otherOldUser:uid(),otherOld:uid(),replacementUser:uid(),replacement:uid(),
 period:uid(),program:uid(),cohort:uid(),section:uid(),session:uid(),otherSession:uid()};
const tag="chat4-faculty-"+ids.session.slice(0,8);
const actor:RequestContext={
 user:{id:ids.actor,identityUid:tag+"-actor",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:ids.actorMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
  status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};

describe.skipIf(!enabled)("College faculty schedule reassignment (disposable PostgreSQL)",()=>{
 beforeAll(async()=>{
  if(!pool)throw new Error("DB03 test database required");
  for(const [id,identity] of [
   [ids.actor,tag+"-actor"],[ids.oldUser,tag+"-old"],[ids.otherOldUser,tag+"-other"],[ids.replacementUser,tag+"-replacement"],
  ])await pool.query("insert into users(id,identity_uid,display_name) values($1,$2,$3)",[id,identity,identity]);
  for(const [member,user,role] of [
   [ids.actorMembership,ids.actor,"COLLEGE_ADMIN"],
   [ids.old,ids.oldUser,"FACULTY"],
   [ids.otherOld,ids.otherOldUser,"FACULTY"],
   [ids.replacement,ids.replacementUser,"FACULTY"],
  ]) {
   await pool.query("insert into college_memberships(id,user_id,college_id) values($1,$2,$3)",
    [member,user,SEED_IDS.collegeA]);
   await pool.query("insert into membership_roles(membership_id,role) values($1,$2)",
    [member,role]);
  }
  await pool.query("insert into academic_periods(id,college_id,name,code,start_date,end_date,status) values($1,$2,$3,$3,'2026-07-01','2027-06-30','ACTIVE')",
   [ids.period,SEED_IDS.collegeA,tag]);
  await pool.query("insert into programs(id,department_id,name,code,duration_terms,status) values($1,$2,$3,$3,8,'ACTIVE')",
   [ids.program,SEED_IDS.departmentA,tag]);
  await pool.query("insert into cohorts(id,program_id,name,code,start_period_id,status) values($1,$2,$3,$3,$4,'ACTIVE')",
   [ids.cohort,ids.program,tag,ids.period]);
  await pool.query("insert into sections(id,cohort_id,academic_period_id,name,code,status) values($1,$2,$3,$4,$4,'ACTIVE')",
   [ids.section,ids.cohort,ids.period,tag]);
  const start=new Date(Date.now()+72*3600000),end=new Date(start.getTime()+3600000);
  await pool.query("insert into section_schedule_events(id,section_id,faculty_membership_id,title,starts_at,ends_at,status) values($1,$2,$3,$4,$5,$6,'SCHEDULED')",
   [ids.session,ids.section,ids.old,tag,start,end]);
 });
 afterAll(async()=>{
  try {
   if(pool){
    await pool.query("delete from section_schedule_events where id=any($1::uuid[])",[[ids.session,ids.otherSession]]);
    await pool.query("delete from sections where id=$1",[ids.section]);
    await pool.query("delete from cohorts where id=$1",[ids.cohort]);
    await pool.query("delete from programs where id=$1",[ids.program]);
    await pool.query("delete from academic_periods where id=$1",[ids.period]);
    // Retain synthetic users and memberships when immutable activity references
    // them; the DB03 isolated database is disposable.
   }
  }finally{await pool?.end();await closeDatabaseConnection();}
 });
 it("COL-faculty-reassign-PG-01 selected source, active replacement, atomic write and retry no extra audit",async()=>{
  const choices=await getFacultyScheduleReassignOptions(actor,ids.old);
  expect(choices.upcoming).toBe(1);
  expect(choices.faculty.map(row=>row.id)).toContain(ids.replacement);
  expect(choices.faculty.map(row=>row.id)).not.toContain(ids.old);
  const body={replacementMembershipId:ids.replacement,confirmed:true};
  await pool!.query("update users set platform_status='DISABLED' where id=$1",[ids.replacementUser]);
  await expect(reassignFacultyUpcomingSchedules(actor,ids.old,body)).rejects.toBeDefined();
  await pool!.query("update users set platform_status='ACTIVE' where id=$1",[ids.replacementUser]);
  await pool!.query("update college_memberships set status='SUSPENDED' where id=$1",[ids.actorMembership]);
  await expect(reassignFacultyUpcomingSchedules(actor,ids.old,body))
   .rejects.toMatchObject({name:"AuthorizationError"});
  await pool!.query("update college_memberships set status='ACTIVE' where id=$1",[ids.actorMembership]);
  const first=await reassignFacultyUpcomingSchedules(actor,ids.old,body);
  expect(first).toMatchObject({total:1,reassigned:1,skipped:0});
  const result=await pool!.query<{faculty_membership_id:string}>(
   "select faculty_membership_id from section_schedule_events where id=$1",[ids.session]);
  expect(result.rows[0]?.faculty_membership_id).toBe(ids.replacement);
  const audit=async()=>Number((await pool!.query<{count:string}>(
   "select count(*)::text as count from activity_events where event_type='ACADEMICS_FACULTY_SCHEDULES_REASSIGNED' and subject_id=$1",
   [ids.old])).rows[0]?.count??0);
  expect(await audit()).toBe(1);
  const repeat=await reassignFacultyUpcomingSchedules(actor,ids.old,body);
  expect(repeat).toMatchObject({total:0,reassigned:0});
  expect(await audit()).toBe(1);
 });
 it("COL-faculty-reassign-RACE-01 concurrent old faculty cannot create overlapping replacements",async()=>{
  // First test moved the original session to the replacement. Restore only
  // this isolated fixture so BOTH sources begin with colliding intervals.
  await pool!.query("update section_schedule_events set faculty_membership_id=$2 where id=$1",
   [ids.session,ids.old]);
  const row=await pool!.query<{section_id:string;starts_at:Date;ends_at:Date}>(
   "select section_id,starts_at,ends_at from section_schedule_events where id=$1",[ids.session]);
  const current=row.rows[0]!;
  await pool!.query("insert into section_schedule_events(id,section_id,faculty_membership_id,title,starts_at,ends_at,status) values($1,$2,$3,$4,$5,$6,'SCHEDULED')",
   [ids.otherSession,current.section_id,ids.otherOld,tag+"-parallel",current.starts_at,current.ends_at]);
  const payload={replacementMembershipId:ids.replacement,confirmed:true};
  const results=await Promise.all([
   reassignFacultyUpcomingSchedules(actor,ids.old,payload),
   reassignFacultyUpcomingSchedules(actor,ids.otherOld,payload),
  ]);
  expect(results.map(result=>result.reassigned).sort()).toEqual([0,1]);
  const rows=await pool!.query<{faculty_membership_id:string}>(
   "select faculty_membership_id from section_schedule_events where id=any($1::uuid[])",
   [[ids.session,ids.otherSession]]);
  expect(rows.rows.filter(row=>row.faculty_membership_id===ids.replacement)).toHaveLength(1);
  // Retrying either source cannot create a second simultaneous lecture.
  const repeats=await Promise.all([
   reassignFacultyUpcomingSchedules(actor,ids.old,payload),
   reassignFacultyUpcomingSchedules(actor,ids.otherOld,payload),
  ]);
  expect(repeats.every(result=>result.reassigned===0)).toBe(true);
 });

 it("COL-faculty-reassign-PG-02 rejects foreign source IDs without inspecting schedules",async()=>{
  await expect(getFacultyScheduleReassignOptions(actor,SEED_IDS.facultyCollegeBMembership))
   .rejects.toThrow("Faculty not found in this college.");
  await expect(reassignFacultyUpcomingSchedules(actor,SEED_IDS.facultyCollegeBMembership,{
   replacementMembershipId:ids.replacement,confirmed:true,
  })).rejects.toBeDefined();
 });
});
