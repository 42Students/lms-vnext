import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";

vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({
  queries: [] as Array<{ sql: string; params: unknown[] }>,
  available: false,
  visible: [] as string[],
}));
vi.mock("@/db/client", () => ({
  getDb: () => ({
    execute: async (statement: SQL) => {
      const query = new PgDialect().sqlToQuery(statement);
      state.queries.push({ sql: query.sql, params: query.params });
      return state.queries.length === 1
        ? { rows: [{ available: state.available }] }
        : { rows: state.visible.map(id => ({ id })) };
    },
  }),
}));
import {
  filterStagedStudentVisibleLessonContents,
} from "@/modules/courses/faculty-lesson-visibility-staged";

const lessonId = "11111111-1111-4111-8111-111111111111";
const rows = [
  { id: "22222222-2222-4222-8222-222222222222", title: "Student note" },
  { id: "33333333-3333-4333-8333-333333333333", title: "Teacher-only note" },
] as const;

beforeEach(() => {
  state.queries = [];
  state.available = false;
  state.visible = [];
});

describe("FAC-LESSON-VISIBILITY-STAGED-01 safe migration-aware learner projection", () => {
  it("does not query the database for an empty content list", async () => {
    expect(await filterStagedStudentVisibleLessonContents(lessonId, [])).toEqual([]);
    expect(state.queries).toHaveLength(0);
  });

  it("refuses a malformed lesson ID before a missing migration can bypass the UUID cast", async () => {
    await expect(filterStagedStudentVisibleLessonContents("forged/lesson", rows))
      .rejects.toThrow();
    expect(state.queries).toHaveLength(0);
  });

  it("preserves legacy records without the unregistered column without changing caller input", async () => {
    const projected = await filterStagedStudentVisibleLessonContents(lessonId, rows);
    expect(projected).toEqual(rows);
    expect(projected).not.toBe(rows);
    expect(state.queries).toHaveLength(1);
    expect(state.queries[0]?.sql).toContain("pg_catalog.pg_attribute");
    expect(state.queries[0]?.sql).toContain("visible_to_students");
  });

  it("when migration exists, projects only true visibility IDs under the exact lesson", async () => {
    state.available = true;
    state.visible = [rows[0].id];
    const result = await filterStagedStudentVisibleLessonContents(lessonId, rows);
    expect(result).toEqual([rows[0]]);
    expect(state.queries).toHaveLength(2);
    expect(state.queries[1]?.sql).toContain("lesson_id");
    expect(state.queries[1]?.sql).toContain("visible_to_students = true");
    expect(state.queries[1]?.params).toContain(lessonId);
  });

  it("fail-closes to an empty list when the registered visibility column returns no authorized IDs", async () => {
    state.available = true;
    state.visible = [];
    expect(await filterStagedStudentVisibleLessonContents(lessonId, rows)).toEqual([]);
    expect(state.queries).toHaveLength(2);
  });
});
