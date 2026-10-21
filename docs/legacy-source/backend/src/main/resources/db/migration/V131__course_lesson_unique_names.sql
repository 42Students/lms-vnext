-- Audit 3.13 / non-security #13: duplicate-name checks are TOCTOU races with no DB constraint.
--
-- checkDuplicateCourse does a SELECT and then a save() with nothing in between, so two concurrent
-- creates both pass the check and both insert. Same shape for lessons. The only place a real
-- constraint existed was the course slug — which is exactly why the slug path needed retry logic
-- and the name path silently produced duplicates.
--
-- This was deferred in earlier rounds as "a unique index risks a failed migration against unknown
-- existing duplicate data; needs a data-cleanup pass first". That objection is answered by doing
-- the cleanup here, in the same transaction as the index, rather than assuming clean data.
--
-- ## Why generated columns rather than a plain unique index
--
-- Both application checks exclude soft-deleted rows:
--   course: "WHERE dept_id = :deptId AND (is_deleted = false OR is_deleted IS NULL) AND ..."
--   lesson: "WHERE course_id = :courseId AND ... AND (is_deleted IS NULL OR is_deleted = 0)"
-- so a course may legitimately reuse a deleted course's name. A plain unique index would forbid
-- that and break the restore-after-delete flow. MySQL has no partial indexes, so the standard
-- idiom applies: a generated column that is NULL for deleted rows, and NULL values are ignored by
-- a unique index.
--
-- LOWER(TRIM(...)) matches what the application actually compares — both checks use LOWER(), and
-- both trim the incoming value before checking — so the constraint and the check agree rather than
-- the database being stricter or looser than the code.

-- ---------------------------------------------------------------------------
-- Step 1: resolve any duplicates that already exist.
--
-- Deliberately a self-join on a lower id rather than ROW_NUMBER(), so this runs on MySQL 5.7 as
-- well as 8. The row's own id is appended, which makes the replacement name unique by
-- construction — there is no second collision to resolve.
--
-- In a healthy database this updates zero rows: duplicates can only exist where the TOCTOU race
-- above actually fired. Where it did, the rename is visible and an admin can correct it, which is
-- strictly better than the silent duplicate that is there today.
-- ---------------------------------------------------------------------------

UPDATE course c
JOIN course older
  ON older.dept_id = c.dept_id
 AND older.id < c.id
 AND (older.is_deleted IS NULL OR older.is_deleted = 0)
 AND LOWER(TRIM(older.course_name)) = LOWER(TRIM(c.course_name))
SET c.course_name = CONCAT(c.course_name, ' (dup ', c.id, ')')
WHERE (c.is_deleted IS NULL OR c.is_deleted = 0)
  AND c.course_name IS NOT NULL
  AND TRIM(c.course_name) <> '';

UPDATE course c
JOIN course older
  ON older.dept_id = c.dept_id
 AND older.id < c.id
 AND (older.is_deleted IS NULL OR older.is_deleted = 0)
 AND LOWER(TRIM(older.short_title)) = LOWER(TRIM(c.short_title))
SET c.short_title = CONCAT(c.short_title, ' (dup ', c.id, ')')
WHERE (c.is_deleted IS NULL OR c.is_deleted = 0)
  AND c.short_title IS NOT NULL
  AND TRIM(c.short_title) <> '';

UPDATE lesson l
JOIN lesson older
  ON older.course_id = l.course_id
 AND older.id < l.id
 AND (older.is_deleted IS NULL OR older.is_deleted = 0)
 AND LOWER(TRIM(older.lesson_name)) = LOWER(TRIM(l.lesson_name))
SET l.lesson_name = CONCAT(l.lesson_name, ' (dup ', l.id, ')')
WHERE (l.is_deleted IS NULL OR l.is_deleted = 0)
  AND l.lesson_name IS NOT NULL
  AND TRIM(l.lesson_name) <> '';

-- ---------------------------------------------------------------------------
-- Step 2: the uniqueness keys.
--
-- NULL for a deleted row, for a NULL name, and for an empty-string name. That last case matters:
-- without it every row with short_title = '' would collide with every other, and short_title is
-- optional.
-- ---------------------------------------------------------------------------

ALTER TABLE course
    ADD COLUMN course_name_key VARCHAR(255)
        GENERATED ALWAYS AS (
            CASE WHEN (is_deleted IS NULL OR is_deleted = 0)
                      AND course_name IS NOT NULL
                      AND TRIM(course_name) <> ''
                 THEN LOWER(TRIM(course_name))
                 ELSE NULL END
        ) STORED,
    ADD COLUMN short_title_key VARCHAR(255)
        GENERATED ALWAYS AS (
            CASE WHEN (is_deleted IS NULL OR is_deleted = 0)
                      AND short_title IS NOT NULL
                      AND TRIM(short_title) <> ''
                 THEN LOWER(TRIM(short_title))
                 ELSE NULL END
        ) STORED;

ALTER TABLE lesson
    ADD COLUMN lesson_name_key VARCHAR(255)
        GENERATED ALWAYS AS (
            CASE WHEN (is_deleted IS NULL OR is_deleted = 0)
                      AND lesson_name IS NOT NULL
                      AND TRIM(lesson_name) <> ''
                 THEN LOWER(TRIM(lesson_name))
                 ELSE NULL END
        ) STORED;

CREATE UNIQUE INDEX ux_course_dept_name_active ON course (dept_id, course_name_key);
CREATE UNIQUE INDEX ux_course_dept_short_title_active ON course (dept_id, short_title_key);
CREATE UNIQUE INDEX ux_lesson_course_name_active ON lesson (course_id, lesson_name_key);
