import { randomUUID } from "node:crypto";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import { createGroup, joinGroup, leaveGroup } from "@/modules/groups/service";
import { listLearnerCourseDeliveries } from "@/modules/courses/learner-course-service";
import { requireLearningReadAccess } from "@/modules/courses/learning-access";
import type { RequestContext } from "@/modules/identity/context";
import { SEED_IDS } from "../../scripts/db-seed-data";

const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DB03 roster integration tests require TEST_DATABASE_URL");
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
  groupId: string; otherUserId?: string; otherMembershipId?: string;
  otherEnrollmentId?: string; otherSectionEnrollmentId?: string;
};
const fixtures: Fixture[] = [];
const label = () => "DB03-R-" + randomUUID();

async function setupRosterFixture() {
  const programId = randomUUID(), periodId = randomUUID(), cohortId = randomUUID();
  const sectionId = randomUUID(), courseId = randomUUID(), offeringId = randomUUID();
  const deliveryId = randomUUID(), slotId = randomUUID();
  const group = await createGroup(admin, {
    collegeId: SEED_IDS.collegeA,
    kind: "ELECTIVE", name: label(), capacity: 10,
    selfJoinOpenFrom: new Date(Date.now() - 60_000),
    configJson: { allowSelfLeave: true, allowWaitlist: false },
  });
  const fixture: Fixture = { programId, periodId, cohortId, sectionId,
    courseId, offeringId, deliveryId, slotId, groupId: group.id };
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
    await pool.query("DELETE FROM lms_group_member_events WHERE group_id=$1",[f.groupId]);
    await pool.query("DELETE FROM lms_group_members WHERE group_id=$1",[f.groupId]);
    await pool.query("DELETE FROM elective_offerings WHERE group_id=$1",[f.groupId]);
    await pool.query("DELETE FROM elective_slots WHERE id=$1",[f.slotId]);
    if(f.otherSectionEnrollmentId) await pool.query("DELETE FROM section_enrollments WHERE id=$1",[f.otherSectionEnrollmentId]);
    if(f.otherEnrollmentId) await pool.query("DELETE FROM learner_program_enrollments WHERE id=$1",[f.otherEnrollmentId]);
    await pool.query("DELETE FROM course_section_deliveries WHERE id=$1",[f.deliveryId]);
    await pool.query("DELETE FROM course_offerings WHERE id=$1",[f.offeringId]);
    await pool.query("DELETE FROM courses WHERE id=$1",[f.courseId]);
    await pool.query("DELETE FROM sections WHERE id=$1",[f.sectionId]);
    await pool.query("DELETE FROM cohorts WHERE id=$1",[f.cohortId]);
    await pool.query("DELETE FROM academic_periods WHERE id=$1",[f.periodId]);
    await pool.query("DELETE FROM programs WHERE id=$1",[f.programId]);
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
    const before = await pool.query(
      "SELECT count(*)::integer AS n FROM section_enrollments se JOIN learner_program_enrollments pe ON pe.id=se.learner_enrollment_id WHERE pe.membership_id=$1",
      [learner.membership!.id],
    );
    await joinGroup(learner,f.groupId,learner.membership!.id);
    const listed = await listLearnerCourseDeliveries(learner);
    expect(listed.some(row=>row.deliveryId===f.deliveryId)).toBe(true);
    await expect(requireLearningReadAccess(learner,f.offeringId,f.deliveryId)).resolves.toBe("LEARNER");
    const after = await pool.query(
      "SELECT count(*)::integer AS n FROM section_enrollments se JOIN learner_program_enrollments pe ON pe.id=se.learner_enrollment_id WHERE pe.membership_id=$1",
      [learner.membership!.id],
    );
    expect(after.rows[0].n).toBe(before.rows[0].n);
  });

  it("does not grant host-section members an elective they have not joined", async () => {
    const f = await setupRosterFixture();
    const host = await createHostSectionLearner(f);
    const listed = await listLearnerCourseDeliveries(host.ctx);
    expect(listed.some(row=>row.deliveryId===f.deliveryId)).toBe(false);
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

  it("denies archived elective offerings rather than silently using host-section membership", async () => {
    const f = await setupRosterFixture();
    const host = await createHostSectionLearner(f);
    await joinGroup(host.ctx,f.groupId,host.membershipId);
    await pool.query("UPDATE elective_offerings SET status='ARCHIVED' WHERE group_id=$1",[f.groupId]);
    await expect(requireLearningReadAccess(host.ctx,f.offeringId,f.deliveryId))
      .rejects.toMatchObject({ code: "LEARNER_ENROLLMENT_SCOPE_REQUIRED" });
    expect((await listLearnerCourseDeliveries(host.ctx)).some(row=>row.deliveryId===f.deliveryId)).toBe(false);
  });

  it("does not allow joining an ELECTIVE group that has no active offering", async () => {
    const f = await setupRosterFixture();
    await pool.query("UPDATE elective_offerings SET status='ARCHIVED' WHERE group_id=$1",[f.groupId]);
    await expect(joinGroup(learner,f.groupId,learner.membership!.id))
      .rejects.toMatchObject({ code: "ELECTIVE_OFFERING_NOT_ACTIVE" });
  });
});
