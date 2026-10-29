import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { createGroup, joinGroup, leaveGroup, moveElectiveMember, transitionGroup } from "@/modules/groups/service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { createElectiveOffering, createElectiveSlot, listElectiveOfferings } from "@/modules/electives/service";
import { upsertGroupRule, refreshGroupRule } from "@/modules/groups/rules-service";

const url = process.env.TEST_DATABASE_URL;
if (!url || process.env.DB03_ISOLATED_TEST_DATABASE !== "1")
  throw new Error("DB03 requires TEST_DATABASE_URL AND DB03_ISOLATED_TEST_DATABASE=1; history cleanup uses TRUNCATE on an isolated disposable database");
const pool = new Pool({ connectionString: url, max: 5 });
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
const fixture = {
  groups: [] as string[], slots: [] as string[], courses: [] as string[], programs: [] as string[],
  users: [] as string[], memberships: [] as string[],
  periods: [] as string[], cohorts: [] as string[], sections: [] as string[],
  offerings: [] as string[], electiveOfferingIds: [] as string[], deliveries: [] as string[],
  groupBackedClasses: [] as string[],
  learnerEnrollments: [] as string[], learnerSections: [] as string[],
};

async function createActiveGroup(kind = "BUS", capacity = 1) {
  const group = await createGroup(admin, {
    collegeId: SEED_IDS.collegeA, kind, name: "DB03 " + randomUUID(),
    capacity, configJson: { allowSelfLeave: true, allowWaitlist: true },
    selfJoinOpenFrom: new Date(Date.now() - 60_000),
  });
  fixture.groups.push(group.id);
  await transitionGroup(admin, group.id, "ACTIVATE");
  return group.id;
}
async function createLearner(collegeId: string = SEED_IDS.collegeA): Promise<{ ctx: RequestContext; membershipId: string }> {
  const userId = randomUUID(), membershipId = randomUUID();
  fixture.users.push(userId);
  fixture.memberships.push(membershipId);
  await pool.query("INSERT INTO users (id, identity_uid, display_name) VALUES ($1,$2,'DB03 learner')",
    [userId, "db03-"+userId]);
  await pool.query("INSERT INTO college_memberships (id, user_id, college_id) VALUES ($1,$2,$3)",
    [membershipId,userId,collegeId]);
  await pool.query("INSERT INTO membership_roles (membership_id,role) VALUES ($1,'LEARNER')", [membershipId]);
  return { membershipId, ctx: {
    user: { id: userId, identityUid: "db03-"+userId, platformStatus: "ACTIVE", systemRoles: [] },
    membership: { id: membershipId, collegeId, organizationId: SEED_IDS.organization,
      status: "ACTIVE", roles: ["LEARNER"] },
  }};
}
async function createElectiveFixture() {
  const programId = randomUUID(), courseA = randomUUID(), courseB = randomUUID();
  const slotId = randomUUID(), periodId = randomUUID(), cohortId = randomUUID(), sectionId = randomUUID();
  fixture.programs.push(programId); fixture.courses.push(courseA, courseB);
  fixture.slots.push(slotId); fixture.periods.push(periodId);
  fixture.cohorts.push(cohortId); fixture.sections.push(sectionId);
  await pool.query(
    "INSERT INTO programs (id,department_id,name,code,duration_terms) VALUES ($1,$2,$3,$4,8)",
    [programId,SEED_IDS.departmentA,"DB03 Program "+programId,"DB03-"+programId]);
  await pool.query(
    "INSERT INTO academic_periods (id,college_id,name,code,start_date,end_date,status) VALUES ($1,$2,$3,$4,'2026-07-01','2026-12-31','ACTIVE')",
    [periodId,SEED_IDS.collegeA,"DB03 Period "+periodId,"DB03-"+periodId]);
  await pool.query(
    "INSERT INTO cohorts (id,program_id,name,code,start_period_id,status) VALUES ($1,$2,$3,$4,$5,'ACTIVE')",
    [cohortId,programId,"DB03 Cohort "+cohortId,"DB03-"+cohortId,periodId]);
  await pool.query(
    "INSERT INTO sections (id,cohort_id,academic_period_id,name,code) VALUES ($1,$2,$3,$4,$5)",
    [sectionId,cohortId,periodId,"DB03 Section "+sectionId,"DB03-"+sectionId]);
  for (const cid of [courseA,courseB]) await pool.query(
    "INSERT INTO courses (id,department_id,name,code) VALUES ($1,$2,$3,$4)",
    [cid,SEED_IDS.departmentA,"DB03 Course "+cid,"DB03-"+cid]);
  await pool.query(
    "INSERT INTO elective_slots (id,college_id,program_id,academic_period_id,semester_number,name,credits,min_pick,max_pick) VALUES ($1,$2,$3,$4,1,'DB03 Slot',3,1,1)",
    [slotId,SEED_IDS.collegeA,programId,periodId]);
  const groups = [await createActiveGroup("ELECTIVE"), await createActiveGroup("ELECTIVE")];
  for (let i=0;i<groups.length;i++) {
    const courseId = i===0?courseA:courseB;
    const offeringId = randomUUID(), deliveryId = randomUUID();
    fixture.offerings.push(offeringId); fixture.deliveries.push(deliveryId);
    await pool.query(
      "INSERT INTO course_offerings (id,course_id,cohort_id,academic_period_id,type,credits,display_order) VALUES ($1,$2,$3,$4,'ELECTIVE',3,$5)",
      [offeringId,courseId,cohortId,periodId,i]);
    await pool.query(
      "INSERT INTO course_section_deliveries (id,offering_id,section_id) VALUES ($1,$2,$3)",
      [deliveryId,offeringId,sectionId]);
    const elective = await pool.query<{id:string}>(
      "INSERT INTO elective_offerings (slot_id,course_id,group_id,backed_delivery_id) VALUES ($1,$2,$3,$4) RETURNING id",
      [slotId,courseId,groups[i],deliveryId]);
    fixture.electiveOfferingIds.push(elective.rows[0].id);
  }
  const candidate = await createLearner();
  const programEnrollmentId = randomUUID(), sectionEnrollmentId = randomUUID();
  fixture.learnerEnrollments.push(programEnrollmentId);
  fixture.learnerSections.push(sectionEnrollmentId);
  await pool.query(
    "INSERT INTO learner_program_enrollments (id,membership_id,program_id,cohort_id) VALUES ($1,$2,$3,$4)",
    [programEnrollmentId,candidate.membershipId,programId,cohortId]);
  await pool.query(
    "INSERT INTO section_enrollments (id,learner_enrollment_id,section_id,academic_period_id) VALUES ($1,$2,$3,$4)",
    [sectionEnrollmentId,programEnrollmentId,sectionId,periodId]);
  return { slotId, groups, candidate, programId, cohortId, sectionId, periodId };
}
beforeEach(() => {
  for(const value of Object.values(fixture)) value.length=0;
});
afterEach(async () => {
  const groupIds = fixture.groups;
  if(groupIds.length) {
    // UPDATE/DELETE are intentionally forbidden by the audit trigger.
    // TRUNCATE is permitted ONLY in this deliberately isolated disposable test DB.
    await pool.query("TRUNCATE TABLE lms_group_member_events");
    await pool.query("DELETE FROM lms_group_members WHERE group_id = ANY($1::uuid[])",[groupIds]);
    await pool.query("DELETE FROM lms_group_rules WHERE group_id = ANY($1::uuid[])",[groupIds]);
    await pool.query("DELETE FROM elective_offerings WHERE group_id = ANY($1::uuid[])",[groupIds]);
  }
  if(fixture.groupBackedClasses.length) await pool.query("DELETE FROM group_backed_class_offerings WHERE id = ANY($1::uuid[])",[fixture.groupBackedClasses]);
  if(fixture.slots.length) await pool.query("DELETE FROM elective_slots WHERE id = ANY($1::uuid[])",[fixture.slots]);
  if(fixture.learnerSections.length) await pool.query("DELETE FROM section_enrollments WHERE id = ANY($1::uuid[])",[fixture.learnerSections]);
  if(fixture.learnerEnrollments.length) await pool.query("DELETE FROM learner_program_enrollments WHERE id = ANY($1::uuid[])",[fixture.learnerEnrollments]);
  if(fixture.deliveries.length) await pool.query("DELETE FROM course_section_deliveries WHERE id = ANY($1::uuid[])",[fixture.deliveries]);
  if(fixture.offerings.length) await pool.query("DELETE FROM course_offerings WHERE id = ANY($1::uuid[])",[fixture.offerings]);
  if(fixture.sections.length) await pool.query("DELETE FROM sections WHERE id = ANY($1::uuid[])",[fixture.sections]);
  if(fixture.cohorts.length) await pool.query("DELETE FROM cohorts WHERE id = ANY($1::uuid[])",[fixture.cohorts]);
  if(fixture.periods.length) await pool.query("DELETE FROM academic_periods WHERE id = ANY($1::uuid[])",[fixture.periods]);
  if(groupIds.length) await pool.query("DELETE FROM lms_groups WHERE id = ANY($1::uuid[])",[groupIds]);
  if(fixture.courses.length) await pool.query("DELETE FROM courses WHERE id = ANY($1::uuid[])",[fixture.courses]);
  if(fixture.programs.length) {
    // DB-005 creates program_terms for synthetic programs; drop only test-owned
    // curriculum after its course offerings have been cleaned.
    await pool.query("DELETE FROM program_term_courses WHERE program_term_id IN (SELECT id FROM program_terms WHERE program_id = ANY($1::uuid[]))",[fixture.programs]);
    await pool.query("DELETE FROM program_terms WHERE program_id = ANY($1::uuid[])",[fixture.programs]);
    await pool.query("DELETE FROM programs WHERE id = ANY($1::uuid[])",[fixture.programs]);
  }
  if(fixture.memberships.length) {
    await pool.query("DELETE FROM membership_roles WHERE membership_id = ANY($1::uuid[])",[fixture.memberships]);
    await pool.query("DELETE FROM college_memberships WHERE id = ANY($1::uuid[])",[fixture.memberships]);
  }
  if(fixture.users.length) await pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])",[fixture.users]);
});
afterAll(async () => { await pool.end(); await closeDatabaseConnection(); });

describe("DB03 group kernel on disposable PostgreSQL", () => {
  it("serializes simultaneous choices from different offerings of the same max_pick=1 slot", async () => {
    const { groups, candidate } = await createElectiveFixture();
    const initialSections = await pool.query(
      "SELECT count(*)::integer AS n FROM section_enrollments se JOIN learner_program_enrollments e ON e.id=se.learner_enrollment_id WHERE e.membership_id=$1",
      [candidate.membershipId],
    );
    const results = await Promise.allSettled(groups.map(g=>joinGroup(candidate.ctx,g,candidate.membershipId)));
    expect(results.filter(r=>r.status==="fulfilled")).toHaveLength(1);
    const rejected = results.find(r=>r.status==="rejected");
    expect(rejected).toMatchObject({ status:"rejected",reason:{code:"ELECTIVE_MAX_PICK_REACHED"} });
    const active = await pool.query(
      "SELECT count(*)::integer AS n FROM lms_group_members WHERE group_id=ANY($1::uuid[]) AND state='ACTIVE'",
      [groups],
    );
    expect(active.rows[0].n).toBe(1);
    const afterSections = await pool.query(
      "SELECT count(*)::integer AS n FROM section_enrollments se JOIN learner_program_enrollments e ON e.id=se.learner_enrollment_id WHERE e.membership_id=$1",
      [candidate.membershipId],
    );
    expect(afterSections.rows[0].n).toBe(initialSections.rows[0].n);
  });
  it("rejects elective slot years that canonical progression cannot represent", async () => {
    const { programId, periodId } = await createElectiveFixture();
    for (const academicYear of ["1800-01", "9999-00", "2024-29"]) {
      await expect(createElectiveSlot(admin, {
        collegeId: SEED_IDS.collegeA, programId, academicPeriodId: periodId,
        semesterNumber: 1, academicYear, name: "Impossible elective year",
      })).rejects.toMatchObject({ code: "ELECTIVE_ACADEMIC_YEAR_INVALID" });
    }
  });

  it("resolves actual elective offering IDs independently from delivery course offering IDs", async () => {
    const { slotId } = await createElectiveFixture();
    expect(fixture.offerings).toHaveLength(2);
    expect(fixture.electiveOfferingIds).toHaveLength(2);
    expect(fixture.electiveOfferingIds[0]).not.toBe(fixture.offerings[0]);
    const rows = await pool.query<{ id:string; backed_delivery_id:string }>(
      "SELECT id,backed_delivery_id FROM elective_offerings WHERE slot_id=$1 ORDER BY backed_delivery_id",
      [slotId],
    );
    expect(new Set(rows.rows.map(row => row.id))).toEqual(new Set(fixture.electiveOfferingIds));
    expect(await listElectiveOfferings(admin,slotId))
      .toEqual(expect.arrayContaining(fixture.electiveOfferingIds.map(offeringId =>
        expect.objectContaining({ offeringId }))));
  });
  it("refuses an elective offering when the source course is disabled", async () => {
    const { slotId } = await createElectiveFixture();
    const unassignedGroup = await createActiveGroup("ELECTIVE", 10);
    await pool.query("UPDATE courses SET enabled=false WHERE id=$1", [fixture.courses[0]]);
    await expect(createElectiveOffering(admin, {
      slotId, courseId: fixture.courses[0], groupId: unassignedGroup,
      backedDeliveryId: fixture.deliveries[0], capacity: 10,
    })).rejects.toMatchObject({ code: "ELECTIVE_COURSE_COLLEGE_MISMATCH" });
    const offerings = await pool.query(
      "SELECT count(*)::integer AS n FROM elective_offerings WHERE group_id=$1",
      [unassignedGroup],
    );
    expect(offerings.rows[0].n).toBe(0);
  });

  it("rejects elective reassignment to disabled or deleted courses without mutating the offering or group", async () => {
    const { slotId, cohortId, sectionId, periodId, groups } = await createElectiveFixture();
    const offeringId = fixture.electiveOfferingIds[0];
    const targetCourseId = randomUUID(), targetOfferingId = randomUUID(), targetDeliveryId = randomUUID();
    fixture.courses.push(targetCourseId);
    fixture.offerings.push(targetOfferingId);
    fixture.deliveries.push(targetDeliveryId);
    await pool.query(
      "INSERT INTO courses (id,department_id,name,code) VALUES ($1,$2,$3,$4)",
      [targetCourseId,SEED_IDS.departmentA,"DB03 edit target "+targetCourseId,"DB03-"+targetCourseId]);
    await pool.query(
      "INSERT INTO course_offerings (id,course_id,cohort_id,academic_period_id,type,credits,display_order) VALUES ($1,$2,$3,$4,'ELECTIVE',3,50)",
      [targetOfferingId,targetCourseId,cohortId,periodId]);
    await pool.query(
      "INSERT INTO course_section_deliveries (id,offering_id,section_id) VALUES ($1,$2,$3)",
      [targetDeliveryId,targetOfferingId,sectionId]);

    const original = (await pool.query(
      "SELECT course_id,backed_delivery_id,capacity,version FROM elective_offerings WHERE id=$1",
      [offeringId])).rows[0];
    const originalGroup = (await pool.query(
      "SELECT capacity,version,active_count FROM lms_groups WHERE id=$1",
      [groups[0]])).rows[0];

    for (const state of ["disabled", "deleted"] as const) {
      await pool.query(
        state === "disabled"
          ? "UPDATE courses SET enabled=false,deleted_at=NULL WHERE id=$1"
          : "UPDATE courses SET enabled=true,deleted_at=now() WHERE id=$1",
        [targetCourseId]);
      await expect(updateCollegeElectiveOffering(admin,slotId,offeringId,{
        courseId:targetCourseId,backedDeliveryId:targetDeliveryId,
        capacity:5,expectedVersion:original.version,
      })).rejects.toMatchObject({code:"ELECTIVE_DELIVERY_MISMATCH"});
      const after = (await pool.query(
        "SELECT course_id,backed_delivery_id,capacity,version FROM elective_offerings WHERE id=$1",
        [offeringId])).rows[0];
      const afterGroup = (await pool.query(
        "SELECT capacity,version,active_count FROM lms_groups WHERE id=$1",
        [groups[0]])).rows[0];
      expect(after).toEqual(original);
      expect(afterGroup).toEqual(originalGroup);
    }

    await pool.query("UPDATE courses SET enabled=true,deleted_at=NULL WHERE id=$1", [targetCourseId]);
    const updated = await updateCollegeElectiveOffering(admin,slotId,offeringId,{
      courseId:original.course_id,backedDeliveryId:original.backed_delivery_id,
      capacity:5,expectedVersion:original.version,
    });
    expect(updated.capacity).toBe(5);
    expect(updated.version).toBe(original.version + 1);
  });

  it("rejects cross-period elective rebind that would orphan its group-backed class", async () => {
    const { slotId, cohortId, periodId, groups } = await createElectiveFixture();
    const backingId = randomUUID();
    fixture.groupBackedClasses.push(backingId);
    await pool.query(
      "INSERT INTO group_backed_class_offerings (id,academic_period_id,roster_group_id,name) VALUES ($1,$2,$3,'DB03 original backed class')",
      [backingId,periodId,groups[0]]);
    await pool.query(
      "UPDATE elective_offerings SET backed_class_offering_id=$1 WHERE id=$2",
      [backingId,fixture.electiveOfferingIds[0]]);
    const originalGroup = (await pool.query(
      "SELECT capacity,version FROM lms_groups WHERE id=$1", [groups[0]])).rows[0];
    // A period-agnostic elective slot can still have one fixed-period class identity.
    await pool.query("UPDATE elective_slots SET academic_period_id=NULL WHERE id=$1",[slotId]);
    const secondPeriod=randomUUID(), secondSection=randomUUID();
    const secondOffering=randomUUID(), secondDelivery=randomUUID();
    fixture.periods.push(secondPeriod);
    fixture.sections.push(secondSection);
    fixture.offerings.push(secondOffering);
    fixture.deliveries.push(secondDelivery);
    await pool.query(
      "INSERT INTO academic_periods (id,college_id,name,code,start_date,end_date,status) VALUES ($1,$2,$3,$4,'2027-01-01','2027-06-30','ACTIVE')",
      [secondPeriod,SEED_IDS.collegeA,"DB03 next period "+secondPeriod,"DB03-"+secondPeriod]);
    await pool.query(
      "INSERT INTO sections (id,cohort_id,academic_period_id,name,code) VALUES ($1,$2,$3,$4)",
      [secondSection,cohortId,secondPeriod,"DB03 next section "+secondSection,"DB03-"+secondSection]);
    await pool.query(
      "INSERT INTO course_offerings (id,course_id,cohort_id,academic_period_id,type,credits,display_order) VALUES ($1,$2,$3,$4,'ELECTIVE',3,51)",
      [secondOffering,fixture.courses[0],cohortId,secondPeriod]);
    await pool.query(
      "INSERT INTO course_section_deliveries (id,offering_id,section_id) VALUES ($1,$2,$3)",
      [secondDelivery,secondOffering,secondSection]);

    await expect(updateCollegeElectiveOffering(admin,slotId,fixture.electiveOfferingIds[0],{
      courseId:fixture.courses[0],backedDeliveryId:secondDelivery,
      capacity:3,expectedVersion:0,
    })).rejects.toMatchObject({code:"ELECTIVE_DELIVERY_MISMATCH"});
    const saved = (await pool.query(
      "SELECT backed_delivery_id,capacity,version,backed_class_offering_id FROM elective_offerings WHERE id=$1",
      [fixture.electiveOfferingIds[0]])).rows[0];
    expect(saved).toMatchObject({
      backed_delivery_id:fixture.deliveries[0],
      capacity:null,
      version:0,
      backed_class_offering_id:backingId,
    });
    const classAfter = (await pool.query(
      "SELECT academic_period_id,status FROM group_backed_class_offerings WHERE id=$1",
      [backingId])).rows[0];
    expect(classAfter).toMatchObject({academic_period_id:periodId,status:"ACTIVE"});
    const group = (await pool.query("SELECT capacity,version FROM lms_groups WHERE id=$1",
      [groups[0]])).rows[0];
    expect(group).toEqual(originalGroup);
  });

  it("rejects a new elective join after its backed class delivery ends", async () => {
    const { groups, candidate } = await createElectiveFixture();
    await pool.query(
      "UPDATE course_section_deliveries SET ended_at=now() WHERE id=$1",
      [fixture.deliveries[0]],
    );
    await expect(joinGroup(candidate.ctx, groups[0], candidate.membershipId))
      .rejects.toMatchObject({ code: "ELECTIVE_OFFERING_NOT_ACTIVE" });
    const roster = await pool.query(
      "SELECT id FROM lms_group_members WHERE group_id=$1 AND membership_id=$2",
      [groups[0], candidate.membershipId],
    );
    const group = await pool.query("SELECT active_count FROM lms_groups WHERE id=$1", [groups[0]]);
    expect(roster.rows).toHaveLength(0);
    expect(group.rows[0].active_count).toBe(0);
  });

  it("rolls back an elective transfer into an ended backed class", async () => {
    const { groups, candidate } = await createElectiveFixture();
    await joinGroup(candidate.ctx, groups[0], candidate.membershipId);
    await pool.query(
      "UPDATE course_section_deliveries SET ended_at=now() WHERE id=$1",
      [fixture.deliveries[1]],
    );
    await expect(moveElectiveMember(
      admin, fixture.electiveOfferingIds[0], fixture.electiveOfferingIds[1], candidate.membershipId,
    )).rejects.toMatchObject({ code: "ELECTIVE_MOVE_OFFERINGS_INVALID" });
    const states = await pool.query(
      "SELECT group_id,state FROM lms_group_members WHERE group_id=ANY($1::uuid[]) AND membership_id=$2",
      [groups, candidate.membershipId],
    );
    expect(states.rows).toHaveLength(1);
    expect(states.rows[0]).toMatchObject({ group_id: groups[0], state: "ACTIVE" });
    const counts = await pool.query(
      "SELECT id,active_count FROM lms_groups WHERE id=ANY($1::uuid[])", [groups],
    );
    expect(counts.rows.find(row=>row.id===groups[0]).active_count).toBe(1);
    expect(counts.rows.find(row=>row.id===groups[1]).active_count).toBe(0);
    const events = await pool.query(
      "SELECT count(*)::integer AS n FROM lms_group_member_events WHERE group_id=ANY($1::uuid[])",
      [groups],
    );
    expect(events.rows[0].n).toBe(1);
  });

  it("rejects electives from a stale cohort semester and mismatched known academic year", async () => {
    const { groups, candidate, slotId } = await createElectiveFixture();
    const progression = await pool.query<{ current_term_number:number; current_academic_year_start:number|null }>(
      "SELECT cps.current_term_number,cps.current_academic_year_start FROM cohort_progression_state cps JOIN learner_program_enrollments e ON e.cohort_id=cps.cohort_id WHERE e.membership_id=$1",
      [candidate.membershipId],
    );
    expect(progression.rows[0]?.current_term_number).toBe(1);
    expect(progression.rows[0]?.current_academic_year_start).not.toBeNull();

    // An academic period match must not substitute for semester eligibility.
    await pool.query("UPDATE elective_slots SET semester_number=2 WHERE id=$1", [slotId]);
    await expect(joinGroup(candidate.ctx, groups[0], candidate.membershipId))
      .rejects.toMatchObject({ code: "ELECTIVE_PRIMARY_SECTION_REQUIRED" });
    await pool.query("UPDATE elective_slots SET semester_number=1 WHERE id=$1", [slotId]);

    const cohortYear = Number(progression.rows[0].current_academic_year_start);
    const differentYear = cohortYear - 1;
    await pool.query("UPDATE elective_slots SET academic_year=$2 WHERE id=$1", [
      slotId, `${differentYear}-${String(differentYear + 1).slice(-2)}`,
    ]);
    await expect(joinGroup(candidate.ctx, groups[0], candidate.membershipId))
      .rejects.toMatchObject({ code: "ELECTIVE_PRIMARY_SECTION_REQUIRED" });

    // Legacy class eligibility does not reject on year when the slot year
    // is unknown. The semester and program must still match.
    await pool.query("UPDATE elective_slots SET academic_year=NULL WHERE id=$1", [slotId]);
    await expect(joinGroup(candidate.ctx, groups[0], candidate.membershipId))
      .resolves.toMatchObject({ state: "ACTIVE" });
  });

  it("allows an admin to rescue a learner from an ended source elective", async () => {
    const { groups, candidate } = await createElectiveFixture();
    await joinGroup(candidate.ctx, groups[0], candidate.membershipId);
    await pool.query("UPDATE course_section_deliveries SET ended_at=now() WHERE id=$1", [
      fixture.deliveries[0],
    ]);
    const moved = await moveElectiveMember(
      admin, fixture.electiveOfferingIds[0], fixture.electiveOfferingIds[1], candidate.membershipId,
    );
    expect(moved).toMatchObject({ state: "ACTIVE", groupId: groups[1] });
    const states = await pool.query(
      "SELECT group_id,state FROM lms_group_members WHERE group_id=ANY($1::uuid[]) AND membership_id=$2",
      [groups, candidate.membershipId],
    );
    expect(states.rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ group_id: groups[0], state: "REMOVED" }),
      expect.objectContaining({ group_id: groups[1], state: "ACTIVE" }),
    ]));
  });

  it("DB-006 direct concurrent SQL elective choices obey one slot max_pick", async () => {
    const {groups,candidate}=await createElectiveFixture();
    const attempts=await Promise.allSettled(groups.map(group=>pool.query(
      "INSERT INTO lms_group_members(group_id,membership_id,member_type,state,source) VALUES($1,$2,'LEARNER','ACTIVE','MANUAL')",
      [group,candidate.membershipId])));
    expect(attempts.filter(x=>x.status==="fulfilled")).toHaveLength(1);
    expect(attempts.find(x=>x.status==="rejected"))
      .toMatchObject({status:"rejected",reason:{code:"23514"}});
  });
  it("DB-006 rejects direct SQL admission for stale semester and year", async () => {
    const {groups,candidate,slotId}=await createElectiveFixture();
    const insert=()=>pool.query("INSERT INTO lms_group_members(group_id,membership_id,member_type,state,source) VALUES($1,$2,'LEARNER','ACTIVE','MANUAL')",
      [groups[0],candidate.membershipId]);
    await pool.query("UPDATE elective_slots SET semester_number=2 WHERE id=$1",[slotId]);
    await expect(insert()).rejects.toMatchObject({code:"23514"});
    await pool.query("UPDATE elective_slots SET semester_number=1 WHERE id=$1",[slotId]);
    const years=await pool.query("SELECT cp.current_academic_year_start AS y FROM cohort_progression_state cp JOIN learner_program_enrollments e ON e.cohort_id=cp.cohort_id WHERE e.membership_id=$1",[candidate.membershipId]);
    const y=Number(years.rows[0].y)-1;
    await pool.query("UPDATE elective_slots SET academic_year=$2 WHERE id=$1",
      [slotId,`${y}-${String(y+1).slice(-2)}`]);
    await expect(insert()).rejects.toMatchObject({code:"23514"});
    await pool.query("UPDATE elective_slots SET academic_year=NULL WHERE id=$1",[slotId]);
    await expect(insert()).resolves.toBeDefined();
  });
  it("DB-006 blocks direct structural cohort reparent with live elective", async () => {
    const {cohortId}=await createElectiveFixture();
    const other=randomUUID();fixture.programs.push(other);
    await pool.query("INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3,$4,8)",
      [other,SEED_IDS.departmentA,"DB006 program "+other,"DB006-"+other]);
    await expect(pool.query("UPDATE cohorts SET program_id=$1 WHERE id=$2",[other,cohortId]))
      .rejects.toMatchObject({code:"23514"});
  });
  it("DB-006 registered SQL guard rejects cross-program backed offerings", async () => {
    const {slotId,periodId}=await createElectiveFixture();
    const otherProgram=randomUUID(),otherCohort=randomUUID(),otherSection=randomUUID();
    const otherOffering=randomUUID(),otherDelivery=randomUUID();
    fixture.programs.push(otherProgram);
    fixture.cohorts.push(otherCohort);
    fixture.sections.push(otherSection);
    fixture.offerings.push(otherOffering);
    fixture.deliveries.push(otherDelivery);
    await pool.query(
      "INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3,$4,8)",
      [otherProgram,SEED_IDS.departmentA,"DB006 cross "+otherProgram,"DB006-"+otherProgram]);
    await pool.query(
      "INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES($1,$2,$3,$4,$5)",
      [otherCohort,otherProgram,"DB006 cohort "+otherCohort,"DB006-"+otherCohort,periodId]);
    await pool.query(
      "INSERT INTO sections(id,cohort_id,academic_period_id,name,code) VALUES($1,$2,$3,$4,$5)",
      [otherSection,otherCohort,periodId,"DB006 section "+otherSection,"DB006-"+otherSection]);
    await pool.query(
      "INSERT INTO course_offerings(id,course_id,cohort_id,academic_period_id,type,credits,display_order) VALUES($1,$2,$3,$4,'ELECTIVE',3,5)",
      [otherOffering,fixture.courses[1],otherCohort,periodId]);
    await pool.query(
      "INSERT INTO course_section_deliveries(id,offering_id,section_id) VALUES($1,$2,$3)",
      [otherDelivery,otherOffering,otherSection]);
    const target=await createActiveGroup("ELECTIVE",5);
    await expect(pool.query(
      "INSERT INTO elective_offerings(slot_id,course_id,group_id,backed_delivery_id) VALUES($1,$2,$3,$4)",
      [slotId,fixture.courses[1],target,otherDelivery]))
      .rejects.toMatchObject({code:"23514"});
    const rows=await pool.query(
      "SELECT count(*)::integer AS n FROM elective_offerings WHERE group_id=$1",[target]);
    expect(rows.rows[0].n).toBe(0);
  });

  it("moves an elective atomically between offerings of the same slot", async () => {
    const { groups, candidate } = await createElectiveFixture();
    const active = await joinGroup(candidate.ctx, groups[0], candidate.membershipId);
    expect(active.state).toBe("ACTIVE");
    const moved = await moveElectiveMember(
      admin, fixture.electiveOfferingIds[0], fixture.electiveOfferingIds[1], candidate.membershipId,
    );
    expect(moved.state).toBe("ACTIVE");
    const counts = await pool.query(
      "SELECT id,active_count FROM lms_groups WHERE id=ANY($1::uuid[])",
      [groups],
    );
    expect(counts.rows.find(r=>r.id===groups[0]).active_count).toBe(0);
    expect(counts.rows.find(r=>r.id===groups[1]).active_count).toBe(1);
    const memberStates = await pool.query(
      "SELECT group_id,state FROM lms_group_members WHERE group_id=ANY($1::uuid[]) AND membership_id=$2",
      [groups,candidate.membershipId],
    );
    expect(memberStates.rows.find(r=>r.group_id===groups[0]).state).toBe("REMOVED");
    expect(memberStates.rows.find(r=>r.group_id===groups[1]).state).toBe("ACTIVE");
    const events = await pool.query(
      "SELECT count(*)::integer AS n FROM lms_group_member_events WHERE group_id=ANY($1::uuid[])",
      [groups],
    );
    expect(events.rows[0].n).toBe(3);
  });

  it("rejects an admin elective move after the learner transfers to another program", async () => {
    const { groups, candidate, periodId } = await createElectiveFixture();
    await joinGroup(candidate.ctx, groups[0], candidate.membershipId);

    const enrollment = await pool.query(
      "SELECT id FROM learner_program_enrollments WHERE membership_id=$1 AND status='ACTIVE'",
      [candidate.membershipId],
    );
    expect(enrollment.rows).toHaveLength(1);
    const learnerEnrollmentId = enrollment.rows[0].id as string;

    const otherProgramId=randomUUID(), otherCohortId=randomUUID(), otherSectionId=randomUUID();
    fixture.programs.push(otherProgramId);
    fixture.cohorts.push(otherCohortId);
    fixture.sections.push(otherSectionId);
    await pool.query(
      "INSERT INTO programs (id,department_id,name,code,duration_terms) VALUES ($1,$2,$3,$4,8)",
      [otherProgramId,SEED_IDS.departmentA,"DB26 Transfer Program "+otherProgramId,"DB26-"+otherProgramId],
    );
    await pool.query(
      "INSERT INTO cohorts (id,program_id,name,code,start_period_id,status) VALUES ($1,$2,$3,$4,$5,'ACTIVE')",
      [otherCohortId,otherProgramId,"DB26 Transfer Cohort "+otherCohortId,"DB26-"+otherCohortId,periodId],
    );
    await pool.query(
      "INSERT INTO sections (id,cohort_id,academic_period_id,name,code) VALUES ($1,$2,$3,$4,$5)",
      [otherSectionId,otherCohortId,periodId,"DB26 Transfer Section "+otherSectionId,"DB26-"+otherSectionId],
    );
    // DB-005 makes program/cohort identity immutable. A transfer must close
    // the old enrollment and create a new identity; never rewrite its FK.
    const nextEnrollment=randomUUID(),nextSectionEnrollment=randomUUID();
    fixture.learnerEnrollments.push(nextEnrollment);
    fixture.learnerSections.push(nextSectionEnrollment);
    await pool.query(
      "UPDATE section_enrollments SET status='MOVED',ended_at=now() WHERE learner_enrollment_id=$1 AND status='ACTIVE'",
      [learnerEnrollmentId]);
    await pool.query(
      "UPDATE learner_program_enrollments SET status='WITHDRAWN',withdrawn_at=now() WHERE id=$1",
      [learnerEnrollmentId]);
    await pool.query(
      "INSERT INTO learner_program_enrollments(id,membership_id,program_id,cohort_id) VALUES($1,$2,$3,$4)",
      [nextEnrollment,candidate.membershipId,otherProgramId,otherCohortId]);
    await pool.query(
      "INSERT INTO section_enrollments(id,learner_enrollment_id,section_id,academic_period_id) VALUES($1,$2,$3,$4)",
      [nextSectionEnrollment,nextEnrollment,otherSectionId,periodId]);

    await expect(moveElectiveMember(
      admin,fixture.electiveOfferingIds[0],fixture.electiveOfferingIds[1],candidate.membershipId,
    )).rejects.toMatchObject({code:"ELECTIVE_PRIMARY_SECTION_REQUIRED"});

    const source = await pool.query(
      "SELECT state FROM lms_group_members WHERE group_id=$1 AND membership_id=$2",
      [groups[0],candidate.membershipId],
    );
    const target = await pool.query(
      "SELECT state FROM lms_group_members WHERE group_id=$1 AND membership_id=$2",
      [groups[1],candidate.membershipId],
    );
    const counts = await pool.query(
      "SELECT id,active_count FROM lms_groups WHERE id=ANY($1::uuid[])",
      [groups],
    );
    expect(source.rows[0]?.state).toBe("ACTIVE");
    expect(target.rows).toHaveLength(0);
    expect(counts.rows.find(row=>row.id===groups[0]).active_count).toBe(1);
    expect(counts.rows.find(row=>row.id===groups[1]).active_count).toBe(0);
  });

  it("allows an admin elective move into a locked removed target and preserves the lock", async () => {
    const { groups, candidate } = await createElectiveFixture();
    await joinGroup(admin,groups[1],candidate.membershipId,"MANUAL");
    await leaveGroup(admin,groups[1],candidate.membershipId,"MANUAL");
    await pool.query(
      "UPDATE lms_group_members SET is_locked=true WHERE group_id=$1 AND membership_id=$2",
      [groups[1],candidate.membershipId],
    );
    await joinGroup(admin,groups[0],candidate.membershipId,"MANUAL");
    const moved=await moveElectiveMember(
      admin,fixture.electiveOfferingIds[0],fixture.electiveOfferingIds[1],candidate.membershipId,
    );
    expect(moved.state).toBe("ACTIVE");
    const target=await pool.query(
      "SELECT state,is_locked FROM lms_group_members WHERE group_id=$1 AND membership_id=$2",
      [groups[1],candidate.membershipId],
    );
    expect(target.rows[0]).toMatchObject({state:"ACTIVE",is_locked:true});
  });

  it("uses the legacy waitlist=true default when an elective move targets a full group with empty config", async () => {
    const { groups, candidate, programId, cohortId, sectionId, periodId } =
      await createElectiveFixture();
    const other = await createLearner();
    const programEnrollmentId = randomUUID(), sectionEnrollmentId = randomUUID();
    fixture.learnerEnrollments.push(programEnrollmentId);
    fixture.learnerSections.push(sectionEnrollmentId);
    await pool.query(
      "INSERT INTO learner_program_enrollments (id,membership_id,program_id,cohort_id) VALUES ($1,$2,$3,$4)",
      [programEnrollmentId,other.membershipId,programId,cohortId]);
    await pool.query(
      "INSERT INTO section_enrollments (id,learner_enrollment_id,section_id,academic_period_id) VALUES ($1,$2,$3,$4)",
      [sectionEnrollmentId,programEnrollmentId,sectionId,periodId]);
    await pool.query("UPDATE lms_groups SET config_json='{}'::jsonb WHERE id=$1",[groups[1]]);
    await joinGroup(other.ctx,groups[1],other.membershipId);
    await joinGroup(candidate.ctx,groups[0],candidate.membershipId);
    const moved=await moveElectiveMember(
      admin,fixture.electiveOfferingIds[0],fixture.electiveOfferingIds[1],candidate.membershipId,
    );
    expect(moved.state).toBe("WAITLISTED");
    const source=await pool.query(
      "SELECT state FROM lms_group_members WHERE group_id=$1 AND membership_id=$2",
      [groups[0],candidate.membershipId],
    );
    expect(source.rows[0].state).toBe("REMOVED");
  });

  it("rolls back a move into a full target without changing source membership", async () => {
    const { groups, candidate, programId, cohortId, sectionId, periodId } =
      await createElectiveFixture();
    const other = await createLearner();
    const programEnrollmentId = randomUUID(), sectionEnrollmentId = randomUUID();
    fixture.learnerEnrollments.push(programEnrollmentId);
    fixture.learnerSections.push(sectionEnrollmentId);
    await pool.query(
      "INSERT INTO learner_program_enrollments (id,membership_id,program_id,cohort_id) VALUES ($1,$2,$3,$4)",
      [programEnrollmentId,other.membershipId,programId,cohortId]);
    await pool.query(
      "INSERT INTO section_enrollments (id,learner_enrollment_id,section_id,academic_period_id) VALUES ($1,$2,$3,$4)",
      [sectionEnrollmentId,programEnrollmentId,sectionId,periodId]);
    await pool.query(
      "UPDATE lms_groups SET config_json='{\"allowWaitlist\":false}'::jsonb WHERE id=$1",
      [groups[1]],
    );
    await joinGroup(other.ctx,groups[1],other.membershipId);
    await joinGroup(candidate.ctx,groups[0],candidate.membershipId);
    await expect(moveElectiveMember(
      admin,fixture.electiveOfferingIds[0],fixture.electiveOfferingIds[1],candidate.membershipId,
    )).rejects.toMatchObject({ code: "GROUP_CAPACITY_REACHED" });
    const membership = await pool.query(
      "SELECT state FROM lms_group_members WHERE group_id=$1 AND membership_id=$2",
      [groups[0],candidate.membershipId],
    );
    expect(membership.rows[0].state).toBe("ACTIVE");
    const events = await pool.query(
      "SELECT count(*)::integer AS n FROM lms_group_member_events WHERE membership_id=$1",
      [candidate.membershipId],
    );
    expect(events.rows[0].n).toBe(1);
  });

  it("hides soft-deleted ACTIVE offerings from the elective slot listing", async () => {
    const {slotId}=await createElectiveFixture();
    expect(await listElectiveOfferings(admin,slotId)).toHaveLength(2);
    await pool.query(
      "UPDATE elective_offerings SET deleted_at=now() WHERE id=$1",
      [fixture.electiveOfferingIds[0]],
    );
    const visible=await listElectiveOfferings(admin,slotId);
    expect(visible).toHaveLength(1);
    expect(visible[0].offeringId).toBe(fixture.electiveOfferingIds[1]);
  });

  it("rejects a backed elective delivery from another program in the same college", async () => {
    const { slotId, periodId } = await createElectiveFixture();
    const otherProgramId=randomUUID(), otherCohortId=randomUUID(), otherSectionId=randomUUID();
    const courseId=randomUUID(), offeringId=randomUUID(), deliveryId=randomUUID();
    fixture.programs.push(otherProgramId);
    fixture.cohorts.push(otherCohortId);
    fixture.sections.push(otherSectionId);
    fixture.courses.push(courseId);
    fixture.offerings.push(offeringId);
    fixture.deliveries.push(deliveryId);

    await pool.query(
      "INSERT INTO programs (id,department_id,name,code,duration_terms) VALUES ($1,$2,$3,$4,8)",
      [otherProgramId,SEED_IDS.departmentA,"DB26 Program "+otherProgramId,"DB26-"+otherProgramId],
    );
    await pool.query(
      "INSERT INTO cohorts (id,program_id,name,code,start_period_id,status) VALUES ($1,$2,$3,$4,$5,'ACTIVE')",
      [otherCohortId,otherProgramId,"DB26 Cohort "+otherCohortId,"DB26-"+otherCohortId,periodId],
    );
    await pool.query(
      "INSERT INTO sections (id,cohort_id,academic_period_id,name,code) VALUES ($1,$2,$3,$4,$5)",
      [otherSectionId,otherCohortId,periodId,"DB26 Section "+otherSectionId,"DB26-"+otherSectionId],
    );
    await pool.query(
      "INSERT INTO courses (id,department_id,name,code) VALUES ($1,$2,$3,$4)",
      [courseId,SEED_IDS.departmentA,"DB26 Course "+courseId,"DB26-"+courseId],
    );
    await pool.query(
      "INSERT INTO course_offerings (id,course_id,cohort_id,academic_period_id,type,credits,display_order) VALUES ($1,$2,$3,$4,'ELECTIVE',3,9)",
      [offeringId,courseId,otherCohortId,periodId],
    );
    await pool.query(
      "INSERT INTO course_section_deliveries (id,offering_id,section_id) VALUES ($1,$2,$3)",
      [deliveryId,offeringId,otherSectionId],
    );

    const groupId=await createActiveGroup("ELECTIVE",10);
    await expect(createElectiveOffering(admin,{
      slotId,courseId,groupId,backedDeliveryId:deliveryId,capacity:30,
    })).rejects.toMatchObject({code:"ELECTIVE_DELIVERY_MISMATCH"});

    const rows=await pool.query(
      "SELECT count(*)::integer AS n FROM elective_offerings WHERE group_id=$1",
      [groupId],
    );
    expect(rows.rows[0].n).toBe(0);
  });

  it("normalizes the elective academic year and enforces source slot bounds", async () => {
    const { programId, periodId } = await createElectiveFixture();
    const values = {
      collegeId: SEED_IDS.collegeA, programId, academicPeriodId: periodId,
      semesterNumber: 8, name: "DB03 slot validation",
      credits: 0, minPick: 0, maxPick: 1,
    };
    const made = await createElectiveSlot(admin, { ...values, academicYear: "2026" });
    fixture.slots.push(made.id);
    expect(made.academicYear).toBe("2026-27");
    expect(made.credits).toBe(0);
    await expect(createElectiveSlot(admin, { ...values, semesterNumber: 9 }))
      .rejects.toMatchObject({code:"ELECTIVE_SEMESTER_OUTSIDE_PROGRAM"});
    await expect(createElectiveSlot(admin, { ...values, academicYear: "2026-29" }))
      .rejects.toMatchObject({code:"ELECTIVE_ACADEMIC_YEAR_INVALID"});
  });

  it("preserves legacy true defaults for waitlisting and self-leave when config flags are absent", async () => {
    const group = await createGroup(admin, {
      collegeId: SEED_IDS.collegeA, kind: "BUS", name: "DB03 default config " + randomUUID(),
      capacity: 1, selfJoinOpenFrom: new Date(Date.now() - 60_000),
    });
    fixture.groups.push(group.id);
    await transitionGroup(admin, group.id, "ACTIVATE");
    const second = await createLearner();
    const active = await joinGroup(learner, group.id, SEED_IDS.learnerCollegeAMembership);
    const waiting = await joinGroup(second.ctx, group.id, second.membershipId);
    expect(active.state).toBe("ACTIVE");
    expect(waiting.state).toBe("WAITLISTED");
    await leaveGroup(learner, group.id, SEED_IDS.learnerCollegeAMembership);
    const promoted = await pool.query(
      "SELECT state FROM lms_group_members WHERE group_id=$1 AND membership_id=$2",
      [group.id, second.membershipId],
    );
    expect(promoted.rows[0].state).toBe("ACTIVE");
    const left = await leaveGroup(second.ctx, group.id, second.membershipId);
    expect(left.state).toBe("REMOVED");
  });

  it("keeps seat-count, waitlist and immutable event trail consistent under leave and promotion", async () => {
    const group = await createActiveGroup();
    const second = await createLearner();
    const active = await joinGroup(learner,group,SEED_IDS.learnerCollegeAMembership);
    const waiting = await joinGroup(second.ctx,group,second.membershipId);
    expect(active.state).toBe("ACTIVE");
    expect(waiting.state).toBe("WAITLISTED");
    const removed = await leaveGroup(learner,group,SEED_IDS.learnerCollegeAMembership);
    expect(removed.state).toBe("REMOVED");
    const [current,events] = await Promise.all([
      pool.query("SELECT active_count FROM lms_groups WHERE id=$1",[group]),
      pool.query("SELECT from_state,to_state,actor_type,actor_user_id FROM lms_group_member_events WHERE group_id=$1 ORDER BY created_at",[group]),
    ]);
    expect(current.rows[0].active_count).toBe(1);
    expect(events.rows).toHaveLength(4);
    expect(events.rows.some(e=>e.from_state==="WAITLISTED" && e.to_state==="ACTIVE")).toBe(true);
    expect(events.rows.find(e=>e.from_state==="WAITLISTED" && e.to_state==="ACTIVE"))
      .toMatchObject({actor_type:"SYSTEM",actor_user_id:null});
    const promoted = await pool.query("SELECT state,waitlist_position FROM lms_group_members WHERE id=$1",[waiting.id]);
    expect(promoted.rows[0]).toMatchObject({state:"ACTIVE",waitlist_position:null});
  });
  it("blocks MANUAL group enrollments of DISABLED users at service and SQL boundaries", async () => {
    const group=await createActiveGroup("BUS",2);
    const disabled=await createLearner();
    await pool.query("UPDATE users SET platform_status='DISABLED' WHERE id=$1",[disabled.ctx.user.id]);
    await expect(joinGroup(admin,group,disabled.membershipId,"MANUAL"))
      .rejects.toMatchObject({code:"GROUP_MEMBER_INACTIVE"});
    await expect(pool.query(
      "INSERT INTO lms_group_members (group_id,membership_id,state,source) VALUES ($1,$2,'ACTIVE','MANUAL')",
      [group,disabled.membershipId],
    )).rejects.toMatchObject({code:"23514"});
    const result=await pool.query(
      "SELECT count(*)::integer AS n FROM lms_group_members WHERE group_id=$1",[group],
    );
    expect(result.rows[0].n).toBe(0);
  });
  it("rejects a valid foreign college learner membership on a college group", async () => {
    const group=await createActiveGroup();
    const outsider=await createLearner(SEED_IDS.collegeB);
    await expect(joinGroup(admin,group,outsider.membershipId,"MANUAL"))
      .rejects.toMatchObject({code:"GROUP_MEMBER_COLLEGE_MISMATCH"});
    const events=await pool.query("SELECT count(*)::integer AS n FROM lms_group_member_events WHERE group_id=$1",[group]);
    expect(events.rows[0].n).toBe(0);
  });
  it("skips disabled waitlisted accounts and promotes the next eligible learner", async () => {
    const group = await createActiveGroup("BUS",1);
    const disabled = await createLearner(), eligible = await createLearner();
    await joinGroup(learner,group,SEED_IDS.learnerCollegeAMembership);
    await joinGroup(disabled.ctx,group,disabled.membershipId);
    await joinGroup(eligible.ctx,group,eligible.membershipId);
    await pool.query("UPDATE users SET platform_status='DISABLED' WHERE id=$1", [disabled.ctx.user.id]);
    await leaveGroup(learner,group,SEED_IDS.learnerCollegeAMembership);
    const members = await pool.query("SELECT membership_id,state FROM lms_group_members WHERE group_id=$1", [group]);
    expect(members.rows.find(r=>r.membership_id===disabled.membershipId)?.state).toBe("WAITLISTED");
    expect(members.rows.find(r=>r.membership_id===eligible.membershipId)?.state).toBe("ACTIVE");
  });
  it("blocks self rejoin but allows explicit admin re-add while preserving the lock", async () => {
    const group=await createActiveGroup();
    await joinGroup(learner,group,SEED_IDS.learnerCollegeAMembership);
    await leaveGroup(admin,group,SEED_IDS.learnerCollegeAMembership,"MANUAL");
    await pool.query("UPDATE lms_group_members SET is_locked=true WHERE group_id=$1",[group]);
    await expect(joinGroup(learner,group,SEED_IDS.learnerCollegeAMembership))
      .rejects.toMatchObject({code:"GROUP_MEMBERSHIP_LOCKED"});
    const restored=await joinGroup(admin,group,SEED_IDS.learnerCollegeAMembership,"MANUAL");
    expect(restored.state).toBe("ACTIVE");
    const row=await pool.query(
      "SELECT is_locked FROM lms_group_members WHERE group_id=$1 AND membership_id=$2",
      [group,SEED_IDS.learnerCollegeAMembership],
    );
    expect(row.rows[0].is_locked).toBe(true);
  });
  it("persists creator role and immutable member type snapshots in the database", async () => {
    const group=await createActiveGroup("BUS",1);
    const rows=await pool.query("SELECT created_by_type FROM lms_groups WHERE id=$1",[group]);
    expect(rows.rows[0].created_by_type).toBe("COLLEGE_ADMIN");
    await joinGroup(learner,group,SEED_IDS.learnerCollegeAMembership);
    const events=await pool.query(
      "SELECT member_type,actor_type,actor_user_id FROM lms_group_member_events WHERE group_id=$1",[group],
    );
    expect(events.rows).toHaveLength(1);
    expect(events.rows[0]).toMatchObject({
      member_type:"LEARNER", actor_type:"LEARNER", actor_user_id:SEED_IDS.learnerUser,
    });
  });
  it("blocks mutating append-only event history at the database boundary", async () => {
    const group=await createActiveGroup();
    await joinGroup(learner,group,SEED_IDS.learnerCollegeAMembership);
    await expect(pool.query("DELETE FROM lms_group_member_events WHERE group_id=$1",[group]))
      .rejects.toMatchObject({code:"23514"});
    await expect(pool.query("UPDATE lms_group_member_events SET reason='tampered' WHERE group_id=$1",[group]))
      .rejects.toMatchObject({code:"23514"});
  });
  it("refuses privileged SQL mutation of group owner or feature kind", async () => {
    const group=await createActiveGroup("BUS",1);
    await expect(pool.query("UPDATE lms_groups SET kind='ELECTIVE' WHERE id=$1",[group]))
      .rejects.toMatchObject({code:"23514"});
    await expect(pool.query("UPDATE lms_groups SET college_id=$1 WHERE id=$2",
      [SEED_IDS.collegeB,group])).rejects.toMatchObject({code:"23514"});
  });
  it("rejects impossible capacity counters by a physical CHECK constraint", async () => {
    const group=await createActiveGroup("BUS",1);
    await expect(pool.query("UPDATE lms_groups SET active_count=2 WHERE id=$1",[group]))
      .rejects.toMatchObject({code:"23514"});
  });
});

describe("DB03 bounded group rule refresh (PostgreSQL)", () => {
  it("does not materialize rule enrollments for a DRAFT group", async () => {
    const draft = await createGroup(admin,{
      collegeId:SEED_IDS.collegeA,kind:"BUS",
      name:"DB03 draft rule "+randomUUID(),capacity:1,
    });
    fixture.groups.push(draft.id);
    const {programId}=await createElectiveFixture();
    await upsertGroupRule(admin,draft.id,{
      criteria:{allowedProgramIds:[programId]},autoRefresh:false,
    });
    await expect(refreshGroupRule(admin,draft.id))
      .rejects.toMatchObject({code:"GROUP_RULE_GROUP_NOT_ACTIVE"});
    const [rows]=await Promise.all([
      pool.query("SELECT count(*)::integer AS n FROM lms_group_members WHERE group_id=$1",[draft.id]),
    ]);
    expect(rows.rows[0].n).toBe(0);
  });

  it("uses the legacy waitlist=true default for rule-refresh overflow with empty config", async () => {
    const data=await createElectiveFixture();
    const another=await createLearner();
    const enrollment=randomUUID();fixture.learnerEnrollments.push(enrollment);
    await pool.query("INSERT INTO learner_program_enrollments(id,membership_id,program_id,cohort_id) VALUES($1,$2,$3,$4)",
      [enrollment,another.membershipId,data.programId,data.cohortId]);
    const group=await createGroup(admin,{
      collegeId:SEED_IDS.collegeA,kind:"BUS",name:"DB006 default waitlist "+randomUUID(),
      capacity:1,configJson:{},
    });
    fixture.groups.push(group.id);
    await transitionGroup(admin,group.id,"ACTIVATE");
    await upsertGroupRule(admin,group.id,{
      criteria:{allowedProgramIds:[data.programId]},autoRefresh:false,
    });
    const result=await refreshGroupRule(admin,group.id);
    expect(result).toMatchObject({matched:2,active:1,added:2,waitlisted:1,skippedCapacity:0});
    const states=await pool.query(
      "SELECT state,count(*)::integer AS n FROM lms_group_members WHERE group_id=$1 GROUP BY state",
      [group.id]);
    expect(states.rows.find(row=>row.state==="ACTIVE")?.n).toBe(1);
    expect(states.rows.find(row=>row.state==="WAITLISTED")?.n).toBe(1);
    expect(await refreshGroupRule(admin,group.id))
      .toMatchObject({matched:2,active:1,added:0,waitlisted:0});
  });

  it("rejects rule-refresh overflow only when allowWaitlist is explicitly false", async () => {
    const data=await createElectiveFixture();
    const another=await createLearner();
    const enrollment=randomUUID();fixture.learnerEnrollments.push(enrollment);
    await pool.query("INSERT INTO learner_program_enrollments(id,membership_id,program_id,cohort_id) VALUES($1,$2,$3,$4)",
      [enrollment,another.membershipId,data.programId,data.cohortId]);
    const group=await createGroup(admin,{
      collegeId:SEED_IDS.collegeA,kind:"BUS",name:"DB006 closed waitlist "+randomUUID(),
      capacity:1,configJson:{allowWaitlist:false},
    });
    fixture.groups.push(group.id);
    await transitionGroup(admin,group.id,"ACTIVATE");
    await upsertGroupRule(admin,group.id,{
      criteria:{allowedProgramIds:[data.programId]},autoRefresh:false,
    });
    expect(await refreshGroupRule(admin,group.id))
      .toMatchObject({matched:2,active:1,added:1,waitlisted:0,skippedCapacity:1});
    const count=await pool.query("SELECT count(*)::integer AS n FROM lms_group_members WHERE group_id=$1",
      [group.id]);
    expect(count.rows[0].n).toBe(1);
  });

  it("promotes an existing eligible RULE waitlist when a stale active rule member exits", async () => {
    const data=await createElectiveFixture();
    const second=await createLearner();
    const secondEnrollmentId=randomUUID();
    fixture.learnerEnrollments.push(secondEnrollmentId);
    await pool.query(
      "INSERT INTO learner_program_enrollments (id,membership_id,program_id,cohort_id) VALUES ($1,$2,$3,$4)",
      [secondEnrollmentId,second.membershipId,data.programId,data.cohortId],
    );
    const group=await createActiveGroup("BUS",1);
    await upsertGroupRule(admin,group,{
      criteria:{allowedProgramIds:[data.programId]},autoRefresh:false,
    });
    const first=await refreshGroupRule(admin,group);
    expect(first).toMatchObject({matched:2,added:2,active:1,waitlisted:1});
    const members=await pool.query(
      "SELECT membership_id,state FROM lms_group_members WHERE group_id=$1",
      [group],
    );
    const active=members.rows.find(row=>row.state==="ACTIVE");
    const waiting=members.rows.find(row=>row.state==="WAITLISTED");
    expect(active).toBeDefined();
    expect(waiting).toBeDefined();

    await pool.query(
      "UPDATE learner_program_enrollments SET status='WITHDRAWN', withdrawn_at=now() WHERE membership_id=$1 AND program_id=$2",
      [active.membership_id,data.programId],
    );
    const refreshed=await refreshGroupRule(admin,group);
    expect(refreshed).toMatchObject({matched:1,removed:1,promoted:1,active:1,added:0});
    const promotedRow=await pool.query(
      "SELECT state,waitlist_position FROM lms_group_members WHERE group_id=$1 AND membership_id=$2",
      [group,waiting.membership_id],
    );
    expect(promotedRow.rows[0]).toMatchObject({state:"ACTIVE",waitlist_position:null});
    const promotion=await pool.query(
      "SELECT count(*)::integer AS n FROM lms_group_member_events WHERE group_id=$1 AND reason='RULE_REFRESH_WAITLIST_PROMOTION'",
      [group],
    );
    expect(promotion.rows[0].n).toBe(1);
    expect(await refreshGroupRule(admin,group))
      .toMatchObject({matched:1,active:1,added:0,removed:0,promoted:0});
  });

  it("is idempotent, protects MANUAL and locked decisions, and reconciles active_count", async () => {
    const data=await createElectiveFixture();
    const group=await createActiveGroup("BUS",2);
    await upsertGroupRule(admin,group,{
      criteria:{allowedProgramIds:[data.programId]},autoRefresh:false,
    });
    const first=await refreshGroupRule(admin,group);
    expect(first).toMatchObject({matched:1,added:1,active:1,removed:0});
    const second=await refreshGroupRule(admin,group);
    expect(second).toMatchObject({matched:1,added:0,removed:0,active:1});
    const initialEvents=await pool.query(
      "SELECT count(*)::integer AS n FROM lms_group_member_events WHERE group_id=$1",[group],
    );
    expect(initialEvents.rows[0].n).toBe(1);

    // Human MANUAL membership must not be overwritten by rerunning a rule.
    await joinGroup(admin,group,SEED_IDS.learnerCollegeAMembership,"MANUAL");
    const [{rows:[ruleRow]}]=await Promise.all([pool.query(
      "SELECT id FROM lms_group_members WHERE group_id=$1 AND membership_id=$2",
      [group,data.candidate.membershipId],
    )]);
    await pool.query("UPDATE lms_group_members SET is_locked=true WHERE id=$1",[ruleRow.id]);
    await upsertGroupRule(admin,group,{
      criteria:{allowedProgramIds:[data.programId],minCgpa:9.9},autoRefresh:false,
    });
    const locked=await refreshGroupRule(admin,group);
    expect(locked).toMatchObject({matched:0,removed:0,active:2});
    await pool.query("UPDATE lms_group_members SET is_locked=false WHERE id=$1",[ruleRow.id]);
    const removed=await refreshGroupRule(admin,group);
    expect(removed).toMatchObject({matched:0,removed:1,active:1});
    const [members,groupCounter]=await Promise.all([
      pool.query("SELECT membership_id,state,source FROM lms_group_members WHERE group_id=$1",[group]),
      pool.query("SELECT active_count FROM lms_groups WHERE id=$1",[group]),
    ]);
    expect(members.rows.find(row=>row.membership_id===data.candidate.membershipId))
      .toMatchObject({state:"REMOVED",source:"RULE"});
    expect(members.rows.find(row=>row.membership_id===SEED_IDS.learnerCollegeAMembership))
      .toMatchObject({state:"ACTIVE",source:"MANUAL"});
    expect(groupCounter.rows[0].active_count).toBe(1);
    const third=await refreshGroupRule(admin,group);
    expect(third).toMatchObject({added:0,removed:0,active:1});
  });
});
