import {randomUUID} from "node:crypto";
import {Pool} from "pg";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {listAdminFacultyAssignments} from "@/modules/admin-ui/super-admin-faculty-assignments-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=!!process.env.TEST_DATABASE_URL&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1}):null;
const admin:RequestContext={user:{id:SEED_IDS.superAdminUser,identityUid:"admin-faculty-assignment",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}};
const ids={period:randomUUID(),program:randomUUID(),cohort:randomUUID(),course:randomUUID(),
 offering:randomUUID(),section:randomUUID(),delivery:randomUUID(),assignment:randomUUID()};
const name="admin-teach-"+ids.assignment.slice(0,8);
describe.skipIf(!enabled)("Super Admin faculty assignment PostgreSQL",()=>{
 beforeAll(async()=>{
  await pool!.query("insert into academic_periods(id,college_id,name,code,start_date,end_date) values ($1,$2,$3,$4,'2026-07-01','2026-12-31')",[ids.period,SEED_IDS.collegeA,name,name]);
  await pool!.query("insert into programs(id,department_id,name,code,duration_terms) values ($1,$2,$3,$4,8)",[ids.program,SEED_IDS.departmentA,name,name]);
  await pool!.query("insert into cohorts(id,program_id,name,code,start_period_id) values ($1,$2,$3,$4,$5)",[ids.cohort,ids.program,name,name,ids.period]);
  await pool!.query("insert into courses(id,department_id,name,code) values ($1,$2,$3,$4)",[ids.course,SEED_IDS.departmentA,name,name]);
  await pool!.query("insert into course_offerings(id,course_id,cohort_id,academic_period_id) values ($1,$2,$3,$4)",[ids.offering,ids.course,ids.cohort,ids.period]);
  await pool!.query("insert into sections(id,cohort_id,academic_period_id,name,code) values ($1,$2,$3,$4,$5)",[ids.section,ids.cohort,ids.period,name,name]);
  await pool!.query("insert into course_section_deliveries(id,offering_id,section_id) values ($1,$2,$3)",[ids.delivery,ids.offering,ids.section]);
  await pool!.query("insert into course_teaching_assignments(id,delivery_id,membership_id,role) values ($1,$2,$3,'PRIMARY')",
   [ids.assignment,ids.delivery,SEED_IDS.facultyCollegeAMembership]);
 });
 afterAll(async()=>{try{
  for(const [table,id] of [["course_teaching_assignments",ids.assignment],["course_section_deliveries",ids.delivery],
   ["sections",ids.section],["course_offerings",ids.offering],["courses",ids.course],["cohorts",ids.cohort],
   ["programs",ids.program],["academic_periods",ids.period]] as const){if(table==="courses") await pool?.query("delete from program_term_courses where course_id=$1",[id]); if(table==="programs") await pool?.query("delete from program_terms where program_id=$1",[id]);
    await pool?.query(`delete from ${table} where id=$1`,[id]);}
 }finally{await pool?.end();await closeDatabaseConnection();}});
 it("resolves only selected-college teaching assignments and denies wrong role",async()=>{
  expect((await listAdminFacultyAssignments(admin,{q:name})).items).toEqual([expect.objectContaining({id:ids.assignment,status:"ACTIVE"})]);
  const foreign={...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeB}};
  expect((await listAdminFacultyAssignments(foreign,{q:name})).items).toHaveLength(0);
  await pool!.query("update course_teaching_assignments set ended_at=now() where id=$1",[ids.assignment]);
  expect((await listAdminFacultyAssignments(admin,{q:name,status:"ENDED"})).items)
   .toEqual([expect.objectContaining({id:ids.assignment,status:"ENDED"})]);
  expect((await listAdminFacultyAssignments(admin,{q:name,status:"ACTIVE"})).items).toHaveLength(0);
  await expect(listAdminFacultyAssignments({...admin,user:{...admin.user,systemRoles:[]}},{})).rejects.toBeInstanceOf(AuthorizationError);
 });
});
