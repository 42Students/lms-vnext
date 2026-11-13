import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { ZodError } from "zod";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { ProjectsServiceError } from "@/modules/projects/errors";
import { listMyProjectInstances, listProjectMembers } from "@/modules/projects/member-service";
import { getMentorMeetingNotes } from "@/modules/projects/mentor-meeting-notes-service";
import { listProjectFiles } from "@/modules/projects/project-resource-file-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import { contextFor, deletePerson, insertPerson as insertActor, person, seededCollegeAdmin, type Person, type TestRole } from "../support/actors";

/**
 * Project workspaces and mentor material: object-level access between people of the SAME college.
 *
 * Two projects run in one college. Project 1 has mentor 1 and learners 1 and 2; project 2 has mentor 2 and learner 3. A person
 * reaches only the project they belong to: the member list, the team files and a mentor's private meeting notes of project 1
 * are closed to everyone on project 2, to faculty and TPO without a project role, and to another college's administrator. A
 * refusal must be an access error, never a validation error or a crash.
 */
if (!process.env.TEST_DATABASE_URL || process.env.DB03_ISOLATED_TEST_DATABASE !== "1") {
  throw new Error("sec-cross-user-projects needs TEST_DATABASE_URL and DB03_ISOLATED_TEST_DATABASE=1 (disposable database)");
}
assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 });

const college = SEED_IDS.collegeA;
const l1 = person();
const l2 = person();
const l3 = person();
const m1 = person();
const m2 = person();
const faculty = person();
const tpoP = person();
const people = [l1, l2, l3, m1, m2, faculty, tpoP];

const template = randomUUID();
const version = randomUUID();
const project1 = randomUUID();
const project2 = randomUUID();
const meeting1 = randomUUID();

const as = (p: Person, role: TestRole, collegeId: string = college): RequestContext => contextFor(p, role, collegeId, "sec-prj");
const insertPerson = (p: Person, role: string, name: string) => insertActor(pool, p, role, name, college, "sec-prj");
const learner1 = as(l1, "LEARNER");
const learner2 = as(l2, "LEARNER");
const learner3 = as(l3, "LEARNER");
const mentor1 = as(m1, "MENTOR");
const mentor2 = as(m2, "MENTOR");
const facultyCtx = as(faculty, "FACULTY");
const tpoCtx = as(tpoP, "TPO");
const admin = seededCollegeAdmin();
const otherCollegeAdmin = as(person(), "COLLEGE_ADMIN", SEED_IDS.collegeB);

/** Refused by an access rule: never a validation error, never a crash. */
async function refused(call: Promise<unknown>, who: string) {
  let error: unknown = null;
  try {
    await call;
  } catch (caught) {
    error = caught;
  }
  expect(error, who + " must be refused").not.toBeNull();
  expect(error instanceof ZodError, who + " was refused for invalid input, not for access").toBe(false);
  expect(error instanceof AuthorizationError || error instanceof ProjectsServiceError || (error as Error)?.name === "StorageFileError", who + ": " + String(error)).toBe(true);
}

describe("project workspaces: nobody can reach another team's project", () => {
  beforeAll(async () => {
    const q = pool.query.bind(pool);
    await insertPerson(l1, "LEARNER", "SEC-PRJ Learner 1");
    await insertPerson(l2, "LEARNER", "SEC-PRJ Learner 2");
    await insertPerson(l3, "LEARNER", "SEC-PRJ Learner 3");
    await insertPerson(m1, "MENTOR", "SEC-PRJ Mentor 1");
    await insertPerson(m2, "MENTOR", "SEC-PRJ Mentor 2");
    await insertPerson(faculty, "FACULTY", "SEC-PRJ Faculty");
    await insertPerson(tpoP, "TPO", "SEC-PRJ TPO");
    // The template and its first version reference each other through a deferred key, so they are created in one transaction.
    const tx = await pool.connect();
    try {
      await tx.query("BEGIN");
      await tx.query("INSERT INTO project_templates(id,slug,title,created_by_user_id) VALUES($1,$2,'SEC-PRJ template',$3)", [template, "sec-prj-" + template, SEED_IDS.superAdminUser]);
      await tx.query("INSERT INTO project_template_versions(id,template_id,version,title,blueprint,created_by_user_id) VALUES($1,$2,1,'SEC-PRJ version','{}'::jsonb,$3)", [version, template, SEED_IDS.superAdminUser]);
      await tx.query("COMMIT");
    } catch (error) {
      await tx.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      tx.release();
    }
    for (const [id, title] of [[project1, "SEC-PRJ Project 1"], [project2, "SEC-PRJ Project 2"]] as const) {
      await q(
        "INSERT INTO project_instances(id,college_id,template_id,template_version_id,slug,title,created_by_user_id) VALUES($1,$2,$3,$4,$5,$6,$7)",
        [id, college, template, version, "sec-prj-" + id, title, SEED_IDS.collegeAdminUser],
      );
    }
    const member = (project: string, p: Person, role: "LEARNER" | "MENTOR", primary: boolean) =>
      q("INSERT INTO project_members(project_id,membership_id,role,is_primary,created_by_user_id) VALUES($1,$2,$3,$4,$5)", [project, p.membership, role, primary, SEED_IDS.collegeAdminUser]);
    await member(project1, m1, "MENTOR", true);
    await member(project1, l1, "LEARNER", false);
    await member(project1, l2, "LEARNER", false);
    await member(project2, m2, "MENTOR", true);
    await member(project2, l3, "LEARNER", false);
    await q(
      "INSERT INTO project_meetings(id,project_id,status,title,starts_at,ends_at,time_zone,outcome,meeting_url,scheduled_by_user_id,created_by_user_id) VALUES($1,$2,'COMPLETED','SEC-PRJ private meeting',now()-interval '2 hours',now()-interval '1 hour','Asia/Kolkata','SEC-PRJ private mentor notes','https://meet.example.test/sec-prj',$3,$3)",
      [meeting1, project1, SEED_IDS.collegeAdminUser],
    );
  }, 90_000);

  afterAll(async () => {
    try {
      // A meeting writes an append-only history row, so on this DISPOSABLE database the protection is lifted for the cleanup only.
      const tx = await pool.connect();
      try {
        await tx.query("BEGIN");
        await tx.query("SET LOCAL session_replication_role = replica");
        await tx.query("DELETE FROM project_meeting_history WHERE project_id=ANY($1::uuid[])", [[project1, project2]]);
        await tx.query("DELETE FROM project_meetings WHERE project_id=ANY($1::uuid[])", [[project1, project2]]);
        await tx.query("DELETE FROM project_members WHERE project_id=ANY($1::uuid[])", [[project1, project2]]);
        await tx.query("DELETE FROM project_instances WHERE id=ANY($1::uuid[])", [[project1, project2]]);
        await tx.query("DELETE FROM project_template_versions WHERE id=$1", [version]);
        await tx.query("DELETE FROM project_templates WHERE id=$1", [template]);
        await tx.query("COMMIT");
      } catch {
        await tx.query("ROLLBACK").catch(() => undefined);
      } finally {
        tx.release();
      }
      for (const p of people) await deletePerson(pool, p);
    } finally {
      await pool.end();
      await closeDatabaseConnection();
    }
  }, 90_000);

  describe("each person's own projects", () => {
    it("a learner's list holds only their own team's project", async () => {
      const titles = async (ctx: RequestContext) => (await listMyProjectInstances(ctx)).map((row: { project: { id: string } }) => row.project.id);
      expect(await titles(learner1)).toEqual([project1]);
      expect(await titles(learner2)).toEqual([project1]);
      expect(await titles(learner3)).toEqual([project2]);
    });
  });

  describe("the member list and the team files", () => {
    it("members of the project, its mentor and the college admin can read them", async () => {
      for (const [who, actor] of [["learner 1", learner1], ["learner 2", learner2], ["mentor 1", mentor1], ["admin", admin]] as const) {
        const members = (await listProjectMembers(actor, project1)).map((row: { membershipId: string }) => row.membershipId);
        expect(members, who).toEqual(expect.arrayContaining([l1.membership, l2.membership, m1.membership]));
        expect(members, who).not.toContain(l3.membership);
        expect(Array.isArray(await listProjectFiles(actor, project1)), who).toBe(true);
      }
    });

    it("a learner or mentor of the other project, faculty, a TPO and another college's admin cannot", async () => {
      for (const [who, actor] of [
        ["learner 3 (project 2)", learner3], ["mentor 2 (project 2)", mentor2], ["faculty", facultyCtx], ["tpo", tpoCtx], ["other college admin", otherCollegeAdmin],
      ] as const) {
        await refused(listProjectMembers(actor, project1), who + " members");
        await refused(listProjectFiles(actor, project1), who + " files");
      }
    });

    it("the same people can reach their own project, so the refusal is about team membership", async () => {
      expect((await listProjectMembers(learner3, project2)).length).toBeGreaterThan(0);
      expect((await listProjectMembers(mentor2, project2)).length).toBeGreaterThan(0);
    });
  });

  describe("a mentor's private meeting notes", () => {
    it("project 1's own mentor reads them, with the outcome", async () => {
      const notes = await getMentorMeetingNotes(mentor1, { projectId: project1, meetingId: meeting1 });
      expect(JSON.stringify(notes)).toContain("SEC-PRJ private mentor notes");
    });

    it("everyone else is refused: learners of the team, the other project's mentor, faculty, a TPO and another college's admin", async () => {
      for (const [who, actor] of [
        ["learner 1 (same team)", learner1], ["learner 3", learner3], ["mentor 2", mentor2], ["faculty", facultyCtx], ["tpo", tpoCtx], ["other college admin", otherCollegeAdmin],
      ] as const) {
        await refused(getMentorMeetingNotes(actor, { projectId: project1, meetingId: meeting1 }), who);
      }
    });

    it("a meeting is only reachable through its own project", async () => {
      await refused(getMentorMeetingNotes(mentor2, { projectId: project2, meetingId: meeting1 }), "mentor 2 asking for project 1's meeting through project 2");
    });
  });
});
