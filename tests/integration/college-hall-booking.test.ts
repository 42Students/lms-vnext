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
  section:randomUUID(),hall:randomUUID()};
const label="w-hall-book-"+ids.hall.slice(0,8);
let token="";
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
  });
  afterAll(async()=>{try{if(pool){
    await pool.query("DELETE FROM section_schedule_events WHERE section_id=$1",[ids.section]);
    await pool.query("DELETE FROM lecture_halls WHERE id=$1",[ids.hall]);
    for(const [table,id] of [["sections",ids.section],["cohorts",ids.cohort],
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
});
