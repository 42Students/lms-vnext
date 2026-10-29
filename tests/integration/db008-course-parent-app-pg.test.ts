import { randomUUID } from "node:crypto";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import {
  createCourse, listCoursesPage, listArchivedCoursesPage, moveCourseDepartment, updateCourse,
} from "@/modules/courses/course-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled
  ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 })
  : null;

const admin: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "db008-admin",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA, organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};

const prefix = "D8PG-" + randomUUID().slice(0, 8);
let seq = 0;
const createdIds: string[] = [];
async function makeCourse(options: {
  parentCourseId?: string | null;
  departmentId?: string;
} = {}) {
  const number = ++seq;
  const course = await createCourse(admin, {
    departmentId: options.departmentId ?? SEED_IDS.departmentA,
    parentCourseId: options.parentCourseId,
    name: prefix + "-Course-" + number,
    code: prefix + "-" + number,
  });
  createdIds.push(course.id);
  return course;
}

afterEach(async () => {
  if (!pool || createdIds.length === 0) return;
  const ids = createdIds.splice(0);
  // Clear links before deletion so self-FK ON DELETE RESTRICT is honored.
  await pool.query("UPDATE courses SET parent_course_id = NULL WHERE id = ANY($1::uuid[])", [ids]);
  await pool.query("DELETE FROM courses WHERE id = ANY($1::uuid[])", [ids]);
});
afterAll(async () => {
  await pool?.end();
  await closeDatabaseConnection();
});

describe.skipIf(!enabled)("DB-008 persisted course parent graph and races", () => {
  it("paged course totals exclude soft-deleted ACTIVE rows and preserve archive counts", async () => {
    const baseline = await listCoursesPage(
      admin, SEED_IDS.collegeA, { limit: 10, offset: 0 }, SEED_IDS.departmentA,
    );
    const archivedBaseline = await listArchivedCoursesPage(
      admin, SEED_IDS.collegeA, { limit: 10, offset: 0 }, SEED_IDS.departmentA,
    );
    const live = await makeCourse();
    const softDeleted = await makeCourse();
    const archived = await makeCourse();
    await pool!.query("UPDATE courses SET deleted_at=now() WHERE id=$1", [softDeleted.id]);
    await pool!.query("UPDATE courses SET status='ARCHIVED' WHERE id=$1", [archived.id]);

    const visiblePage = await listCoursesPage(
      admin, SEED_IDS.collegeA, { limit: 10, offset: 0 }, SEED_IDS.departmentA,
    );
    const archivePage = await listArchivedCoursesPage(
      admin, SEED_IDS.collegeA, { limit: 10, offset: 0 }, SEED_IDS.departmentA,
    );
    expect(visiblePage.total).toBe(baseline.total + 1);
    expect(archivePage.total).toBe(archivedBaseline.total + 1);
    const currentIds = await pool!.query<{ id: string }>(
      "SELECT id FROM courses WHERE id=ANY($1::uuid[]) AND status='ACTIVE' AND deleted_at IS NULL",
      [[live.id, softDeleted.id, archived.id]],
    );
    expect(currentIds.rows.map(row => row.id)).toEqual([live.id]);
  });

  it("preserves same-college deep parent ancestry and rejects an indirect cycle", async () => {
    const root = await makeCourse();
    const middle = await makeCourse({ parentCourseId: root.id });
    const leaf = await makeCourse({ parentCourseId: middle.id });
    await expect(updateCourse(admin, root.id, {
      expectedUpdatedAt: root.updatedAt.toISOString(),
      parentCourseId: leaf.id,
    })).rejects.toMatchObject({ code: "COURSE_PARENT_CYCLE" });
    const actual = await pool!.query<{ parent_course_id: string | null }>(
      "SELECT parent_course_id FROM courses WHERE id=$1", [root.id],
    );
    expect(actual.rows[0]?.parent_course_id).toBeNull();
    // Explicit null clears the relationship without altering the course identity.
    const cleared = await updateCourse(admin, leaf.id, {
      expectedUpdatedAt: leaf.updatedAt.toISOString(), parentCourseId: null,
    });
    expect(cleared.parentCourseId).toBeNull();
  });

  it("rejects archived, soft-deleted and wrong-college parents on create", async () => {
    const archived = await makeCourse();
    await pool!.query("UPDATE courses SET status = 'ARCHIVED' WHERE id=$1", [archived.id]);
    await expect(createCourse(admin, {
      departmentId: SEED_IDS.departmentA,
      parentCourseId: archived.id,
      name: prefix + "-Archived-parent",
      code: prefix + "-Archived",
    })).rejects.toMatchObject({ code: "COURSE_PARENT_NOT_FOUND" });
    const deleted = await makeCourse();
    await pool!.query("UPDATE courses SET deleted_at = now() WHERE id=$1", [deleted.id]);
    await expect(createCourse(admin, {
      departmentId: SEED_IDS.departmentA,
      parentCourseId: deleted.id,
      name: prefix + "-Deleted-parent",
      code: prefix + "-Deleted",
    })).rejects.toMatchObject({ code: "COURSE_PARENT_NOT_FOUND" });
    const foreign = await pool!.query<{ id: string }>(
      "INSERT INTO courses (department_id,name,code) VALUES ($1,$2,$3) RETURNING id",
      [SEED_IDS.departmentB, prefix + "-foreign", prefix + "-foreign"],
    );
    try {
      await expect(createCourse(admin, {
        departmentId: SEED_IDS.departmentA,
        parentCourseId: foreign.rows[0]!.id,
        name: prefix + "-Wrong-tenant",
        code: prefix + "-Wrong-tenant",
      })).rejects.toMatchObject({ code: "COURSE_PARENT_NOT_FOUND" });
    } finally {
      await pool!.query("DELETE FROM courses WHERE id=$1", [foreign.rows[0]!.id]);
    }
  });

  it("serializes reciprocal course reparenting under concurrent requests", async () => {
    const a = await makeCourse();
    const b = await makeCourse();
    const [left, right] = await Promise.allSettled([
      updateCourse(admin, a.id, {
        expectedUpdatedAt: a.updatedAt.toISOString(), parentCourseId: b.id,
      }),
      updateCourse(admin, b.id, {
        expectedUpdatedAt: b.updatedAt.toISOString(), parentCourseId: a.id,
      }),
    ]);
    const outcomes = [left, right];
    expect(outcomes.filter((entry) => entry.status === "fulfilled")).toHaveLength(1);
    const rejected = outcomes.find((entry) => entry.status === "rejected");
    expect(rejected).toBeDefined();
    if (rejected?.status === "rejected")
      expect(rejected.reason).toMatchObject({ code: "COURSE_PARENT_CYCLE" });
    const rows = await pool!.query<{ id: string; parent_course_id: string | null }>(
      "SELECT id,parent_course_id FROM courses WHERE id=ANY($1::uuid[])", [[a.id, b.id]],
    );
    const parent = new Map(rows.rows.map((row) => [row.id, row.parent_course_id]));
    expect(!(parent.get(a.id) === b.id && parent.get(b.id) === a.id)).toBe(true);
  });

  it("rechecks a parent row after an opposing archival transaction commits", async () => {
    const parent = await makeCourse();
    const holder = await pool!.connect();
    let committed = false;
    try {
      await holder.query("BEGIN");
      await holder.query("UPDATE courses SET status='ARCHIVED' WHERE id=$1", [parent.id]);
      const pending = createCourse(admin, {
        departmentId: SEED_IDS.departmentA,
        parentCourseId: parent.id,
        name: prefix + "-Concurrent-archive", code: prefix + "-Concurrent-archive",
      }).then(() => ({ accepted: true as const, error: null }),
        (error: unknown) => ({ accepted: false as const, error }));
      await new Promise((resolve) => setTimeout(resolve, 75));
      await holder.query("COMMIT");
      committed = true;
      const result = await pending;
      expect(result.accepted).toBe(false);
      if (!result.accepted)
        expect(result.error).toMatchObject({ code: "COURSE_PARENT_NOT_FOUND" });
    } finally {
      if (!committed) await holder.query("ROLLBACK").catch(() => undefined);
      holder.release();
    }
  });

  it("rejects moving a course to a different college even with an active destination", async () => {
    const course = await makeCourse();
    await expect(moveCourseDepartment(
      admin, course.id, SEED_IDS.departmentB, course.updatedAt.toISOString(),
    )).rejects.toMatchObject({ code: "DEPARTMENT_NOT_FOUND" });
  });
  it("enforces trimmed course identity while reserving slugs after deletion",async()=>{
    const base=await makeCourse(), other=await makeCourse();
    await expect(pool!.query("update courses set name=$1 where id=$2",
      ["  "+base.name.toUpperCase()+"  ",other.id])).rejects.toMatchObject({code:"23505"});
    await expect(pool!.query("update courses set short_title=$1 where id=$2",
      ["  "+base.shortTitle!.toUpperCase()+"  ",other.id])).rejects.toMatchObject({code:"23505"});
    await expect(pool!.query("update courses set slug=$1 where id=$2",
      [base.slug,other.id])).rejects.toMatchObject({code:"23505"});
    await expect(pool!.query("update courses set short_title=$1 where id=$2",
      ["   ",other.id])).rejects.toMatchObject({code:"23514"});
    await pool!.query("update courses set deleted_at=now() where id=$1",[base.id]);
    const reused=await createCourse(admin,{departmentId:SEED_IDS.departmentA,
      name:base.name,shortTitle:base.shortTitle!,code:prefix+"-REUSE-"+(++seq)});
    createdIds.push(reused.id);
    expect(reused.name).toBe(base.name);
    await expect(pool!.query("update courses set slug=$1 where id=$2",
      [base.slug,reused.id])).rejects.toMatchObject({code:"23505"});
  });
});
