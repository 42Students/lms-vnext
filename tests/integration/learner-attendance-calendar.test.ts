import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import { AuthorizationError } from "@/modules/permissions/policy";
import type { RequestContext } from "@/modules/identity/context";
import { getOwnLearnerAttendanceCalendar } from "@/modules/attendance/learner-attendance-calendar-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import {
  newLearnerPositiveFixture, seedLearnerPositiveFixture,
  cleanupLearnerPositiveFixture,
} from "../support/learner-positive-fixture";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Attendance calendar integration requires disposable TEST_DATABASE_URL");
}

const pool = new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
const fixture = newLearnerPositiveFixture();
const ids = {
  period:randomUUID(),section:randomUUID(),course:randomUUID(),
  offering:randomUUID(),delivery:randomUUID(),sectionEnrollment:randomUUID(),
  absentEvent:randomUUID(),unmarkedEvent:randomUUID(),
  presentEvent:randomUUID(),futureEvent:randomUUID(),
};
const eventIds=[ids.absentEvent,ids.unmarkedEvent,ids.presentEvent,ids.futureEvent];
let prepared=false;

async function setup() {
  prepared=true;
  await seedLearnerPositiveFixture(pool,fixture);
  const parent=await pool.query<{program_id:string;cohort_id:string}>(
    "SELECT program_id,cohort_id FROM learner_program_enrollments WHERE id=$1 AND status='ACTIVE'",
    [fixture.ids.enrollment],
  );
  if(parent.rowCount!==1) throw new Error("Positive enrollment fixture is not unique");
  const {cohort_id}=parent.rows[0]!;
  const unique=ids.course.slice(0,8);
  await pool.query(
    "INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) VALUES($1,$2,$3,$4,'2025-01-01','2040-12-31')",
    [ids.period,SEED_IDS.collegeA,"Attendance Calendar "+unique,"C4CAL-T-"+unique],
  );
  await pool.query(
    "INSERT INTO sections(id,cohort_id,academic_period_id,name,code) VALUES($1,$2,$3,$4,$5)",
    [ids.section,cohort_id,ids.period,"Attendance Calendar "+unique,"C4CAL-S-"+unique],
  );
  await pool.query(
    "INSERT INTO courses(id,department_id,name,code) VALUES($1,$2,$3,$4)",
    [ids.course,SEED_IDS.departmentA,"Attendance Calendar "+unique,"C4CAL-C-"+unique],
  );
  await pool.query(
    "INSERT INTO course_offerings(id,course_id,cohort_id,academic_period_id) VALUES($1,$2,$3,$4)",
    [ids.offering,ids.course,cohort_id,ids.period],
  );
  await pool.query(
    "INSERT INTO course_section_deliveries(id,offering_id,section_id) VALUES($1,$2,$3)",
    [ids.delivery,ids.offering,ids.section],
  );
  await pool.query(
    "INSERT INTO section_enrollments(id,learner_enrollment_id,section_id,academic_period_id) VALUES($1,$2,$3,$4)",
    [ids.sectionEnrollment,fixture.ids.enrollment,ids.section,ids.period],
  );
  for(const [eventId,title,starts,ends] of [
    [ids.absentEvent,"Recorded absence","2025-03-10T04:00:00Z","2025-03-10T05:00:00Z"],
    [ids.unmarkedEvent,"Awaiting college marking","2025-03-11T04:00:00Z","2025-03-11T05:00:00Z"],
    [ids.presentEvent,"Recorded attendance","2025-03-12T04:00:00Z","2025-03-12T05:00:00Z"],
    [ids.futureEvent,"Future scheduled class","2035-03-13T04:00:00Z","2035-03-13T05:00:00Z"],
  ]) {
    await pool.query(
      "INSERT INTO section_schedule_events(id,section_id,title,starts_at,ends_at) VALUES($1,$2,$3,$4,$5)",
      [eventId,ids.section,title,starts,ends],
    );
    await pool.query(
      "INSERT INTO section_schedule_event_courses(schedule_event_id,delivery_id) VALUES($1,$2)",
      [eventId,ids.delivery],
    );
  }
  for(const eventId of [ids.absentEvent,ids.presentEvent]) {
    await pool.query(
      "INSERT INTO attendance_sessions(schedule_event_id,status,marked_by_user_id,marked_at) VALUES($1,'MARKED',$2,now())",
      [eventId,SEED_IDS.facultyUser],
    );
  }
  await pool.query(
    "INSERT INTO attendance_records(schedule_event_id,membership_id,status,marked_by_user_id,marked_at) VALUES($1,$2,'ABSENT',$3,now())",
    [ids.absentEvent,fixture.ids.membership,SEED_IDS.facultyUser],
  );
}

async function cleanup() {
  await pool.query("DELETE FROM attendance_records WHERE schedule_event_id=ANY($1::uuid[])",[eventIds]);
  await pool.query("DELETE FROM attendance_sessions WHERE schedule_event_id=ANY($1::uuid[])",[eventIds]);
  await pool.query("DELETE FROM section_schedule_event_courses WHERE schedule_event_id=ANY($1::uuid[])",[eventIds]);
  await pool.query("DELETE FROM section_schedule_events WHERE id=ANY($1::uuid[])",[eventIds]);
  await pool.query("DELETE FROM section_enrollments WHERE id=$1",[ids.sectionEnrollment]);
  await pool.query("DELETE FROM course_section_deliveries WHERE id=$1",[ids.delivery]);
  await pool.query("DELETE FROM course_offerings WHERE id=$1",[ids.offering]);
  await pool.query("DELETE FROM courses WHERE id=$1",[ids.course]);
  await pool.query("DELETE FROM sections WHERE id=$1",[ids.section]);
  await pool.query("DELETE FROM academic_periods WHERE id=$1",[ids.period]);
}

beforeAll(setup,45_000);
afterAll(async()=>{
  try {
    if(prepared) {
      await cleanup();
      await cleanupLearnerPositiveFixture(pool,fixture);
    }
  } finally {
    await pool.end();
    await closeDatabaseConnection();
  }
},45_000);

describe("Learner attendance month calendar against disposable PostgreSQL",()=>{
  it("reads only its own registered class/attendance rows and exact status",async()=>{
    const data=await getOwnLearnerAttendanceCalendar(fixture.context,{
      month:"2025-03",deliveryId:ids.delivery,status:"ALL",
    });
    expect(data.courses).toEqual(expect.arrayContaining([
      expect.objectContaining({deliveryId:ids.delivery}),
    ]));
    expect(data.rows).toHaveLength(3);
    expect(data.rows.map(row=>row.id)).toEqual([
      ids.absentEvent,ids.unmarkedEvent,ids.presentEvent,
    ]);
    expect(data.rows.map(row=>row.status)).toEqual([
      "ABSENT","NOT_MARKED","PRESENT",
    ]);
    expect(data.summary).toMatchObject({
      total:3,marked:2,present:1,otherMarked:1,unmarked:1,percentage:50,
    });
    expect(data.rows.every(row=>row.deliveryId===ids.delivery)).toBe(true);
  });
  it("distinguishes future scheduled, missing months and a status filter",async()=>{
    const future=await getOwnLearnerAttendanceCalendar(fixture.context,{
      month:"2035-03",deliveryId:ids.delivery,status:"ALL",
    });
    expect(future.rows.map(row=>row.id)).toEqual([ids.futureEvent]);
    expect(future.rows[0]?.status).toBe("SCHEDULED");
    expect(future.summary.percentage).toBeNull();
    const unmarked=await getOwnLearnerAttendanceCalendar(fixture.context,{
      month:"2025-03",deliveryId:ids.delivery,status:"NOT_MARKED",
    });
    expect(unmarked.rows.map(row=>row.id)).toEqual([ids.unmarkedEvent]);
    const empty=await getOwnLearnerAttendanceCalendar(fixture.context,{
      month:"2028-03",deliveryId:ids.delivery,
    });
    expect(empty.rows).toEqual([]);
    expect(empty.hasAnyRecords).toBe(true);
    expect(empty.summary.percentage).toBeNull();
  });
  it("rejects forged college, suspended, wrong-role and forged actor",async()=>{
    const context=fixture.context;
    const denied:RequestContext[]=[
      {...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},
      {...context,membership:{...context.membership!,status:"SUSPENDED"}},
      {...context,membership:{...context.membership!,roles:["FACULTY"]}},
      {...context,user:{...context.user,id:SEED_IDS.facultyUser}},
    ];
    for(const invalid of denied) {
      await expect(getOwnLearnerAttendanceCalendar(invalid,{
        month:"2025-03",deliveryId:ids.delivery,
      })).rejects.toBeInstanceOf(AuthorizationError);
    }
  });
  it("rejects an unauthorized delivery and caller-supplied tenant selector",async()=>{
    await expect(getOwnLearnerAttendanceCalendar(fixture.context,{
      month:"2025-03",deliveryId:SEED_IDS.collegeB,
    })).rejects.toBeInstanceOf(AuthorizationError);
    await expect(getOwnLearnerAttendanceCalendar(fixture.context,{
      month:"2025-03",collegeId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
  });
});
