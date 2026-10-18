import "server-only";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";

/** Migration-aware learner filter. No unregistered Drizzle schema imports. */
export async function filterStagedStudentVisibleLessonContents<T extends { id: string }>(
  lessonId: string, rows: readonly T[],
): Promise<T[]> {
  if (rows.length === 0) return [];
  // Validate before the migration fallback: malformed URLs must never skip scope checks.
  const normalizedLessonId = z.string().uuid().parse(lessonId);
  const ready = await getDb().execute<{ available: boolean }>(sql`
    select exists (
      select 1 from pg_catalog.pg_attribute
      where attrelid = to_regclass('public.lesson_contents')
        and attname = 'visible_to_students' and not attisdropped
    ) as available
  `);
  // This stays an explicit migration blocker, never an assumed new column.
  if (!ready.rows[0]?.available) return [...rows];
  const visible = await getDb().execute<{ id: string }>(sql`
    select id::text as id from lesson_contents
    where lesson_id = ${normalizedLessonId}::uuid
      and visible_to_students = true
  `);
  const allowed = new Set(visible.rows.map(row => row.id));
  return rows.filter(row => allowed.has(row.id));
}
