import { randomUUID } from "node:crypto";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import { createGroup, joinGroup, leaveGroup } from "@/modules/groups/service";
import { listLearnerCourseDeliveries } from "@/modules/courses/learner-course-service";
import { requireLearningReadAccess } from "@/modules/courses/learning-access";
import { listActiveDeliveryLearners } from "@/modules/courses/delivery-roster";
import { getLearnerClassSchedule } from "@/modules/academics/learner-schedule-service";
import type { RequestContext } from "@/modules/identity/context";
import { SEED_IDS } from "../../scripts/db-seed-data";

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl || process.env.DB03_ISOLATED_TEST_DATABASE !== "1")
  throw new Error("DB03 roster tests require disposable TEST_DATABASE_URL and DB03_ISOLATED_TEST_DATABASE=1");
const pool = new Pool({ connectionString: databaseUrl, max: 2 });
const admin: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "seed-college-admin", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const learner: RequestContext = {
  user: { id: SEED_IDS.learnerUser, identityUid: "seed-learner", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.learnerCollegeAMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["LEARNER"] },
};

type Fixture = {
  programId: string; periodId: string; cohortId: string; sectionId: string;
  courseId: string; offeringId: string; deliveryId: string; slotId: string;
  groupId: string; scheduleEventId: string; otherUserId?: string; otherMembershipId?: string;
  otherEnrollmentId?: string; otherSectionEnrollmentId?: string;
  transferredEnrollmentId?: string; transferredSectionEnrollmentId?: string;
  crossProgramId?: string; crossCohortId?: string; crossSectionId?: string;
};
const fixtures: Fixture[] = [];
const label = () => "DB03-R-" + randomUUID();

async function setupRosterFixture() {
  const programId = randomUUID(), periodId = randomUUID(), cohortId = randomUUID();
  const sectionId = randomUUID(), courseId = randomUUID(), offeringId = randomUUID();
  const deliveryId = randomUUID(), slotId = randomUUID(), scheduleEventId = randomUUID();
  const group = await createGroup(admin, {
    collegeId: SEED_IDS.collegeA,
    kind: "ELECTIVE", name: label(), capacity: 10,
    selfJoinOpenFrom: new Date(Date.now() - 60_000),
    configJson: { allowSelfLeave: true, allowWaitlist: false },
  });
  const fixture: Fixture = { programId, periodId, cohortId, sectionId,
    courseId, offeringId, deliveryId, slotId, scheduleEventId, groupId: group.id };
  fixtures.push(fixture);
  await pool.query("UPDATE lms_groups SET status='ACTIVE' WHERE id=$1", [group.id]);
  await pool.query(
    "INSERT INTO programs (id,department_id,name,code,duration_terms) VALUES ($1,$2,$3,$4,8)",
    [programId, SEED_IDS.departmentA, label(), label()],
  );
  await pool.query(
    "INSERT INTO academic_periods (id,college_id,name,code,start_date,end_date,status) VALUES ($1,$2,$3,$4,'2026-07-01','2026-12-31','ACTIVE')",
    [periodId, SEED_IDS.collegeA, label(), label()],
  );
  await pool.query(
    "INSERT INTO cohorts (id,program_id,name,code,start_period_id,status) VALUES ($1,$2,$3,$4,$5,'ACTIVE')",
    [cohortId,programId,label(),label(),periodId],
  );
  await pool.query(
    "INSERT INTO sections (id,cohort_id,academic_period_id,name,code) VALUES ($1,$2,$3,$4,$5)",
    [sectionId,cohortId,periodId,label(),label()],
  );
  await pool.query(
    "INSERT INTO courses (id,department_id,name,code) VALUES ($1,$2,$3,$4)",
    [courseId,SEED_IDS.departmentA,label(),label()],
  );
  await pool.query(
    "INSERT INTO course_offerings (id,course_id,cohort_id,academic_period_id,type,credits,display_order) VALUES ($1,$2,$3,$4,'ELECTIVE',3,0)",
    [offeringId,courseId,cohortId,periodId],
  );
  await pool.query(
    "INSERT INTO course_section_deliveries (id,offering_id,section_id) VALUES ($1,$2,$3)",
    [deliveryId,offeringId,sectionId],
  );
  await pool.query(
    "INSERT INTO section_schedule_events (id,section_id,title,starts_at,ends_at) VALUES ($1,$2,$3,'2026-10-12T10:00:00+05:30','2026-10-12T11:00:00+05:30')",
    [scheduleEventId,sectionId,"DB03 elective class"],
  );
  await pool.query(
    "INSERT INTO section_schedule_event_courses (schedule_event_id,delivery_id) VALUES ($1,$2)",
    [scheduleEventId,deliveryId],
  );
  await pool.query(
    "INSERT INTO elective_slots (id,college_id,program_id,academic_period_id,semester_number,name) VALUES ($1,$2,$3,$4,1,$5)",
    [slotId,SEED_IDS.collegeA,programId,periodId,label()],
  );
  await pool.query(
    "INSERT INTO elective_offerings (slot_id,course_id,group_id,backed_delivery_id) VALUES ($1,$2,$3,$4)",
    [slotId,courseId,group.id,deliveryId],
  );
  return fixture;
}
async function createHostSectionLearner(f: Fixture) {
  const userId = randomUUID(), membershipId = randomUUID(), enrollmentId = randomUUID(), sectionEnrollmentId = randomUUID();
  f.otherUserId = userId; f.otherMembershipId = membershipId;
  f.otherEnrollmentId = enrollmentId; f.otherSectionEnrollmentId = sectionEnrollmentId;
  await pool.query(
    "INSERT INTO users (id,identity_uid,display_name) VALUES ($1,$2,'DB03 host learner')",
    [userId,"db03-host-"+userId],
  );
  await pool.query("INSERT INTO college_memberships (id,user_id,college_id) VALUES ($1,$2,$3)",
    [membershipId,userId,SEED_IDS.collegeA]);
  await pool.query("INSERT INTO membership_roles (membership_id,role) VALUES ($1,'LEARNER')",[membershipId]);
  await pool.query(
    "INSERT INTO learner_program_enrollments (id,membership_id,program_id,cohort_id) VALUES ($1,$2,$3,$4)",
    [enrollmentId,membershipId,f.programId,f.cohortId],
  );
  await pool.query(
    "INSERT INTO section_enrollments (id,learner_enrollment_id,section_id,academic_period_id) VALUES ($1,$2,$3,$4)",
    [sectionEnrollmentId,enrollmentId,f.sectionId,f.periodId],
  );
  const ctx: RequestContext = {
    user: { id:userId, identityUid:"db03-host-"+userId, platformStatus:"ACTIVE", systemRoles:[] },
    membership: { id:membershipId,collegeId:SEED_IDS.collegeA, organizationId:SEED_IDS.organization,
      status:"ACTIVE", roles:["LEARNER"] },
  };
  return { ctx, membershipId };
}
afterEach(async () => {
  for(const f of fixtures.reverse()) {
    await pool.query("TRUNCATE TABLE lms_group_member_events");
    await pool.query("DELETE FROM lms_group_members WHERE group_id=$1",[f.groupId]);
    await pool.query("DELETE FROM elective_offerings WHERE group_id=$1",[f.groupId]);
    await pool.query("DELETE FROM elective_slots WHERE id=$1",[f.slotId]);
    await pool.query("DELETE FROM section_schedule_event_courses WHERE schedule_event_id=$1",[f.scheduleEventId]);
    await pool.query("DELETE FROM section_schedule_events WHERE id=$1",[f.scheduleEventId]);
    if(f.transferredSectionEnrollmentId) await pool.query("DELETE FROM section_enrollments WHERE id=$1",[f.transferredSectionEnrollmentId]);
    if(f.transferredEnrollmentId) await pool.query("DELETE FROM learner_program_enrollments WHERE id=$1",[f.transferredEnrollmentId]);
    if(f.otherSectionEnrollmentId) await pool.query("DELETE FROM section_enrollments WHERE id=$1",[f.otherSectionEnrollmentId]);
    if(f.otherEnrollmentId) await pool.query("DELETE FROM learner_program_enrollments WHERE id=$1",[f.otherEnrollmentId]);
    await pool.query("DELETE FROM course_section_deliveries WHERE id=$1",[f.deliveryId]);
    await pool.query("DELETE FROM course_offerings WHERE id=$1",[f.offeringId]);
    await pool.query("DELETE FROM courses WHERE id=$1",[f.courseId]);
    // Both cohorts reference the same academic period; remove every dependent
    // section/cohort before deleting the period, including transfer fixtures.
    await pool.query("DELETE FROM sections WHERE id=$1",[f.sectionId]);
    if(f.crossSectionId) await pool.query("DELETE FROM sections WHERE id=$1",[f.crossSectionId]);
    await pool.query("DELETE FROM cohorts WHERE id=$1",[f.cohortId]);
    if(f.crossCohortId) await pool.query("DELETE FROM cohorts WHERE id=$1",[f.crossCohortId]);
    await pool.query("DELETE FROM academic_periods WHERE id=$1",[f.periodId]);
    const programs=[f.programId,...(f.crossProgramId?[f.crossProgramId]:[])];
    await pool.query("DELETE FROM program_term_courses WHERE program_term_id IN (SELECT id FROM program_terms WHERE program_id=ANY($1::uuid[]))",[programs]);
    await pool.query("DELETE FROM program_terms WHERE program_id=ANY($1::uuid[])",[programs]);
    await pool.query("DELETE FROM programs WHERE id=ANY($1::uuid[])",[programs]);
    await pool.query("DELETE FROM lms_groups WHERE id=$1",[f.groupId]);
    if(f.otherMembershipId) {
      await pool.query("DELETE FROM membership_roles WHERE membership_id=$1",[f.otherMembershipId]);
      await pool.query("DELETE FROM college_memberships WHERE id=$1",[f.otherMembershipId]);
    }
    if(f.otherUserId) await pool.query("DELETE FROM users WHERE id=$1",[f.otherUserId]);
  }
  fixtures.length = 0;
});
afterAll(async()=>{await pool.end();await closeDatabaseConnection();});

describe("DB03 elective group-backed course access (PostgreSQL)", () => {
  it("shows a group-backed elective without creating primary section enrollment", async () => {
    const f = await setupRosterFixture();
    const host = await createHostSectionLearner(f);
    const before = await pool.query(
      "SELECT count(*)::integer AS n FROM section_enrollments se JOIN learner_program_enrollments pe ON pe.id=se.learner_enrollment_id WHERE pe.membership_id=$1",
      [host.membershipId],
    );
    await joinGroup(host.ctx,f.groupId,host.membershipId);
    const listed = await listLearnerCourseDeliveries(host.ctx);
    expect(listed.some(row=>row.deliveryId===f.deliveryId)).toBe(true);
    await expect(requireLearningReadAccess(host.ctx,f.offeringId,f.deliveryId)).resolves.toBe("LEARNER");
    const schedule = await getLearnerClassSchedule(host.ctx);
    expect(schedule.courses.some(row=>row.deliveryId===f.deliveryId)).toBe(true);
    expect(schedule.events.some(row=>row.id===f.scheduleEventId)).toBe(true);
    const after = await pool.query(
      "SELECT count(*)::integer AS n FROM section_enrollments se JOIN learner_program_enrollments pe ON pe.id=se.learner_enrollment_id WHERE pe.membership_id=$1",
      [host.membershipId],
    );
    expect(after.rows[0].n).toBe(before.rows[0].n);
  });

  it("protects faculty attendance rosters after elective term changes or source revocation", async () => {
    const f=await setupRosterFixture();
    const host=await createHostSectionLearner(f);
    const scope={deliveryId:f.deliveryId,sectionId:f.sectionId,
      academicPeriodId:f.periodId,collegeId:SEED_IDS.collegeA};
    expect((await listActiveDeliveryLearners(scope))
      .some(row=>row.membershipId===host.membershipId)).toBe(false);
    await joinGroup(host.ctx,f.groupId,host.membershipId);
    expect((await listActiveDeliveryLearners(scope))
      .some(row=>row.membershipId===host.membershipId)).toBe(true);
    await pool.query("UPDATE elective_slots SET semester_number=2 WHERE id=$1",[f.slotId]);
    expect((await listActiveDeliveryLearners(scope))
      .some(row=>row.membershipId===host.membershipId)).toBe(false);
    await pool.query("UPDATE elective_slots SET semester_number=1 WHERE id=$1",[f.slotId]);
    expect((await listActiveDeliveryLearners(scope))
      .some(row=>row.membershipId===host.membershipId)).toBe(true);
    await pool.query("UPDATE courses SET enabled=false WHERE id=$1",[f.courseId]);
    expect((await listActiveDeliveryLearners(scope))
      .some(row=>row.membershipId===host.membershipId)).toBe(false);
  });

  it("does not grant host-section members an elective they have not joined", async () => {
    const f = await setupRosterFixture();
    const host = await createHostSectionLearner(f);
    const listed = await listLearnerCourseDeliveries(host.ctx);
    expect(listed.some(row=>row.deliveryId===f.deliveryId)).toBe(false);
    const schedule = await getLearnerClassSchedule(host.ctx);
    expect(schedule.courses.some(row=>row.deliveryId===f.deliveryId)).toBe(false);
    expect(schedule.events.some(row=>row.id===f.scheduleEventId)).toBe(false);
    await expect(requireLearningReadAccess(host.ctx,f.offeringId,f.deliveryId))
      .rejects.toMatchObject({ code: "LEARNER_ENROLLMENT_SCOPE_REQUIRED" });
  });

  it("revokes group-backed read access after leave even with a valid host section", async () => {
    const f = await setupRosterFixture();
    const host = await createHostSectionLearner(f);
    await joinGroup(host.ctx,f.groupId,host.membershipId);
    await expect(requireLearningReadAccess(host.ctx,f.offeringId,f.deliveryId)).resolves.toBe("LEARNER");
    await leaveGroup(host.ctx,f.groupId,host.membershipId);
    await expect(requireLearningReadAccess(host.ctx,f.offeringId,f.deliveryId))
      .rejects.toMatchObject({ code: "LEARNER_ENROLLMENT_SCOPE_REQUIRED" });
    const listed = await listLearnerCourseDeliveries(host.ctx);
    expect(listed.some(row=>row.deliveryId===f.deliveryId)).toBe(false);
  });

  it("revokes elective content access when its source course is disabled", async () => {
    const fixture = await setupRosterFixture();
    const host = await createHostSectionLearner(fixture);
    await joinGroup(host.ctx, fixture.groupId, host.membershipId);
    await expect(requireLearningReadAccess(host.ctx, fixture.offeringId, fixture.deliveryId))
      .resolves.toBe("LEARNER");
    await pool.query("UPDATE courses SET enabled=false WHERE id=$1", [fixture.courseId]);
    await expect(requireLearningReadAccess(host.ctx, fixture.offeringId, fixture.deliveryId))
      .rejects.toMatchObject({ code: "LEARNER_ENROLLMENT_SCOPE_REQUIRED" });
    expect((await listLearnerCourseDeliveries(host.ctx))
      .some(row => row.deliveryId === fixture.deliveryId)).toBe(false);
  });

  it("revokes elective course and schedule access when the slot no longer matches current term/year", async () => {
    const f = await setupRosterFixture();
    const host = await createHostSectionLearner(f);
    await joinGroup(host.ctx, f.groupId, host.membershipId);
    await expect(requireLearningReadAccess(host.ctx, f.offeringId, f.deliveryId))
      .resolves.toBe("LEARNER");

    await pool.query("UPDATE elective_slots SET semester_number=2 WHERE id=$1", [f.slotId]);
    await expect(requireLearningReadAccess(host.ctx, f.offeringId, f.deliveryId))
      .rejects.toMatchObject({ code: "LEARNER_ENROLLMENT_SCOPE_REQUIRED" });
    expect((await listLearnerCourseDeliveries(host.ctx))
      .some(row => row.deliveryId === f.deliveryId)).toBe(false);
    expect((await getLearnerClassSchedule(host.ctx)).events
      .some(row => row.id === f.scheduleEventId)).toBe(false);
    await expect(joinGroup(host.ctx, f.groupId, host.membershipId))
      .rejects.toMatchObject({ code: "ELECTIVE_PRIMARY_SECTION_REQUIRED" });

    await pool.query("UPDATE elective_slots SET semester_number=1 WHERE id=$1", [f.slotId]);
    const currentYear = await pool.query<{ current_academic_year_start:number|null }>(
      "SELECT cps.current_academic_year_start FROM cohort_progression_state cps WHERE cps.cohort_id=$1",
      [f.cohortId],
    );
    const start = currentYear.rows[0]?.current_academic_year_start;
    expect(start).not.toBeNull();
    const otherStart = Number(start) - 1;
    await pool.query("UPDATE elective_slots SET academic_year=$2 WHERE id=$1", [
      f.slotId, `${otherStart}-${String(otherStart + 1).slice(-2)}`,
    ]);
    await expect(requireLearningReadAccess(host.ctx, f.offeringId, f.deliveryId))
      .rejects.toMatchObject({ code: "LEARNER_ENROLLMENT_SCOPE_REQUIRED" });
    await pool.query("UPDATE elective_slots SET academic_year=NULL WHERE id=$1", [f.slotId]);
    await expect(requireLearningReadAccess(host.ctx, f.offeringId, f.deliveryId))
      .resolves.toBe("LEARNER");
  });

  it("denies archived elective offerings rather than silently using host-section membership", async () => {
    const f = await setupRosterFixture();
    const host = await createHostSectionLearner(f);
    await joinGroup(host.ctx,f.groupId,host.membershipId);
    await pool.query("UPDATE elective_offerings SET status='ARCHIVED' WHERE group_id=$1",[f.groupId]);
    await expect(requireLearningReadAccess(host.ctx,f.offeringId,f.deliveryId))
      .rejects.toMatchObject({ code: "LEARNER_ENROLLMENT_SCOPE_REQUIRED" });
    expect((await listLearnerCourseDeliveries(host.ctx)).some(row=>row.deliveryId===f.deliveryId)).toBe(false);
  });

  it("blocks suspended accounts even when group membership remains ACTIVE", async () => {
    const f = await setupRosterFixture();
    const host = await createHostSectionLearner(f);
    await joinGroup(host.ctx,f.groupId,host.membershipId);
    const suspended: RequestContext = { ...host.ctx, user: { ...host.ctx.user, platformStatus: "DISABLED" } };
    await expect(listLearnerCourseDeliveries(suspended))
      .rejects.toMatchObject({ code: "LEARNER_PROGRESS_ACCESS_DENIED" });
    // Suspended platform identities fail the top-level learning authorization
    // gate before any specific enrollment-visibility checks are evaluated.
    await expect(requireLearningReadAccess(suspended,f.offeringId,f.deliveryId))
      .rejects.toMatchObject({ code: "LEARNING_ACCESS_DENIED" });
    await expect(getLearnerClassSchedule(suspended))
      .rejects.toMatchObject({ code: "LEARNER_SCHEDULE_ACCESS_DENIED" });
  });

  it("denies stale elective access and rejoin after learner moves to another program", async () => {
    const f=await setupRosterFixture();
    const student=await createHostSectionLearner(f);

    // Establish a valid allocation first, then simulate a legitimate academic
    // transfer while the historical elective group membership remains ACTIVE.
    await joinGroup(student.ctx,f.groupId,student.membershipId);
    await expect(requireLearningReadAccess(student.ctx,f.offeringId,f.deliveryId))
      .resolves.toBe("LEARNER");

    const p=randomUUID(), c=randomUUID(), s=randomUUID();
    f.crossProgramId=p; f.crossCohortId=c; f.crossSectionId=s;
    await pool.query(
      "INSERT INTO programs (id,department_id,name,code,duration_terms) VALUES ($1,$2,$3,$4,8)",
      [p,SEED_IDS.departmentA,label(),label()],
    );
    await pool.query(
      "INSERT INTO cohorts (id,program_id,name,code,start_period_id,status) VALUES ($1,$2,$3,$4,$5,'ACTIVE')",
      [c,p,label(),label(),f.periodId],
    );
    await pool.query(
      "INSERT INTO sections (id,cohort_id,academic_period_id,name,code) VALUES ($1,$2,$3,$4,$5)",
      [s,c,f.periodId,label(),label()],
    );
    // DB-005 immutable enrollment identity: retire old and create fresh
    // same-college program/section enrollment, preserving historical rows.
    f.transferredEnrollmentId=randomUUID();
    f.transferredSectionEnrollmentId=randomUUID();
    await pool.query("UPDATE section_enrollments SET status='MOVED',ended_at=now() WHERE id=$1",[f.otherSectionEnrollmentId]);
    await pool.query("UPDATE learner_program_enrollments SET status='WITHDRAWN',withdrawn_at=now() WHERE id=$1",[f.otherEnrollmentId]);
    await pool.query(
      "INSERT INTO learner_program_enrollments(id,membership_id,program_id,cohort_id) VALUES($1,$2,$3,$4)",
      [f.transferredEnrollmentId,student.membershipId,p,c]);
    await pool.query(
      "INSERT INTO section_enrollments(id,learner_enrollment_id,section_id,academic_period_id) VALUES($1,$2,$3,$4)",
      [f.transferredSectionEnrollmentId,f.transferredEnrollmentId,s,f.periodId]);

    // Membership history remains, but it must no longer authorize the slot's
    // delivery after the learner's primary program changes.
    await expect(requireLearningReadAccess(student.ctx,f.offeringId,f.deliveryId))
      .rejects.toMatchObject({code:"LEARNER_ENROLLMENT_SCOPE_REQUIRED"});
    expect((await listLearnerCourseDeliveries(student.ctx))
      .some(row=>row.deliveryId===f.deliveryId)).toBe(false);
    expect((await getLearnerClassSchedule(student.ctx)).events
      .some(row=>row.id===f.scheduleEventId)).toBe(false);

    // An idempotent join must NOT report this stale ACTIVE membership as valid.
    // Returning the old row before checking the current program is an auth leak.
    await expect(joinGroup(student.ctx,f.groupId,student.membershipId))
      .rejects.toMatchObject({code:"ELECTIVE_PRIMARY_SECTION_REQUIRED"});

    // Once the stale membership is removed, allocation back into this slot is
    // rejected by the same program-scoped eligibility rule.
    await leaveGroup(student.ctx,f.groupId,student.membershipId);
    await expect(joinGroup(student.ctx,f.groupId,student.membershipId))
      .rejects.toMatchObject({code:"ELECTIVE_PRIMARY_SECTION_REQUIRED"});
  });

  it("rejects a first elective join from a different program in the same college", async () => {
    const f=await setupRosterFixture();
    const student=await createHostSectionLearner(f);
    const p=randomUUID(), c=randomUUID(), s=randomUUID();
    f.crossProgramId=p; f.crossCohortId=c; f.crossSectionId=s;
    await pool.query(
      "INSERT INTO programs (id,department_id,name,code,duration_terms) VALUES ($1,$2,$3,$4,8)",
      [p,SEED_IDS.departmentA,label(),label()],
    );
    await pool.query(
      "INSERT INTO cohorts (id,program_id,name,code,start_period_id,status) VALUES ($1,$2,$3,$4,$5,'ACTIVE')",
      [c,p,label(),label(),f.periodId],
    );
    await pool.query(
      "INSERT INTO sections (id,cohort_id,academic_period_id,name,code) VALUES ($1,$2,$3,$4,$5)",
      [s,c,f.periodId,label(),label()],
    );
    // DB-005 immutable enrollment identity: retire old and create fresh
    // same-college program/section enrollment, preserving historical rows.
    f.transferredEnrollmentId=randomUUID();
    f.transferredSectionEnrollmentId=randomUUID();
    await pool.query("UPDATE section_enrollments SET status='MOVED',ended_at=now() WHERE id=$1",[f.otherSectionEnrollmentId]);
    await pool.query("UPDATE learner_program_enrollments SET status='WITHDRAWN',withdrawn_at=now() WHERE id=$1",[f.otherEnrollmentId]);
    await pool.query(
      "INSERT INTO learner_program_enrollments(id,membership_id,program_id,cohort_id) VALUES($1,$2,$3,$4)",
      [f.transferredEnrollmentId,student.membershipId,p,c]);
    await pool.query(
      "INSERT INTO section_enrollments(id,learner_enrollment_id,section_id,academic_period_id) VALUES($1,$2,$3,$4)",
      [f.transferredSectionEnrollmentId,f.transferredEnrollmentId,s,f.periodId]);
    // College and period still match. The pinned legacy service rejects on
    // program mismatch, even though old V167 commentary suggests otherwise.
    await expect(joinGroup(student.ctx,f.groupId,student.membershipId))
      .rejects.toMatchObject({code:"ELECTIVE_PRIMARY_SECTION_REQUIRED"});
    const events=await pool.query(
      "SELECT count(*)::integer AS n FROM lms_group_member_events WHERE group_id=$1",
      [f.groupId],
    );
    expect(events.rows[0].n).toBe(0);
    expect((await listLearnerCourseDeliveries(student.ctx))
      .some(row=>row.deliveryId===f.deliveryId)).toBe(false);
  });

  it("denies elective access after persisted user disable even when request context is stale", async () => {
    const fixture=await setupRosterFixture();
    const host=await createHostSectionLearner(fixture);
    await joinGroup(host.ctx,fixture.groupId,host.membershipId);
    expect((await listLearnerCourseDeliveries(host.ctx)).some(row=>row.deliveryId===fixture.deliveryId)).toBe(true);
    await pool.query("UPDATE users SET platform_status='DISABLED' WHERE id=$1",[host.ctx.user.id]);
    expect((await listLearnerCourseDeliveries(host.ctx)).some(row=>row.deliveryId===fixture.deliveryId)).toBe(false);
    await expect(requireLearningReadAccess(host.ctx,fixture.offeringId,fixture.deliveryId))
      .rejects.toMatchObject({code:"LEARNER_ENROLLMENT_SCOPE_REQUIRED"});
    // The learner schedule now re-checks the persisted user status and refuses a disabled user outright.
    await expect(getLearnerClassSchedule(host.ctx)).rejects.toMatchObject({name:"AuthorizationError"});
  });

  it("rejects elective joins without any active primary academic enrollment", async () => {
    const f = await setupRosterFixture();
    await expect(joinGroup(learner,f.groupId,learner.membership!.id))
      .rejects.toMatchObject({ code: "ELECTIVE_PRIMARY_SECTION_REQUIRED" });
  });

  it("rejects forged cross-college group membership in direct SQL", async () => {
    const f=await setupRosterFixture();
    await expect(pool.query(
      "INSERT INTO lms_group_members (group_id,membership_id,member_type,state,source) VALUES ($1,$2,'FACULTY','ACTIVE','MANUAL')",
      [f.groupId,SEED_IDS.facultyCollegeBMembership],
    )).rejects.toMatchObject({code:"23514"});
    const rows=await pool.query("SELECT count(*)::integer AS n FROM lms_group_members WHERE group_id=$1",[f.groupId]);
    expect(rows.rows[0].n).toBe(0);
  });

  it("rejects forged elective slot college and delivery course in privileged SQL", async () => {
    const f=await setupRosterFixture();
    await expect(pool.query(
      "UPDATE elective_slots SET college_id=$1 WHERE id=$2",
      [SEED_IDS.collegeB,f.slotId],
    )).rejects.toMatchObject({code:"23514"});
    const foreignCourseId=randomUUID();
    await pool.query(
      "INSERT INTO courses (id,department_id,name,code) VALUES ($1,$2,$3,$4)",
      [foreignCourseId,SEED_IDS.departmentB,label(),label()],
    );
    try {
      await expect(pool.query(
        "UPDATE elective_offerings SET course_id=$1 WHERE group_id=$2",
        [foreignCourseId,f.groupId],
      )).rejects.toMatchObject({code:"23514"});
      const row=await pool.query(
        "SELECT course_id FROM elective_offerings WHERE group_id=$1",[f.groupId],
      );
      expect(row.rows[0].course_id).toBe(f.courseId);
    } finally {
      await pool.query("DELETE FROM courses WHERE id=$1",[foreignCourseId]);
    }
  });

  it("does not allow joining an ELECTIVE group that has no active offering", async () => {
    const f = await setupRosterFixture();
    await pool.query("UPDATE elective_offerings SET status='ARCHIVED' WHERE group_id=$1",[f.groupId]);
    await expect(joinGroup(learner,f.groupId,learner.membership!.id))
      .rejects.toMatchObject({ code: "ELECTIVE_OFFERING_NOT_ACTIVE" });
  });
});
