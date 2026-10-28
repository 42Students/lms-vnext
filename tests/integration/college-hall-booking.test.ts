import {randomUUID} from "node:crypto";
import {beforeAll,afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {createCollegeHallBooking}
  from "@/modules/academics/college-hall-booking-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=!!process.env.TEST_DATABASE_URL&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const own:RequestContext={user:{id:SEED_IDS.collegeAdminUser,identityUid:"hall-booking-test",
  platformStatus:"ACTIVE",systemRoles:[]},membership:{id:SEED_IDS.collegeAdminMembership,
  collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]}};
const foreign:RequestContext={...own,membership:{...own.membership!,
  id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
const faculty:RequestContext={...own,membership:{...own.membership!,roles:["FACULTY"]}};
const ids={period:randomUUID(),program:randomUUID(),cohort:randomUUID(),
  section:randomUUID(),hall:randomUUID(),secondSection:randomUUID(),secondHall:randomUUID(),
  teacher:randomUUID(),teacherMembership:randomUUID(),teacherRole:randomUUID()};
const label="w-hall-book-"+ids.hall.slice(0,8);
let token="";
let secondToken="";
const booking=()=>({sectionId:ids.section,facultyMembershipId:null,
  date:"2026-10-15",from:"09:00",to:"10:00",title:label,
  expectedSectionUpdatedAt:token,confirm:true});
describe.skipIf(!enabled)("College hall booking isolated PostgreSQL",()=>{
  beforeAll(async()=>{
    if(!pool)throw Error("Disposable test PostgreSQL required");
    await pool.query("INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) VALUES($1,$2,$3::text,$3::text,'2026-07-01','2026-12-31')",
      [ids.period,SEED_IDS.collegeA,label]);
    await pool.query("INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3::text,$3::text,8)",
      [ids.program,SEED_IDS.departmentA,label]);
    await pool.query("INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES($1,$2,$3::text,$3::text,$4)",
      [ids.cohort,ids.program,label,ids.period]);
    const rows=await pool.query<{updated_at:Date}>(
      "INSERT INTO sections(id,cohort_id,academic_period_id,name,code,capacity) VALUES($1,$2,$3,$4::text,$4::text,25) RETURNING updated_at",
      [ids.section,ids.cohort,ids.period,label]);
    token=rows.rows[0]!.updated_at.toISOString();
    await pool.query("INSERT INTO lecture_halls(id,college_id,name,capacity,room_type) VALUES($1,$2,$3,30,'CLASSROOM')",
      [ids.hall,SEED_IDS.collegeA,label]);
    const second=await pool.query<{updated_at:Date}>(
      "INSERT INTO sections(id,cohort_id,academic_period_id,name,code,capacity) VALUES($1,$2,$3,$4::text,$4::text,25) RETURNING updated_at",
      [ids.secondSection,ids.cohort,ids.period,label+"-second"]);
    secondToken=second.rows[0]!.updated_at.toISOString();
    await pool.query("INSERT INTO lecture_halls(id,college_id,name,capacity,room_type) VALUES($1,$2,$3,30,'CLASSROOM')",
      [ids.secondHall,SEED_IDS.collegeA,label+"-second"]);
    await pool.query("INSERT INTO users(id,identity_uid,display_name) VALUES($1,$2::text,$3::text)",
      [ids.teacher,ids.teacher,label]);
    await pool.query("INSERT INTO college_memberships(id,user_id,college_id) VALUES($1,$2,$3)",
      [ids.teacherMembership,ids.teacher,SEED_IDS.collegeA]);
    await pool.query("INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,'FACULTY')",
      [ids.teacherRole,ids.teacherMembership]);
  });
  afterAll(async()=>{try{if(pool){
    await pool.query("DELETE FROM section_schedule_events WHERE section_id IN ($1,$2)",[ids.section,ids.secondSection]);
    await pool.query("DELETE FROM lecture_halls WHERE id IN ($1,$2)",[ids.hall,ids.secondHall]);
    for(const [table,id] of [["sections",ids.section],["sections",ids.secondSection],["cohorts",ids.cohort],
      ["programs",ids.program],["academic_periods",ids.period]] as const)
      await pool.query(`DELETE FROM ${table} WHERE id=$1`,[id]);
    // activity_events is append-only; its subjects are text, never delete.
  }}finally{await pool?.end();await closeDatabaseConnection();}});
  it("denies foreign college, wrong role, stale token and overlapping hall time; audits success",async()=>{
    await expect(createCollegeHallBooking(foreign,ids.hall,booking()))
      .rejects.toMatchObject({code:"SECTION_NOT_FOUND"});
    await expect(createCollegeHallBooking(faculty,ids.hall,booking()))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(createCollegeHallBooking(own,ids.hall,{...booking(),collegeId:SEED_IDS.collegeB}))
      .rejects.toBeDefined();
    const saved=await createCollegeHallBooking(own,ids.hall,booking());
    expect(saved.hallId).toBe(ids.hall);
    await expect(createCollegeHallBooking(own,ids.hall,booking()))
      .rejects.toMatchObject({code:"SECTION_STALE"});
    const changed=await pool!.query<{updated_at:Date}>(
      "SELECT updated_at FROM sections WHERE id=$1",[ids.section]);
    token=changed.rows[0]!.updated_at.toISOString();
    await expect(createCollegeHallBooking(own,ids.hall,booking()))
      .rejects.toMatchObject({code:"SCHEDULE_CONFLICT"});
    const rows=await pool!.query("SELECT id FROM section_schedule_events WHERE lecture_hall_id=$1",[ids.hall]);
    expect(rows.rowCount).toBe(1);
    const audit=await pool!.query("SELECT id FROM activity_events WHERE subject_type='section' AND subject_id=$1::text AND summary='College Admin booked a lecture hall for a scheduled class'",[ids.section]);
    expect(audit.rowCount).toBe(1);
  });
  it("denies disabled Faculty and permits only one concurrent overlap across different halls and Sections",async()=>{
    const request={...booking(),from:"11:00",to:"12:00",facultyMembershipId:ids.teacherMembership};
    await pool!.query("UPDATE users SET platform_status='DISABLED' WHERE id=$1",[ids.teacher]);
    await expect(createCollegeHallBooking(own,ids.hall,request))
      .rejects.toMatchObject({code:"FACULTY_NOT_FOUND"});
    await pool!.query("UPDATE users SET platform_status='ACTIVE' WHERE id=$1",[ids.teacher]);
    const results=await Promise.allSettled([
      createCollegeHallBooking(own,ids.hall,request),
      createCollegeHallBooking(own,ids.secondHall,{...request,sectionId:ids.secondSection,
        expectedSectionUpdatedAt:secondToken}),
    ]);
    expect(results.filter(result=>result.status==="fulfilled")).toHaveLength(1);
    const denied=results.find(result=>result.status==="rejected");
    expect(denied?.status==="rejected"?denied.reason:undefined)
      .toMatchObject({code:"SCHEDULE_CONFLICT"});
    const rows=await pool!.query("SELECT id FROM section_schedule_events WHERE faculty_membership_id=$1",
      [ids.teacherMembership]);
    expect(rows.rowCount).toBe(1);
    // Retain identity fixtures; immutable audit/history may reference them.
  });
  it("blocks a closed academic period without blocking planned-period scheduling",async()=>{
    // The regular fixture is PLANNED and the earlier successful booking proves
    // forward scheduling is allowed before a period becomes ACTIVE.
    const latest=await pool!.query<{updated_at:Date}>(
      "SELECT updated_at FROM sections WHERE id=$1",[ids.section]);
    token=latest.rows[0]!.updated_at.toISOString();
    const before=await pool!.query<{total:string}>(
      "SELECT count(*)::text AS total FROM section_schedule_events WHERE section_id=$1",[ids.section]);
    await pool!.query("UPDATE academic_periods SET status='CLOSED' WHERE id=$1",[ids.period]);
    try {
      await expect(createCollegeHallBooking(own,ids.hall,
        {...booking(),from:"14:00",to:"15:00"}))
        .rejects.toMatchObject({code:"SECTION_PERIOD_INVALID"});
      const after=await pool!.query<{total:string}>(
        "SELECT count(*)::text AS total FROM section_schedule_events WHERE section_id=$1",[ids.section]);
      expect(after.rows[0]?.total).toBe(before.rows[0]?.total);
    } finally {
      await pool!.query("UPDATE academic_periods SET status='PLANNED' WHERE id=$1",[ids.period]);
    }
  });
});
