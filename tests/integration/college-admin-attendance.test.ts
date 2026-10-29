import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import {
  correctAdminAttendance,
  getAdminAttendanceGrid,
  getAdminAttendanceOptions,
} from "@/modules/attendance/admin-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import {facultyAttendanceCorrectionTokenMatches}
  from "@/modules/attendance/faculty-correction-token-model";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Attendance DB tests require disposable TEST_DATABASE_URL");
}
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 });
const nonce = randomUUID().slice(0, 8);
const admin: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "seed-college-admin",
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
type Fixture = {
  program: string; period: string; cohort: string; section: string;
  course: string; offering: string; delivery: string; event: string;
  learner: string; enrollment: string; sectionEnrollment: string;
};
const fixtures: Fixture[] = [];
const memberIds: string[] = [];
const userIds: string[] = [];

async function fixture(collegeId: string, departmentId: string): Promise<Fixture> {
  const user = randomUUID();
  const learner = randomUUID();
  await pool.query(
    "insert into users (id,identity_uid,display_name) values ($1,$2,$3)",
    [user, "attendance-" + user, "Synthetic Learner"],
  );
  userIds.push(user);
  await pool.query(
    "insert into college_memberships (id,user_id,college_id) values ($1,$2,$3)",
    [learner, user, collegeId],
  );
  memberIds.push(learner);
  await pool.query(
    "insert into membership_roles (membership_id,role) values ($1,'LEARNER')",
    [learner],
  );

  const f: Fixture = {
    learner, program: randomUUID(), period: randomUUID(),
    cohort: randomUUID(), section: randomUUID(), course: randomUUID(),
    offering: randomUUID(), delivery: randomUUID(), event: randomUUID(),
    enrollment: randomUUID(), sectionEnrollment: randomUUID(),
  };
  fixtures.push(f);
  const suffix = collegeId.slice(-2);
  await pool.query(
    "insert into programs (id,department_id,name,code,duration_terms) values ($1,$2,$3,$4,8)",
    [f.program, departmentId, "Synthetic Program", "ATT-P-" + nonce + suffix],
  );
  await pool.query(
    "insert into academic_periods (id,college_id,name,code,start_date,end_date) values ($1,$2,$3,$4,'2020-01-01','2040-12-31')",
    [f.period, collegeId, "Synthetic Period", "ATT-T-" + nonce + suffix],
  );
  await pool.query(
    "insert into cohorts (id,program_id,name,code,start_period_id) values ($1,$2,$3,$4,$5)",
    [f.cohort, f.program, "Synthetic Cohort", "ATT-C-" + nonce + suffix, f.period],
  );
  await pool.query(
    "insert into sections (id,cohort_id,academic_period_id,name,code) values ($1,$2,$3,$4,$5)",
    [f.section, f.cohort, f.period, "Synthetic Class", "ATT-S-" + nonce + suffix],
  );
  await pool.query(
    "insert into courses (id,department_id,name,code) values ($1,$2,$3,$4)",
    [f.course, departmentId, "Synthetic Course", "ATT-COURSE-" + nonce + suffix],
  );
  await pool.query(
    "insert into course_offerings (id,course_id,cohort_id,academic_period_id) values ($1,$2,$3,$4)",
    [f.offering, f.course, f.cohort, f.period],
  );
  await pool.query(
    "insert into course_section_deliveries (id,offering_id,section_id) values ($1,$2,$3)",
    [f.delivery, f.offering, f.section],
  );
  await pool.query(
    "insert into learner_program_enrollments (id,membership_id,program_id,cohort_id) values ($1,$2,$3,$4)",
    [f.enrollment, learner, f.program, f.cohort],
  );
  await pool.query(
    "insert into section_enrollments (id,learner_enrollment_id,section_id,academic_period_id) values ($1,$2,$3,$4)",
    [f.sectionEnrollment, f.enrollment, f.section, f.period],
  );
  await pool.query(
    "insert into section_schedule_events (id,section_id,title,starts_at,ends_at) values ($1,$2,'Synthetic class',now()-interval '2 hours',now()-interval '1 hour')",
    [f.event, f.section],
  );
  await pool.query(
    "insert into section_schedule_event_courses (schedule_event_id,delivery_id) values ($1,$2)",
    [f.event, f.delivery],
  );
  return f;
}

let own: Fixture;
let foreign: Fixture;

beforeAll(async () => {
  own = await fixture(SEED_IDS.collegeA, SEED_IDS.departmentA);
  foreign = await fixture(SEED_IDS.collegeB, SEED_IDS.departmentB);
  await pool.query(
    "insert into attendance_sessions (schedule_event_id,status,marked_by_user_id,marked_at) values ($1,'MARKED',$2,now())",
    [foreign.event, SEED_IDS.facultyUser],
  );
  await pool.query(
    "insert into attendance_records (schedule_event_id,membership_id,status,marked_by_user_id,marked_at) values ($1,$2,'ABSENT',$3,now())",
    [foreign.event, foreign.learner, SEED_IDS.facultyUser],
  );
});

afterAll(async () => {
  // Only remove records created by this test. No production/shared database.
  for (const f of [...fixtures].reverse()) {
    const deletions = [
      ["attendance_records", "schedule_event_id", f.event],
      ["attendance_sessions", "schedule_event_id", f.event],
      ["section_schedule_event_courses", "schedule_event_id", f.event],
      ["section_schedule_events", "id", f.event],
      ["section_enrollments", "id", f.sectionEnrollment],
      ["learner_program_enrollments", "id", f.enrollment],
      ["course_section_deliveries", "id", f.delivery],
      ["course_offerings", "id", f.offering],
      ["courses", "id", f.course],
      ["sections", "id", f.section],
      ["cohorts", "id", f.cohort],
      ["programs", "id", f.program],
      ["academic_periods", "id", f.period],
    ] as const;
    for (const [table, column, id] of deletions) {
      await pool.query("delete from " + table + " where " + column + " = $1", [id]);
    }
  }
  for (const id of [...memberIds].reverse()) {
    await pool.query("delete from membership_roles where membership_id=$1", [id]);
    await pool.query("delete from college_memberships where id=$1", [id]);
  }
  for (const id of [...userIds].reverse()) {
    await pool.query("delete from users where id=$1", [id]);
  }
  await pool.end();
  await closeDatabaseConnection();
});

describe("College Admin attendance tenant isolation with PostgreSQL", () => {
  it("lists only own-college deliveries and catalogue entries", async () => {
    const options = await getAdminAttendanceOptions(admin, SEED_IDS.collegeA);
    expect(options.deliveries.some((row) => row.deliveryId === own.delivery)).toBe(true);
    expect(options.deliveries.some((row) => row.deliveryId === foreign.delivery)).toBe(false);
    expect(options.courses.some((row) => row.id === foreign.course)).toBe(false);
    // CourseInfo.formal_title is derived from the course's short title,
    // with the unchanged course name as a null-only fallback.
    const ownDelivery=options.deliveries.find(row=>row.deliveryId===own.delivery);
    const ownCourse=options.courses.find(row=>row.id===own.course);
    expect(ownDelivery?.formalTitle).toBe(ownCourse?.formalTitle);
    expect(typeof ownDelivery?.formalTitle).toBe("string");
    await expect(getAdminAttendanceOptions(admin, SEED_IDS.collegeB)).rejects.toThrow();
  });

  it("does not reveal foreign sessions, records or learner rosters", async () => {
    const month = new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 7);
    const grid = await getAdminAttendanceGrid(admin, {
      collegeId: SEED_IDS.collegeA, deliveryId: own.delivery, month,
    });
    expect(grid.sessions.some((row) => row.id === own.event)).toBe(true);
    expect(grid.sessions.some((row) => row.id === foreign.event)).toBe(false);
    expect(grid.records.some((row) => row.scheduleEventId === foreign.event)).toBe(false);
    expect(grid.roster.some((row) => row.membershipId === foreign.learner)).toBe(false);
    await expect(getAdminAttendanceGrid(admin, {
      collegeId: SEED_IDS.collegeA, deliveryId: foreign.delivery, month,
    })).rejects.toThrow();
  });

  it("rejects correcting foreign sessions without mutating them", async () => {
    await expect(correctAdminAttendance(admin, foreign.event, {
      collegeId: SEED_IDS.collegeA,
      deliveryId: own.delivery,
      membershipId: own.learner,
      status: "PRESENT",
    })).rejects.toThrow();
    const check = await pool.query(
      "select status from attendance_records where schedule_event_id=$1 and membership_id=$2",
      [foreign.event, foreign.learner],
    );
    expect(check.rows[0]?.status).toBe("ABSENT");
  });

  it("COL-attendance-R01 corrects an individual absence without marking an unmarked session", async () => {
    const input = {collegeId:SEED_IDS.collegeA,deliveryId:own.delivery,membershipId:own.learner};
    const before = await pool.query("select schedule_event_id from attendance_sessions where schedule_event_id=$1",[own.event]);
    expect(before.rows).toHaveLength(0);
    await correctAdminAttendance(admin,own.event,{...input,status:"ABSENT"});
    const [sessionRows,recordRows] = await Promise.all([
      pool.query("select status from attendance_sessions where schedule_event_id=$1",[own.event]),
      pool.query("select status from attendance_records where schedule_event_id=$1 and membership_id=$2",[own.event,own.learner]),
    ]);
    expect(sessionRows.rows).toHaveLength(0);
    expect(recordRows.rows).toMatchObject([{status:"ABSENT"}]);
    const previous = await pool.query(
      "select id from attendance_records where schedule_event_id=$1 and membership_id=$2",
      [own.event, own.learner],
    );
    await correctAdminAttendance(admin,own.event,{...input,status:"PRESENT"});
    const corrected = await pool.query(
      "select id,status from attendance_records where schedule_event_id=$1 and membership_id=$2",
      [own.event,own.learner],
    );
    expect(corrected.rows).toMatchObject([{id:previous.rows[0]?.id,status:"PRESENT"}]);
    const stillUnmarked = await pool.query(
      "select status from attendance_sessions where schedule_event_id=$1",
      [own.event],
    );
    expect(stillUnmarked.rows).toHaveLength(0);
  });

  it("admin correction invalidates an already marked Faculty session token", async () => {
    const input={collegeId:SEED_IDS.collegeA,deliveryId:own.delivery,membershipId:own.learner};
    const oldMarkedAt=new Date(Date.now()-60_000);
    await pool.query(
      "insert into attendance_sessions (schedule_event_id,status,marked_by_user_id,marked_at) values ($1,'MARKED',$2,$3)",
      [own.event,admin.user.id,oldMarkedAt],
    );
    await correctAdminAttendance(admin,own.event,{...input,status:"ABSENT"});
    const result=await pool.query(
      "select status,marked_at from attendance_sessions where schedule_event_id=$1",
      [own.event],
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.status).toBe("MARKED");
    const current=new Date(result.rows[0]?.marked_at);
    expect(current.getTime()).toBeGreaterThan(oldMarkedAt.getTime());
    expect(facultyAttendanceCorrectionTokenMatches(
      "MARKED",current,oldMarkedAt.toISOString(),
    )).toBe(false);
  });

  it("keeps explicit PRESENT identity and prevents inactive-member corrections", async () => {
    const input = {
      collegeId: SEED_IDS.collegeA,
      deliveryId: own.delivery,
      membershipId: own.learner,
    };
    await correctAdminAttendance(admin, own.event, { ...input, status: "ABSENT" });
    await correctAdminAttendance(admin, own.event, { ...input, status: "PRESENT" });
    const check = await pool.query(
      "select id,status from attendance_records where schedule_event_id=$1 and membership_id=$2",
      [own.event, own.learner],
    );
    expect(check.rows).toMatchObject([{status:"PRESENT"}]);
    await pool.query(
      "update college_memberships set status='SUSPENDED',suspended_at=now() where id=$1",
      [own.learner],
    );
    await expect(correctAdminAttendance(admin, own.event, {
      ...input, status: "ABSENT",
    })).rejects.toThrow();
  });
});
