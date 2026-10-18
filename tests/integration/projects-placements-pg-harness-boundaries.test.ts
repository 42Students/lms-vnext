import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Pool } from "pg";
import {
  createFinalSubmission, createMeeting, createPrincipal, createSiblingCollege, createProjectFixture,
  createPlacementCandidateFixture, createPlacementFixture,
  createTaskSubmission, createTenant, newHarnessPool, submitFinalSubmission,
  withProjectPg, withTwoPgSessions, type PgHarness,
} from "./support/projects-placements-pg-harness";

/**
 * PROJ-HARNESS-22..26: real migrated PostgreSQL witnesses.
 * Every fixture uses the same rollback-only transaction and never commits
 * learner data. These checks guard the fixture API; HTTP IDOR is tested by
 * its owning service lane independently.
 */
let pool: Pool;
beforeAll(() => { pool = newHarnessPool(); });
afterAll(async () => { if (pool) await pool.end(); });

async function actors(db: PgHarness) {
  const own = await createTenant(db, "Harness tenant one");
  const foreign = await createTenant(db, "Harness tenant two");
  const author = await createPrincipal(db, own, ["COLLEGE_ADMIN"]);
  const mentor = await createPrincipal(db, own, ["MENTOR"]);
  const learner = await createPrincipal(db, own, ["LEARNER"]);
  const outsider = await createPrincipal(db, foreign, ["LEARNER"]);
  const foreignAuthor = await createPrincipal(db, foreign, ["COLLEGE_ADMIN"]);
  const notRosted = await createPrincipal(db, own, ["LEARNER"]);
  const project = await createProjectFixture(db, own, author, mentor, learner);
  return {own, foreign, author, mentor, learner, outsider, foreignAuthor, notRosted, project};
}
async function count(db: PgHarness, table: "project_task_submissions" | "project_submissions" | "project_meetings") {
  const rows = await db.query<{n:number}>(`select count(*)::int as n from ${table}`);
  return rows[0]!.n;
}

describe("PROJ-HARNESS role/tenancy and concurrent PostgreSQL fixture boundaries", () => {
  it("PROJ-HARNESS-22 foreign college and unrostered learner cannot create task submissions", async () => {
    await withProjectPg(pool, async db => {
      const f = await actors(db);
      const before = await count(db, "project_task_submissions");
      await expect(createTaskSubmission(db, f.project, f.outsider)).rejects.toThrow(/active member/);
      await expect(createTaskSubmission(db, f.project, f.notRosted)).rejects.toThrow(/active member/);
      await expect(createTaskSubmission(db, f.project, f.mentor)).rejects.toThrow(/learner membership/);
      expect(await count(db, "project_task_submissions")).toBe(before);
      const id = await createTaskSubmission(db, f.project, f.learner);
      expect(await db.query("select id from project_task_submissions where id=$1", [id])).toHaveLength(1);
    });
  });

  it("PROJ-HARNESS-TENANCY-17 sibling college in the same org never inherits project or placement rights",async()=>{
    await withProjectPg(pool,async db=>{
      const own=await createTenant(db,"IIT Dharwad");
      const sibling=await createSiblingCollege(db,own,"Other campus in same group");
      expect(sibling.organizationId).toBe(own.organizationId);
      expect(sibling.collegeId).not.toBe(own.collegeId);
      const admin=await createPrincipal(db,own,["COLLEGE_ADMIN"]);
      const mentor=await createPrincipal(db,own,["MENTOR"]);
      const learner=await createPrincipal(db,own,["LEARNER"]);
      const siblingAdmin=await createPrincipal(db,sibling,["COLLEGE_ADMIN"]);
      const siblingLearner=await createPrincipal(db,sibling,["LEARNER"]);
      const project=await createProjectFixture(db,own,admin,mentor,learner);
      const drive=await createPlacementFixture(db,own,admin);
      await expect(createTaskSubmission(db,project,siblingLearner)).rejects.toThrow(/active member/);
      await expect(createFinalSubmission(db,project,siblingLearner)).rejects.toThrow(/active member/);
      await expect(createMeeting(db,project,learner,siblingAdmin)).rejects.toThrow(/wrong college/);
      await expect(createPlacementCandidateFixture(db,drive,siblingLearner,admin))
        .rejects.toThrow(/different colleges|share a college/);
      await expect(createPlacementFixture(db,own,siblingAdmin)).rejects.toThrow(/wrong college/);
      expect(await db.query("select id from project_task_submissions")).toHaveLength(0);
      expect(await db.query("select id from placement_applications")).toHaveLength(0);
      expect(await db.query<{id:string}>(
        "select id from project_instances where college_id=$1",[sibling.collegeId])).toHaveLength(0);
    });
  });

  it("PROJ-HARNESS-23 wrong learner cannot create OR submit a final delivery for another project", async () => {
    await withProjectPg(pool, async db => {
      const f = await actors(db);
      const before = await count(db, "project_submissions");
      await expect(createFinalSubmission(db, f.project, f.outsider)).rejects.toThrow(/active member/);
      await expect(createFinalSubmission(db, f.project, f.notRosted)).rejects.toThrow(/active member/);
      expect(await count(db, "project_submissions")).toBe(before);
      const id = await createFinalSubmission(db, f.project, f.learner);
      await expect(submitFinalSubmission(db, id, f.outsider)).rejects.toThrow(/active member/);
      await expect(submitFinalSubmission(db, id, f.notRosted)).rejects.toThrow(/active member/);
      expect((await db.query<{status:string}>(
        "select status from project_submissions where id=$1", [id]))[0]?.status).toBe("DRAFT");
      await submitFinalSubmission(db, id, f.learner);
      expect((await db.query<{status:string}>(
        "select status from project_submissions where id=$1", [id]))[0]?.status).toBe("SUBMITTED");
      await expect(submitFinalSubmission(db, id, f.learner)).rejects.toThrow(/expected one draft/);
    });
  });

  it("PROJ-HARNESS-24 meetings require an active project learner and a same-college author", async () => {
    await withProjectPg(pool, async db => {
      const f = await actors(db);
      const before = await count(db, "project_meetings");
      await expect(createMeeting(db, f.project, f.outsider, f.author)).rejects.toThrow(/active member/);
      await expect(createMeeting(db, f.project, f.learner, f.foreignAuthor)).rejects.toThrow(/wrong college/);
      expect(await count(db, "project_meetings")).toBe(before);
      const meeting = await createMeeting(db, f.project, f.learner, f.author);
      expect(await db.query("select id from project_meetings where id=$1", [meeting])).toHaveLength(1);
    });
  });

  it("PROJ-HARNESS-25 suspended membership cannot submit from a stale tab", async () => {
    await withProjectPg(pool, async db => {
      const f = await actors(db);
      await db.query("update college_memberships set status='SUSPENDED' where id=$1", [f.learner.membershipId]);
      await expect(createTaskSubmission(db, f.project, f.learner)).rejects.toThrow(/active member/);
      await expect(createFinalSubmission(db, f.project, f.learner)).rejects.toThrow(/active member/);
      expect(await count(db, "project_submissions")).toBe(0);
      expect(await count(db, "project_task_submissions")).toBe(0);
    });
  });

  it("PROJ-HARNESS-27 ended or read-only project roster grants no fixture write access", async () => {
    await withProjectPg(pool, async db => {
      const f = await actors(db);
      await db.query(
        "update project_members set ended_at=now() where project_id=$1 and membership_id=$2",
        [f.project.projectId, f.learner.membershipId]);
      await expect(createFinalSubmission(db, f.project, f.learner)).rejects.toThrow(/active member/);
      await expect(createTaskSubmission(db, f.project, f.learner)).rejects.toThrow(/active member/);
      expect(await count(db, "project_submissions")).toBe(0);
    });
    await withProjectPg(pool, async db => {
      const f = await actors(db);
      await db.query(
        "update project_members set can_mutate=false where project_id=$1 and membership_id=$2",
        [f.project.projectId, f.learner.membershipId]);
      await expect(createFinalSubmission(db, f.project, f.learner)).rejects.toThrow(/active member/);
      await expect(createMeeting(db, f.project, f.learner, f.author)).rejects.toThrow(/active member/);
      expect(await count(db, "project_meetings")).toBe(0);
    });
  });

  it("PROJ-HARNESS-28 a deactivated user and deactivated meeting author fail closed", async () => {
    await withProjectPg(pool, async db => {
      const f = await actors(db);
      await db.query("update users set platform_status='DISABLED' where id=$1", [f.learner.userId]);
      await expect(createTaskSubmission(db, f.project, f.learner)).rejects.toThrow(/active member/);
      await expect(createFinalSubmission(db, f.project, f.learner)).rejects.toThrow(/active member/);
      expect(await count(db, "project_submissions")).toBe(0);
    });
    await withProjectPg(pool, async db => {
      const f = await actors(db);
      await db.query("update users set platform_status='DISABLED' where id=$1", [f.author.userId]);
      await expect(createMeeting(db, f.project, f.learner, f.author)).rejects.toThrow(/wrong college/);
      expect(await count(db, "project_meetings")).toBe(0);
    });
  });

  it("PROJ-HARNESS-33 role spoofing in Project fixture constructor fails before templates are inserted",async()=>{
    await withProjectPg(pool,async db=>{
      const tenant=await createTenant(db,"Wrong-role college");
      const wrongAuthor=await createPrincipal(db,tenant,["LEARNER"]);
      const mentor=await createPrincipal(db,tenant,["MENTOR"]);
      const learner=await createPrincipal(db,tenant,["LEARNER"]);
      await expect(createProjectFixture(db,tenant,wrongAuthor,mentor,learner))
        .rejects.toThrow(/actor role/);
      const templates=await db.query<{n:number}>("select count(*)::int as n from project_templates");
      expect(templates[0]!.n).toBe(0);
    });
  });

  it("PROJ-HARNESS-34 suspended or disabled author cannot create a Projects graph",async()=>{
    await withProjectPg(pool,async db=>{
      const tenant=await createTenant(db,"Suspended author");
      const admin=await createPrincipal(db,tenant,["COLLEGE_ADMIN"]);
      const mentor=await createPrincipal(db,tenant,["MENTOR"]);
      const learner=await createPrincipal(db,tenant,["LEARNER"]);
      await db.query("update college_memberships set status='SUSPENDED' where id=$1",[admin.membershipId]);
      await expect(createProjectFixture(db,tenant,admin,mentor,learner))
        .rejects.toThrow(/not an active member/);
      await db.query("update college_memberships set status='ACTIVE' where id=$1",[admin.membershipId]);
      await db.query("update users set platform_status='DISABLED' where id=$1",[admin.userId]);
      await expect(createProjectFixture(db,tenant,admin,mentor,learner))
        .rejects.toThrow(/not an active member/);
      expect(await db.query("select id from project_instances")).toHaveLength(0);
    });
  });

  it("PROJ-HARNESS-35 placements fixture rejects learner-only and suspended TPO initiators",async()=>{
    await withProjectPg(pool,async db=>{
      const tenant=await createTenant(db,"Placement actor");
      const learner=await createPrincipal(db,tenant,["LEARNER"]);
      await expect(createPlacementFixture(db,tenant,learner))
        .rejects.toThrow(/actor role/);
      const tpo=await createPrincipal(db,tenant,["TPO"]);
      await db.query("update college_memberships set status='SUSPENDED' where id=$1",[tpo.membershipId]);
      await expect(createPlacementFixture(db,tenant,tpo))
        .rejects.toThrow(/not an active member/);
      expect(await db.query("select id from placement_companies")).toHaveLength(0);
    });
  });

  it("PROJ-HARNESS-36 an active learner from same college cannot impersonate meeting coordinator",async()=>{
    await withProjectPg(pool,async db=>{
      const f=await actors(db);
      const otherLearner=await createPrincipal(db,f.own,["LEARNER"]);
      const before=await count(db,"project_meetings");
      await expect(createMeeting(db,f.project,f.learner,otherLearner))
        .rejects.toThrow(/actor role/);
      expect(await count(db,"project_meetings")).toBe(before);
      await expect(createMeeting(db,f.project,f.learner,f.author)).resolves.toBeTruthy();
      expect(await count(db,"project_meetings")).toBe(before+1);
    });
  });

  it("PROJ-HARNESS-38 archived organizations and colleges revoke all new fixture writes", async () => {
    await withProjectPg(pool, async db => {
      const f = await actors(db);
      await db.query("update organizations set status='ARCHIVED' where id=$1", [f.own.organizationId]);
      await expect(createTaskSubmission(db,f.project,f.learner)).rejects.toThrow(/active member/);
      await expect(createMeeting(db,f.project,f.learner,f.author)).rejects.toThrow(/active member|wrong college/);
      await expect(createPlacementFixture(db,f.own,f.author)).rejects.toThrow(/active member/);
      expect(await count(db,"project_task_submissions")).toBe(0);
      expect(await count(db,"project_meetings")).toBe(0);
      await db.query("update organizations set status='ACTIVE' where id=$1", [f.own.organizationId]);
      await db.query("update colleges set status='ARCHIVED' where id=$1", [f.own.collegeId]);
      await expect(createFinalSubmission(db,f.project,f.learner)).rejects.toThrow(/active member/);
      await expect(createPlacementFixture(db,f.own,f.author)).rejects.toThrow(/active member/);
      expect(await count(db,"project_submissions")).toBe(0);
      await db.query("update colleges set status='ACTIVE' where id=$1", [f.own.collegeId]);
      await expect(createTaskSubmission(db,f.project,f.learner)).resolves.toBeTruthy();
    });
  });

  it("PROJ-HARNESS-39 revoked learner role denies writes even while project roster remains active", async () => {
    await withProjectPg(pool, async db => {
      const f = await actors(db);
      await db.query("delete from membership_roles where membership_id=$1 and role='LEARNER'",
        [f.learner.membershipId]);
      await expect(createTaskSubmission(db,f.project,f.learner)).rejects.toThrow(/active member/);
      await expect(createFinalSubmission(db,f.project,f.learner)).rejects.toThrow(/active member/);
      await expect(createMeeting(db,f.project,f.learner,f.author)).rejects.toThrow(/active member/);
      expect(await count(db,"project_task_submissions")).toBe(0);
      expect(await count(db,"project_submissions")).toBe(0);
      expect(await count(db,"project_meetings")).toBe(0);
    });
  });

  it("PROJ-HARNESS-40 two same-college workspaces cannot mix task and project IDs", async () => {
    await withProjectPg(pool, async db => {
      const f = await actors(db);
      const second = await createProjectFixture(db,f.own,f.author,f.mentor,f.learner);
      const before = await count(db,"project_task_submissions");
      await expect(createTaskSubmission(db,{...f.project,taskId:second.taskId},f.learner))
        .rejects.toThrow(/task does not belong to this project/);
      expect(await count(db,"project_task_submissions")).toBe(before);
      const id = await createTaskSubmission(db,f.project,f.learner);
      const rows = await db.query<{project_id:string; task_id:string}>(
        "select project_id,task_id from project_task_submissions where id=$1",[id]);
      expect(rows).toEqual([{project_id:f.project.projectId,task_id:f.project.taskId}]);
    });
  });

  it("PROJ-HARNESS-41 only an active project mentor or college admin can coordinate meetings", async () => {
    await withProjectPg(pool,async db=>{
      const f=await actors(db);
      const outsideMentor=await createPrincipal(db,f.own,["MENTOR"]);
      await expect(createMeeting(db,f.project,f.learner,outsideMentor))
        .rejects.toThrow(/mentor is not active on this project/);
      const allowed = await createMeeting(db,f.project,f.learner,f.mentor);
      expect(await db.query("select id from project_meetings where id=$1",[allowed]))
        .toHaveLength(1);
      await db.query("update project_members set can_mutate=false where project_id=$1 and membership_id=$2",
        [f.project.projectId,f.mentor.membershipId]);
      await expect(createMeeting(db,f.project,f.learner,f.mentor))
        .rejects.toThrow(/mentor is not active on this project/);
      expect(await count(db,"project_meetings")).toBe(1);
      await expect(createMeeting(db,f.project,f.learner,f.author)).resolves.toBeTruthy();
      expect(await count(db,"project_meetings")).toBe(2);
    });
  });

  it("PROJ-HARNESS-42 another active project learner can submit the team's final draft", async () => {
    await withProjectPg(pool,async db=>{
      const f=await actors(db);
      const teammate=await createPrincipal(db,f.own,["LEARNER"]);
      await db.query(`
        insert into project_members (project_id,membership_id,role,created_by_user_id)
        values ($1,$2,'LEARNER',$3)`,[f.project.projectId,teammate.membershipId,f.author.userId]);
      const draftId=await createFinalSubmission(db,f.project,f.learner);
      await expect(submitFinalSubmission(db,draftId,f.outsider))
        .rejects.toThrow(/active member/);
      await submitFinalSubmission(db,draftId,teammate);
      const rows=await db.query<{status:string;created_by_membership_id:string;submitted_by_membership_id:string}>(`
        select status,created_by_membership_id,submitted_by_membership_id
        from project_submissions where id=$1`,[draftId]);
      expect(rows).toMatchObject([{
        status:"SUBMITTED",created_by_membership_id:f.learner.membershipId,
        submitted_by_membership_id:teammate.membershipId,
      }]);
      await expect(submitFinalSubmission(db,draftId,f.learner)).rejects.toThrow(/expected one draft/);
    });
  });

  it("PROJ-HARNESS-43 archived/completed projects cannot accept drafts or final submission transitions", async () => {
    await withProjectPg(pool,async db=>{
      const f=await actors(db);
      const draft=await createFinalSubmission(db,f.project,f.learner);
      await db.query("update project_instances set status='ARCHIVED' where id=$1",
        [f.project.projectId]);
      await expect(createFinalSubmission(db,f.project,f.learner))
        .rejects.toThrow(/final delivery is closed/);
      await expect(submitFinalSubmission(db,draft,f.learner))
        .rejects.toThrow(/final delivery is closed/);
      await db.query("update project_instances set status='COMPLETED' where id=$1",
        [f.project.projectId]);
      await expect(submitFinalSubmission(db,draft,f.learner))
        .rejects.toThrow(/final delivery is closed/);
      const rows=await db.query<{status:string}>(
        "select status from project_submissions where id=$1",[draft]);
      expect(rows).toEqual([{status:"DRAFT"}]);
      await db.query("update project_instances set status='ACTIVE' where id=$1",
        [f.project.projectId]);
      await submitFinalSubmission(db,draft,f.learner);
      expect((await db.query<{status:string}>(
        "select status from project_submissions where id=$1",[draft]))[0]?.status).toBe("SUBMITTED");
    });
  });

  it("PROJ-HARNESS-48 PLANNED project writes match the live task, submission and meeting service contract", async () => {
    await withProjectPg(pool, async db => {
      const f=await actors(db);
      await db.query("update project_instances set status='PLANNED' where id=$1",
        [f.project.projectId]);
      const draft=await createFinalSubmission(db,f.project,f.learner);
      await expect(createTaskSubmission(db,f.project,f.learner)).resolves.toBeTruthy();
      await expect(createMeeting(db,f.project,f.learner,f.author)).resolves.toBeTruthy();
      await submitFinalSubmission(db,draft,f.learner);
      expect(await count(db,"project_task_submissions")).toBe(1);
      expect(await count(db,"project_meetings")).toBe(1);
      expect((await db.query<{status:string}>(
        "select status from project_submissions where id=$1",[draft]))[0]?.status).toBe("SUBMITTED");
      // COMPLETED/ARCHIVED are still denied in PROJ-HARNESS-43/46.
    });
  });

  it("PROJ-HARNESS-46 archived/completed projects reject task submissions and meetings", async () => {
    await withProjectPg(pool,async db=>{
      const f=await actors(db);
      for(const terminalStatus of ["ARCHIVED","COMPLETED"] as const) {
        await db.query("update project_instances set status=$2 where id=$1",
          [f.project.projectId,terminalStatus]);
        await expect(createTaskSubmission(db,f.project,f.learner))
          .rejects.toThrow(/project task submissions is closed/);
        await expect(createMeeting(db,f.project,f.learner,f.author))
          .rejects.toThrow(/project meetings is closed/);
        expect(await count(db,"project_task_submissions")).toBe(0);
        expect(await count(db,"project_meetings")).toBe(0);
      }
      await db.query("update project_instances set status='ACTIVE' where id=$1",
        [f.project.projectId]);
      await expect(createTaskSubmission(db,f.project,f.learner)).resolves.toBeTruthy();
      await expect(createMeeting(db,f.project,f.learner,f.author)).resolves.toBeTruthy();
    });
  });

  it("PROJ-HARNESS-47 task submissions need the assigned learner and an active sprint", async () => {
    await withProjectPg(pool, async db => {
      const f=await actors(db);
      const teammate=await createPrincipal(db,f.own,["LEARNER"]);
      await db.query(`
        insert into project_members(project_id,membership_id,role,created_by_user_id)
        values ($1,$2,'LEARNER',$3)`,[f.project.projectId,teammate.membershipId,f.author.userId]);
      await expect(createTaskSubmission(db,f.project,teammate))
        .rejects.toThrow(/task assignee is not the submitting learner/);
      await db.query("update project_sprints set status='COMPLETED' where id=$1",
        [f.project.sprintId]);
      await expect(createTaskSubmission(db,f.project,f.learner))
        .rejects.toThrow(/task sprint or task state/);
      await db.query("update project_sprints set status='ACTIVE' where id=$1",
        [f.project.sprintId]);
      await db.query("update project_tasks set status='IN_REVIEW' where id=$1",
        [f.project.taskId]);
      await expect(createTaskSubmission(db,f.project,f.learner))
        .rejects.toThrow(/task sprint or task state/);
      await db.query("update project_tasks set status='TODO' where id=$1",
        [f.project.taskId]);
      await expect(createTaskSubmission(db,f.project,f.learner)).resolves.toBeTruthy();
      expect(await count(db,"project_task_submissions")).toBe(1);
    });
  });

  it("PROJ-HARNESS-26 independent sessions contend for the same transaction advisory lock", async () => {
    const key = BigInt("0x" + randomUUID().replaceAll("-", "").slice(0, 15)).toString();
    await withTwoPgSessions(pool, async (first, second) => {
      await first.query("SAVEPOINT harness_lock_boundary");
      await first.query("select pg_advisory_xact_lock($1::bigint)", [key]);
      const blocked = await second.query<{available:boolean}>(
        "select pg_try_advisory_xact_lock($1::bigint) as available", [key]);
      expect(blocked.rows[0]?.available).toBe(false);
      await first.query("ROLLBACK TO SAVEPOINT harness_lock_boundary");
      const unlocked = await second.query<{available:boolean}>(
        "select pg_try_advisory_xact_lock($1::bigint) as available", [key]);
      expect(unlocked.rows[0]?.available).toBe(true);
    });
  });
});
