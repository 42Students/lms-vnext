import { insertDisposableAttendanceMark, deleteDisposableAttendanceEvents } from "../support/db045-attendance-fixture.mjs";
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
    [foreign.event, SEED_IDS.superAdminUser],
  );
  // Valid foreign-college fixture: immutable history must never rely on
  // a Faculty marker from college A impersonating a college B teacher.
  await insertDisposableAttendanceMark(pool,{
    scheduleEventId:foreign.event,deliveryId:foreign.delivery,
    membershipId:foreign.learner,collegeId:SEED_IDS.collegeB,
    actorUserId:SEED_IDS.superAdminUser,actorMembershipId:null,
    actorRole:"SUPER_ADMIN",status:"ABSENT",
  });
});

afterAll(async () => {
  // Only remove records created by this test. No production/shared database.
  for (const f of [...fixtures].reverse()) {
    await deleteDisposableAttendanceEvents(pool,[f.event]);
    const deletions = [
      ["attendance_records", "schedule_event_id", f.event],
      ["attendance_sessions", "schedule_event_id", f.event],
      ["section_schedule_event_courses", "schedule_event_id", f.event],
      ["section_schedule_events", "id", f.event],
      ["section_enrollments", "id", f.sectionEnrollment],
      ["learner_program_enrollments", "id", f.enrollment],
      ["course_section_deliveries", "id", f.delivery],
      ["course_offerings", "id", f.offering],
      ["program_term_courses", "course_id", f.course],
      ["courses", "id", f.course],
      ["sections", "id", f.section],
      ["cohorts", "id", f.cohort],
      ["program_terms", "program_id", f.program],
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

  // DB045 direct negative matrix: distinct CHECK, actor, tenant, schedule,
  // learner, version and immutable-id attacks against a POPULATED event row.
  // Every statement is repo-authored SQL; its parameters come only from the
  // disposable test fixtures created above.
  const eventFields = {
    attendance_record_id:"ar.id",
    schedule_event_id:"ar.schedule_event_id",
    delivery_id:"$2::uuid",
    membership_id:"ar.membership_id",
    college_id:"$3::uuid",
    actor_user_id:"$4::uuid",
    actor_membership_id:"NULL::uuid",
    actor_role:"'SUPER_ADMIN'",
    action:"'CORRECT'",
    previous_status:"ar.status",
    new_status:"'PRESENT'",
    previous_note:"ar.note",
    new_note:"'DB045 negative'",
    previous_marked_by_user_id:"ar.marked_by_user_id",
    new_marked_by_user_id:"$4::uuid",
    previous_marked_at:"ar.marked_at",
    new_marked_at:"now()",
    record_version_before:"ar.version",
    record_version_after:"ar.version+1",
  } as const;
  type EventField = keyof typeof eventFields;
  const forgedCases: {
    name:string;overrides:Partial<Record<EventField,string>>;
    code:string;message:string;
  }[] = [
    {name:"unrecognized action",overrides:{action:"'VOID'"},
      code:"23514",message:"event does not match current row post-state"},
    {name:"unrecognized actor role",overrides:{actor_role:"'STUDENT'"},
      code:"23514",message:"actor without membership must be SUPER_ADMIN"},
    {name:"unrecognized new attendance status",overrides:{new_status:"'UNKNOWN'"},
      code:"23514",message:"event does not match current row post-state"},
    {name:"unrecognized prior attendance status",overrides:{previous_status:"'UNKNOWN'"},
      code:"23514",message:"event does not match current row post-state"},
    {name:"skipped version number",overrides:{record_version_after:"ar.version+3"},
      code:"23514",message:"event does not match current row post-state"},
    {name:"negative previous version",overrides:{record_version_before:"-1"},
      code:"23514",message:"event does not match current row post-state"},
    {name:"CORRECT with null previous version",overrides:{record_version_before:"NULL::integer"},
      code:"23514",message:"event does not match current row post-state"},
    {name:"CORRECT missing previous marker",overrides:{previous_marked_by_user_id:"NULL::uuid"},
      code:"23514",message:"event does not match current row post-state"},
    {name:"CORRECT missing previous timestamp",overrides:{previous_marked_at:"NULL::timestamptz"},
      code:"23514",message:"event does not match current row post-state"},
    {name:"tenant metadata from another college",overrides:{college_id:"$5::uuid"},
      code:"23514",message:"tenant mismatch"},
    {name:"actor differs from claimed marker",overrides:{actor_user_id:"$6::uuid"},
      code:"23514",message:"actor must equal current marker"},
    {name:"wrong course delivery",overrides:{delivery_id:"$7::uuid"},
      code:"23514",message:"delivery does not match schedule link"},
    {name:"wrong record identity",overrides:{attendance_record_id:"gen_random_uuid()"},
      code:"23514",message:"post-state"},
    {name:"wrong learner membership",overrides:{membership_id:"$8::uuid"},
      code:"23514",message:"tenant mismatch"},
    {name:"SUPER_ADMIN actor without persisted SUPER_ADMIN role",overrides:{
      actor_user_id:"$6::uuid",new_marked_by_user_id:"$6::uuid"},
      code:"23514",message:"SUPER_ADMIN role is missing"},
    {name:"actor claims COLLEGE_ADMIN using learner membership",overrides:{
      actor_role:"'COLLEGE_ADMIN'",actor_membership_id:"ar.membership_id",
      actor_user_id:"(select user_id from college_memberships where id=ar.membership_id)",
      new_marked_by_user_id:"(select user_id from college_memberships where id=ar.membership_id)"},
      code:"23514",message:"lacks COLLEGE_ADMIN grant"},
    {name:"actor claims FACULTY using learner membership",overrides:{
      actor_role:"'FACULTY'",actor_membership_id:"ar.membership_id",
      actor_user_id:"(select user_id from college_memberships where id=ar.membership_id)",
      new_marked_by_user_id:"(select user_id from college_memberships where id=ar.membership_id)"},
      code:"23514",message:"lacks teaching scope"},
  ];
  it("DB045 registers validated independent event CHECK constraints",async()=>{
    // The scope trigger can reject a forged post-state before PostgreSQL
    // evaluates its CHECK expressions. Inspect the catalog independently.
    const {rows}=await pool.query<{conname:string,convalidated:boolean}>(`
      select conname,convalidated from pg_constraint
      where conrelid='public.attendance_record_events'::regclass and contype='c'
    `);
    const checks=new Map(rows.map(row=>[row.conname,row.convalidated]));
    for (const name of [
      "attendance_record_events_action_ck",
      "attendance_record_events_actor_role_ck",
      "attendance_record_events_actor_shape_ck",
      "attendance_record_events_shape_ck",
      "attendance_record_events_status_ck",
      "attendance_record_events_version_ck",
    ]) expect(checks.get(name)).toBe(true);
  });

  it.each(forgedCases)("DB045 rejects $name against a real attendance row",async witness=>{
    const fields = Object.keys(eventFields) as EventField[];
    const expressions=fields.map(col=>witness.overrides[col]??eventFields[col]);
    const query=`insert into attendance_record_events
      (${fields.join(",")}) select ${expressions.join(",")}
      from attendance_records ar where ar.schedule_event_id=$1`;
    // All fixture IDs are locally generated or seeded UUIDs. Inline only
    // these validated UUID literals; keep the foreign schedule ID bound as
    // $1. PostgreSQL must reach the actual CHECK/tenant/actor guard instead
    // of stopping on extraneous or untyped intermediary bind parameters.
    const fixtureIds=[foreign.delivery,SEED_IDS.collegeB,
      SEED_IDS.superAdminUser,SEED_IDS.collegeA,
      SEED_IDS.collegeAdminUser,own.delivery,own.learner];
    const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(fixtureIds.every(id=>uuidPattern.test(id))).toBe(true);
    let boundQuery=query;
    for (let i=0;i<fixtureIds.length;i++){
      boundQuery=boundQuery.replaceAll("$"+(i+2)+"::uuid",
        "'"+fixtureIds[i]+"'::uuid");
    }
    let failure:unknown;
    try {await pool.query(boundQuery,[foreign.event]);}catch(error){failure=error;}
    expect(failure).toMatchObject({code:witness.code});
    expect(String((failure as {message?:string})?.message??""))
      .toContain(witness.message);
    const unchanged=await pool.query<{version:number,status:string}>(
      "select version,status from attendance_records where schedule_event_id=$1",
      [foreign.event],
    );
    expect(unchanged.rows).toMatchObject([{version:0,status:"ABSENT"}]);
  });


  // DB045 direct SQL negative witnesses target a genuine linked, immutably
  // audited foreign-college attendance row, not an empty-catalog success.
  it("DB045 prevents unaudited initial marks and retains exact current identity", async () => {
    await expect(pool.query(
      `insert into attendance_records
        (schedule_event_id,membership_id,status,marked_by_user_id)
       values($1,$2,'PRESENT',$3)`,
      [own.event,own.learner,admin.user.id],
    )).rejects.toMatchObject({code:"23514"});
    const rows=await pool.query(
      "select 1 from attendance_records where schedule_event_id=$1",
      [own.event],
    );
    expect(rows.rowCount).toBe(0);
  });

  it("DB045 rejects direct attendance status and marker edits lacking a CORRECT event",async()=>{
    const before=await pool.query<{id:string,version:number,status:string}>(
      "select id,version,status from attendance_records where schedule_event_id=$1",
      [foreign.event],
    );
    expect(before.rows).toHaveLength(1);
    await expect(pool.query(
      `update attendance_records set status='PRESENT',
        version=version+1,marked_at=marked_at+interval '1 second'
       where schedule_event_id=$1`,[foreign.event],
    )).rejects.toMatchObject({code:"23514"});
    const after=await pool.query<{id:string,version:number,status:string}>(
      "select id,version,status from attendance_records where schedule_event_id=$1",
      [foreign.event],
    );
    expect(after.rows).toEqual(before.rows);
  });

  it("DB045 rejects attendance identity rewrites even with an incremented version",async()=>{
    await expect(pool.query(
      "update attendance_records set membership_id=$2,version=version+1 where schedule_event_id=$1",
      [foreign.event,own.learner],
    )).rejects.toMatchObject({code:"23514"});
  });

  it("DB045 rejects in-place event changes, deletion and wholesale TRUNCATE",async()=>{
    await expect(pool.query(
      "update attendance_record_events set new_note='forged' where schedule_event_id=$1",
      [foreign.event],
    )).rejects.toMatchObject({code:"23514"});
    await expect(pool.query(
      "delete from attendance_record_events where schedule_event_id=$1",
      [foreign.event],
    )).rejects.toMatchObject({code:"23514"});
    await expect(pool.query(
      "truncate table attendance_record_events",
    )).rejects.toMatchObject({code:"23514"});
    await expect(pool.query(
      "delete from attendance_records where schedule_event_id=$1",
      [foreign.event],
    )).rejects.toMatchObject({code:"23503"});
  });

  it("DB045 rejects forged cross-college CORRECT event even with a real record",async()=>{
    await expect(pool.query(`
      insert into attendance_record_events (
        attendance_record_id,schedule_event_id,delivery_id,membership_id,
        college_id,actor_user_id,actor_membership_id,actor_role,action,
        previous_status,new_status,previous_note,new_note,
        previous_marked_by_user_id,new_marked_by_user_id,
        previous_marked_at,new_marked_at,
        record_version_before,record_version_after
      ) select ar.id,ar.schedule_event_id,$2::uuid,ar.membership_id,
        $3::uuid,$4::uuid,null,'SUPER_ADMIN','CORRECT',
        ar.status,'PRESENT',ar.note,'forged',
        ar.marked_by_user_id,$4::uuid,ar.marked_at,now(),0,1
      from attendance_records ar where ar.schedule_event_id=$1
    `,[foreign.event,foreign.delivery,SEED_IDS.collegeA,
      SEED_IDS.superAdminUser],
    )).rejects.toMatchObject({code:"23514"});
  });


  it("lists only own-college deliveries and catalogue entries", async () => {
    const shortTitle="Attendance formal "+nonce;
    await pool.query("update courses set short_title=$1 where id=$2",[shortTitle,own.course]);
    const options = await getAdminAttendanceOptions(admin, SEED_IDS.collegeA);
    expect(options.deliveries.some((row) => row.deliveryId === own.delivery)).toBe(true);
    expect(options.deliveries.some((row) => row.deliveryId === foreign.delivery)).toBe(false);
    expect(options.courses.some((row) => row.id === foreign.course)).toBe(false);
    // CourseInfo.formal_title is derived from the course's short title,
    // with the unchanged course name as a null-only fallback.
    const ownDelivery=options.deliveries.find(row=>row.deliveryId===own.delivery);
    const ownCourse=options.courses.find(row=>row.id===own.course);
    expect(ownDelivery?.formalTitle).toBe(ownCourse?.formalTitle);
    expect(ownDelivery?.formalTitle).toBe(shortTitle);
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

  it("persists note-only admin corrections with stable row tokens and no spurious rewrite", async () => {
    const input={
      collegeId:SEED_IDS.collegeA,deliveryId:own.delivery,membershipId:own.learner,
    };
    const before=await pool.query(
      "select id,status,note,marked_at from attendance_records where schedule_event_id=$1 and membership_id=$2",
      [own.event,own.learner],
    );
    expect(before.rows[0]?.status).toBe("ABSENT");
    const old=before.rows[0];
    const changed=await correctAdminAttendance(admin,own.event,{
      ...input,status:"ABSENT",note:"Reviewed with course coordinator",
      expectedMarkedAt:new Date(old.marked_at).toISOString(),
    });
    expect(changed.status).toBe("ABSENT");
    const corrected=await pool.query(
      "select id,status,note,marked_at from attendance_records where schedule_event_id=$1 and membership_id=$2",
      [own.event,own.learner],
    );
    const after=corrected.rows[0];
    expect(after.id).toBe(old.id);
    expect(after.note).toBe("Reviewed with course coordinator");
    expect(new Date(after.marked_at).getTime()).toBeGreaterThan(
      new Date(old.marked_at).getTime(),
    );
    // A note-only correction advances the optimistic token. A concurrent
    // editor's previous snapshot can no longer overwrite the reviewed note.
    await expect(correctAdminAttendance(admin,own.event,{
      ...input,status:"PRESENT",expectedMarkedAt:new Date(old.marked_at).toISOString(),
    })).rejects.toMatchObject({code:"ATTENDANCE_STALE_VERSION"});
    await correctAdminAttendance(admin,own.event,{
      ...input,status:"ABSENT",note:"Reviewed with course coordinator",
      expectedMarkedAt:new Date(after.marked_at).toISOString(),
    });
    const noOp=await pool.query(
      "select id,note,marked_at from attendance_records where schedule_event_id=$1 and membership_id=$2",
      [own.event,own.learner],
    );
    expect(noOp.rows[0]?.id).toBe(after.id);
    expect(noOp.rows[0]?.note).toBe(after.note);
    expect(new Date(noOp.rows[0].marked_at).getTime()).toBe(
      new Date(after.marked_at).getTime(),
    );
    await correctAdminAttendance(admin,own.event,{
      ...input,status:"ABSENT",note:"",
      expectedMarkedAt:new Date(after.marked_at).toISOString(),
    });
    const cleared=await pool.query(
      "select id,note from attendance_records where schedule_event_id=$1 and membership_id=$2",
      [own.event,own.learner],
    );
    expect(cleared.rows).toMatchObject([{id:after.id,note:null}]);
  });

  it("DB045 two concurrent admin corrections with one row token cannot both commit", async()=>{
    const input={collegeId:SEED_IDS.collegeA,deliveryId:own.delivery,
      membershipId:own.learner};
    const before=await pool.query<{marked_at:Date,status:string,version:number}>(
      "select marked_at,status,version from attendance_records where schedule_event_id=$1 and membership_id=$2",
      [own.event,own.learner],
    );
    expect(before.rows).toHaveLength(1);
    const expectedMarkedAt=before.rows[0]!.marked_at.toISOString();
    const writes=await Promise.allSettled([
      correctAdminAttendance(admin,own.event,{
        ...input,status:"PRESENT",note:"Competing admin correction A",expectedMarkedAt,
      }),
      correctAdminAttendance(admin,own.event,{
        ...input,status:"ABSENT",note:"Competing admin correction B",expectedMarkedAt,
      }),
    ]);
    const accepted=writes.filter(w=>w.status==="fulfilled");
    const rejected=writes.filter(w=>w.status==="rejected");
    expect(accepted).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason)
      .toMatchObject({code:"ATTENDANCE_STALE_VERSION"});
    const after=await pool.query<{version:number,note:string}>(
      "select version,note from attendance_records where schedule_event_id=$1 and membership_id=$2",
      [own.event,own.learner],
    );
    expect(after.rows[0]!.version).toBe(before.rows[0]!.version+1);
    expect(["Competing admin correction A","Competing admin correction B"])
      .toContain(after.rows[0]!.note);
    const audit=await pool.query<{version:number}>(
      `select record_version_after version from attendance_record_events e
       join attendance_records ar on ar.id=e.attendance_record_id
       where ar.schedule_event_id=$1 and ar.membership_id=$2
       and e.record_version_after=$3`,
      [own.event,own.learner,after.rows[0]!.version],
    );
    expect(audit.rows).toHaveLength(1);
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
