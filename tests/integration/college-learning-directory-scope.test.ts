import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {exportCollegeLessons} from "@/modules/courses/college-lessons-export-service";
import {exportCollegeCourseProgress} from "@/modules/courses/college-progress-export-service";
import {
  listCollegeCourseProgress,
  listCollegeLessons,
} from "@/modules/courses/college-learning-directory-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB09_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled
  ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 })
  : null;

const own: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "college-learning-observability",
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
const otherCollege: RequestContext = {
  user: { ...own.user, id: SEED_IDS.facultyUser },
  membership: {
    id: SEED_IDS.facultyCollegeBMembership,
    collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["COLLEGE_ADMIN"],
  },
};
const nonAdmin: RequestContext = {
  ...own,
  membership: { ...own.membership!, roles: ["FACULTY"] },
};

const ids = {
  period: randomUUID(),
  program: randomUUID(),
  cohort: randomUUID(),
  course: randomUUID(),
  offering: randomUUID(),
  path: randomUUID(),
  lesson: randomUUID(),
  content: randomUUID(),
};
const name = "W-Learning-" + ids.period.slice(0, 8);

describe.skipIf(!enabled)("College learning directories use disposable PostgreSQL scope", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("Isolated PostgreSQL is required");
    const tableState = await pool.query(
      "SELECT to_regclass('public.course_lessons') AS lessons, " +
      "to_regclass('public.lesson_contents') AS content, " +
      "to_regclass('public.learner_content_progress') AS progress",
    );
    for (const value of Object.values(tableState.rows[0] ?? {})) {
      if (!value) throw new Error("Registered course C2/C3 migrations required");
    }
    await pool.query(
      "INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) " +
      "VALUES($1,$2,$3,$4,'2026-07-01','2026-12-31')",
      [ids.period, SEED_IDS.collegeA, name, name],
    );
    await pool.query(
      "INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3,$4,8)",
      [ids.program, SEED_IDS.departmentA, name, name],
    );
    await pool.query(
      "INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES($1,$2,$3,$4,$5)",
      [ids.cohort, ids.program, name, name, ids.period],
    );
    await pool.query(
      "INSERT INTO courses(id,department_id,name,code) VALUES($1,$2,$3,$4)",
      [ids.course, SEED_IDS.departmentA, name, name],
    );
    await pool.query(
      "INSERT INTO course_offerings(id,course_id,cohort_id,academic_period_id) VALUES($1,$2,$3,$4)",
      [ids.offering, ids.course, ids.cohort, ids.period],
    );
    await pool.query(
      "INSERT INTO course_learning_paths(id,offering_id,title) VALUES($1,$2,$3)",
      [ids.path, ids.offering, name],
    );
    await pool.query(
      "INSERT INTO course_lessons(id,learning_path_id,name,sequence) VALUES($1,$2,$3,0)",
      [ids.lesson, ids.path, name],
    );
    await pool.query(
      "INSERT INTO lesson_contents(id,lesson_id,content_type,title,external_url,duration_seconds,sequence,created_by_user_id,status) " +
      "VALUES($1,$2,'YOUTUBE',$3,'https://www.youtube.com/watch?v=example',60,0,$4,'PUBLISHED')",
      [ids.content, ids.lesson, name, SEED_IDS.collegeAdminUser],
    );
  });

  afterAll(async () => {
    try {
      if (pool) {
        for (const [table, id] of [
          ["lesson_contents", ids.content],
          ["course_lessons", ids.lesson],
          ["course_learning_paths", ids.path],
          ["course_offerings", ids.offering],
          ["courses", ids.course],
          ["cohorts", ids.cohort],
          ["programs", ids.program],
          ["academic_periods", ids.period],
        ] as const) {
          await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
        }
      }
    } finally {
      await pool?.end();
      await closeDatabaseConnection();
    }
  });

  it("shows a persisted lesson and no fabricated completion on the own college", async () => {
    const [lessonPage, progressPage] = await Promise.all([
      listCollegeLessons(own, { q: name }),
      listCollegeCourseProgress(own, { q: name }),
    ]);
    const exact=await listCollegeLessons(own,{courseCode:name});
    const unknown=await listCollegeLessons(own,{courseCode:"MISSING-CODE"});
    expect(exact.items.map(row=>row.id)).toContain(ids.lesson);
    expect(unknown.items).toEqual([]);
    const lesson = lessonPage.items.find(row => row.id === ids.lesson);
    const sameCode=await listCollegeCourseProgress(own,{courseCode:name});
    const missingCode=await listCollegeCourseProgress(own,{courseCode:"NOT-THIS-CODE"});
    expect(sameCode.items.map(row=>row.offeringId)).toContain(ids.offering);
    expect(missingCode.items).toEqual([]);
    const progress = progressPage.items.find(row => row.offeringId === ids.offering);
    expect(lesson).toMatchObject({ contentCount: 1, publishedContentCount: 1 });
    const [active, archived] = await Promise.all([
      listCollegeLessons(own, { q: name, offeringStatus: "ACTIVE" }),
      listCollegeLessons(own, { q: name, offeringStatus: "ARCHIVED" }),
    ]);
    expect(active.items.map(row => row.id)).toContain(ids.lesson);
    expect(archived.items).toEqual([]);
    expect(progress).toMatchObject({ recordedRows: 0, completedRows: 0, learnersWithRecords: 0 });
  });

  it("exports only own-college authored/published lesson counts",async()=>{
    const ours=await exportCollegeLessons(own,{q:name});
    const theirs=await exportCollegeLessons(otherCollege,{q:name});
    expect(ours.csv).toContain(name);
    expect(ours.csv).toContain("Published content");
    expect(theirs.csv).not.toContain(name);
    await expect(exportCollegeLessons(nonAdmin,{})).rejects.toBeInstanceOf(AuthorizationError);
  });
  it("exports observed progress counts only under the current college",async()=>{
    const ours=await exportCollegeCourseProgress(own,{q:name});
    const theirs=await exportCollegeCourseProgress(otherCollege,{q:name});
    expect(ours.csv).toContain(name);
    expect(ours.csv).toContain("Recorded content rows");
    expect(ours.csv).toContain("0");
    expect(theirs.csv).not.toContain(name);
    await expect(exportCollegeCourseProgress(nonAdmin,{})).rejects.toBeInstanceOf(AuthorizationError);
  });
  it("does not reveal the seeded course or lesson to an admin from another college", async () => {
    const [lessons, progress] = await Promise.all([
      listCollegeLessons(otherCollege, { q: name }),
      listCollegeCourseProgress(otherCollege, { q: name }),
    ]);
    expect(lessons.items).toEqual([]);
    expect(progress.items).toEqual([]);
  });

  it("rejects non-admin membership, caller-chosen college and invalid filters", async () => {
    await expect(listCollegeLessons(nonAdmin, {})).rejects.toBeInstanceOf(AuthorizationError);
    await expect(listCollegeCourseProgress(nonAdmin, {})).rejects.toBeInstanceOf(AuthorizationError);
    await expect(listCollegeLessons(own, { collegeId: SEED_IDS.collegeB })).rejects.toBeDefined();
    await expect(listCollegeCourseProgress(own, { collegeId: SEED_IDS.collegeB })).rejects.toBeDefined();
    await expect(listCollegeCourseProgress(own, { page: 1001 })).rejects.toBeDefined();
  });
});
