import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { createGroup, joinGroup, leaveGroup, transitionGroup } from "@/modules/groups/service";
import { SEED_IDS } from "../../scripts/db-seed-data";

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
async function createLearner(collegeId = SEED_IDS.collegeA): Promise<{ ctx: RequestContext; membershipId: string }> {
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
  const programId = randomUUID(), courseA = randomUUID(), courseB = randomUUID(), slotId = randomUUID();
  fixture.programs.push(programId); fixture.courses.push(courseA, courseB); fixture.slots.push(slotId);
  await pool.query("INSERT INTO programs (id, department_id, name, code, duration_terms) VALUES ($1,$2,$3,$4,8)",
    [programId,SEED_IDS.departmentA,"DB03 Program "+programId,"DB03-"+programId]);
  for (const cid of [courseA,courseB]) await pool.query(
    "INSERT INTO courses (id, department_id, name, code) VALUES ($1,$2,$3,$4)",
    [cid,SEED_IDS.departmentA,"DB03 Course "+cid,"DB03-"+cid],
  );
  await pool.query(
    "INSERT INTO elective_slots (id,college_id,program_id,semester_number,name,credits,min_pick,max_pick) VALUES ($1,$2,$3,1,'DB03 Slot',3,1,1)",
    [slotId,SEED_IDS.collegeA,programId],
  );
  const groups = [await createActiveGroup("ELECTIVE"), await createActiveGroup("ELECTIVE")];
  for (let i=0;i<groups.length;i++) await pool.query(
    "INSERT INTO elective_offerings (slot_id,course_id,group_id) VALUES ($1,$2,$3)",
    [slotId, i===0?courseA:courseB, groups[i]],
  );
  return { slotId, groups };
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
  if(fixture.slots.length) await pool.query("DELETE FROM elective_slots WHERE id = ANY($1::uuid[])",[fixture.slots]);
  if(groupIds.length) await pool.query("DELETE FROM lms_groups WHERE id = ANY($1::uuid[])",[groupIds]);
  if(fixture.courses.length) await pool.query("DELETE FROM courses WHERE id = ANY($1::uuid[])",[fixture.courses]);
  if(fixture.programs.length) await pool.query("DELETE FROM programs WHERE id = ANY($1::uuid[])",[fixture.programs]);
  if(fixture.memberships.length) {
    await pool.query("DELETE FROM membership_roles WHERE membership_id = ANY($1::uuid[])",[fixture.memberships]);
    await pool.query("DELETE FROM college_memberships WHERE id = ANY($1::uuid[])",[fixture.memberships]);
  }
  if(fixture.users.length) await pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])",[fixture.users]);
});
afterAll(async () => { await pool.end(); await closeDatabaseConnection(); });

describe("DB03 group kernel on disposable PostgreSQL", () => {
  it("serializes simultaneous choices from different offerings of the same max_pick=1 slot", async () => {
    const { groups } = await createElectiveFixture();
    const initialSections = await pool.query(
      "SELECT count(*)::integer AS n FROM section_enrollments se JOIN learner_program_enrollments e ON e.id=se.learner_enrollment_id WHERE e.membership_id=$1",
      [SEED_IDS.learnerCollegeAMembership],
    );
    const results = await Promise.allSettled(groups.map(g=>joinGroup(learner,g,SEED_IDS.learnerCollegeAMembership)));
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
      [SEED_IDS.learnerCollegeAMembership],
    );
    expect(afterSections.rows[0].n).toBe(initialSections.rows[0].n);
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
  it("rejects a valid foreign college learner membership on a college group", async () => {
    const group=await createActiveGroup();
    const outsider=await createLearner(SEED_IDS.collegeB);
    await expect(joinGroup(admin,group,outsider.membershipId,"MANUAL"))
      .rejects.toMatchObject({code:"GROUP_MEMBER_COLLEGE_MISMATCH"});
    const events=await pool.query("SELECT count(*)::integer AS n FROM lms_group_member_events WHERE group_id=$1",[group]);
    expect(events.rows[0].n).toBe(0);
  });
  it("rejects an admin-locked removed member rejoining through self-service", async () => {
    const group=await createActiveGroup();
    await joinGroup(learner,group,SEED_IDS.learnerCollegeAMembership);
    await leaveGroup(admin,group,SEED_IDS.learnerCollegeAMembership,"MANUAL");
    await pool.query("UPDATE lms_group_members SET is_locked=true WHERE group_id=$1",[group]);
    await expect(joinGroup(learner,group,SEED_IDS.learnerCollegeAMembership))
      .rejects.toMatchObject({code:"GROUP_MEMBERSHIP_LOCKED"});
  });
  it("blocks mutating append-only event history at the database boundary", async () => {
    const group=await createActiveGroup();
    await joinGroup(learner,group,SEED_IDS.learnerCollegeAMembership);
    await expect(pool.query("DELETE FROM lms_group_member_events WHERE group_id=$1",[group]))
      .rejects.toMatchObject({code:"23514"});
    await expect(pool.query("UPDATE lms_group_member_events SET reason='tampered' WHERE group_id=$1",[group]))
      .rejects.toMatchObject({code:"23514"});
  });
  it("rejects impossible capacity counters by a physical CHECK constraint", async () => {
    const group=await createActiveGroup("BUS",1);
    await expect(pool.query("UPDATE lms_groups SET active_count=2 WHERE id=$1",[group]))
      .rejects.toMatchObject({code:"23514"});
  });
});
